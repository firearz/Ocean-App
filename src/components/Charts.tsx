// Ocean — DonutChart + BarChart Components
// Part 1 § 3.10: Category breakdown donut + weekly focused minutes bar chart.
// Uses the 8-hue category palette; pure SVG/CSS, no external chart library.

import React from 'react';

// ── Shared types ───────────────────────────────────────────────────────────
export interface ChartSegment {
  label:    string;
  value:    number;       // minutes
  color:    string;       // hex
}

// ── DonutChart ─────────────────────────────────────────────────────────────
interface DonutChartProps {
  segments: ChartSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  size = 180,
  strokeWidth = 20,
  centerLabel = 'Total',
  centerValue,
}) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r     = (size - strokeWidth) / 2;
  const circ  = 2 * Math.PI * r;
  const cx    = size / 2;
  const cy    = size / 2;

  const totalMinutes = segments.reduce((s, seg) => s + seg.value, 0);
  const totalHours   = Math.floor(totalMinutes / 60);
  const totalMins    = totalMinutes % 60;
  const displayVal   = centerValue ?? (totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`);

  let cumulativeDeg = 0;

  return (
    <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* SVG Donut */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
          role="img"
          aria-label="Category time breakdown donut chart"
        >
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg, i) => {
            if (seg.value === 0) return null;
            const fraction = seg.value / (total || 1);
            const dash     = fraction * circ;
            const gap      = circ - dash;
            const offset   = -(cumulativeDeg / 360) * circ;
            cumulativeDeg += fraction * 360;

            return (
              <circle
                key={i}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 'var(--fs-h2)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>
            {displayVal}
          </span>
          <span className="text-micro" style={{ marginTop: 4 }}>{centerLabel}</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1, minWidth: 140 }}>
        {segments.map((seg, i) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          const h   = Math.floor(seg.value / 60);
          const m   = seg.value % 60;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: seg.color, flexShrink: 0,
              }} />
              <span style={{ flex: 1, fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                {seg.label}
              </span>
              <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-primary)', fontWeight: 600, minWidth: 48, textAlign: 'right' }}>
                {h > 0 ? `${h}h ${m}m` : `${m}m`}
              </span>
              <span className="text-micro" style={{ minWidth: 32, textAlign: 'right' }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── BarChart ───────────────────────────────────────────────────────────────
export interface BarDay {
  label:    string;    // e.g. "Mon", "Tue", or "Jul 14"
  minutes:  number;
  color?:   string;    // dominant category color; defaults to accent-focus
}

interface BarChartProps {
  days: BarDay[];
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ days, height = 120 }) => {
  const maxMin = Math.max(...days.map((d) => d.minutes), 1);

  return (
    <div
      role="img"
      aria-label="Focused minutes per day bar chart"
      style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: height + 24 }}
    >
      {days.map((day, i) => {
        const barH  = Math.max(2, (day.minutes / maxMin) * height);
        const color = day.color ?? 'var(--accent-focus)';
        const h     = Math.floor(day.minutes / 60);
        const m     = day.minutes % 60;
        const tip   = day.minutes > 0 ? (h > 0 ? `${h}h ${m}m` : `${m}m`) : '–';

        return (
          <div
            key={i}
            title={`${day.label}: ${tip}`}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 4,
              height: height + 24,
            }}
          >
            <div
              style={{
                width: '100%',
                height: barH,
                background: color,
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                opacity: day.minutes > 0 ? 1 : 0.18,
                transition: 'height 0.4s var(--ease-spring)',
                minWidth: 8,
              }}
            />
            <span className="text-micro" style={{ fontSize: 10 }}>{day.label}</span>
          </div>
        );
      })}
    </div>
  );
};
