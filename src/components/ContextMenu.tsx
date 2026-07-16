import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOceanStore } from '../store/useOceanStore';
import { useShallow } from 'zustand/react/shallow';

const ContextMenu: React.FC = () => {
  const { contextMenu, closeContextMenu } = useOceanStore(
    useShallow((s) => ({
      contextMenu: s.contextMenu,
      closeContextMenu: s.closeContextMenu,
    }))
  );

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    
    // Listen for right clicks outside as well to close
    const handleContextMenu = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('contextmenu', handleContextMenu);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [contextMenu, closeContextMenu]);

  if (!contextMenu) return null;

  // Prevent menu from overflowing window
  let posX = contextMenu.x;
  let posY = contextMenu.y;
  
  // A rough estimate of menu dimensions to adjust spawn point.
  const estWidth = 180;
  const estHeight = contextMenu.items.length * 36 + 16;
  
  if (posX + estWidth > window.innerWidth) posX = window.innerWidth - estWidth - 8;
  if (posY + estHeight > window.innerHeight) posY = window.innerHeight - estHeight - 8;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999, // Ensure it's above everything
        pointerEvents: 'none'
      }}
    >
      <AnimatePresence>
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: posX,
            top: posY,
            pointerEvents: 'auto',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-2)',
            minWidth: 160,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            boxShadow: 'var(--shadow-float)',
            backdropFilter: 'blur(20px)'
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {contextMenu.items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.action();
                closeContextMenu();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-caption)',
                fontWeight: 500,
                color: item.destructive ? 'var(--accent-coral)' : 'var(--text-primary)',
                transition: 'background 0.1s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = item.destructive 
                  ? 'rgba(255, 107, 107, 0.1)' 
                  : 'var(--border-subtle)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ContextMenu;
