import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppView } from '../types';
import {
  generateSyntheticUsers,
  computeDailyMetrics,
  computeCohortRetention,
  computeBusinessMetrics,
  DailyMetric,
  CohortRetention,
  BusinessUser,
  BusinessMetrics,
} from '../data/syntheticBusinessData';

type TimeRange = '7d' | '30d' | '90d' | 'all';

interface Props {
  onBack: () => void;
  onViewChange: (view: AppView) => void;
}

/** Color palette matching NeuroPath theme */
const COLORS = {
  violet: '#8b5cf6',
  cyan: '#06b6d4',
  emerald: '#22c55e',
  amber: '#eab308',
  rose: '#f43f5e',
  zinc: '#71717a',
};

/** Dark card wrapper */
function Card({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className={`bg-zinc-900/80 backdrop-blur rounded-2xl border ${accent || 'border-zinc-800'} p-5`}>
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

/** Stat card with big number */
function StatCard({ label, value, unit, color, trend }: {
  label: string; value: string | number; unit?: string; color: string; trend?: 'up' | 'down' | 'neutral';
}) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-zinc-500';
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ color }}>{value}</span>
        {unit && <span className="text-sm text-zinc-500">{unit}</span>}
      </div>
      {trend && <span className={`text-xs ${trendColor} mt-1 block`}>{trendIcon} vs last period</span>}
    </div>
  );
}

