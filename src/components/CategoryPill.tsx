// Ocean — CategoryPill Component
// Part 1 § 3.3: Colored dot + label, selectable, "add new" affordance,
// 8-color palette support, pop-in animation.

import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Plus, X, Edit2, Archive } from 'lucide-react';
import { useOceanStore } from '../store/useOceanStore';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from 'react-router-dom';

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
  isArchived?: boolean;
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
  onContextMenu?: (e: React.MouseEvent) => void;
  showRemove?: boolean;
  className?: string;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({
  category,
  selected = false,
  onSelect,
  onRemove,
  onContextMenu,
  showRemove = false,
  className = '',
}) => (
  <motion.div
    variants={pillVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.94, scaleX: 1.05 }}
    className={`category-pill ${selected ? 'category-pill--active' : ''} ${className}`}
    style={selected ? { borderColor: category.colorHex, color: category.colorHex } : {}}
    onClick={() => onSelect?.(category)}
    onContextMenu={onContextMenu}
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
    style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, zIndex: 999, padding: 12, width: 196 }}
  >
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {CATEGORY_COLORS.map((c) => (
        <motion.button
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
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        />
      ))}
    </div>
  </motion.div>
);

// ── "Add new category" pill ────────────────────────────────────────────────
interface AddCategoryPillProps {
  onAdd: (name: string, colorHex: string) => void;
}

import { Check } from 'lucide-react';

export const AddCategoryPill: React.FC<AddCategoryPillProps> = ({ onAdd }) => {
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
    setPicking(false);
  };

  const handleCancel = () => {
    setName('');
    setColor(CATEGORY_COLORS[0].hex);
    setOpen(false);
    setPicking(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <motion.div
        layout
        variants={pillVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`category-pill ${open ? 'category-pill--editing' : 'category-pill--add'}`}
        onClick={() => !open && setOpen(true)}
        whileHover={!open ? { scale: 1.05 } : undefined}
        whileTap={!open ? { scale: 0.94, scaleX: 1.05 } : undefined}
        style={{
          cursor: open ? 'default' : 'pointer',
          padding: open ? '4px 8px' : undefined,
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (!open && (e.key === 'Enter' || e.key === ' ')) setOpen(true); }}
      >
        <AnimatePresence mode="wait">
          {!open ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={12} />
              <span>New category</span>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, width: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: 24 }}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); setPicking(!picking); }}
                aria-label="Choose category color"
                style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: color, border: 'none', cursor: 'pointer', flexShrink: 0,
                }}
              />
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') handleCancel();
                }}
                placeholder="Category name"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)',
                  color: 'var(--text-primary)', width: 120, minWidth: 60,
                }}
                maxLength={30}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--text-tertiary)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2
                  }}
                  aria-label="Cancel"
                >
                  <X size={14} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  disabled={!name.trim()}
                  onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                  style={{
                    background: 'transparent', border: 'none',
                    color: name.trim() ? 'var(--accent-focus)' : 'var(--border-subtle)',
                    cursor: name.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2
                  }}
                  aria-label="Save"
                >
                  <Check size={14} strokeWidth={3} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {picking && open && (
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
}


export const CategoryPillRow: React.FC<PillRowProps> = ({
  categories,
  selected,
  onSelect,
  onAdd,
}) => {
  const { openContextMenu, archiveCategory } = useOceanStore(useShallow(s => ({
    openContextMenu: s.openContextMenu,
    archiveCategory: s.archiveCategory
  })));
  const navigate = useNavigate();

  return (
    <div className="pill-row" role="group" aria-label="Category selection">
      <AnimatePresence mode="popLayout">
        {categories.map((cat) => (
          <CategoryPill
            key={cat.id}
            category={cat}
            selected={selected === cat.id}
            onSelect={onSelect}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openContextMenu(e.clientX, e.clientY, [
                {
                  id: 'edit',
                  label: 'Edit Category',
                  icon: <Edit2 size={14} />,
                  action: () => navigate('/categories')
                },
                {
                  id: 'archive',
                  label: 'Archive',
                  icon: <Archive size={14} />,
                  destructive: true,
                  action: () => archiveCategory(cat.id)
                }
              ]);
            }}
          />
        ))}
      </AnimatePresence>
      {onAdd && <AddCategoryPill onAdd={onAdd} />}
    </div>
  );
};
