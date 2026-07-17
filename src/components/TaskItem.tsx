import React, { useState, useRef } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Trash2, Check } from 'lucide-react';
import { useOceanStore, TodoTask } from '../store/useOceanStore';
import { useShallow } from 'zustand/react/shallow';
import confetti from 'canvas-confetti';

export const AnimatedCheckbox: React.FC<{ checked: boolean; onClick: () => void }> = ({ checked, onClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    if (!checked) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      
      confetti({
        particleCount: 80,
        spread: 80,
        startVelocity: 30,
        origin: { x, y },
        colors: ['#FF6B6B', '#6C63FF', '#56CCF2', '#43e8d8', '#FFD166'],
        disableForReducedMotion: true,
        zIndex: 10000,
      });
    }
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      animate={{ 
        backgroundColor: checked ? 'var(--accent-focus)' : 'transparent',
        borderColor: checked ? 'var(--accent-focus)' : 'var(--border-strong)',
      }}
      whileTap={{ scale: 0.8, borderRadius: '40%' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0
      }}
      aria-label={checked ? "Mark as incomplete" : "Mark as complete"}
    >
      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Check size={14} color="#fff" strokeWidth={4} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export const TaskItem: React.FC<{ task: TodoTask, dragEnabled?: boolean }> = ({ task, dragEnabled = true }) => {
  const { toggleTask, removeTask } = useOceanStore(
    useShallow(s => ({ toggleTask: s.toggleTask, removeTask: s.removeTask }))
  );
  
  const [isHolding, setIsHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = () => {
    setIsHolding(true);
    holdTimer.current = setTimeout(() => {
      removeTask(task.id);
      setIsHolding(false);
    }, 1500);
  };
  const cancelHold = () => {
    setIsHolding(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  const content = (
    <>
      <AnimatedCheckbox checked={task.completed} onClick={() => toggleTask(task.id)} />
      <span style={{ 
        flex: 1, fontSize: 'var(--fs-body)', color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
        textDecoration: task.completed ? 'line-through' : 'none', transition: 'all 0.4s ease',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        {task.text}
      </span>
      <motion.button 
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        animate={{ 
          scale: isHolding ? 1.4 : 1, 
          color: isHolding ? 'var(--accent-coral)' : 'var(--text-tertiary)',
          rotate: isHolding ? [-2, 2, -2, 2, 0] : 0 
        }}
        transition={{ duration: isHolding ? 1.5 : 0.2, ease: 'linear' }}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 8, display: 'flex' }}
        aria-label="Hold to Delete Task"
      >
        <Trash2 size={16} />
      </motion.button>
    </>
  );

  const style = {
    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
    background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
    marginBottom: 12, border: '1px solid var(--border-subtle)',
    cursor: dragEnabled ? 'grab' : 'default'
  };

  const initialAnim = { opacity: 0, y: -30, scale: 0.95 };
  const animateAnim = { 
    opacity: task.completed ? 0.4 : 1, 
    y: 0, 
    scale: task.completed ? 0.95 : 1,
    filter: task.completed ? 'blur(4px)' : 'blur(0px)',
  };
  const exitAnim = { opacity: 0, scale: 0.8, filter: 'blur(10px)' };
  const transitionAnim = { 
    type: 'spring' as const, 
    stiffness: 200, 
    damping: 24, 
    mass: 0.8 
  };

  if (!dragEnabled) {
    return (
      <motion.div
        initial={initialAnim} animate={animateAnim} exit={exitAnim} transition={transitionAnim}
        style={style}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <Reorder.Item
      value={task}
      id={task.id}
      initial={initialAnim}
      animate={animateAnim}
      exit={exitAnim}
      transition={transitionAnim}
      whileDrag={{ scale: 1.05, boxShadow: '0 16px 32px rgba(0,0,0,0.2)', zIndex: 10, cursor: 'grabbing' }}
      style={style}
    >
      {content}
    </Reorder.Item>
  );
};
