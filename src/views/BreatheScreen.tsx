// Ocean — Breathe Screen
// Part 2 § 2.3: Breathing circle animation, caption cycling, skip button.
// Part 1 § 2.5: 4s in, 6-8s out, ease-in-out, N breath cycles.

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOceanStore } from '../store/useOceanStore';
import { GhostButton } from '../components/Buttons';

const BreatheScreen: React.FC = () => {
  const { beginFocusing, settings } = useOceanStore();
  const totalBreaths = settings.breathCount || 3;

  const [breathPhase, setBreathPhase] = useState<'in' | 'out'>('in');
  const [breathCount, setBreathCount]  = useState(0);
  const [scale,       setScale]        = useState(0.7);

  // Breathing animation loop
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      // Skip breathing immediately if reduce-motion is on
      beginFocusing();
      return;
    }

    let cancelled = false;

    const doBreath = async () => {
      // Breathe in: 4 seconds
      setBreathPhase('in');
      setScale(1.0);
      await delay(4200);
      if (cancelled) return;

      // Breathe out: 7 seconds
      setBreathPhase('out');
      setScale(0.68);
      await delay(7200);
      if (cancelled) return;

      setBreathCount((c) => {
        const next = c + 1;
        if (next >= totalBreaths) {
          beginFocusing();
        }
        return next;
      });
    };

    const loop = async () => {
      while (!cancelled) {
        await doBreath();
        if (cancelled) break;
      }
    };

    loop();
    return () => { cancelled = true; };
  }, []);

  const captions = {
    in:  'Breathe in…',
    out: 'Breathe out…',
  };

  return (
    <div className="breathe-screen">
      {/* Ambient — subtle focus tint */}
      <div className="ambient-backdrop ambient-backdrop--focus" />

      {/* Breathing circle */}
      <motion.div
        animate={{ scale }}
        transition={{
          duration: breathPhase === 'in' ? 4 : 7,
          ease: 'easeInOut',
        }}
        style={{
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(var(--accent-focus-rgb), 0.18) 0%, rgba(var(--accent-focus-rgb), 0.04) 70%)',
          border: '2px solid rgba(var(--accent-focus-rgb), 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Inner ring */}
        <motion.div
          animate={{ scale: breathPhase === 'in' ? 1 : 0.72 }}
          transition={{ duration: breathPhase === 'in' ? 4 : 7, ease: 'easeInOut' }}
          style={{
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(var(--accent-focus-rgb), 0.10)',
            border: '1.5px solid rgba(var(--accent-focus-rgb), 0.4)',
          }}
        />
      </motion.div>

      {/* Caption */}
      <AnimatePresence mode="wait">
        <motion.p
          key={breathPhase}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.6 }}
          className="breathe-caption"
        >
          {captions[breathPhase]}
        </motion.p>
      </AnimatePresence>

      {/* Breath progress dots */}
      <div style={{ display: 'flex', gap: 8 }}>
        {Array.from({ length: totalBreaths }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: i < breathCount ? 'var(--accent-focus)' : 'var(--border-medium)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Skip */}
      <GhostButton onClick={beginFocusing} style={{ position: 'absolute', bottom: 40 }}>
        Skip
      </GhostButton>
    </div>
  );
};

function delay(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

export default BreatheScreen;
