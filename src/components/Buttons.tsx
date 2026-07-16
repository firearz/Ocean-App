// Ocean — Button Components
// Part 1 § 3.2: PrimaryButton, SecondaryButton, GhostButton, IconButton
// Pill-shaped, spring motion press feedback per spec.

import React from 'react';
import { motion } from 'framer-motion';

import { useOceanStore } from '../store/useOceanStore';

// Spring press animation — scale 0.95 and slightly stretch horizontally on press, smooth hover
const getPressTap = (reduced: boolean) => reduced ? { scale: 0.98 } : { scale: 0.92, scaleX: 1.08, scaleY: 0.85 };
const getPressHover = (reduced: boolean) => reduced ? {} : { scale: 1.04 };
const getTransition = (reduced: boolean) => reduced ? { duration: 0.1 } : { type: 'spring', stiffness: 400, damping: 15 };

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const reducedMotion = useOceanStore(s => s.settings?.reducedMotion ?? false);
  const [mousePos, setMousePos] = React.useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <motion.button
      {...(props as any)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 50, y: 50 }); }}
      whileHover={!disabled ? getPressHover(reducedMotion) : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      transition={getTransition(reducedMotion)}
      className={`btn btn-primary btn--${size} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      <div 
        style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
          opacity: isHovered && !disabled ? 1 : 0,
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 'inherit' }}>
        {loading && <span className="btn-spinner" aria-hidden="true" />}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </span>
    </motion.button>
  );
};

// ── SecondaryButton ────────────────────────────────────────────────────────
export const SecondaryButton: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const reducedMotion = useOceanStore(s => s.settings?.reducedMotion ?? false);
  return (
    <motion.button
      {...(props as any)}
      whileHover={!disabled ? getPressHover(reducedMotion) : undefined}
      whileTap={!disabled ? getPressTap(reducedMotion) : undefined}
      transition={getTransition(reducedMotion)}
      className={`btn btn-secondary btn--${size} ${className}`}
      disabled={disabled}
    >
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </motion.button>
  );
};

// ── GhostButton ────────────────────────────────────────────────────────────
export const GhostButton: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const reducedMotion = useOceanStore(s => s.settings?.reducedMotion ?? false);
  return (
    <motion.button
      {...(props as any)}
      whileHover={!disabled ? getPressHover(reducedMotion) : undefined}
      whileTap={!disabled ? getPressTap(reducedMotion) : undefined}
      transition={getTransition(reducedMotion)}
      className={`btn btn-ghost btn--${size} ${className}`}
      disabled={disabled}
    >
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </motion.button>
  );
};

// ── IconButton ─────────────────────────────────────────────────────────────
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // aria-label, required for icon-only buttons
  size?: number | string; // diameter
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  label,
  size = 40,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const reducedMotion = useOceanStore(s => s.settings?.reducedMotion ?? false);
  return (
    <motion.button
      {...(props as any)}
      whileHover={!disabled ? getPressHover(reducedMotion) : undefined}
      whileTap={!disabled ? { scale: reducedMotion ? 0.98 : 0.85, borderRadius: reducedMotion ? '12px' : '20px' } : undefined}
      transition={getTransition(reducedMotion)}
      className={`btn-icon ${className}`}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{ width: size, height: size, ...style }}
    >
      {children}
    </motion.button>
  );
};
