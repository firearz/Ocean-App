// Ocean — Home Screen
// Part 2 § 2.2: Greeting, Mode Toggle, IntentionInput, CategoryPillRow,
// DurationSelector, Start Session/Flow button, Today strip.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Timer, Waves } from 'lucide-react';
import { useOceanStore } from '../store/useOceanStore';
import IntentionInput from '../components/IntentionInput';
import DurationSelector from '../components/DurationSelector';
import { CategoryPillRow } from '../components/CategoryPill';
import { PrimaryButton } from '../components/Buttons';

import { useShallow } from 'zustand/react/shallow';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning.';
  if (h < 17) return 'Good afternoon.';
  return 'Good evening.';
}

const HomeScreen: React.FC = () => {
  const {
    categories, recentIntentions, sessions, settings,
    startSession, startStopwatch, addCategory, addToast, removeRecentIntention, updateSettings
  } = useOceanStore(
    useShallow((s) => ({
      categories: s.categories,
      recentIntentions: s.recentIntentions,
      sessions: s.sessions,
      settings: s.settings,
      startSession: s.startSession,
      startStopwatch: s.startStopwatch,
      addCategory: s.addCategory,
      addToast: s.addToast,
      removeRecentIntention: s.removeRecentIntention,
      updateSettings: s.updateSettings,
    }))
  );

  const [intention,   setIntention]   = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [duration,    setDuration]    = useState(settings.workDurationMin);

  const isStopwatch = settings.timerMode === 'stopwatch';

  // Today stats
  const todayStr = new Date().toDateString();
  const todaySessions = sessions.filter(s =>
    new Date(s.startedAt).toDateString() === todayStr && s.status === 'completed'
  );
  const todayMinutes  = Math.round(todaySessions.reduce((a, s) => a + s.actualDurationSec / 60, 0));

  // Streak — consecutive days with ≥1 completed session
  const streak = (() => {
    const days = new Set(sessions.filter(s => s.status === 'completed')
      .map(s => new Date(s.startedAt).toDateString()));
    let count = 0;
    const d = new Date();
    while (days.has(d.toDateString())) { count++; d.setDate(d.getDate() - 1); }
    return count;
  })();

  const handleStart = () => {
    if (settings.requireIntention && !intention.trim()) {
      addToast('Please state your intention before starting.', 'warning');
      return;
    }
    if (isStopwatch) {
      startStopwatch(intention.trim() || 'Flow session', selectedCat);
    } else {
      startSession(intention.trim() || 'Focus session', selectedCat, duration);
    }
  };

  return (
    <div className="home-screen">
      {/* Ambient backdrop — idle, no tint */}
      <div className="ambient-backdrop" />

      <div className="home-content">
        {/* ── Mode Toggle ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, duration: 0.3 }}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <div
            className="mode-toggle"
            role="group"
            aria-label="Timer mode"
          >
            {(['countdown', 'stopwatch'] as const).map((mode) => {
              const active = settings.timerMode === mode;
              const Icon = mode === 'countdown' ? Timer : Waves;
              const label = mode === 'countdown' ? 'Timer' : 'Stopwatch';
              return (
                <motion.button
                  key={mode}
                  className="mode-toggle__option"
                  onClick={() => updateSettings({ timerMode: mode })}
                  aria-pressed={active}
                  aria-label={`${label} mode`}
                  whileHover={{ scale: active ? 1 : 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  style={{ position: 'relative', zIndex: 1, border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  {active && (
                    <motion.div
                      layoutId="modeToggleActive"
                      className="mode-toggle__indicator"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="mode-toggle__content" style={{ color: active ? '#fff' : 'var(--text-secondary)' }}>
                    <Icon size={13} />
                    {label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Greeting */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="text-secondary"
          style={{ fontSize: 'var(--fs-body)' }}
        >
          {getGreeting()}
        </motion.p>

        {/* Intention input */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <IntentionInput
            value={intention}
            onChange={setIntention}
            recentIntentions={recentIntentions}
            onRemoveRecent={removeRecentIntention}
          />
        </motion.div>

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <CategoryPillRow
            categories={categories.filter(c => !c.isArchived)}
            selected={selectedCat}
            onSelect={(cat) => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
            onAdd={(name, colorHex) => addCategory(name, colorHex)}
          />
        </motion.div>

        {/* Duration selector — only in countdown mode */}
        <AnimatePresence mode="wait">
          {!isStopwatch && (
            <motion.div
              key="duration-selector"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden' }}
            >
              <DurationSelector value={duration} onChange={setDuration} />
            </motion.div>
          )}
          {isStopwatch && (
            <motion.div
              key="stopwatch-hint"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <p
                className="text-secondary"
                style={{
                  textAlign: 'center',
                  fontSize: 'var(--fs-caption)',
                  padding: '6px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Waves size={13} />
                Open-ended — stop whenever you're done
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start session / Start flow */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <PrimaryButton
            className="btn--full btn--lg"
            onClick={handleStart}
            icon={isStopwatch
              ? <Waves size={17} />
              : <Play size={17} fill="currentColor" />
            }
          >
            {isStopwatch ? 'Start Flow' : 'Start Session'}
          </PrimaryButton>
        </motion.div>

        {/* Today strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="today-strip"
        >
          <div className="stat-chip">
            <span className="stat-chip__value">{todaySessions.length}</span>
            <span className="stat-chip__label">sessions today</span>
          </div>
          <div className="stat-chip">
            <span className="stat-chip__value">{todayMinutes < 60 ? `${todayMinutes}m` : `${Math.floor(todayMinutes/60)}h`}</span>
            <span className="stat-chip__label">focused today</span>
          </div>
          <div className="stat-chip">
            <span className="stat-chip__value" style={{ color: streak > 0 ? 'var(--accent-focus)' : undefined }}>{streak}</span>
            <span className="stat-chip__label">day streak</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};



export default HomeScreen;
