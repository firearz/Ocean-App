// Ocean — Settings Screen
// Part 2 § 2.9: All 8 sub-sections with sidebar nav.

import React, { useState } from 'react';
import { useOceanStore } from '../store/useOceanStore';
import { useShallow } from 'zustand/react/shallow';
import { Toggle, Slider, Stepper } from '../components/Primitives';
import { GhostButton, PrimaryButton } from '../components/Buttons';
import type { AmbientSound } from '../store/useOceanStore';
import {
  Timer, Music, ShieldOff, Bell, User, Info, Palette, Waves
} from 'lucide-react';

const SECTIONS = [
  { id: 'timer',        label: 'Timer',         icon: Timer       },
  { id: 'appearance',   label: 'Appearance',    icon: Palette     },
  { id: 'sounds',       label: 'Sounds',        icon: Music       },
  { id: 'blocking',     label: 'Blocking',      icon: ShieldOff   },
  { id: 'notifications',label: 'Notifications', icon: Bell        },
  { id: 'account',      label: 'Account',       icon: User        },
  { id: 'about',        label: 'About',         icon: Info        },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

// ── Reusable setting row ───────────────────────────────────────────────────
const SettingRow: React.FC<{
  label: string;
  description?: string;
  control: React.ReactNode;
  disabled?: boolean;
}> = ({ label, description, control, disabled }) => (
  <div className="settings-row" style={{ opacity: disabled ? 0.5 : 1 }}>
    <div className="settings-row__left">
      <span style={{ fontSize: 'var(--fs-body)', color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
      {description && <span className="text-micro text-tertiary">{description}</span>}
    </div>
    <div style={{ flexShrink: 0 }}>{control}</div>
  </div>
);

// ── 1. Timer ───────────────────────────────────────────────────────────────
const TimerSection: React.FC = () => {
  const { settings, updateSettings } = useOceanStore(
    useShallow((s) => ({ settings: s.settings, updateSettings: s.updateSettings }))
  );

  const handleWorkDurationChange = (newWork: number) => {
    const ratio = settings.breakDurationMin / settings.workDurationMin;
    const newBreak = Math.max(1, Math.round(newWork * ratio));
    updateSettings({ workDurationMin: newWork, breakDurationMin: newBreak });
  };

  return (
    <div className="settings-card">
      <h2 className="text-h2">Timer</h2>
      <SettingRow label="Default mode"
        description="Switch between a fixed countdown timer or an open-ended stopwatch"
        control={
          <div style={{ display: 'flex', gap: 4 }}>
            {(['countdown', 'stopwatch'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => updateSettings({ timerMode: mode })}
                aria-pressed={settings.timerMode === mode}
                style={{
                  padding: '6px 14px', cursor: 'pointer',
                  borderRadius: 'var(--radius-full)', border: 'none',
                  fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', fontWeight: 500,
                  background: settings.timerMode === mode ? 'var(--accent-focus)' : 'transparent',
                  color: settings.timerMode === mode ? '#fff' : 'var(--text-secondary)',
                  transition: 'background var(--dur-fast), color var(--dur-fast)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {mode === 'countdown' ? <Timer size={13} /> : <Waves size={13} />}
                {mode === 'countdown' ? 'Timer' : 'Stopwatch'}
              </button>
            ))}
          </div>
        }
      />
      <SettingRow label="Work duration"
        disabled={settings.timerMode === 'stopwatch'}
        control={<Stepper value={settings.workDurationMin} onChange={handleWorkDurationChange} min={1} max={180} step={5} unit=" min" />}
      />
      <SettingRow label="Break duration"
        description="This ratio is maintained for all your sessions."
        disabled={settings.timerMode === 'stopwatch'}
        control={<Stepper value={settings.breakDurationMin} onChange={v => updateSettings({ breakDurationMin: v })} min={1} max={60} step={1} unit=" min" />}
      />
      <SettingRow label="Breathing exercises"
        description="Number of breath cycles before each session"
        control={<Stepper value={settings.breathCount} onChange={v => updateSettings({ breathCount: v })} min={0} max={12} step={1} unit=" breaths" />}
      />
      <SettingRow label="Auto-start next session"
        description="Automatically start focusing after a break"
        disabled={settings.timerMode === 'stopwatch'}
        control={<Toggle id="auto-start" checked={settings.autoStartNext} onChange={v => updateSettings({ autoStartNext: v })} />}
      />
      <SettingRow label="Overflow timer"
        description="Keep counting after session ends until you stop"
        disabled={settings.timerMode === 'stopwatch'}
        control={<Toggle id="overflow" checked={settings.overflowEnabled} onChange={v => updateSettings({ overflowEnabled: v })} />}
      />
      <SettingRow label="2-minute warning"
        description="Glow ring when 2 minutes remain"
        disabled={settings.timerMode === 'stopwatch'}
        control={<Toggle id="two-min" checked={settings.twoMinWarning} onChange={v => updateSettings({ twoMinWarning: v })} />}
      />
      <SettingRow label="Require intention"
        description="Prevent starting without stating a focus intention"
        control={<Toggle id="req-intention" checked={settings.requireIntention} onChange={v => updateSettings({ requireIntention: v })} />}
      />
    </div>
  );
};

// ── 2. Appearance ──────────────────────────────────────────────────────────
const AppearanceSection: React.FC = () => {
  const { settings, updateSettings } = useOceanStore(
    useShallow((s) => ({ settings: s.settings, updateSettings: s.updateSettings }))
  );
  const themes = [
    { value: 'system', label: 'System' },
    { value: 'light',  label: 'Light'  },
    { value: 'dark',   label: 'Dark'   },
  ] as const;

  return (
    <div className="settings-card">
      <h2 className="text-h2">Appearance</h2>
      <SettingRow label="Theme"
        control={
          <div style={{ display: 'flex', gap: 4 }}>
            {themes.map(t => (
              <button
                key={t.value}
                onClick={() => updateSettings({ theme: t.value })}
                aria-pressed={settings.theme === t.value}
                style={{
                  padding: '6px 14px', cursor: 'pointer',
                  borderRadius: 'var(--radius-full)', border: 'none',
                  fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', fontWeight: 500,
                  background: settings.theme === t.value ? 'var(--accent-focus)' : 'transparent',
                  color: settings.theme === t.value ? '#fff' : 'var(--text-secondary)',
                  transition: 'background var(--dur-fast), color var(--dur-fast)'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />
      <SettingRow label="Reduced motion"
        description="Disable fluid physics, gooey effects, and morphological animations"
        control={<Toggle id="reduced-motion" checked={settings.reducedMotion} onChange={v => updateSettings({ reducedMotion: v })} />}
      />
    </div>
  );
};

// ── 3. Sounds ─────────────────────────────────────────────────────────────
const SoundsSection: React.FC = () => {
  const { settings, updateSettings } = useOceanStore(
    useShallow((s) => ({ settings: s.settings, updateSettings: s.updateSettings }))
  );
  const packs = ['chime', 'marimba', 'wood', 'silent'] as const;

  const AMBIENT_OPTIONS: { id: AmbientSound; label: string; emoji: string }[] = [
    { id: 'none',        label: 'Off',         emoji: '🔇' },
    { id: 'ocean',       label: 'Ocean',       emoji: '🌊' },
    { id: 'rain',        label: 'Rain',        emoji: '🌧️' },
    { id: 'brown-noise', label: 'Brown Noise', emoji: '🟫' },
    { id: 'pink-noise',  label: 'Pink Noise',  emoji: '🌸' },
    { id: 'white-noise', label: 'White Noise', emoji: '⬜' },
  ];

  return (
    <div className="settings-card">
      <h2 className="text-h2">Sounds</h2>
      <SettingRow label="Enable sounds"
        control={<Toggle id="sound-on" checked={settings.soundEnabled} onChange={v => updateSettings({ soundEnabled: v })} />}
      />
      <SettingRow label="Sound pack" disabled={!settings.soundEnabled}
        control={
          <div style={{ display: 'flex', gap: 4 }}>
            {packs.map(p => (
              <button
                key={p}
                onClick={() => updateSettings({ soundPack: p })}
                aria-pressed={settings.soundPack === p}
                disabled={!settings.soundEnabled}
                style={{
                  padding: '6px 12px', cursor: settings.soundEnabled ? 'pointer' : 'not-allowed',
                  borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--fs-micro)', fontWeight: 600, textTransform: 'capitalize',
                  background: settings.soundPack === p ? 'var(--accent-focus)' : 'var(--bg-surface)',
                  color: settings.soundPack === p ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${settings.soundPack === p ? 'transparent' : 'var(--border-subtle)'}`,
                  transition: 'all 0.15s',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />
      <SettingRow label="Volume" disabled={!settings.soundEnabled}
        control={<div style={{ width: 200 }}><Slider id="vol" value={settings.soundVolume} onChange={v => updateSettings({ soundVolume: v })} unit="%" /></div>}
      />

      {/* ── Ambient Soundscapes ── */}
      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0' }} />
      <h3 style={{ fontSize: 'var(--fs-caption)', fontWeight: 600, color: 'var(--text-secondary)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)' }}>
        Ambient Soundscapes
      </h3>
      <SettingRow label="Default soundscape"
        description="Plays automatically during focus sessions"
        control={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {AMBIENT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => updateSettings({ ambientSound: opt.id })}
                aria-pressed={settings.ambientSound === opt.id}
                style={{
                  padding: '5px 10px', cursor: 'pointer',
                  borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--fs-micro)', fontWeight: 600,
                  background: settings.ambientSound === opt.id ? 'var(--accent-focus)' : 'var(--bg-surface)',
                  color: settings.ambientSound === opt.id ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${settings.ambientSound === opt.id ? 'transparent' : 'var(--border-subtle)'}`,
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <span>{opt.emoji}</span> {opt.label}
              </button>
            ))}
          </div>
        }
      />
      <SettingRow label="Ambient volume" disabled={settings.ambientSound === 'none'}
        control={<div style={{ width: 200 }}><Slider id="ambient-vol" value={settings.ambientVolume} onChange={v => updateSettings({ ambientVolume: v })} unit="%" /></div>}
      />
    </div>
  );
};

// ── 4. Blocking ────────────────────────────────────────────────────────────
const BlockingSection: React.FC = () => {
  const { settings, updateSettings, addToast } = useOceanStore(
    useShallow((s) => ({ settings: s.settings, updateSettings: s.updateSettings, addToast: s.addToast }))
  );
  return (
    <div className="settings-card">
      <h2 className="text-h2">App & Site Blocking</h2>
      <SettingRow label="Enable Focus Assist"
        description="Suppresses Windows notifications during sessions"
        control={<Toggle id="focus-assist" checked={settings.focusAssistEnabled} onChange={v => updateSettings({ focusAssistEnabled: v })} />}
      />
      <SettingRow label="App & site blocklist"
        description="Manage blocked apps and websites"
        control={
          <GhostButton size="sm" onClick={() => addToast('App blocking editor coming soon.', 'info')}>
            Manage
          </GhostButton>
        }
      />
      <div style={{
        marginTop: 'var(--space-4)',
        padding: 'var(--space-4)',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
      }}>
        <p className="text-caption text-secondary" style={{ lineHeight: 1.7 }}>
          <strong>Note:</strong> Deep blocking requires elevated privileges.
          Ocean will prompt for administrator access the first time blocking is activated.
        </p>
      </div>
    </div>
  );
};

// ── 5. Notifications ───────────────────────────────────────────────────────
const NotificationsSection: React.FC = () => (
  <div className="settings-card">
    <h2 className="text-h2">Notifications</h2>
    <p className="text-caption text-secondary" style={{ lineHeight: 1.7 }}>
      Ocean uses Windows app notifications for session end, break end, and daily reminders.
      Manage notification priority in <strong>Windows Settings → System → Notifications</strong>.
    </p>
  </div>
);

// ── 6. Account ────────────────────────────────────────────────────────────
const AccountSection: React.FC = () => (
  <div className="settings-card">
    <h2 className="text-h2">Account</h2>
    <p className="text-caption text-secondary" style={{ marginBottom: 'var(--space-4)', lineHeight: 1.7 }}>
      Sign in to sync your sessions and settings across devices.
    </p>
    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
      <PrimaryButton size="sm">Sign in with Google</PrimaryButton>
      <GhostButton size="sm">Use anonymously</GhostButton>
    </div>
  </div>
);


// ── 8. About ──────────────────────────────────────────────────────────────
const AboutSection: React.FC = () => (
  <div className="settings-card">
    <h2 className="text-h2">About Ocean</h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <SettingRow label="Version" control={<span className="text-caption">0.1.0</span>} />
      <SettingRow label="Stack" control={<span className="text-caption">Tauri 2 · React 19 · TypeScript</span>} />
    </div>
    <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
      <GhostButton size="sm">Check for updates</GhostButton>
      <GhostButton size="sm">Privacy policy</GhostButton>
      <GhostButton size="sm">Open source licenses</GhostButton>
    </div>
  </div>
);

const SECTION_CONTENT: Record<SectionId, React.FC> = {
  timer:         TimerSection,
  appearance:    AppearanceSection,
  sounds:        SoundsSection,
  blocking:      BlockingSection,
  notifications: NotificationsSection,
  account:       AccountSection,
  about:         AboutSection,
};

// ── Settings Screen ────────────────────────────────────────────────────────
const SettingsScreen: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('timer');
  const ActiveContent = SECTION_CONTENT[activeSection];

  return (
    <div className="settings-layout">
      {/* Sidebar nav */}
      <nav className="settings-nav" aria-label="Settings sections">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`settings-nav__item${activeSection === id ? ' settings-nav__item--active' : ''}`}
            onClick={() => setActiveSection(id)}
            aria-current={activeSection === id ? 'page' : undefined}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon size={14} /> {label}
            </span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="settings-content">
        <h1 className="text-h1" style={{ marginBottom: 'var(--space-4)' }}>
          {SECTIONS.find(s => s.id === activeSection)?.label}
        </h1>
        <div className="card">
          <ActiveContent />
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
