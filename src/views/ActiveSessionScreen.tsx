// Ocean — Active Session Screen
// Part 2 § 2.4: Large RingTimer, MM:SS, controls, blocking badge, ambient tint.
// Part 1 § 2.2: Warm coral radial gradient backdrop during focus.

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, StopCircle, Plus, Minus, Lock, Minimize2, CheckSquare } from 'lucide-react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Window } from '@tauri-apps/api/window';
import { useOceanStore } from '../store/useOceanStore';
import RingTimer from '../components/RingTimer';
import { IconButton, GhostButton } from '../components/Buttons';
import { CategoryPill } from '../components/CategoryPill';
import { TaskItem } from '../components/TaskItem';

import { useShallow } from 'zustand/react/shallow';

// Generate random organic border radii for the liquid blob
const blobShapes = [
  "60% 40% 30% 70% / 60% 30% 70% 40%",
  "30% 70% 70% 30% / 30% 30% 70% 70%",
  "50% 50% 20% 80% / 25% 80% 20% 75%",
  "40% 60% 70% 30% / 40% 50% 50% 60%",
  "70% 30% 50% 50% / 30% 30% 70% 70%",
];

const MorphingBlob: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  if (reducedMotion) return null;
  return (
    <motion.div
      animate={{ borderRadius: blobShapes }}
      transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", repeatType: "mirror" }}
      style={{
        position: 'absolute',
        top: 10, left: 10, right: 10, bottom: 10,
        background: 'var(--accent-focus-subtle)',
        zIndex: -1,
        opacity: 0.8,
        filter: 'blur(8px)'
      }}
    />
  );
};

const ActiveSessionScreen: React.FC = () => {
  const {
    phase, remaining, activeSession, glow,
    categories,
    pauseSession, resumeSession, extendSession, endEarly, tasks, addTask
  } = useOceanStore(
    useShallow((s) => ({
      phase: s.phase,
      remaining: s.remaining,
      activeSession: s.activeSession,
      glow: s.glow,
      categories: s.categories,
      pauseSession: s.pauseSession,
      resumeSession: s.resumeSession,
      extendSession: s.extendSession,
      endEarly: s.endEarly,
      tasks: s.tasks,
      addTask: s.addTask,
    }))
  );

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [newTask, setNewTask] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTask(newTask.trim());
      setNewTask('');
    }
  };

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
        backgroundImage: `radial-gradient(ellipse 80% 60% at 50% 30%,
          rgba(var(--accent-focus-rgb), ${isPaused ? 0.03 : 0.06}) 0%,
          transparent 70%)`,
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

      {/* Tasks Popup Button */}
      <div style={{ position: 'absolute', top: '50%', right: 20, transform: 'translateY(-50%)', zIndex: 50 }}>
        <IconButton
          label="View Tasks"
          onClick={() => setShowTasks(!showTasks)}
          style={{ background: showTasks || isPinned ? 'var(--accent-focus)' : 'var(--bg-surface)', color: showTasks || isPinned ? '#fff' : 'var(--text-primary)' }}
        >
          <CheckSquare size={20} />
        </IconButton>
        
        <AnimatePresence>
          {(showTasks || isPinned) && (
            <motion.div
              drag
              dragMomentum={false}
              initial={{ opacity: 0, scale: 0.9, x: 20, y: 0, transformOrigin: 'right center' }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20, y: 0 }}
              style={{
                position: 'absolute', top: '50%', right: 60, width: 320, maxHeight: 400,
                transform: 'translateY(-50%)',
                background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-subtle)',
                overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12,
                cursor: 'grab'
              }}
              whileDrag={{ cursor: 'grabbing', scale: 1.02, boxShadow: 'var(--shadow-float)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'grab' }}>
                <h3 className="text-h2" style={{ margin: 0, fontSize: 16 }}>Tasks</h3>
                <IconButton 
                  size={24} 
                  label={isPinned ? "Unpin window" : "Pin window"} 
                  onClick={() => setIsPinned(!isPinned)}
                  style={{ color: isPinned ? 'var(--accent-focus)' : 'var(--text-tertiary)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="17" x2="12" y2="22"></line>
                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                  </svg>
                </IconButton>
              </div>

              <form onSubmit={handleAddTask} style={{ display: 'flex', gap: 8, marginTop: 4, cursor: 'default' }}>
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a task..."
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)', background: 'var(--bg-surface)',
                    fontSize: 'var(--fs-body)', color: 'var(--text-primary)', outline: 'none',
                    minWidth: 0
                  }}
                />
                <button type="submit" disabled={!newTask.trim()} style={{
                  background: newTask.trim() ? 'var(--accent-focus)' : 'var(--bg-elevated)',
                  color: newTask.trim() ? '#fff' : 'var(--text-tertiary)',
                  border: 'none', borderRadius: 'var(--radius-md)', padding: '0 14px',
                  cursor: newTask.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}>
                  <Plus size={18} />
                </button>
              </form>

              {tasks.filter(t => !t.completed).length === 0 ? (
                <p className="text-tertiary text-micro" style={{ textAlign: 'center', padding: '20px 0' }}>All caught up!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'default' }}>
                  {tasks.filter(t => !t.completed).map(task => (
                    <TaskItem key={task.id} task={task} dragEnabled={false} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
        style={{ position: 'relative' }}
      >
        <MorphingBlob reducedMotion={useOceanStore(s => s.settings?.reducedMotion ?? false)} />
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
        style={{ position: 'relative', zIndex: 10 }}
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

        {/* Reduce -5 */}
        <IconButton
          label="Reduce session by 5 minutes"
          onClick={() => extendSession(-5)}
        >
          <Minus size={18} />
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
