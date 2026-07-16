// Ocean — Onboarding Screen
// Part 2 § 2.1: 4 lightweight slides, skippable, ends with account/offline.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Timer, ShieldOff, BarChart2, Waves, ArrowRight } from 'lucide-react';
import { PrimaryButton, GhostButton } from '../components/Buttons';
import RingTimer from '../components/RingTimer';

interface Slide {
  icon: React.ReactNode;
  title: string;
  body: string;
  visual?: React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    icon: <Waves size={36} />,
    title: 'Welcome to Ocean.',
    body: 'Start your momentum by focusing in time-boxed sessions.',
    visual: (
      <div style={{ opacity: 0.85 }}>
        <RingTimer size={140} progress={0.65} color="focus">
          <span style={{ fontSize: 28, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>25:00</span>
        </RingTimer>
      </div>
    ),
  },
  {
    icon: <Timer size={36} />,
    title: 'State your focus.',
    body: 'Every session starts by naming an intention — not just pressing start.',
    visual: (
      <div style={{
        width: '100%', borderBottom: '2px solid var(--accent-focus)',
        padding: '8px 0 12px', fontSize: 22, color: 'var(--text-tertiary)',
        fontWeight: 400, textAlign: 'left'
      }}>
        Design review for Q3…
        <span style={{ borderLeft: '2px solid var(--accent-focus)', marginLeft: 2 }} />
      </div>
    ),
  },
  {
    icon: <ShieldOff size={36} />,
    title: 'Block distractions.',
    body: 'Apps and websites you choose become unreachable the moment a session starts.',
    visual: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        {['Twitter / X', 'YouTube', 'Reddit'].map((site) => (
          <div key={site} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
          }}>
            <span style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)' }}>{site}</span>
            <span style={{ fontSize: 'var(--fs-micro)', background: 'var(--accent-focus-subtle)', color: 'var(--accent-focus)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>blocked</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: <BarChart2 size={36} />,
    title: 'Review your progress.',
    body: 'Calendar-style analytics, streaks, and category breakdowns reviewed daily.',
    visual: (
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {Array.from({ length: 35 }, (_, i) => {
          const levels = [0,1,2,3,4,3,2,1,0,2,3,4,2,1,0,3,4,3,2,1,2,3,2,1,0,4,3,2,1,3,2,1,0,2,3];
          const l = levels[i] ?? 0;
          return (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: 3,
              background: l === 0 ? 'var(--border-subtle)' : `rgba(var(--accent-focus-rgb), ${[0,0.15,0.35,0.6,0.85][l]})`,
            }} />
          );
        })}
      </div>
    ),
  },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (next: number) => {
    setDir(next > idx ? 1 : -1);
    setIdx(next);
  };

  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  return (
    <div className="onboarding">
      <div className="onboarding__slides">
        {/* Slide content */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={idx}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="onboarding__slide"
          >
            <div className="onboarding__slide-icon">{slide.icon}</div>
            <div>
              <h1 className="text-h1" style={{ marginBottom: 12 }}>{slide.title}</h1>
              <p className="text-body text-secondary" style={{ maxWidth: 380, lineHeight: 1.7 }}>{slide.body}</p>
            </div>
            {slide.visual && (
              <div style={{ width: '100%', maxWidth: 360, display: 'flex', justifyContent: 'center' }}>
                {slide.visual}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="onboarding__dots" role="tablist" aria-label="Onboarding progress">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`onboarding__dot${i === idx ? ' onboarding__dot--active' : ''}`}
              onClick={() => go(i)}
              role="tab"
              aria-selected={i === idx}
              aria-label={`Slide ${i + 1} of ${SLIDES.length}`}
              style={{ border: 'none', cursor: 'pointer', padding: 0 }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="onboarding__actions">
        {isLast ? (
          <>
            <PrimaryButton className="btn--full" onClick={onComplete} icon={<ArrowRight size={16} />} iconPosition="right">
              Get started
            </PrimaryButton>
            <GhostButton onClick={onComplete}>Skip, use offline</GhostButton>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <GhostButton onClick={onComplete}>Skip</GhostButton>
            <PrimaryButton onClick={() => go(idx + 1)} icon={<ArrowRight size={15} />} iconPosition="right">
              Next
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
