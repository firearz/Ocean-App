// Ocean — Categories Screen
// Part 2 § 2.8: Grid of category cards with edit/rename/recolor/archive and reorder.
// Free tier: cap at 3 active categories with inline upgrade prompt.

import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useVelocity, useSpring } from 'framer-motion';
import { Edit2, Archive, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useOceanStore } from '../store/useOceanStore';
import { CATEGORY_COLORS, type Category } from '../components/CategoryPill';
import { PrimaryButton, GhostButton, IconButton } from '../components/Buttons';
import { Card, EmptyState } from '../components/Primitives';

import { useShallow } from 'zustand/react/shallow';

const LiquidCard: React.FC<{ children: React.ReactNode, reducedMotion: boolean }> = ({ children, reducedMotion }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const vx = useVelocity(x);
  const vy = useVelocity(y);
  const smoothVx = useSpring(vx, { damping: 30, stiffness: 400 });
  const smoothVy = useSpring(vy, { damping: 30, stiffness: 400 });
  const skewX = useTransform(smoothVx, [-800, 800], [4, -4]);
  const skewY = useTransform(smoothVy, [-800, 800], [-4, 4]);
  const scale = useTransform(smoothVx, [-800, 0, 800], [0.95, 1, 0.95]);

  return (
    <motion.div
      style={reducedMotion ? {} : { x, y, skewX, skewY, scale, zIndex: 1 }}
      drag={!reducedMotion}
      dragSnapToOrigin
      dragElastic={0.6}
      whileDrag={reducedMotion ? {} : { zIndex: 10, cursor: 'grabbing', scale: 1.05 }}
    >
      {children}
    </motion.div>
  );
};

