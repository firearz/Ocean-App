// Ocean — Break Screen
// Part 2 § 2.5: Same structure as Active Session, re-skinned green.
// "Rest. You've earned it." — restorative copy, Skip Break control.

import React from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, SkipForward } from 'lucide-react';
import { useOceanStore } from '../store/useOceanStore';
import RingTimer from '../components/RingTimer';
import { IconButton, PrimaryButton } from '../components/Buttons';

const BreakScreen: React.FC = () => {
  const {
    phase, remaining,
    pauseSession, resumeSession, completePhase, settings,
  } = useOceanStore();

  const isPaused = phase === 'paused';
  const totalSec = settings.breakDurationMin * 60;
  const progress = totalSec > 0 ? remaining / totalSec : 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const isEnded = remaining === 0;

  return (
    <div
      className="break-screen"
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% 30%,
          rgba(var(--accent-break-rgb), 0.06) 0%,
          var(--bg-canvas) 70%)`,
      }}
    >
      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center' }}
      >
        <h1 className="text-h1" style={{ color: 'var(--accent-break)', marginBottom: 8 }}>
          Rest. You've earned it.
        </h1>
        <p className="text-secondary text-body">Step away and recharge.</p>
      </motion.div>

      {/* Ring Timer — green */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: isPaused ? 0.7 : 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      >
        <RingTimer
          size={280}
          strokeWidth={7}
          progress={progress}
          color="break"
          mode="timer"
        >
          <span
            className="ring-timer__digits"
            style={{ fontSize: 60, color: 'var(--accent-break)' }}
            aria-label={`${mm} minutes ${ss} seconds remaining on break`}
          >
            {mm}:{ss}
          </span>
          <span className="ring-timer__label" style={{ color: 'var(--accent-break)', fontSize: 13 }}>
            {isPaused ? 'paused' : 'on break'}
          </span>
        </RingTimer>
      </motion.div>

      {/* Controls */}
      <motion.div
        className="session-controls"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Pause / Resume */}
        <IconButton
          label={isPaused ? 'Resume break' : 'Pause break'}
          onClick={isPaused ? resumeSession : pauseSession}
        >
          {isPaused ? <Play size={18} /> : <Pause size={18} />}
        </IconButton>

        {/* Skip Break / Start Next Session */}
        {isEnded ? (
          <PrimaryButton
            onClick={completePhase}
            style={{ background: 'var(--accent-break)' }}
          >
            Start Next Session
          </PrimaryButton>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={completePhase}
            aria-label="Skip break"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--accent-break)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 6px 20px rgba(var(--accent-break-rgb), 0.32)',
            }}
          >
            <SkipForward size={26} />
          </motion.button>
        )}
      </motion.div>

      {/* Break-time reminder */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-caption text-tertiary"
        style={{ maxWidth: 300, textAlign: 'center' }}
      >
        Don't forget to take a real rest — close work apps and step away.
      </motion.p>
    </div>
  );
};

export default BreakScreen;
