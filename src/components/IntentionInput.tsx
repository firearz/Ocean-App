// Ocean — IntentionInput Component
// Part 1 § 3.4: Large borderless text field with placeholder,
// autocomplete dropdown of recent intentions, no hard char limit.

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { Clock, Trash2, Check, X } from 'lucide-react';
import { useOceanStore } from '../store/useOceanStore';

interface IntentionInputProps {
  value: string;
  onChange: (val: string) => void;
  recentIntentions?: string[];
  placeholder?: string;
  disabled?: boolean;
  onRemoveRecent?: (val: string) => void;
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
  onRemoveRecent,
}) => {
  const [focused,     setFocused]     = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const openContextMenu = useOceanStore((s) => s.openContextMenu);

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
      
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{
          scaleX: focused ? 1 : 0,
          opacity: focused ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'var(--accent-focus)',
          boxShadow: '0 0 16px var(--accent-focus), 0 0 4px var(--accent-focus)',
          originX: 0.5,
          pointerEvents: 'none',
        }}
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
                onMouseDown={(e) => {
                  if (e.button !== 2) selectSuggestion(s);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openContextMenu(e.clientX, e.clientY, [
                    {
                      id: 'delete',
                      label: 'Delete from history',
                      icon: <Trash2 size={14} />,
                      destructive: true,
                      action: () => onRemoveRecent?.(s)
                    }
                  ]);
                }}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <Clock
                    size={12}
                    style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: 'var(--text-tertiary)' }}
                    aria-hidden="true"
                  />
                  {s}
                </div>
                <DeleteDot onDelete={() => onRemoveRecent?.(s)} />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DeleteDot: React.FC<{ onDelete: () => void }> = ({ onDelete }) => {
  const [hover, setHover] = useState(false);
  const [clicked, setClicked] = useState(false);

  return (
    <div
      onMouseDown={(e) => {
        // Stop mousedown from propagating to the parent div which selects the item
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (clicked) return;
        setClicked(true);
        setTimeout(() => onDelete(), 400); // Wait for the tick animation before removing
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: '#FF5F56',
        border: '1px solid #E0443E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        marginLeft: 8,
        flexShrink: 0,
      }}
      title="Delete"
    >
      <AnimatePresence mode="wait">
        {clicked ? (
          <motion.div
            key="tick"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          >
            <Check size={8} color="#fff" strokeWidth={4} />
          </motion.div>
        ) : hover ? (
          <motion.div
            key="cross"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <X size={8} color="#600000" strokeWidth={3} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default IntentionInput;
