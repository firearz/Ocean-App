import React, { useState } from 'react';
import { Reorder, AnimatePresence } from 'framer-motion';
import { Plus, FolderPlus, Folder } from 'lucide-react';
import { useOceanStore } from '../store/useOceanStore';
import { useShallow } from 'zustand/react/shallow';
import { PrimaryButton, GhostButton } from '../components/Buttons';
import { EmptyState, Tabs, TabItem } from '../components/Primitives';
import { TaskItem } from '../components/TaskItem';
import { TaskAnalytics } from '../components/TaskAnalytics';

const TasksScreen: React.FC = () => {
  const { 
    tasks, addTask, reorderTasks, clearCompletedTasks,
    taskChapters, addChapter 
  } = useOceanStore(
    useShallow(s => ({
      tasks: s.tasks,
      addTask: s.addTask,
      reorderTasks: s.reorderTasks,
      clearCompletedTasks: s.clearCompletedTasks,
      taskChapters: s.taskChapters,
      addChapter: s.addChapter
    }))
  );
  
  const [newTask, setNewTask] = useState('');
  const [activeChapterId, setActiveChapterId] = useState<string>('all');
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      const chapterId = activeChapterId === 'all' ? undefined : activeChapterId;
      addTask(newTask.trim(), chapterId);
      setNewTask('');
    }
  };

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChapterName.trim()) {
      addChapter(newChapterName.trim());
      setNewChapterName('');
      setIsAddingChapter(false);
    }
  };

  const orderedTasks = [...tasks].sort((a, b) => a.order - b.order);
  
  const filteredTasks = activeChapterId === 'all' 
    ? orderedTasks 
    : orderedTasks.filter(t => t.chapterId === activeChapterId);

  const activeTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);
  const hasCompleted = completedTasks.length > 0;

  const tabItems: TabItem[] = [
    { id: 'all', label: 'All Tasks', badge: tasks.filter(t => !t.completed).length },
    ...taskChapters.map(c => ({
      id: c.id,
      label: c.name,
      badge: tasks.filter(t => t.chapterId === c.id && !t.completed).length || undefined
    }))
  ];

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

        {tasks.length > 0 && (
          <TaskAnalytics />
        )}

        {/* Chapters Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
          <Tabs tabs={tabItems} active={activeChapterId} onChange={setActiveChapterId} />
          
          {!isAddingChapter ? (
            <GhostButton size="sm" onClick={() => setIsAddingChapter(true)} style={{ borderRadius: 'var(--radius-full)' }}>
              <FolderPlus size={16} style={{ marginRight: 'var(--space-2)' }}/> New Chapter
            </GhostButton>
          ) : (
            <form onSubmit={handleAddChapter} style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                autoFocus
                type="text"
                value={newChapterName}
                onChange={e => setNewChapterName(e.target.value)}
                placeholder="Chapter name..."
                onBlur={() => { if(!newChapterName) setIsAddingChapter(false); }}
                style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-medium)', background: 'var(--bg-surface)',
                  fontSize: 'var(--fs-caption)', color: 'var(--text-primary)', outline: 'none'
                }}
              />
            </form>
          )}
        </div>

        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <input
            type="text"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder={activeChapterId === 'all' ? "What do you need to get done?" : `Add task to ${taskChapters.find(c => c.id === activeChapterId)?.name}...`}
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

        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={activeChapterId === 'all' ? undefined : <Folder size={28} />}
            title={activeChapterId === 'all' ? "All caught up!" : "Empty chapter"}
            body={activeChapterId === 'all' ? "Add a task above to start planning your focus sessions." : "Add a task to this chapter above."}
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
                No active tasks here. Add one above!
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
