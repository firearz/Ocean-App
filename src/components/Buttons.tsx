// Ocean — Button Components
// Part 1 § 3.2: PrimaryButton, SecondaryButton, GhostButton, IconButton
// Pill-shaped, spring motion press feedback per spec.

import React from 'react';
import { motion } from 'framer-motion';

// Spring press animation — scale 0.97 on press, fast spring back (100ms)
const pressTap = { scale: 0.97 };
const pressTransition = { type: 'spring', stiffness: 500, damping: 30 };

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

// ── PrimaryButton ──────────────────────────────────────────────────────────
export const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => (
  <motion.button
    {...(props as any)}
    whileTap={!disabled ? pressTap : undefined}
    transition={pressTransition}
    className={`btn btn-primary btn--${size} ${className}`}
    disabled={disabled || loading}
    aria-busy={loading}
  >
    {loading && <span className="btn-spinner" aria-hidden="true" />}
    {!loading && icon && iconPosition === 'left' && icon}
    {children}
    {!loading && icon && iconPosition === 'right' && icon}
  </motion.button>
);

// ── SecondaryButton ────────────────────────────────────────────────────────
export const SecondaryButton: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => (
  <motion.button
    {...(props as any)}
    whileTap={!disabled ? pressTap : undefined}
    transition={pressTransition}
    className={`btn btn-secondary btn--${size} ${className}`}
    disabled={disabled}
  >
    {icon && iconPosition === 'left' && icon}
    {children}
    {icon && iconPosition === 'right' && icon}
  </motion.button>
);

// ── GhostButton ────────────────────────────────────────────────────────────
export const GhostButton: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => (
  <motion.button
    {...(props as any)}
    whileTap={!disabled ? pressTap : undefined}
    transition={pressTransition}
    className={`btn btn-ghost btn--${size} ${className}`}
    disabled={disabled}
  >
    {icon && iconPosition === 'left' && icon}
    {children}
    {icon && iconPosition === 'right' && icon}
  </motion.button>
);

// ── IconButton ─────────────────────────────────────────────────────────────
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // aria-label, required for icon-only buttons
  size?: number; // diameter in px, default 40
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  label,
  size = 40,
  className = '',
  disabled,
  style,
  ...props
}) => (
  <motion.button
    {...(props as any)}
    whileTap={!disabled ? pressTap : undefined}
    transition={pressTransition}
    className={`btn btn-icon ${className}`}
    aria-label={label}
    disabled={disabled}
    style={{ width: size, height: size, ...style }}
  >
    {children}
  </motion.button>
);
