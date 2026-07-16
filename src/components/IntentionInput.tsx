// Ocean — IntentionInput Component
// Part 1 § 3.4: Large borderless text field with placeholder,
// autocomplete dropdown of recent intentions, no hard char limit.

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { Clock } from 'lucide-react';

interface IntentionInputProps {
  value: string;
  onChange: (val: string) => void;
  recentIntentions?: string[];
  placeholder?: string;
  disabled?: boolean;
}

const dropdownVariants: Variants = {
  initial: { opacity: 0, y: -6, scale: 0.97 },
  animate: { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring' as const, stiffness: 420, damping: 28 } },
  exit:    { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12 } },
};

const IntentionInput: React.FC<IntentionInputProps> = ({
  value,
  onChange,
  recentIntentions = [],
  placeholder = 'What are you focusing on?',
  disabled = false,
}) => {
  const [focused,     setFocused]     = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter suggestions: deduplicated, case-insensitive, exclude current value, max 5
  const suggestions = recentIntentions
    .filter((r) => r.toLowerCase() !== value.toLowerCase() && r.trim().length > 0)
    .slice(0, 5);

  const showDropdown = focused && suggestions.length > 0 && value.trim().length === 0;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const selectSuggestion = (s: string) => {
    onChange(s);
    setFocused(false);
    textareaRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  return (
    <div className="intention-input-wrapper">
      <textarea
        ref={textareaRef}
        className="intention-input"
        value={value}
        onChange={(e) => { onChange(e.target.value); setActiveIndex(-1); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        aria-label="Session intention"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        style={{ overflowY: 'hidden' }}
      />

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="intention-autocomplete"
            role="listbox"
            aria-label="Recent intentions"
          >
            {suggestions.map((s, i) => (
              <div
                key={s}
                className="intention-autocomplete__item"
                role="option"
                aria-selected={i === activeIndex}
                style={i === activeIndex ? { background: 'var(--accent-focus-subtle)', color: 'var(--text-primary)' } : {}}
                onMouseDown={() => selectSuggestion(s)}
              >
                <Clock
                  size={12}
                  style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: 'var(--text-tertiary)' }}
                  aria-hidden="true"
                />
                {s}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntentionInput;