/** Custom SVG Line Chart (from skill) */
function LineChart({ dates, values, label, color, height = 180 }: {
  dates: string[]; values: number[]; label: string; color: string; height?: number;
}) {
  if (!values || values.length === 0) return <div className="text-xs text-zinc-600 py-8 text-center">No data</div>;

  const maxVal = Math.max(...values) * 1.15 || 100;
  const minVal = Math.min(...values) * 0.85 > 0 ? Math.min(...values) * 0.85 : 0;
  const range = maxVal - minVal || 1;

  const W = 600;
  const H = height;
  const pad = { top: 20, bottom: 30, left: 50, right: 20 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const points = values.map((v, i) => {
    const x = pad.left + (i / Math.max(values.length - 1, 1)) * chartW;
    const y = pad.top + chartH - ((v - minVal) / range) * chartH;
    return { x, y, v };
  });

  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const fillD = `${pathD} L ${points[points.length - 1].x} ${H - pad.bottom} L ${points[0].x} ${H - pad.bottom} Z`;

  // Show only a subset of x labels
  const labelInterval = Math.max(1, Math.floor(dates.length / 8));

  return (
    <div className="w-full">
      <span className="text-xs font-semibold text-zinc-500 mb-2 block">{label}</span>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible">
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = pad.top + chartH * (1 - r);
          const v = minVal + range * r;
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <text x={pad.left - 6} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="monospace">
                {Math.round(v)}
              </text>
            </g>
          );
        })}
        {/* X labels */}
        {points.map((p, i) =>
          i % labelInterval === 0 ? (
            <text key={i} x={p.x} y={H - 6} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="monospace">
              {dates[i].slice(5)}
            </text>
          ) : null
        )}
        {/* Area */}
        <defs>
          <linearGradient id={`grad-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillD} fill={`url(#grad-${label.replace(/\s/g, '')})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#000" stroke={color} strokeWidth="1.5" />
            <title>{`${dates[i]}: ${p.v}`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Bar chart for cohort retention */
function CohortBarChart({ cohorts }: { cohorts: CohortRetention[] }) {
  if (!cohorts || cohorts.length === 0) return <div className="text-xs text-zinc-600 py-8 text-center">No cohort data</div>;

  // Show last 8 cohorts
  const recent = cohorts.slice(-8);
  const W = 500;
  const H = 200;
  const pad = { top: 20, bottom: 50, left: 60, right: 20 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const days = [7, 14, 30, 60, 90] as const;
  const dayColors = ['#8b5cf6', '#06b6d4', '#22c55e', '#eab308', '#f43f5e'];

  return (
    <div className="w-full">
      <span className="text-xs font-semibold text-zinc-500 mb-2 block">Cohort Retention (% of users still active)</span>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible">
        {/* Legend */}
        {days.map((d, i) => (
          <g key={d}>
            <rect x={W - 120 + i * 25} y="4" width="12" height="8" rx="2" fill={dayColors[i]} />
            <text x={W - 106 + i * 25} y="11" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="monospace">
              {d}d
            </text>
          </g>
        ))}
        {/* Grid */}
        {[0, 25, 50, 75, 100].map((pct, i) => {
          const y = pad.top + chartH * (1 - pct / 100);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <text x={pad.left - 6} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="monospace">
                {pct}%
              </text>
            </g>
          );
        })}
        {/* Bars */}
        {recent.map((cohort, ci) => {
          const barW = Math.max(6, (chartW / recent.length) * 0.15);
          const gap = (chartW / recent.length);
          const xBase = pad.left + ci * gap + gap * 0.15;
          return days.map((d, di) => {
            const retention = cohort[`day${d}` as keyof typeof cohort] as number;
            const pct = cohort.size > 0 ? (retention / cohort.size) * 100 : 0;
            if (retention < 0) return null; // cohort hasn't reached this age
            const barH = (pct / 100) * chartH;
            const y = pad.top + chartH - barH;
            return (
              <g key={`${ci}-${di}`}>
                <rect
                  x={xBase + di * (barW + 2)}
                  y={y}
                  width={barW}
                  height={barH}
                  rx="2"
                  fill={dayColors[di]}
                  opacity={0.8}
                />
                <title>{`${cohort.cohortDate} - ${d}d: ${pct.toFixed(0)}%`}</title>
              </g>
            );
          });
        })}
        {/* X labels */}
        {recent.map((cohort, i) => {
          const x = pad.left + i * (chartW / recent.length) + (chartW / recent.length) / 2;
          return (
            <text
              key={i}
              x={x}
              y={H - 8}
              textAnchor="end"
              transform={`rotate(-30, ${x}, ${H - 8})`}
              fill="rgba(255,255,255,0.35)"
              fontSize="7"
              fontFamily="monospace"
            >
              {cohort.cohortDate.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/** At-risk user table */
function AtRiskTable({ users }: { users: BusinessUser[] }) {
  const atRisk = users
    .filter(u => u.isActive)
    .sort((a, b) => {
      // Users with fewer recent activities are more at risk
      const aRecent = a.activityDates.filter(d => {
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14);
        return d >= cutoff;
      }).length;
      const bRecent = b.activityDates.filter(d => {
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14);
        return d >= cutoff;
      }).length;
      return aRecent - bRecent;
    })
    .slice(0, 8);

  if (atRisk.length === 0) return <div className="text-xs text-zinc-600 py-4 text-center">No at-risk users</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-zinc-500 border-b border-zinc-800">
            <th className="text-left py-2 pr-3">User</th>
            <th className="text-right py-2 pr-3">Sessions</th>
            <th className="text-right py-2 pr-3">HRV</th>
            <th className="text-right py-2">Last Active</th>
          </tr>
        </thead>
        <tbody>
          {atRisk.map(u => {
            const lastActive = u.activityDates.length > 0
              ? u.activityDates[u.activityDates.length - 1]
              : u.signupDate;
            const daysSince = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
            return (
              <tr key={u.id} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                <td className="py-2 pr-3">
                  <span className="mr-1">{u.avatar}</span>
                  <span className="text-zinc-300">{u.name}</span>
                </td>
                <td className="text-right py-2 pr-3 text-zinc-400">{u.sessionsCompleted}</td>
                <td className="text-right py-2 pr-3">
                  <span className={u.latestHrv > 30 ? 'text-emerald-400' : 'text-amber-400'}>{u.latestHrv}ms</span>
                </td>
                <td className="text-right py-2">
                  <span className={daysSince > 7 ? 'text-rose-400' : 'text-zinc-400'}>{daysSince}d ago</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const BusinessDashboard: React.FC<Props> = ({ onBack, onViewChange }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');

  const users = useMemo(() => generateSyntheticUsers(), []);
  const metrics = useMemo(() => computeBusinessMetrics(users), [users]);

  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 120;
  const dailyMetrics = useMemo(() => computeDailyMetrics(users, days), [users, days]);
  const cohorts = useMemo(() => computeCohortRetention(users), [users]);

  // Filter metrics to show only up to the selected range
  const filteredMetrics = dailyMetrics;

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-zinc-400">arrow_back</span>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Business Analytics</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Growth · Churn · Retention</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            {(['7d', '30d', '90d', 'all'] as TimeRange[]).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  timeRange === r
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>
          <button onClick={onBack} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm transition-colors">
            Back
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={metrics.totalUsers} color={COLORS.violet} />
          <StatCard
            label="Active Users"
            value={metrics.activeUsers}
            color={COLORS.emerald}
            trend={metrics.activeUsers > metrics.totalUsers * 0.5 ? 'up' : 'down'}
          />
          <StatCard
            label="Churn Rate"
            value={metrics.churnRate}
            unit="%"
            color={metrics.churnRate > 30 ? COLORS.rose : COLORS.amber}
            trend={metrics.churnRate > 30 ? 'down' : 'neutral'}
          />
          <StatCard
            label="Retention (30d)"
            value={metrics.retentionRate}
            unit="%"
            color={metrics.retentionRate > 60 ? COLORS.emerald : COLORS.amber}
            trend={metrics.retentionRate > 60 ? 'up' : 'down'}
          />
        </div>

        {/* Secondary stat row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="DAU/MAU" value={metrics.dauMauRatio} unit="%" color={COLORS.cyan} />
          <StatCard label="Avg Sessions/User" value={metrics.avgSessionsPerUser} color={COLORS.zinc} />
          <StatCard label="Churned Users" value={metrics.churnedUsers} color={COLORS.rose} />
        </div>

        {/* Growth Chart */}
        <Card title="User Growth" accent="border-violet-500/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LineChart
              dates={filteredMetrics.map(m => m.date)}
              values={filteredMetrics.map(m => m.cumulativeUsers)}
              label="Cumulative Users"
              color={COLORS.violet}
            />
            <LineChart
              dates={filteredMetrics.map(m => m.date)}
              values={filteredMetrics.map(m => m.newSignups)}
              label="New Signups (Daily)"
              color={COLORS.cyan}
            />
          </div>
        </Card>

        {/* Churn & Active Users */}
        <Card title="Churn & Active Users" accent="border-rose-500/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LineChart
              dates={filteredMetrics.map(m => m.date)}
              values={filteredMetrics.map(m => m.activeUsers)}
              label="Active Users"
              color={COLORS.emerald}
            />
            <LineChart
              dates={filteredMetrics.map(m => m.date)}
              values={filteredMetrics.map(m => m.churnRate)}
              label="Churn Rate (%)"
              color={COLORS.rose}
            />
          </div>
        </Card>

        {/* Cohort Retention */}
        <Card title="Cohort Retention" accent="border-cyan-500/30">
          <CohortBarChart cohorts={cohorts} />
        </Card>

        {/* At-risk Users */}
        <Card title="At-Risk Users (Lowest Engagement)" accent="border-amber-500/30">
          <AtRiskTable users={users} />
          <p className="text-xs text-zinc-600 mt-3">
            Based on recent activity frequency. Users with fewer than 2 sessions in the past 14 days are flagged.
          </p>
        </Card>

        {/* Data source note */}
        <div className="text-xs text-zinc-700 text-center py-2">
          Data source: Synthetic seed data (50 users) · Swap to live data by replacing <code className="text-zinc-500 bg-zinc-900 px-1 rounded">generateSyntheticUsers()</code>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;