const CategoriesScreen: React.FC = () => {
  const reducedMotion = useOceanStore(s => s.settings?.reducedMotion ?? false);
  const { categories, addCategory, updateCategory, removeCategory, archiveCategory, restoreCategory } = useOceanStore(
    useShallow((s) => ({
      categories: s.categories,
      addCategory: s.addCategory,
      updateCategory: s.updateCategory,
      removeCategory: s.removeCategory,
      archiveCategory: s.archiveCategory,
      restoreCategory: s.restoreCategory,
    }))
  );
  const [editing,    setEditing]    = useState<string | null>(null);
  const [editName,   setEditName]   = useState('');
  const [editColor,  setEditColor]  = useState('');
  const [showAdd,    setShowAdd]    = useState(false);
  const [newName,    setNewName]    = useState('');
  const [newColor,   setNewColor]   = useState<string>(CATEGORY_COLORS[0].hex);
  const [viewTab,    setViewTab]    = useState<'active' | 'archived'>('active');

  const activeCategories = categories.filter(c => !c.isArchived);
  const archivedCategories = categories.filter(c => c.isArchived);


  const startEdit = (cat: Category) => {
    setEditing(cat.id);
    setEditName(cat.name);
    setEditColor(cat.colorHex);
  };

  const saveEdit = () => {
    if (!editing || !editName.trim()) return;
    updateCategory(editing, { name: editName.trim(), colorHex: editColor });
    setEditing(null);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCategory(newName.trim(), newColor);
    setNewName('');
    setNewColor(CATEGORY_COLORS[0].hex);
    setShowAdd(false);
  };

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="text-h1">Categories</h1>
          <p className="text-caption text-secondary" style={{ marginTop: 4 }}>
            Organise your sessions by topic or project.
          </p>
        </div>
        <AnimatePresence mode="popLayout">
          {!showAdd ? (
            <motion.div layoutId="newCategoryForm" style={{ borderRadius: 'var(--radius-full)' }} key="btn">
              <PrimaryButton
                onClick={() => {
                  setViewTab('active');
                  setShowAdd(true);
                }}
                icon={<Plus size={15} />}
                size="sm"
              >
                New category
              </PrimaryButton>
            </motion.div>
          ) : (
            <motion.div key="placeholder" style={{ width: 140 }} />
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        <button
          onClick={() => setViewTab('active')}
          style={{
            padding: '6px 14px', borderRadius: 'var(--radius-full)',
            background: viewTab === 'active' ? 'var(--text-primary)' : 'transparent',
            color: viewTab === 'active' ? 'var(--bg-canvas)' : 'var(--text-secondary)',
            fontWeight: 500, fontSize: 'var(--fs-caption)', border: 'none', cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Active ({activeCategories.length})
        </button>
        <button
          onClick={() => setViewTab('archived')}
          style={{
            padding: '6px 14px', borderRadius: 'var(--radius-full)',
            background: viewTab === 'archived' ? 'var(--text-primary)' : 'transparent',
            color: viewTab === 'archived' ? 'var(--bg-canvas)' : 'var(--text-secondary)',
            fontWeight: 500, fontSize: 'var(--fs-caption)', border: 'none', cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Archived ({archivedCategories.length})
        </button>
      </div>

      {/* Free tier notice */}


      {/* Add new card */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            layoutId="newCategoryForm"
            style={{ marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', zIndex: 10 }}
          >
            <Card variant="elevated">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h3 className="text-h2">New category</h3>

                {/* Name input */}
                <div>
                  <label htmlFor="new-cat-name" className="text-caption" style={{ marginBottom: 6, display: 'block' }}>Name</label>
                  <input
                    id="new-cat-name"
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false); }}
                    maxLength={30}
                    placeholder="e.g. Deep Work"
                    style={{
                      width: '100%', padding: '10px 14px',
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--fs-body)', color: 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* Color picker */}
                <div>
                  <p className="text-caption" style={{ marginBottom: 10 }}>Colour</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {CATEGORY_COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setNewColor(c.hex)}
                        aria-label={c.label}
                        style={{
                          width: 32, height: 32, borderRadius: '50%', background: c.hex, border: 'none',
                          cursor: 'pointer', outline: newColor === c.hex ? `3px solid var(--text-primary)` : 'none',
                          outlineOffset: 2, transition: 'transform 0.1s',
                        }}
                        onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                        onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                  <GhostButton onClick={() => setShowAdd(false)}>Cancel</GhostButton>
                  <PrimaryButton onClick={handleAdd} disabled={!newName.trim()}>Create</PrimaryButton>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category grid */}
      {(viewTab === 'active' ? activeCategories : archivedCategories).length === 0 ? (
        <EmptyState
          title={viewTab === 'active' ? "No categories yet" : "No archived categories"}
          body={viewTab === 'active' ? "Create categories to organise your focus sessions by topic or project." : "When you archive a category, it will appear here."}
          action={viewTab === 'active' ? <PrimaryButton size="sm" onClick={() => setShowAdd(true)} icon={<Plus size={14} />}>New category</PrimaryButton> : null}
        />
      ) : (
        <div className="categories-grid">
          <AnimatePresence mode="popLayout">
            {(viewTab === 'active' ? activeCategories : archivedCategories).map(cat => (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              >
                <LiquidCard reducedMotion={reducedMotion}>
                  <motion.div
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.4}
                    whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 10, filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.15))' }}
                  >
                  <Card style={{ 
                    boxShadow: `inset 0 0 80px -20px ${cat.colorHex}15`, 
                    border: `1px solid ${cat.colorHex}25`,
                    background: `linear-gradient(to bottom right, rgba(255,255,255,0.02), ${cat.colorHex}05)`
                  }}>
                  {editing === cat.id ? (
                    /* Edit mode */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(null); }}
                        maxLength={30}
                        style={{
                          background: 'var(--bg-surface)', border: '1px solid var(--accent-focus)',
                          borderRadius: 'var(--radius-sm)', padding: '6px 10px',
                          fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)',
                          color: 'var(--text-primary)', width: '100%',
                        }}
                      />
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {CATEGORY_COLORS.map(c => (
                          <button
                            key={c.id}
                            onClick={() => setEditColor(c.hex)}
                            aria-label={c.label}
                            style={{
                              width: 22, height: 22, borderRadius: '50%', background: c.hex,
                              border: 'none', cursor: 'pointer',
                              outline: editColor === c.hex ? '2px solid var(--text-primary)' : 'none',
                              outlineOffset: 1,
                            }}
                          />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <GhostButton size="sm" onClick={() => setEditing(null)}>Cancel</GhostButton>
                        <PrimaryButton size="sm" onClick={saveEdit}>Save</PrimaryButton>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <div className="category-card">
                      <div className="category-card__left">
                        <div className="category-color-swatch" style={{ background: cat.colorHex }} />
                        <div>
                          <div style={{ fontSize: 'var(--fs-body)', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {cat.name}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {viewTab === 'active' ? (
                          <>
                            <IconButton label={`Edit ${cat.name}`} onClick={() => startEdit(cat)} style={{ width: 32, height: 32 }}>
                              <Edit2 size={13} />
                            </IconButton>
                            <IconButton label={`Archive ${cat.name}`} onClick={() => archiveCategory(cat.id)} style={{ width: 32, height: 32 }}>
                              <Archive size={13} />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton label={`Restore ${cat.name}`} onClick={() => restoreCategory(cat.id)} style={{ width: 32, height: 32 }}>
                              <RefreshCw size={13} />
                            </IconButton>
                            <IconButton 
                              label={`Delete ${cat.name}`} 
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to permanently delete "${cat.name}"?`)) {
                                  removeCategory(cat.id);
                                }
                              }} 
                              style={{ width: 32, height: 32, color: 'var(--accent-coral)' }}
                            >
                              <Trash2 size={13} />
                            </IconButton>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  </Card>
                  </motion.div>
                </LiquidCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CategoriesScreen;
