// Ocean — App Store (Zustand)
// Central state for session, categories, settings, toasts, and timer.
// Part 3 § 1-2: Timer state machine, intentions, categories.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Category } from '../components/CategoryPill';
import { ToastMessage } from '../components/Primitives';

// ── Timer Phase ────────────────────────────────────────────────────────────
export type SessionPhase =
  | 'idle'
  | 'breathing'
  | 'focusing'
  | 'paused'
  | 'reflecting'
  | 'onBreak'
  | 'longBreak';

// ── Session Record ─────────────────────────────────────────────────────────
export interface SessionRecord {
  id:               string;
  intention:        string;
  categoryId:       string | null;
  plannedDurationSec: number;
  actualDurationSec: number;
  overflowSec:      number;
  startedAt:        string;  // ISO8601
  endedAt:          string | null;
  status:           'completed' | 'ended_early' | 'aborted';
  reflectionNote:   string | null;
  focusRating:      number | null;  // 1-5
  source:           'manual' | 'scheduled' | 'api';
}

// ── Settings ───────────────────────────────────────────────────────────────
export interface OceanSettings {
  theme:               'light' | 'dark' | 'system';
  workDurationMin:     number;   // default 25
  breakDurationMin:    number;   // default 5
  longBreakDurationMin:number;   // default 20
  longBreakInterval:   number;   // every N sessions, default 4
  breathCount:         number;   // 0-12
  autoStartNext:       boolean;
  overflowEnabled:     boolean;
  twoMinWarning:       boolean;
  soundEnabled:        boolean;
  soundPack:           'chime' | 'marimba' | 'wood' | 'silent';
  soundVolume:         number;   // 0-100
  focusAssistEnabled:  boolean;
  requireIntention:    boolean;
  isPro:               boolean;
  hasCompletedOnboarding: boolean;
}

const DEFAULT_SETTINGS: OceanSettings = {
  theme:               'system',
  workDurationMin:     25,
  breakDurationMin:    5,
  longBreakDurationMin:20,
  longBreakInterval:   4,
  breathCount:         3,
  autoStartNext:       false,
  overflowEnabled:     false,
  twoMinWarning:       true,
  soundEnabled:        true,
  soundPack:           'chime',
  soundVolume:         70,
  focusAssistEnabled:  false,
  requireIntention:    true,
  isPro:               false,
  hasCompletedOnboarding: false,
};

// ── Active Session ─────────────────────────────────────────────────────────
export interface ActiveSession {
  intention:   string;
  categoryId:  string | null;
  durationMin: number;
  startedAt:   Date;
  endAtUtc:    Date;    // DRIFT-SAFE: remaining = endAtUtc - now
  pausedAt:    Date | null;
  pausedRemainMs: number; // remaining ms at time of pause
  sessionCount: number; // how many focus sessions completed in this run
  overflowMs:  number;
}

// ── Store ──────────────────────────────────────────────────────────────────
interface OceanStore {
  // Timer state
  phase:         SessionPhase;
  activeSession: ActiveSession | null;
  remaining:     number;   // seconds, recomputed from endAtUtc
  glow:          boolean;  // 2-min warning

  // Data
  categories:    Category[];
  sessions:      SessionRecord[];
  recentIntentions: string[];

  // UI
  settings:      OceanSettings;
  toasts:        ToastMessage[];
  navExpanded:   boolean;

  // ── Actions ──────────────────────────────────────────────────────────────
  startSession: (intention: string, categoryId: string | null, durationMin: number) => void;
  startBreathing: (intention: string, categoryId: string | null, durationMin: number) => void;
  beginFocusing: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  extendSession: (extraMin?: number) => void;
  endEarly: () => void;
  abortSession: () => void;
  completePhase: () => void;
  tick: () => void;

  // Category CRUD
  addCategory:    (name: string, colorHex: string) => void;
  removeCategory: (id: string) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;

  // Sessions
  saveSession: (record: Omit<SessionRecord, 'id'>) => void;

  // Settings
  updateSettings: (patch: Partial<OceanSettings>) => void;

  // UI helpers
  addToast:     (message: string, type?: ToastMessage['type']) => void;
  removeToast:  (id: string) => void;
  setNavExpanded: (v: boolean) => void;
  applyTheme:   () => void;
}

let tickInterval: ReturnType<typeof setInterval> | null = null;

