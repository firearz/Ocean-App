// Ocean — Primitive Components
// Part 1 § 3.6: Toggle, Slider, Stepper, Tabs, Card, Toast, EmptyState
// All use design tokens; "on/selected" states use --accent-focus.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Inbox } from 'lucide-react';

// ── Toggle ─────────────────────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled, id }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
    {label && (
      <label htmlFor={id} style={{ fontSize: 'var(--fs-body)', color: 'var(--text-primary)', cursor: 'pointer' }}>
        {label}
      </label>
    )}
    <label className="toggle" htmlFor={id} style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <input
        id={id}
        type="checkbox"
        className="toggle__input"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
      />
      <motion.div
        className="toggle__track"
        animate={{ backgroundColor: checked ? 'var(--accent-focus)' : 'var(--border-medium)' }}
        transition={{ duration: 0.18 }}
      />
      <motion.div
        className="toggle__thumb"
        variants={{
          off: { x: 0, scaleX: [1, 1.4, 1] },
          on: { x: 18, scaleX: [1, 1.4, 1] }
        }}
        initial={checked ? "on" : "off"}
        animate={checked ? "on" : "off"}
        transition={{
          x: { type: 'spring', stiffness: 500, damping: 30 },
          scaleX: { duration: 0.25, ease: 'easeInOut' }
        }}
      />
    </label>
  </div>
);

// ── Slider ─────────────────────────────────────────────────────────────────
interface SliderProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  id: string;
  unit?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value, onChange, min = 0, max = 100, step = 1, label, id, unit = ''
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
    {label && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label htmlFor={id} className="text-caption">{label}</label>
        <span className="text-caption" style={{ color: 'var(--accent-focus)', fontWeight: 600 }}>
          {value}{unit}
        </span>
      </div>
    )}
    <input
      id={id}
      type="range"
      className="slider"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={label}
      style={{
        background: `linear-gradient(to right, var(--accent-focus) ${((value - min) / (max - min)) * 100}%, var(--border-medium) 0%)`,
      }}
    />
  </div>
);

// ── Stepper ────────────────────────────────────────────────────────────────

interface StepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  value, onChange, min = 0, max = 100, step = 1, label, unit = ''
}) => {
  const prev = React.useRef(value);
  const dir = value > prev.current ? 1 : -1;
  React.useEffect(() => { prev.current = value; }, [value]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
      {label && <span className="text-body">{label}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <button
          className="btn btn-icon"
          style={{ width: 32, height: 32 }}
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          aria-label="Decrease"
        >
          <Minus size={14} />
        </button>
        <div style={{ position: 'relative', minWidth: 90, height: 24, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <motion.span
              key={value}
              custom={dir}
              variants={{
                initial: (d: number) => ({ y: d * 20, opacity: 0 }),
                animate: { y: 0, opacity: 1 },
                exit: (d: number) => ({ y: -d * 20, opacity: 0 })
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                position: 'absolute',
                fontSize: 'var(--fs-body)', fontWeight: 600,
                fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)',
                whiteSpace: 'nowrap'
              }}
            >
              {value}{unit}
            </motion.span>
          </AnimatePresence>
        </div>
        <button
          className="btn btn-icon"
          style={{ width: 32, height: 32 }}
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          aria-label="Increase"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

// ── Tabs ───────────────────────────────────────────────────────────────────
export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange }) => (
  <div
    role="tablist"
    style={{
      display: 'inline-flex',
      gap: 'var(--space-1)',
      background: 'var(--bg-surface)',
      padding: '4px',
      borderRadius: 'var(--radius-full)',
      border: '1px solid var(--border-subtle)',
    }}
  >
    {tabs.map((t) => (
      <button
        key={t.id}
        role="tab"
        aria-selected={t.id === active}
        id={`tab-${t.id}`}
        aria-controls={`panel-${t.id}`}
        onClick={() => onChange(t.id)}
        style={{
          position: 'relative',
          padding: 'var(--space-2) var(--space-4)',
          borderRadius: 'var(--radius-full)',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-caption)',
          fontWeight: t.id === active ? 600 : 500,
          color: t.id === active ? '#fff' : 'var(--text-secondary)',
          transition: 'color 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          zIndex: 1
        }}
      >
        {t.id === active && (
          <motion.div
            layoutId="activeTabIndicator"
            style={{
              position: 'absolute', inset: 0,
              background: 'var(--accent-focus)',
              borderRadius: 'var(--radius-full)',
              zIndex: -1,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
        {t.label}
        {t.badge !== undefined && (
          <span style={{
            background: t.id === active ? 'rgba(255,255,255,0.2)' : 'var(--border-strong)',
            color: t.id === active ? '#fff' : 'var(--text-primary)',
            borderRadius: 'var(--radius-full)',
            padding: '1px 6px',
            fontSize: 'var(--fs-micro)',
            transition: 'background 0.2s, color 0.2s'
          }}>
            {t.badge}
          </span>
        )}
      </button>
    ))}
  </div>
);

// ── Card ───────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'float';
  style?: React.CSSProperties;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, variant = 'default', style, className = '' }) => (
  <div
    className={`card ${variant !== 'default' ? `card--${variant}` : ''} ${className}`}
    style={style}
  >
    {children}
  </div>
);

// ── InAppToast ─────────────────────────────────────────────────────────────
export type ToastType = 'info' | 'success' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type?: ToastType;
}

const ICON_COLORS: Record<ToastType, string> = {
  info:    'var(--accent-info)',
  success: 'var(--accent-break)',
  warning: 'var(--accent-focus)',
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => (
  <div className="toast-container" role="region" aria-live="polite" aria-label="Notifications">
    <AnimatePresence>
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: -16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0,   scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="toast"
          role="alert"
        >
          <div
            className="toast__icon"
            style={{ background: ICON_COLORS[t.type ?? 'info'] }}
            aria-hidden="true"
          />
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            className="btn btn-ghost btn--sm"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            style={{ padding: '2px 6px', color: 'var(--text-tertiary)' }}
          >
            ✕
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// ── EmptyState ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  title: string;
  body: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  body,
  action,
  icon = <Inbox size={28} />,
}) => (
  <div className="empty-state">
    <div className="empty-state__icon" aria-hidden="true">{icon}</div>
    <div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__body">{body}</p>
    </div>
    {action && <div>{action}</div>}
  </div>
);
