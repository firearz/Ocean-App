// Ocean — App Store (Zustand)
// Central state for session, categories, settings, toasts, and timer.
// Part 3 § 1-2: Timer state machine, intentions, categories.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category } from '../components/CategoryPill';
import type { ToastMessage } from '../components/Primitives';

// ── Timer Phase ────────────────────────────────────────────────────────────
export type SessionPhase =
  | 'idle'
  | 'breathing'
  | 'focusing'
  | 'paused'
  | 'reflecting'
  | 'onBreak'
  | 'endedEarly';

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

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  action: () => void;
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

// ── Ambient Sound Types ────────────────────────────────────────────────────
export type AmbientSound = 'none' | 'brown-noise' | 'ocean' | 'rain' | 'pink-noise' | 'white-noise';

// ── Settings ───────────────────────────────────────────────────────────────
export interface OceanSettings {
  theme:               'light' | 'dark' | 'system';
  reducedMotion:       boolean;
  timerMode:           'countdown' | 'stopwatch'; // default: countdown
  workDurationMin:     number;   // default 25
  breakDurationMin:    number;   // default 5
  breathCount:         number;   // 0-12
  autoStartNext:       boolean;
  overflowEnabled:     boolean;
  twoMinWarning:       boolean;
  soundEnabled:        boolean;
  soundPack:           'chime' | 'marimba' | 'wood' | 'silent';
  soundVolume:         number;   // 0-100
  ambientSound:        AmbientSound; // default: 'none'
  ambientVolume:       number;   // 0-100
  focusAssistEnabled:  boolean;
  requireIntention:    boolean;
  hasCompletedOnboarding: boolean;
}

export interface TodoTask {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

const DEFAULT_SETTINGS: OceanSettings = {
  theme:               'system',
  reducedMotion:       false,
  timerMode:           'countdown',
  workDurationMin:     25,
  breakDurationMin:    5,
  breathCount:         3,
  autoStartNext:       false,
  overflowEnabled:     false,
  twoMinWarning:       true,
  soundEnabled:        true,
  soundPack:           'chime',
  soundVolume:         70,
  ambientSound:        'none',
  ambientVolume:       60,
  focusAssistEnabled:  false,
  requireIntention:    true,
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
  // ── Stopwatch fields ──
  isStopwatch:    boolean; // true = count up mode
  elapsedMs:      number;  // ms elapsed so far (accumulated across pauses)
  breakElapsedMs: number;  // ms spent on manual breaks (excluded from focus time)
}

// ── Store ──────────────────────────────────────────────────────────────────
interface OceanStore {
  // Timer state
  phase:         SessionPhase;
  activeSession: ActiveSession | null;
  remaining:     number;   // seconds, recomputed from endAtUtc (countdown)
  elapsed:       number;   // seconds elapsed so far (stopwatch)
  glow:          boolean;  // 2-min warning (countdown only)

  // Data
  categories:    Category[];
  sessions:      SessionRecord[];
  // Recent intentions
  recentIntentions: string[];
  removeRecentIntention: (intention: string) => void;

  // UI
  settings:      OceanSettings;
  toasts:        ToastMessage[];
  navExpanded:   boolean;
  contextMenu:   ContextMenuState | null;
  tasks:         TodoTask[];

  // ── Actions ──────────────────────────────────────────────────────────────
  startSession: (intention: string, categoryId: string | null, durationMin: number) => void;
  startStopwatch: (intention: string, categoryId: string | null) => void;
  startBreathing: (intention: string, categoryId: string | null, durationMin: number, isStopwatch?: boolean) => void;
  beginFocusing: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  extendSession: (extraMin?: number) => void;
  endEarly: () => void;
  abortSession: () => void;
  completePhase: () => void;
  dismissEndedEarly: () => void;
  tick: () => void;
  // Stopwatch-specific break controls
  startStopwatchBreak: () => void;
  endStopwatchBreak: () => void;

  // Category CRUD
  addCategory:    (name: string, colorHex: string) => void;
  removeCategory: (id: string) => void; // Permanent delete
  archiveCategory: (id: string) => void;
  restoreCategory: (id: string) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;

  // Sessions
  saveSession: (record: Omit<SessionRecord, 'id'>) => void;
  removeSession: (id: string) => void;

  // Settings
  updateSettings: (patch: Partial<OceanSettings>) => void;

