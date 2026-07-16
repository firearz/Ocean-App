// Ocean — DurationSelector Component
// Part 1 § 3.5: Segmented pill control — 25 · 45 · 50 · 90 · Custom
// Custom opens a scroll-wheel stepper picker.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

const PRESETS = [
  { label: '25',     value: 25  },
  { label: '45',     value: 45  },
  { label: '50',     value: 50  },
  { label: '90',     value: 90  },
  { label: 'Custom', value: -1  },
] as const;

interface DurationSelectorProps {
  value: number;          // minutes
  onChange: (minutes: number) => void;
  minCustom?: number;
  maxCustom?: number;
}

const DurationSelector: React.FC<DurationSelectorProps> = ({
  value,
  onChange,
  minCustom = 1,
  maxCustom = 180,
}) => {
  const isCustom   = !PRESETS.some((p) => p.value === value);
  const [customVal, setCustomVal] = useState(isCustom ? value : 30);
  const [showStepper, setShowStepper] = useState(false);

  const handleSelect = (val: number) => {
    if (val === -1) {
      setShowStepper(true);
    } else {
      setShowStepper(false);
      onChange(val);
    }
  };

  const incrementCustom = (by: number) => {
    const next = Math.min(maxCustom, Math.max(minCustom, customVal + by));
    setCustomVal(next);
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
      <div className="duration-selector" role="group" aria-label="Session duration">
        {PRESETS.map((p) => {
          const active = p.value === -1 ? isCustom || showStepper : value === p.value;
          return (
            <button
              key={p.label}
              className={`duration-selector__option${active ? ' duration-selector__option--active' : ''}`}
              onClick={() => handleSelect(p.value)}
              aria-pressed={active}
              aria-label={p.value === -1 ? 'Custom duration' : `${p.value} minutes`}
            >
              {p.value === -1 && isCustom ? `${customVal} min` : p.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {showStepper && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="card card--elevated"
            style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16 }}
          >
            <button
              className="btn btn-icon"
              style={{ width: 32, height: 32 }}
              onClick={() => incrementCustom(-5)}
              aria-label="Decrease duration by 5 minutes"
            >
              <ChevronDown size={16} />
            </button>

            <div style={{ textAlign: 'center', minWidth: 80 }}>
              <div
                className="text-h1"
                style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--accent-focus)' }}
              >
                {customVal}
              </div>
              <div className="text-micro" style={{ marginTop: 2 }}>minutes</div>
            </div>

            <button
              className="btn btn-icon"
              style={{ width: 32, height: 32 }}
              onClick={() => incrementCustom(5)}
              aria-label="Increase duration by 5 minutes"
            >
              <ChevronUp size={16} />
            </button>

            <button
              className="btn btn-primary btn--sm"
              onClick={() => { onChange(customVal); setShowStepper(false); }}
              aria-label={`Set duration to ${customVal} minutes`}
            >
              Set
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DurationSelector;
