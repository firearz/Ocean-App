// Ocean — Categories Screen
// Part 2 § 2.8: Grid of category cards with edit/rename/recolor/archive and reorder.
// Free tier: cap at 3 active categories with inline upgrade prompt.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Archive, Plus } from 'lucide-react';
import { useOceanStore } from '../store/useOceanStore';
import { CATEGORY_COLORS, type Category } from '../components/CategoryPill';
import { PrimaryButton, GhostButton, IconButton } from '../components/Buttons';
import { Card, EmptyState } from '../components/Primitives';

const CategoriesScreen: React.FC = () => {
  const { categories, settings, addCategory, updateCategory, removeCategory, addToast } = useOceanStore();
  const [editing,    setEditing]    = useState<string | null>(null);
  const [editName,   setEditName]   = useState('');
  const [editColor,  setEditColor]  = useState('');
  const [showAdd,    setShowAdd]    = useState(false);
  const [newName,    setNewName]    = useState('');
  const [newColor,   setNewColor]   = useState<string>(CATEGORY_COLORS[0].hex);

  const isPro = settings.isPro;
  const atLimit = !isPro && categories.length >= 3;

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
        <PrimaryButton
          onClick={() => {
            if (atLimit) { addToast('Upgrade to Ocean Pro for unlimited categories.', 'info'); return; }
            setShowAdd(true);
          }}
          icon={<Plus size={15} />}
          size="sm"
        >
          New category
        </PrimaryButton>
      </div>

      {/* Free tier notice */}
      {!isPro && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--accent-focus-subtle)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-4)',
          fontSize: 'var(--fs-caption)',
          color: 'var(--accent-focus)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
        }}>
          <span>{categories.length}/3 categories used on free plan</span>
          <GhostButton size="sm" style={{ color: 'var(--accent-focus)', padding: '2px 10px' }}>
            Upgrade for unlimited
          </GhostButton>
        </div>
      )}

      {/* Add new card */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 'var(--space-4)' }}
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
      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          body="Create categories to organise your focus sessions by topic or project."
          action={<PrimaryButton size="sm" onClick={() => setShowAdd(true)} icon={<Plus size={14} />}>New category</PrimaryButton>}
        />
      ) : (
        <div className="categories-grid">
          <AnimatePresence mode="popLayout">
            {categories.map(cat => (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              >
                <Card>
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
                        <IconButton label={`Edit ${cat.name}`} onClick={() => startEdit(cat)} style={{ width: 32, height: 32 }}>
                          <Edit2 size={13} />
                        </IconButton>
                        <IconButton label={`Remove ${cat.name}`} onClick={() => removeCategory(cat.id)} style={{ width: 32, height: 32 }}>
                          <Archive size={13} />
                        </IconButton>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CategoriesScreen;
