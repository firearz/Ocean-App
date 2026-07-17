// Ocean — AmbientPicker Component
// A floating in-session ambient sound selector with volume control.
// Collapses to a minimal pill, expands to show all soundscape options.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, ChevronUp } from 'lucide-react';
import { useOceanStore } from '../store/useOceanStore';
import { useShallow } from 'zustand/react/shallow';
import type { AmbientSound } from '../store/useOceanStore';

interface SoundOption {
  id: AmbientSound;
  label: string;
  emoji: string;
  description: string;
}

const SOUND_OPTIONS: SoundOption[] = [
  { id: 'none',        label: 'Off',          emoji: '🔇', description: 'Silence' },
  { id: 'ocean',       label: 'Ocean',        emoji: '🌊', description: 'Rolling waves' },
  { id: 'rain',        label: 'Rain',         emoji: '🌧️', description: 'Gentle rainfall' },
  { id: 'brown-noise', label: 'Brown Noise',  emoji: '🟫', description: 'Deep, warm rumble' },
  { id: 'pink-noise',  label: 'Pink Noise',   emoji: '🌸', description: 'Balanced spectrum' },
  { id: 'white-noise', label: 'White Noise',  emoji: '⬜', description: 'Classic focus noise' },
];

const AmbientPicker: React.FC = () => {
  const { ambientSound, ambientVolume, updateSettings } = useOceanStore(
    useShallow((s) => ({
      ambientSound: s.settings.ambientSound,
      ambientVolume: s.settings.ambientVolume,
      updateSettings: s.updateSettings,
    }))
  );

  const [expanded, setExpanded] = useState(false);

  const currentOption = SOUND_OPTIONS.find(o => o.id === ambientSound) ?? SOUND_OPTIONS[0];
  const isPlaying = ambientSound !== 'none';

  const handleSelect = (id: AmbientSound) => {
    updateSettings({ ambientSound: id });
    if (id !== 'none') setExpanded(false);
  };

  return (
    <div className="ambient-picker-wrapper">
      {/* Collapsed pill trigger */}
      <motion.button
        className="ambient-picker__pill"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        aria-label={`Ambient sound: ${currentOption.label}. Click to change.`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-medium)',
          background: isPlaying
            ? 'rgba(var(--accent-focus-rgb), 0.10)'
            : 'var(--bg-surface)',
          cursor: 'pointer',
          color: isPlaying ? 'var(--accent-focus)' : 'var(--text-secondary)',
          fontSize: 'var(--fs-micro)',
          fontWeight: 600,
          letterSpacing: 'var(--ls-wide)',
          textTransform: 'uppercase',
          boxShadow: isPlaying ? '0 0 0 1px rgba(var(--accent-focus-rgb), 0.25)' : 'none',
          transition: 'all 0.2s var(--ease-spring)',
        }}
      >
        <span style={{ fontSize: 14 }}>{currentOption.emoji}</span>
        <span>{isPlaying ? currentOption.label : 'Ambient'}</span>
        {isPlaying ? <Volume2 size={12} /> : <VolumeX size={12} />}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronUp size={12} />
        </motion.div>
      </motion.button>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="ambient-picker__panel"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-lg)',
              padding: '12px',
              width: 260,
              zIndex: 50,
            }}
          >
            {/* Sound options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SOUND_OPTIONS.map((opt) => {
                const active = ambientSound === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    aria-pressed={active}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: active ? 'var(--accent-focus-subtle)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{opt.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 'var(--fs-body)',
                        fontWeight: active ? 600 : 400,
                        color: active ? 'var(--accent-focus)' : 'var(--text-primary)',
                      }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-tertiary)' }}>
                        {opt.description}
                      </div>
                    </div>
                    {active && (
                      <motion.div
                        layoutId="activeSound"
                        style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: 'var(--accent-focus)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Volume slider (only when a sound is active) */}
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    overflow: 'hidden',
                    borderTop: '1px solid var(--border-subtle)',
                    marginTop: 8,
                    paddingTop: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
                    <VolumeX size={13} color="var(--text-tertiary)" />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={ambientVolume}
                      onChange={(e) => updateSettings({ ambientVolume: Number(e.target.value) })}
                      aria-label="Ambient volume"
                      style={{
                        flex: 1,
                        height: 3,
                        accentColor: 'var(--accent-focus)',
                        cursor: 'pointer',
                      }}
                    />
                    <Volume2 size={13} color="var(--accent-focus)" />
                    <span style={{
                      fontSize: 'var(--fs-micro)',
                      color: 'var(--text-tertiary)',
                      minWidth: 26,
                      textAlign: 'right',
                    }}>
                      {ambientVolume}%
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AmbientPicker;
