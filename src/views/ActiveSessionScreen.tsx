// Ocean — Active Session Screen
// Part 2 § 2.4: Large RingTimer, MM:SS, controls, blocking badge, ambient tint.
// Part 1 § 2.2: Warm coral radial gradient backdrop during focus.

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, StopCircle, Plus, Lock, Minimize2 } from 'lucide-react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Window } from '@tauri-apps/api/window';
import { useOceanStore } from '../store/useOceanStore';
import RingTimer from '../components/RingTimer';
import { IconButton, GhostButton } from '../components/Buttons';
import { CategoryPill } from '../components/CategoryPill';

const ActiveSessionScreen: React.FC = () => {
  const {
    phase, remaining, activeSession, glow,
    categories,
    pauseSession, resumeSession, extendSession, endEarly,
  } = useOceanStore();

  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const isPaused     = phase === 'paused';
  const totalSec     = (activeSession?.durationMin ?? 25) * 60;
  const progress     = totalSec > 0 ? remaining / totalSec : 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const category = categories.find(c => c.id === activeSession?.categoryId);

  // Announce 2-min warning to screen readers (once)
  const [announced, setAnnounced] = useState(false);
  useEffect(() => {
    if (remaining <= 120 && remaining > 0 && !announced) {
      setAnnounced(true);
    }
  }, [remaining]);

  return (
    <div
      className="session-screen"
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% 30%,
          rgba(var(--accent-focus-rgb), ${isPaused ? 0.03 : 0.06}) 0%,
          var(--bg-canvas) 70%)`,
      }}
    >
      {/* Live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', left: -9999 }}
      >
        {announced ? '2 minutes remaining' : ''}
      </div>

      {/* Blocking badge */}
      <div
        className="session-badge"
        role="button"
        tabIndex={0}
        aria-label="Blocking status"
        title="View blocked apps and sites"
      >
        <Lock size={11} />
        <span>Focus mode active</span>
      </div>

      {/* Paused overlay */}
      {isPaused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 16px',
            fontSize: 'var(--fs-micro)',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            backdropFilter: 'var(--blur-surface)',
          }}
        >
          PAUSED
        </motion.div>
      )}

      {/* Ring Timer — hero element */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: isPaused ? 0.7 : 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      >
        <RingTimer
          size={320}
          strokeWidth={8}
          progress={progress}
          color="focus"
          glow={glow}
          mode="timer"
        >
          <span
            className="ring-timer__digits"
            style={{ fontSize: 72 }}
            aria-label={`${mm} minutes ${ss} seconds remaining`}
          >
            {mm}:{ss}
          </span>
          <span className="ring-timer__label" style={{ fontSize: 14 }}>
            {isPaused ? 'paused' : 'focusing'}
          </span>
        </RingTimer>
      </motion.div>

      {/* Intention + Category */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
      >
        <p style={{
          fontSize: 18,
          fontWeight: 400,
          color: 'var(--text-primary)',
          maxWidth: 400,
          lineHeight: 1.4,
        }}>
          {activeSession?.intention || 'Focus session'}
        </p>
        {category && (
          <div style={{ pointerEvents: 'none' }}>
            <CategoryPill
              category={category}
              selected
            />
          </div>
        )}
      </motion.div>

      {/* Controls */}
      <motion.div
        className="session-controls"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Switch to Mini Player */}
        <IconButton
          label="Mini Player"
          onClick={async () => {
            try {
              const mini = await Window.getByLabel('mini');
              if (mini) {
                await mini.show();
                await getCurrentWebviewWindow().hide();
              }
            } catch (e) {
              console.error(e);
            }
          }}
        >
          <Minimize2 size={18} />
        </IconButton>

        {/* Extend +5 */}
        <IconButton
          label="Extend session by 5 minutes"
          onClick={() => extendSession(5)}
        >
          <Plus size={18} />
        </IconButton>

        {/* Pause / Resume */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={isPaused ? resumeSession : pauseSession}
          aria-label={isPaused ? 'Resume session' : 'Pause session'}
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--accent-focus)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 6px 20px rgba(var(--accent-focus-rgb), 0.36)',
          }}
        >
          {isPaused
            ? <Play size={26} fill="currentColor" />
            : <Pause size={26} />
          }
        </motion.button>

        {/* End Early */}
        <IconButton
          label="End session early"
          onClick={() => setShowEndConfirm(true)}
        >
          <StopCircle size={18} />
        </IconButton>
      </motion.div>

      {/* End confirmation dialog */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            className="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="confirm-dialog"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            >
              <h2 className="text-h2">End session early?</h2>
              <p className="text-body text-secondary">
                The session will be saved with your actual focus time.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <GhostButton onClick={() => setShowEndConfirm(false)}>Keep going</GhostButton>
                <button
                  className="btn btn-primary"
                  onClick={() => { setShowEndConfirm(false); endEarly(); }}
                  style={{ background: 'var(--accent-focus)' }}
                >
                  End session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActiveSessionScreen;
