// Ocean — Home Screen
// Part 2 § 2.2: Greeting, IntentionInput, CategoryPillRow,
// DurationSelector, Start Session button, Today strip.

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
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
    startSession, addCategory, addToast, removeRecentIntention
  } = useOceanStore(
    useShallow((s) => ({
      categories: s.categories,
      recentIntentions: s.recentIntentions,
      sessions: s.sessions,
      settings: s.settings,
      startSession: s.startSession,
      addCategory: s.addCategory,
      addToast: s.addToast,
      removeRecentIntention: s.removeRecentIntention,
    }))
  );

  const [intention,   setIntention]   = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [duration,    setDuration]    = useState(settings.workDurationMin);

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
    startSession(intention.trim() || 'Focus session', selectedCat, duration);
  };

  return (
    <div className="home-screen">
      {/* Ambient backdrop — idle, no tint */}
      <div className="ambient-backdrop" />

      <div className="home-content">
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

        {/* Duration selector */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <DurationSelector value={duration} onChange={setDuration} />
        </motion.div>

        {/* Start session */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <PrimaryButton
            className="btn--full btn--lg"
            onClick={handleStart}
            icon={<Play size={17} fill="currentColor" />}
          >
            Start Session
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
            <span className="stat-chip__label">{streak === 1 ? 'day streak' : 'day streak'}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};



export default HomeScreen;