  // UI helpers
  addToast:     (message: string, type?: ToastMessage['type']) => void;
  removeToast:  (id: string) => void;
  setNavExpanded: (v: boolean) => void;
  applyTheme:   () => void;
  
  openContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  closeContextMenu: () => void;
  
  // Tasks
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  reorderTasks: (newTasks: TodoTask[]) => void;
  clearCompletedTasks: () => void;
}

let tickInterval: ReturnType<typeof setInterval> | null = null;

export const useOceanStore = create<OceanStore>()(
  persist(
    (set, get) => ({
      phase:         'idle',
      activeSession: null,
      remaining:     0,
      elapsed:       0,
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
      contextMenu:      null,
      tasks:            [],

      // ── Start breathing phase ────────────────────────────────────────────
      startBreathing: (intention, categoryId, durationMin, isStopwatch = false) => {
        const settings = get().settings;
        // For stopwatch, endAtUtc is set far in future so tick never auto-completes
        const endAtUtc = isStopwatch
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + durationMin * 60 * 1000);

        if (settings.breathCount === 0) {
          // Skip breathing, go straight to focusing
          set({
            phase: 'breathing',
            activeSession: {
              intention,
              categoryId,
              durationMin,
              startedAt: new Date(),
              endAtUtc,
              pausedAt: null,
              pausedRemainMs: 0,
              sessionCount: 0,
              overflowMs: 0,
              isStopwatch,
              elapsedMs: 0,
              breakElapsedMs: 0,
            },
          });
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
            endAtUtc,
            pausedAt: null,
            pausedRemainMs: 0,
            sessionCount: 0,
            overflowMs: 0,
            isStopwatch,
            elapsedMs: 0,
            breakElapsedMs: 0,
          },
        });
      },

      // ── Start Stopwatch ──────────────────────────────────────────────────
      startStopwatch: (intention, categoryId) => {
        get().startBreathing(intention, categoryId, 0, true);
        // Add to recent intentions (deduplicated)
        const prev = get().recentIntentions.filter(
          (r) => r.toLowerCase() !== intention.toLowerCase()
        );
        set({ recentIntentions: [intention, ...prev].slice(0, 10) });
      },

      removeRecentIntention: (intention) => set(s => ({
        recentIntentions: s.recentIntentions.filter(i => i !== intention)
      })),

      startSession: (intention, categoryId, durationMin) => {
        get().startBreathing(intention, categoryId, durationMin, false);
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

        if (as.isStopwatch) {
          // Stopwatch: reset startedAt to now, endAtUtc stays far future
          set({
            phase: 'focusing',
            glow: false,
            elapsed: 0,
            activeSession: {
              ...as,
              startedAt: new Date(),
              elapsedMs: 0,
            },
          });
        } else {
          const endAtUtc = new Date(Date.now() + as.durationMin * 60 * 1000);
          set({
            phase: 'focusing',
            glow: false,
            activeSession: { ...as, endAtUtc },
          });
        }

        // Start tick
        if (tickInterval) clearInterval(tickInterval);
        tickInterval = setInterval(() => get().tick(), 1000);
      },

      // ── Tick — drift-safe: remaining = endAtUtc - now ───────────────────
      tick: () => {
        const { phase, activeSession } = get();
        if (!activeSession || (phase !== 'focusing' && phase !== 'onBreak')) return;

        if (activeSession.isStopwatch && phase === 'focusing') {
          // Stopwatch: count up elapsed from startedAt + accumulated elapsedMs
          const nowMs = Date.now();
          const sessionElapsedMs = nowMs - activeSession.startedAt.getTime();
          const totalElapsedSec = Math.floor((activeSession.elapsedMs + sessionElapsedMs) / 1000);
          set({ elapsed: totalElapsedSec });
          return; // Stopwatch never auto-completes
        }

        // Countdown mode (or stopwatch on-break which uses its own tracking)
        const remainMs = activeSession.endAtUtc.getTime() - Date.now();
        const remainSec = Math.max(0, Math.ceil(remainMs / 1000));

        const glow = remainSec <= 120 && remainSec > 0 && phase === 'focusing';

        set({ remaining: remainSec, glow });

        if (remainSec === 0) {
          if (tickInterval) clearInterval(tickInterval);
          get().completePhase();
        }
      },

      // ── Stopwatch manual break controls ─────────────────────────────────
      startStopwatchBreak: () => {
        const { phase, activeSession } = get();
        if (!activeSession?.isStopwatch || phase !== 'focusing') return;
        if (tickInterval) clearInterval(tickInterval);
        // Accumulate elapsed up to this moment
        const nowMs = Date.now();
        const sessionElapsedMs = nowMs - activeSession.startedAt.getTime();
        const totalElapsedMs = activeSession.elapsedMs + sessionElapsedMs;
        set({
          phase: 'onBreak',
          activeSession: {
            ...activeSession,
            elapsedMs: totalElapsedMs,
            pausedAt: new Date(),
          },
        });
      },

      endStopwatchBreak: () => {
        const { phase, activeSession } = get();
        if (!activeSession?.isStopwatch || phase !== 'onBreak') return;
        // Track break duration
        const breakMs = activeSession.pausedAt
          ? Date.now() - activeSession.pausedAt.getTime()
          : 0;
        set({
          phase: 'focusing',
          activeSession: {
            ...activeSession,
            startedAt: new Date(), // reset segment start
            elapsedMs: activeSession.elapsedMs, // keep accumulated
            breakElapsedMs: activeSession.breakElapsedMs + breakMs,
            pausedAt: null,
          },
        });
        if (tickInterval) clearInterval(tickInterval);
        tickInterval = setInterval(() => get().tick(), 1000);
      },

      // ── Phase completed naturally ────────────────────────────────────────
      completePhase: () => {
        const { phase, activeSession, settings } = get();
        if (!activeSession) return;

        if (phase === 'focusing') {
          set({ phase: 'reflecting', glow: false });
        } else if (phase === 'reflecting') {
          // Stopwatch sessions skip break entirely (breaks are user-initiated)
          if (activeSession.isStopwatch) {
            set({ phase: 'idle', activeSession: null, remaining: 0, elapsed: 0, glow: false });
            return;
          }

          // If remaining > 0, the session was ended early. Show the custom message screen instead of a break.
          const { remaining } = get();
          if (remaining > 0) {
            set({ phase: 'endedEarly' });
            return;
          }

          // Otherwise, dynamic proportional break
          const breakRatio = settings.breakDurationMin / settings.workDurationMin;
          const breakDur = Math.round(activeSession.durationMin * breakRatio) || 1;

          set({
            phase: 'onBreak',
            activeSession: {
              ...activeSession,
              endAtUtc: new Date(Date.now() + breakDur * 60 * 1000),
              sessionCount: activeSession.sessionCount + 1,
            }
          });
          if (tickInterval) clearInterval(tickInterval);
          tickInterval = setInterval(() => get().tick(), 1000);
        } else if (phase === 'onBreak') {
          if (settings.autoStartNext) {
            get().startBreathing(
              activeSession.intention,
              activeSession.categoryId,
              settings.workDurationMin
            );
          } else {
            set({ phase: 'idle', activeSession: null, remaining: 0, elapsed: 0 });
          }
        }
      },

      pauseSession: () => {
        const { phase, activeSession } = get();
        if ((phase !== 'focusing' && phase !== 'onBreak') || !activeSession) return;
        if (tickInterval) clearInterval(tickInterval);

        if (activeSession.isStopwatch) {
          // For stopwatch: freeze elapsed at this moment
          const nowMs = Date.now();
          const sessionElapsedMs = nowMs - activeSession.startedAt.getTime();
          const totalElapsedMs = activeSession.elapsedMs + sessionElapsedMs;
          set({
            phase: 'paused',
            activeSession: {
              ...activeSession,
              elapsedMs: totalElapsedMs,
              pausedAt: new Date(),
            },
          });
        } else {
          const remainMs = activeSession.endAtUtc.getTime() - Date.now();
          set({
            phase: 'paused',
            activeSession: {
              ...activeSession,
              pausedAt: new Date(),
              pausedRemainMs: remainMs,
            },
          });
        }
      },

      resumeSession: () => {
        const { activeSession } = get();
        if (!activeSession) return;

        if (activeSession.isStopwatch) {
          // For stopwatch: reset segment startedAt to now, keep accumulated elapsedMs
          set({
            phase: 'focusing',
            activeSession: {
              ...activeSession,
              startedAt: new Date(),
              pausedAt: null,
            },
          });
        } else {
          const newEndAt = new Date(Date.now() + activeSession.pausedRemainMs);
          set({
            phase: 'focusing',
            activeSession: { ...activeSession, endAtUtc: newEndAt, pausedAt: null },
          });
        }
        if (tickInterval) clearInterval(tickInterval);
        tickInterval = setInterval(() => get().tick(), 1000);
      },

      extendSession: (extraMin = 5) => {
        const { activeSession, phase } = get();
        if (!activeSession) return;
        
        if (phase === 'paused') {
          // If paused, just increase pausedRemainMs so it's correct when resumed
          const newRemainMs = Math.max(0, activeSession.pausedRemainMs + extraMin * 60 * 1000);
          set({ activeSession: { ...activeSession, pausedRemainMs: newRemainMs } });
          set({ remaining: Math.ceil(newRemainMs / 1000) });
        } else {
          const newEndMs = Math.max(Date.now(), activeSession.endAtUtc.getTime() + extraMin * 60 * 1000);
          set({ activeSession: { ...activeSession, endAtUtc: new Date(newEndMs) } });
          get().tick();
        }
      },

      endEarly: () => {
        const { activeSession } = get();
        if (tickInterval) clearInterval(tickInterval);
        if (activeSession?.isStopwatch) {
          // For stopwatch, accumulate final elapsed before reflecting
          const nowMs = Date.now();
          const sessionElapsedMs = nowMs - activeSession.startedAt.getTime();
          const totalElapsedMs = activeSession.elapsedMs + sessionElapsedMs;
          set({
            phase: 'reflecting',
            glow: false,
            activeSession: { ...activeSession, elapsedMs: totalElapsedMs },
          });
        } else {
          set({ phase: 'reflecting', glow: false });
        }
      },

      abortSession: () => {
        if (tickInterval) clearInterval(tickInterval);
        set({ phase: 'idle', activeSession: null, remaining: 0, elapsed: 0, glow: false });
      },

      dismissEndedEarly: () => {
        if (tickInterval) clearInterval(tickInterval);
        set({ phase: 'idle', activeSession: null, remaining: 0, elapsed: 0, glow: false });
      },

      addCategory: (name, colorHex) => {
        const { categories } = get();
        const cat: Category = { id: `cat-${Date.now()}`, name, colorHex };
        set({ categories: [...categories, cat] });
      },

      removeCategory: (id) => set(s => ({
        categories: s.categories.filter(c => c.id !== id),
      })),

      archiveCategory: (id) => set(s => ({
        categories: s.categories.map(c => c.id === id ? { ...c, isArchived: true } : c),
      })),

      restoreCategory: (id) => set(s => ({
        categories: s.categories.map(c => c.id === id ? { ...c, isArchived: false } : c),
      })),

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
      removeSession: (id) => {
        set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) }));
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

      openContextMenu: (x, y, items) => {
        set({ contextMenu: { x, y, items } });
      },

      closeContextMenu: () => {
        set({ contextMenu: null });
      },

      // ── Task Actions ─────────────────────────────────────────────────────
      addTask: (text) => set(s => ({
        tasks: [...s.tasks, { id: `task-${Date.now()}`, text, completed: false, order: s.tasks.length }]
      })),
      toggleTask: (id) => set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      })),
      removeTask: (id) => set(s => ({
        tasks: s.tasks.filter(t => t.id !== id)
      })),
      reorderTasks: (newTasks) => set(s => {
        const nonReordered = s.tasks.filter(t => !newTasks.some(nt => nt.id === t.id));
        const updatedReordered = newTasks.map((t, i) => ({ ...t, order: i }));
        return {
          tasks: [...updatedReordered, ...nonReordered]
        };
      }),
      clearCompletedTasks: () => set(s => ({
        tasks: s.tasks.filter(t => !t.completed)
      })),
    }),
    {
      name:    'ocean-store',
      partialize: (s) => ({
        categories:       s.categories,
        sessions:         s.sessions,
        recentIntentions: s.recentIntentions,
        settings:         s.settings,
        tasks:            s.tasks,
      }),
      // Merge new setting defaults with stored settings on rehydration
      merge: (persisted: unknown, current) => ({
        ...current,
        ...(persisted as object),
        settings: {
          ...current.settings,
          ...((persisted as { settings?: Partial<OceanSettings> }).settings ?? {}),
        },
      }),
    }
  )
);
