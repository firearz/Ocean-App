// Ocean — CategoryPill Component
// Part 1 § 3.3: Colored dot + label, selectable, "add new" affordance,
// 8-color palette support, pop-in animation.

import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Plus, X } from 'lucide-react';

export const CATEGORY_COLORS = [
  { id: 'coral',  hex: '#FF6B6B', label: 'Coral'  },
  { id: 'amber',  hex: '#FFB347', label: 'Amber'  },
  { id: 'lime',   hex: '#A8E063', label: 'Lime'   },
  { id: 'teal',   hex: '#00C9A7', label: 'Teal'   },
  { id: 'sky',    hex: '#56CCF2', label: 'Sky'     },
  { id: 'indigo', hex: '#6C63FF', label: 'Indigo' },
  { id: 'violet', hex: '#C471ED', label: 'Violet' },
  { id: 'rose',   hex: '#F64F8B', label: 'Rose'   },
] as const;

export interface Category {
  id: string;
  name: string;
  colorHex: string;
}

// Pop-in spring animation per spec: scale 0.9 → 1.03 → 1
const pillVariants: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1,   opacity: 1, transition: { type: 'spring' as const, stiffness: 380, damping: 22 } },
  exit:    { scale: 0.9, opacity: 0, transition: { duration: 0.12 } },
};

// ── Single pill ────────────────────────────────────────────────────────────
interface CategoryPillProps {
  category: Category;
  selected?: boolean;
  onSelect?: (cat: Category) => void;
  onRemove?: (cat: Category) => void;
  showRemove?: boolean;
  className?: string;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({
  category,
  selected = false,
  onSelect,
  onRemove,
  showRemove = false,
  className = '',
}) => (
  <motion.div
    variants={pillVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    layout
    className={`category-pill ${selected ? 'category-pill--active' : ''} ${className}`}
    style={selected ? { borderColor: category.colorHex, color: category.colorHex } : {}}
    onClick={() => onSelect?.(category)}
    role="button"
    tabIndex={0}
    aria-pressed={selected}
    aria-label={`Category: ${category.name}`}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect?.(category); }}
  >
    <span
      className="category-pill__dot"
      style={{ background: category.colorHex }}
      aria-hidden="true"
    />
    <span>{category.name}</span>
    {showRemove && onRemove && (
      <button
        className="btn btn-ghost"
        style={{ padding: 0, width: 16, height: 16 }}
        onClick={(e) => { e.stopPropagation(); onRemove(category); }}
        aria-label={`Remove ${category.name}`}
      >
        <X size={10} />
      </button>
    )}
  </motion.div>
);

// ── Color picker popover ───────────────────────────────────────────────────
interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  onClose: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, onClose }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.92, y: -6 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.92, y: -6 }}
    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    className="card card--float"
    style={{ position: 'absolute', zIndex: 'var(--z-dropdown)', padding: 12, width: 196 }}
  >
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {CATEGORY_COLORS.map((c) => (
        <button
          key={c.id}
          onClick={() => { onChange(c.hex); onClose(); }}
          aria-label={c.label}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: c.hex,
            border: value === c.hex ? '3px solid var(--text-primary)' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'transform 0.12s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
      ))}
    </div>
  </motion.div>
);

// ── "Add new category" pill ────────────────────────────────────────────────
interface AddCategoryPillProps {
  onAdd: (name: string, colorHex: string) => void;
  disabled?: boolean;
}

export const AddCategoryPill: React.FC<AddCategoryPillProps> = ({ onAdd, disabled }) => {
  const [open, setOpen]         = useState(false);
  const [name, setName]         = useState('');
  const [color, setColor]       = useState<string>(CATEGORY_COLORS[0].hex);
  const [picking, setPicking]   = useState(false);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), color);
    setName('');
    setColor(CATEGORY_COLORS[0].hex);
    setOpen(false);
  };

  if (disabled) {
    return (
      <div className="category-pill category-pill--add" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
        <Plus size={12} />
        <span>New category</span>
      </div>
    );
  }

  if (!open) {
    return (
      <motion.div
        variants={pillVariants}
        initial="initial"
        animate="animate"
        className="category-pill category-pill--add"
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Add new category"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(true); }}
      >
        <Plus size={12} />
        <span>New category</span>
      </motion.div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div className="card card--elevated" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
        {/* Color swatch button */}
        <button
          onClick={() => setPicking(!picking)}
          aria-label="Choose category color"
          style={{
            width: 20, height: 20, borderRadius: '50%',
            background: color, border: 'none', cursor: 'pointer', flexShrink: 0,
          }}
        />
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setOpen(false); }}
          placeholder="Category name"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)',
            color: 'var(--text-primary)',
          }}
          maxLength={30}
        />
        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          style={{
            padding: '2px 10px', borderRadius: 'var(--radius-full)',
            background: name.trim() ? 'var(--accent-focus)' : 'var(--border-subtle)',
            color: name.trim() ? '#fff' : 'var(--text-tertiary)',
            border: 'none', cursor: name.trim() ? 'pointer' : 'not-allowed',
            fontSize: 'var(--fs-micro)', fontWeight: 600, fontFamily: 'var(--font-sans)',
          }}
        >
          Add
        </button>
      </div>
      <AnimatePresence>
        {picking && (
          <ColorPicker value={color} onChange={setColor} onClose={() => setPicking(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Pill row (horizontally scrollable) ────────────────────────────────────
interface PillRowProps {
  categories: Category[];
  selected?: string | null;
  onSelect?: (cat: Category) => void;
  onAdd?: (name: string, colorHex: string) => void;
  maxFree?: number;  // free tier: cap at 3 (pass undefined for Pro)
  isPro?: boolean;
}

export const CategoryPillRow: React.FC<PillRowProps> = ({
  categories,
  selected,
  onSelect,
  onAdd,
  maxFree = 3,
  isPro = false,
}) => {
  const atLimit = !isPro && categories.length >= maxFree;

  return (
    <div className="pill-row" role="group" aria-label="Category selection">
      <AnimatePresence mode="popLayout">
        {categories.map((cat) => (
          <CategoryPill
            key={cat.id}
            category={cat}
            selected={selected === cat.id}
            onSelect={onSelect}
          />
        ))}
      </AnimatePresence>
      {onAdd && <AddCategoryPill onAdd={onAdd} disabled={atLimit} />}
    </div>
  );
};