export const useOceanStore = create<OceanStore>()(
  persist(
    (set, get) => ({
      phase:         'idle',
      activeSession: null,
      remaining:     0,
      glow:          false,
      categories:    [
        { id: 'cat-work',  name: 'Work',    colorHex: '#FF6B6B' },
        { id: 'cat-learn', name: 'Learning',colorHex: '#6C63FF' },
        { id: 'cat-read',  name: 'Reading', colorHex: '#56CCF2' },
      ],
      sessions:         [],
      recentIntentions: [],
      settings:         DEFAULT_SETTINGS,
      toasts:           [],
      navExpanded:      true,

      // ── Start breathing phase ────────────────────────────────────────────
      startBreathing: (intention, categoryId, durationMin) => {
        const settings = get().settings;
        if (settings.breathCount === 0) {
          get().beginFocusing();
          return;
        }
        set({
          phase: 'breathing',
          activeSession: {
            intention,
            categoryId,
            durationMin,
            startedAt: new Date(),
            endAtUtc: new Date(Date.now() + durationMin * 60 * 1000),
            pausedAt: null,
            pausedRemainMs: 0,
            sessionCount: 0,
            overflowMs: 0,
          },
        });
      },

      startSession: (intention, categoryId, durationMin) => {
        get().startBreathing(intention, categoryId, durationMin);
        // Add to recent intentions (deduplicated, case-insensitive)
        const prev = get().recentIntentions.filter(
          (r) => r.toLowerCase() !== intention.toLowerCase()
        );
        set({ recentIntentions: [intention, ...prev].slice(0, 10) });
      },

      // ── Transition from breathing → focusing ─────────────────────────────
      beginFocusing: () => {
        const as = get().activeSession;
        if (!as) return;
        const endAtUtc = new Date(Date.now() + as.durationMin * 60 * 1000);
        set({
          phase: 'focusing',
          glow: false,
          activeSession: { ...as, endAtUtc },
        });

        // Start tick
        if (tickInterval) clearInterval(tickInterval);
        tickInterval = setInterval(() => get().tick(), 1000);
      },

      // ── Tick — drift-safe: remaining = endAtUtc - now ───────────────────
      tick: () => {
        const { phase, activeSession } = get();
        if (!activeSession || (phase !== 'focusing' && phase !== 'onBreak' && phase !== 'longBreak')) return;

        const remainMs = activeSession.endAtUtc.getTime() - Date.now();
        const remainSec = Math.max(0, Math.ceil(remainMs / 1000));

        const glow = remainSec <= 120 && remainSec > 0 && phase === 'focusing';

        set({ remaining: remainSec, glow });

        if (remainSec === 0) {
          if (tickInterval) clearInterval(tickInterval);
          get().completePhase();
        }
      },

      // ── Phase completed naturally ────────────────────────────────────────
      completePhase: () => {
        const { phase, activeSession, settings } = get();
        if (!activeSession) return;

        if (phase === 'focusing') {
          set({ phase: 'reflecting', glow: false });
        } else if (phase === 'onBreak' || phase === 'longBreak') {
          if (settings.autoStartNext) {
            get().startBreathing(
              activeSession.intention,
              activeSession.categoryId,
              settings.workDurationMin
            );
          } else {
            set({ phase: 'idle', activeSession: null, remaining: 0 });
          }
        }
      },

      pauseSession: () => {
        const { phase, activeSession } = get();
        if ((phase !== 'focusing' && phase !== 'onBreak') || !activeSession) return;
        if (tickInterval) clearInterval(tickInterval);
        const remainMs = activeSession.endAtUtc.getTime() - Date.now();
        set({
          phase: 'paused',
          activeSession: {
            ...activeSession,
            pausedAt: new Date(),
            pausedRemainMs: remainMs,
          },
        });
      },

      resumeSession: () => {
        const { activeSession } = get();
        if (!activeSession) return;
        const newEndAt = new Date(Date.now() + activeSession.pausedRemainMs);
        set({
          phase: 'focusing',
          activeSession: { ...activeSession, endAtUtc: newEndAt, pausedAt: null },
        });
        if (tickInterval) clearInterval(tickInterval);
        tickInterval = setInterval(() => get().tick(), 1000);
      },

      extendSession: (extraMin = 5) => {
        const { activeSession } = get();
        if (!activeSession) return;
        const newEnd = new Date(activeSession.endAtUtc.getTime() + extraMin * 60 * 1000);
        set({ activeSession: { ...activeSession, endAtUtc: newEnd } });
      },

      endEarly: () => {
        if (tickInterval) clearInterval(tickInterval);
        set({ phase: 'reflecting', glow: false });
      },

      abortSession: () => {
        if (tickInterval) clearInterval(tickInterval);
        set({ phase: 'idle', activeSession: null, remaining: 0, glow: false });
      },

      // ── Category CRUD ────────────────────────────────────────────────────
      addCategory: (name, colorHex) => {
        const { categories, settings } = get();
        if (!settings.isPro && categories.length >= 3) {
          get().addToast('Upgrade to Pro for unlimited categories.', 'info');
          return;
        }
        const cat: Category = { id: `cat-${Date.now()}`, name, colorHex };
        set({ categories: [...categories, cat] });
      },

      removeCategory: (id) => {
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
      },

      updateCategory: (id, patch) => {
        set((s) => ({
          categories: s.categories.map((c) => c.id === id ? { ...c, ...patch } : c),
        }));
      },

      // ── Sessions ─────────────────────────────────────────────────────────
      saveSession: (record) => {
        const full: SessionRecord = { id: `sess-${Date.now()}`, ...record };
        set((s) => ({ sessions: [full, ...s.sessions] }));
      },

      // ── Settings ─────────────────────────────────────────────────────────
      updateSettings: (patch) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
        get().applyTheme();
      },

      // ── Theme application ─────────────────────────────────────────────────
      applyTheme: () => {
        const { theme } = get().settings;
        const root = document.documentElement;
        if (theme === 'dark') {
          root.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
          root.setAttribute('data-theme', 'light');
        } else {
          root.removeAttribute('data-theme');
        }
      },

      // ── Toasts ────────────────────────────────────────────────────────────
      addToast: (message, type = 'info') => {
        const t: ToastMessage = { id: `toast-${Date.now()}`, message, type };
        set((s) => ({ toasts: [...s.toasts, t] }));
        setTimeout(() => get().removeToast(t.id), 4000);
      },

      removeToast: (id) => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      },

      setNavExpanded: (v) => set({ navExpanded: v }),
    }),
    {
      name:    'ocean-store',
      partialize: (s) => ({
        categories:       s.categories,
        sessions:         s.sessions,
        recentIntentions: s.recentIntentions,
        settings:         s.settings,
      }),
    }
  )
);
