// Ocean — Mini Player
// Part 3: Always-on-top, draggable, compact pill.
// Supports both countdown (ring depletes) and stopwatch (ring fills) modes.

import React from 'react';
import { useOceanStore } from '../store/useOceanStore';
import { Play, Pause, Maximize2, Waves } from 'lucide-react';
import { getCurrentWebviewWindow, WebviewWindow } from '@tauri-apps/api/webviewWindow';
import RingTimer from '../components/RingTimer';

import { useShallow } from 'zustand/react/shallow';

const STOPWATCH_BASELINE_SEC = 90 * 60;

const MiniPlayerScreen: React.FC = () => {
  const { phase, remaining, elapsed, activeSession, pauseSession, resumeSession } = useOceanStore(
    useShallow((s) => ({
      phase: s.phase,
      remaining: s.remaining,
      elapsed: s.elapsed,
      activeSession: s.activeSession,
      pauseSession: s.pauseSession,
      resumeSession: s.resumeSession,
    }))
  );
  const isPaused = phase === 'paused';
  const isBreak = phase === 'onBreak';
  const isStopwatch = activeSession?.isStopwatch ?? false;

  // Ring progress
  const totalSec = activeSession?.durationMin
    ? activeSession.durationMin * 60
    : (isBreak ? 5 * 60 : 25 * 60);

  const progress = isStopwatch
    ? Math.min(1, elapsed / STOPWATCH_BASELINE_SEC)
    : (totalSec > 0 ? remaining / totalSec : 0);

  // Display time
  const displaySec = isStopwatch ? elapsed : remaining;
  const h = Math.floor(displaySec / 3600);
  const m = Math.floor((displaySec % 3600) / 60);
  const s = displaySec % 60;
  const timeStr = h > 0
    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const color = isBreak && !isStopwatch ? 'break' : 'focus';
  const label = isBreak
    ? (isStopwatch ? 'break' : 'break')
    : (isPaused ? 'paused' : (isStopwatch ? 'flow' : 'focus'));

  // Mini player window size is 220x72
  return (
    <div
      data-tauri-drag-region
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 12,
        background: 'rgba(var(--bg-elevated-rgb), 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-full)',
        boxShadow: 'var(--shadow-float)',
        userSelect: 'none',
      }}
    >
      <div data-tauri-drag-region style={{ pointerEvents: 'none' }}>
        <RingTimer
          size={48}
          strokeWidth={4}
          progress={progress}
          color={color}
          mode="timer"
        >
          <span style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: `var(--accent-${color})` }}>
            {timeStr}
          </span>
        </RingTimer>
      </div>

      <div data-tauri-drag-region style={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {activeSession?.intention || 'Ocean Timer'}
        </div>
        <div style={{ fontSize: 11, color: `var(--accent-${color})`, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
          {isStopwatch && <Waves size={9} />}
          {label}
        </div>
      </div>

      <button
        onClick={isPaused ? resumeSession : pauseSession}
        aria-label={isPaused ? 'Resume' : 'Pause'}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: `var(--accent-${color})`,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} />}
      </button>

      <button
        onClick={async () => {
          try {
            const main = await WebviewWindow.getByLabel('main');
            if (main) {
              await main.show();
              await main.setFocus();
              await getCurrentWebviewWindow().hide();
            }
          } catch (e) {
            console.error(e);
          }
        }}
        aria-label="Expand to main window"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'transparent',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <Maximize2 size={14} />
      </button>
    </div>
  );
};

export default MiniPlayerScreen;
