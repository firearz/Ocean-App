// Ocean — Mini Player
// Part 3: Always-on-top, draggable, compact pill.

import React from 'react';
import { useOceanStore } from '../store/useOceanStore';
import { Play, Pause, Maximize2 } from 'lucide-react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Window } from '@tauri-apps/api/window';
import RingTimer from '../components/RingTimer';

const MiniPlayerScreen: React.FC = () => {
  const { phase, remaining, activeSession, pauseSession, resumeSession } = useOceanStore();
  const isPaused = phase === 'paused';
  const isBreak = phase === 'onBreak' || phase === 'longBreak';
  
  const totalSec = activeSession?.durationMin 
    ? activeSession.durationMin * 60 
    : (isBreak ? 5 * 60 : 25 * 60);

  const progress = totalSec > 0 ? remaining / totalSec : 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  
  const color = isBreak ? 'break' : 'focus';
  const label = isBreak ? 'break' : (isPaused ? 'paused' : 'focus');

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
          <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: `var(--accent-${color})` }}>
            {mm}:{ss}
          </span>
        </RingTimer>
      </div>

      <div data-tauri-drag-region style={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {activeSession?.intention || 'Ocean Timer'}
        </div>
        <div style={{ fontSize: 11, color: `var(--accent-${color})`, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
            const main = await Window.getByLabel('main');
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
