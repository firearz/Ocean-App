import React, { useState } from 'react';
import { Reorder, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useOceanStore } from '../store/useOceanStore';
import { useShallow } from 'zustand/react/shallow';
import { PrimaryButton, GhostButton } from '../components/Buttons';
import { EmptyState } from '../components/Primitives';
import { TaskItem } from '../components/TaskItem';

const TasksScreen: React.FC = () => {
  const { tasks, addTask, reorderTasks, clearCompletedTasks } = useOceanStore(
    useShallow(s => ({
      tasks: s.tasks,
      addTask: s.addTask,
      reorderTasks: s.reorderTasks,
      clearCompletedTasks: s.clearCompletedTasks
    }))
  );
  const [newTask, setNewTask] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTask(newTask.trim());
      setNewTask('');
    }
  };

  const orderedTasks = [...tasks].sort((a, b) => a.order - b.order);
  const activeTasks = orderedTasks.filter(t => !t.completed);
  const completedTasks = orderedTasks.filter(t => t.completed);
  const hasCompleted = completedTasks.length > 0;

  return (
    <div className="screen">
      <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="text-h1">Tasks</h1>
          {hasCompleted && (
            <GhostButton size="sm" onClick={clearCompletedTasks}>
              Clear completed
            </GhostButton>
          )}
        </div>

        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <input
            type="text"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="What do you need to get done?"
            style={{
              flex: 1, padding: '14px 20px', borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-medium)', background: 'var(--bg-surface)',
              fontSize: 'var(--fs-body)', color: 'var(--text-primary)', outline: 'none',
              boxShadow: 'var(--shadow-sm)'
            }}
          />
          <PrimaryButton type="submit" disabled={!newTask.trim()} size="lg" style={{ borderRadius: 'var(--radius-full)' }}>
            <Plus size={20} />
          </PrimaryButton>
        </form>

        {tasks.length === 0 ? (
          <EmptyState
            title="All caught up!"
            body="Add a task above to start planning your focus sessions."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {activeTasks.length > 0 ? (
              <Reorder.Group axis="y" values={activeTasks} onReorder={reorderTasks} style={{ listStyleType: 'none', margin: 0, padding: 0 }}>
                <AnimatePresence mode="popLayout">
                  {activeTasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            ) : (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-tertiary)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                No active tasks. Add a task above to get started!
              </div>
            )}

            {completedTasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <h3 className="text-caption text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Completed tasks</h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <AnimatePresence mode="popLayout">
                    {completedTasks.map(task => (
                      <TaskItem key={task.id} task={task} dragEnabled={false} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksScreen;
