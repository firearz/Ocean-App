import React from 'react';
import { useOceanStore } from '../store/useOceanStore';

export const TaskAnalytics: React.FC = () => {
  const tasks = useOceanStore(s => s.tasks);
  const chapters = useOceanStore(s => s.taskChapters);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
      padding: 'var(--space-4)', background: 'var(--bg-surface)', 
      borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 className="text-h3" style={{ marginBottom: 'var(--space-1)' }}>Overview</h2>
          <p className="text-body text-secondary">
            {completedTasks} completed • {activeTasks} active
          </p>
        </div>
        <div className="text-h2" style={{ color: 'var(--accent-focus)' }}>
          {completionRate}%
        </div>
      </div>
      
      {/* Overall Progress Bar */}
      <div style={{ height: 8, background: 'var(--border-medium)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${completionRate}%`,
          background: 'var(--accent-focus)', transition: 'width 0.5s ease-out'
        }} />
      </div>

      {/* Chapter Progress */}
      {chapters.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          {chapters.map(chapter => {
            const chapterTasks = tasks.filter(t => t.chapterId === chapter.id);
            const chapTotal = chapterTasks.length;
            const chapCompleted = chapterTasks.filter(t => t.completed).length;
            const chapRate = chapTotal === 0 ? 0 : Math.round((chapCompleted / chapTotal) * 100);

            return (
              <div key={chapter.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-micro)' }}>
                  <span style={{ fontWeight: 500, color: chapter.colorHex || 'var(--text-primary)' }} className="truncate">
                    {chapter.name}
                  </span>
                  <span className="text-tertiary">{chapCompleted}/{chapTotal}</span>
                </div>
                <div style={{ height: 4, background: 'var(--border-medium)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${chapRate}%`,
                    background: chapter.colorHex || 'var(--text-primary)', transition: 'width 0.5s ease-out'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
