// Ocean — Analytics Screen
// Part 2 § 2.7: Three tabs — Overview, Timeline, Insights (Pro).

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, List } from 'lucide-react';
import { useOceanStore } from '../store/useOceanStore';
import { Tabs, Card, EmptyState } from '../components/Primitives';
import CalendarHeatmap from '../components/CalendarHeatmap';
import { DonutChart, BarChart, type ChartSegment, type BarDay } from '../components/Charts';


const ANALYTICS_TABS = [
  { id: 'overview',  label: 'Overview',  },
  { id: 'timeline',  label: 'Timeline',  },
  { id: 'insights',  label: 'Insights',  },
];

import { useShallow } from 'zustand/react/shallow';

// ── Overview Tab ───────────────────────────────────────────────────────────
const OverviewTab: React.FC = () => {
  const { sessions, categories } = useOceanStore(
    useShallow((s) => ({
      sessions: s.sessions,
      categories: s.categories,
    }))
  );

  const focusSessions = sessions.filter(s => s.status === 'completed');

  // Heatmap data
  const heatmapData = useMemo(() => {
    const map = new Map<string, number>();
    focusSessions.forEach(s => {
      const d = new Date(s.startedAt).toISOString().split('T')[0];
      map.set(d, (map.get(d) ?? 0) + Math.round(s.actualDurationSec / 60));
    });
    return Array.from(map.entries()).map(([date, minutes]) => ({ date, minutes }));
  }, [sessions]);

  // Stats
  const totalMin    = Math.round(focusSessions.reduce((a, s) => a + s.actualDurationSec / 60, 0));
  const thisWeekMin = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    return Math.round(focusSessions
      .filter(s => new Date(s.startedAt).getTime() > weekAgo)
      .reduce((a, s) => a + s.actualDurationSec / 60, 0));
  }, [sessions]);

  // Streak
  const streak = useMemo(() => {
    const days = new Set(focusSessions.map(s => new Date(s.startedAt).toDateString()));
    let count = 0; const d = new Date();
    while (days.has(d.toDateString())) { count++; d.setDate(d.getDate() - 1); }
    return count;
  }, [sessions]);

  // Longest streak
  const longestStreak = useMemo(() => {
    const days = [...new Set(focusSessions.map(s => new Date(s.startedAt).toDateString()))]
      .map(s => new Date(s).getTime())
      .sort((a, b) => a - b);
    let longest = 0, cur = 0, prev = 0;
    days.forEach(d => {
      const diff = (d - prev) / 86400000;
      cur = diff <= 1 ? cur + 1 : 1;
      if (cur > longest) longest = cur;
      prev = d;
    });
    return longest;
  }, [sessions]);

  // Bar chart — last 14 days
  const barDays: BarDay[] = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const daySessions = focusSessions.filter(s => s.startedAt.startsWith(dateStr));
      const minutes = Math.round(daySessions.reduce((a, s) => a + s.actualDurationSec / 60, 0));
      const cat = daySessions.length > 0
        ? categories.find(c => c.id === daySessions[0].categoryId)
        : null;
      return {
        label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
        minutes,
        color: cat?.colorHex,
      };
    });
  }, [sessions, categories]);

  // Donut — category breakdown
  const donutSegments: ChartSegment[] = useMemo(() => {
    const map = new Map<string, number>();
    focusSessions.forEach(s => {
      const key = s.categoryId ?? 'uncategorized';
      map.set(key, (map.get(key) ?? 0) + Math.round(s.actualDurationSec / 60));
    });
    return Array.from(map.entries()).map(([id, value]) => {
      const cat = categories.find(c => c.id === id);
      return {
        label: cat?.name ?? 'Uncategorized',
        value,
        color: cat?.colorHex ?? 'var(--text-tertiary)',
      };
    });
  }, [sessions, categories]);

  const formatTime = (min: number) => {
    const h = Math.floor(min / 60); const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (focusSessions.length === 0) {
    return (
      <EmptyState
        title="No sessions yet"
        body="Complete your first focus session to start seeing analytics here."
        icon={<Calendar size={28} />}
      />
    );
  }

  return (
    <div className="analytics-screen">
      {/* Calendar heatmap */}
      <Card>
        <h2 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>This year</h2>
        <CalendarHeatmap data={heatmapData} />
      </Card>

      {/* Stat cards */}
      <div className="analytics-stat-row">
        {[
          { label: 'Total focus time', value: formatTime(totalMin) },
          { label: 'This week',        value: formatTime(thisWeekMin) },
          { label: 'Current streak',   value: `${streak}d` },
          { label: 'Longest streak',   value: `${longestStreak}d` },
        ].map((s) => (
          <Card key={s.label}>
            <div className="text-h1" style={{ marginBottom: 4, color: 'var(--accent-focus)' }}>{s.value}</div>
            <div className="text-caption">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="analytics-charts-row">
        <Card>
          <h2 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>Last 14 days</h2>
          <BarChart days={barDays} />
        </Card>
        <Card>
          <h2 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>By category</h2>
          {donutSegments.length > 0
            ? <DonutChart segments={donutSegments} />
            : <p className="text-caption text-tertiary">No categories assigned yet.</p>
          }
        </Card>
      </div>
    </div>
  );
};

// ── Timeline Tab ───────────────────────────────────────────────────────────
const TimelineTab: React.FC = () => {
  const { sessions, categories, removeSession, openContextMenu } = useOceanStore(
    useShallow((s) => ({
      sessions: s.sessions,
      categories: s.categories,
      removeSession: s.removeSession,
      openContextMenu: s.openContextMenu,
    }))
  );
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() =>
    sessions
      .filter(s => s.status === 'completed' || s.status === 'ended_early')
      .filter(s => !search || s.intention.toLowerCase().includes(search.toLowerCase()))
      .filter(s => !filterCat || s.categoryId === filterCat),
    [sessions, search, filterCat]
  );

  // Group by day
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach(s => {
      const day = new Date(s.startedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(s);
    });
    return map;
  }, [filtered]);

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No sessions yet"
        body="Your session history will appear here once you complete your first focus session."
        icon={<List size={28} />}
      />
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input
          placeholder="Search intentions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search session intentions"
          style={{
            flex: 1, minWidth: 180, padding: '8px 14px',
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-caption)', color: 'var(--text-primary)',
            backdropFilter: 'var(--blur-surface)',
          }}
        />
        <select
          value={filterCat ?? ''}
          onChange={e => setFilterCat(e.target.value || null)}
          aria-label="Filter by category"
          style={{
            padding: '8px 14px', background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)',
            color: 'var(--text-primary)', cursor: 'pointer',
          }}
        >
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Session list */}
      {filtered.length === 0
        ? <p className="text-caption text-tertiary" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>No sessions match your filters.</p>
        : Array.from(grouped.entries()).map(([day, daySessions]) => (
          <div key={day}>
            <div className="timeline-date-header">{day}</div>
            {daySessions.map(s => {
              const cat = categories.find(c => c.id === s.categoryId);
              const dur = Math.round(s.actualDurationSec / 60);
              const start = new Date(s.startedAt);
              const end   = s.endedAt ? new Date(s.endedAt) : null;
              const isExp = expanded === s.id;

              return (
                <div key={s.id}>
                  <div
                    className="timeline-session"
                    onClick={() => setExpanded(isExp ? null : s.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openContextMenu(e.clientX, e.clientY, [
                        {
                          id: 'delete',
                          label: 'Delete session',
                          icon: <span style={{ fontSize: 14 }}>🗑️</span>,
                          destructive: true,
                          action: () => removeSession(s.id)
                        }
                      ]);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExp}
                    onKeyDown={e => { if (e.key === 'Enter') setExpanded(isExp ? null : s.id); }}
                    title="Click to expand. Right-click to delete."
                  >
                    <div className="timeline-session__dot" style={{ background: cat?.colorHex ?? 'var(--border-medium)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--fs-body)', fontWeight: 400, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.intention || 'Untitled session'}
                      </div>
                      <div className="text-micro" style={{ marginTop: 2 }}>
                        {cat?.name ?? 'Uncategorized'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="text-caption" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dur}m</div>
                      <div className="text-micro">
                        {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {end && ` – ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                      </div>
                    </div>
                    {s.reflectionNote && (
                      <div style={{ color: 'var(--accent-focus)', fontSize: 11 }}>📝</div>
                    )}
                  </div>

                  {/* Expanded reflection note */}
                  <AnimatePresence>
                    {isExp && s.reflectionNote && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          padding: 'var(--space-3) var(--space-6)',
                          background: 'var(--accent-focus-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          margin: '0 var(--space-4) var(--space-2)',
                          fontSize: 'var(--fs-caption)',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                        }}>
                          {s.reflectionNote}
                          {s.focusRating && (
                            <span style={{ marginLeft: 12, color: 'var(--accent-focus)', fontWeight: 600 }}>
                              {'●'.repeat(s.focusRating)}{'○'.repeat(5 - s.focusRating)}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ))
      }
    </div>
  );
};

// ── Insights Tab (Pro) ─────────────────────────────────────────────────────
const InsightsTab: React.FC = () => {
  const { sessions } = useOceanStore(
    useShallow((s) => ({
      sessions: s.sessions,
    }))
  );
  const hourBuckets = useMemo(() => {
    const counts = Array(24).fill(0);
    sessions.filter(s => s.status === 'completed')
      .forEach(s => { counts[new Date(s.startedAt).getHours()]++; });
    return counts;
  }, [sessions]);

  const maxCount = Math.max(...hourBuckets, 1);

  return (
    <div className="analytics-screen">
      <Card>
        <h2 className="text-h2" style={{ marginBottom: 'var(--space-6)' }}>Best focus hours</h2>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80 }}>
          {hourBuckets.map((count, h) => (
            <div
              key={h}
              title={`${h}:00 — ${count} session${count !== 1 ? 's' : ''}`}
              style={{
                flex: 1,
                height: Math.max(4, (count / maxCount) * 72),
                background: count > 0 ? 'var(--accent-focus)' : 'var(--border-subtle)',
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                opacity: count > 0 ? 0.3 + (count / maxCount) * 0.7 : 1,
                transition: 'height 0.4s var(--ease-spring)',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span className="text-micro">12am</span>
          <span className="text-micro">6am</span>
          <span className="text-micro">12pm</span>
          <span className="text-micro">6pm</span>
          <span className="text-micro">11pm</span>
        </div>
      </Card>
    </div>
  );
};

// ── Analytics Screen ───────────────────────────────────────────────────────
const AnalyticsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="screen">
      <h1 className="text-h1" style={{ marginBottom: 'var(--space-4)' }}>Analytics</h1>
      <Tabs tabs={ANALYTICS_TABS} active={activeTab} onChange={setActiveTab} />

      <div style={{ marginTop: 'var(--space-4)' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'overview'  && <OverviewTab />}
            {activeTab === 'timeline'  && <TimelineTab />}
            {activeTab === 'insights'  && <InsightsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnalyticsScreen;
