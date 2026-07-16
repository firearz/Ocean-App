// Ocean — RingTimer Component
// Part 1 § 3.1: Circular SVG progress ring, animated sweep,
// breathing mode, glow state, center slot for digits + label.

import React from 'react';
import { motion } from 'framer-motion';

export type RingTimerColor = 'focus' | 'break' | 'neutral';
export type RingTimerMode  = 'timer' | 'breathing';

interface RingTimerProps {
  /** Diameter of the ring in pixels */
  size?: number;
  /** Stroke width of the progress arc */
  strokeWidth?: number;
  /** 0.0 – 1.0, where 1.0 = full ring */
  progress: number;
  /** Color variant */
  color?: RingTimerColor;
  /** Timer display or breathing animation */
  mode?: RingTimerMode;
  /** Show pulsing glow (e.g. 2-min warning) */
  glow?: boolean;
  /** Content inside the ring (e.g. <Timer digits> <label>) */
  children?: React.ReactNode;
  className?: string;
}

const RingTimer: React.FC<RingTimerProps> = ({
  size        = 280,
  strokeWidth = 6,
  progress    = 1,
  color       = 'focus',
  mode        = 'timer',
  glow        = false,
  children,
  className   = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const cx     = size / 2;
  const cy     = size / 2;
  const circ   = 2 * Math.PI * radius;

  // Clamp progress 0–1
  const p      = Math.min(1, Math.max(0, progress));
  const offset = circ * (1 - p);

  const progressClass = [
    'ring-timer__progress',
    `ring-timer__progress--${color}`,
    glow ? (color === 'break' ? 'ring-timer__progress--glow-break' : 'ring-timer__progress--glow') : '',
  ].filter(Boolean).join(' ');

  const wrapClass = [
    'ring-timer',
    mode === 'breathing' ? 'ring-timer--breathing' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={wrapClass}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Focus session timer ring"
    >
      <svg
        className="ring-timer__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track */}
        <circle
          className="ring-timer__track"
          cx={cx}
          cy={cy}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          className={progressClass}
          cx={cx}
          cy={cy}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'linear' }}
        />
      </svg>

      {/* Center content slot */}
      <div className="ring-timer__center">
        {children}
      </div>
    </div>
  );
};

export default RingTimer;
