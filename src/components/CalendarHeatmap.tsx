// Ocean — CalendarHeatmap Component
// Part 1 § 3.9: GitHub contributions-style grid, current year,
// horizontally scrollable, tooltip on hover, AccentFocus at varying opacity.

import React, { useState, useMemo } from 'react';

export interface DayData {
  date: string;     // ISO date string YYYY-MM-DD
  minutes: number;  // focused minutes that day
}

interface CalendarHeatmapProps {
  data: DayData[];
  year?: number;
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getIntensityLevel(minutes: number, max: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (minutes === 0) return 0;
  const ratio = minutes / Math.max(max, 1);
  if (ratio < 0.1) return 1;
  if (ratio < 0.3) return 2;
  if (ratio < 0.6) return 3;
  if (ratio < 0.85) return 4;
  return 5;
}

function buildWeekGrid(year: number, dataMap: Map<string, number>) {
  const start = new Date(year, 0, 1);
  const end   = new Date(year, 11, 31);

  // Align start to Sunday
  const startDay = start.getDay();
  const gridStart = new Date(start);
  gridStart.setDate(gridStart.getDate() - startDay);

  const weeks: Array<Array<{ date: string; minutes: number; isInYear: boolean }>> = [];
  let current = new Date(gridStart);

  while (current <= end || current.getDay() !== 0) {
    const week: typeof weeks[0] = [];
    for (let d = 0; d < 7; d++) {
      const iso = current.toISOString().split('T')[0];
      week.push({
        date: iso,
        minutes: dataMap.get(iso) ?? 0,
        isInYear: current.getFullYear() === year,
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current.getFullYear() > year && current.getDay() === 0) break;
  }
  return weeks;
}

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  data,
  year = new Date().getFullYear(),
}) => {
  const [_tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => map.set(d.date, d.minutes));
    return map;
  }, [data]);

  const maxMinutes = useMemo(() => Math.max(...data.map((d) => d.minutes), 1), [data]);
  const weeks = useMemo(() => buildWeekGrid(year, dataMap), [year, dataMap]);

  // Month label positions
  const monthLabels = useMemo(() => {
    const seen = new Set<number>();
    return weeks.map((week, wi) => {
      const firstInYear = week.find((d) => d.isInYear);
      if (!firstInYear) return null;
      const month = new Date(firstInYear.date).getMonth();
      if (seen.has(month)) return null;
      seen.add(month);
      return { month, wi };
    }).filter(Boolean) as Array<{ month: number; wi: number }>;
  }, [weeks]);

  const CELL  = 12;
  const GAP   = 3;
  const STEP  = CELL + GAP;
  const MONTH_H = 18;
  const DAY_W   = 28;

  return (
    <div style={{ overflowX: 'auto', padding: '4px 0' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Month labels row */}
        <div style={{ display: 'flex', marginLeft: DAY_W, marginBottom: 4, height: MONTH_H }}>
          {monthLabels.map((m) => (
            <span
              key={m!.month}
              className="text-micro"
              style={{
                position: 'absolute',
                left: DAY_W + m!.wi * STEP,
                top: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {MONTH_NAMES[m!.month]}
            </span>
          ))}
        </div>

        {/* Day label column + week grid */}
        <div style={{ display: 'flex', gap: 0 }}>
          {/* Day of week labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: 4, paddingTop: 0 }}>
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-micro"
                style={{
                  height: CELL,
                  lineHeight: `${CELL}px`,
                  textAlign: 'right',
                  width: DAY_W - 4,
                  flexShrink: 0,
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div className="heatmap" style={{ gap: GAP }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="heatmap__week">
                {week.map((day) => {
                  const level = day.isInYear ? getIntensityLevel(day.minutes, maxMinutes) : 0;
                  const d = new Date(day.date);
                  const label = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${day.minutes} min focused`;
                  return (
                    <div
                      key={day.date}
                      className={`heatmap__cell${level > 0 ? ` heatmap__cell--l${level}` : ''}`}
                      style={{ opacity: day.isInYear ? 1 : 0.3 }}
                      title={day.isInYear ? label : ''}
                      role={day.isInYear ? 'button' : undefined}
                      aria-label={day.isInYear ? label : undefined}
                      tabIndex={day.isInYear ? 0 : undefined}
                      onMouseEnter={(e) => {
                        if (!day.isInYear) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({ text: label, x: rect.x, y: rect.y });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
          <span className="text-micro">Less</span>
          {[0, 1, 2, 3, 4, 5].map((l) => (
            <div key={l} className={`heatmap__cell${l > 0 ? ` heatmap__cell--l${l}` : ''}`} style={{ flexShrink: 0 }} />
          ))}
          <span className="text-micro">More</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
