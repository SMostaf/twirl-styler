import React, { useState, useEffect, useRef } from 'react';
import { runValidation, validationSummary, computeThreeR, computeIes, computeRes } from '../kpi';
import type { ValidationResult } from '../kpi';
import type { AppView } from '../types';

interface Props {
  onBack: () => void;
  onViewChange: (view: AppView) => void;
}

/** Dark-themed card */
function Card({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  const borderColor = accent || 'border-zinc-800';
  return (
    <div className={`bg-zinc-900/80 backdrop-blur rounded-2xl border ${borderColor} p-5`}>
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

/** KPI Gauge visualization */
function Gauge({ label, value, unit, max, interpretation, color }: {
  label: string;
  value: number;
  unit: string;
  max?: number;
  interpretation?: string;
  color?: string;
}) {
  const pct = max ? Math.min(100, (value / max) * 100) : Math.min(100, Math.max(0, value));
  const barColor = color || (pct > 66 ? '#22c55e' : pct > 33 ? '#eab308' : '#ef4444');

  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm text-zinc-300">{label}</span>
        <span className="text-lg font-bold text-white">{value}{unit}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      {interpretation && <span className="text-xs text-zinc-500 mt-0.5 block">{interpretation}</span>}
    </div>
  );
}

const KpiDashboard: React.FC<Props> = ({ onBack, onViewChange }) => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [demoMode, setDemoMode] = useState<'3R' | 'IES' | 'RES'>('3R');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const results = runValidation();
    setValidationResults(results);
  }, []);

  // Compute aggregate stats
  const avg3R = validationResults.length > 0
    ? validationResults.reduce((s, r) => s + r.threeR.computedMonthlySlope, 0) / validationResults.length
    : 0;
  const avgIES = validationResults.length > 0
    ? validationResults.reduce((s, r) => s + r.ies.computed, 0) / validationResults.length
    : 0;
  const avgCHURN = validationResults.length > 0
    ? validationResults.reduce((s, r) => s + r.res.computedChurnRisk, 0) / validationResults.length
    : 0;
  const passedCount = validationResults.filter(r => r.threeR.passed && r.res.passed && r.ies.passed).length;

  // Draw trend chart for selected demo mode
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || validationResults.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width = canvas.clientWidth * 2;
    const H = canvas.height = 300 * 2;
    ctx.scale(1, 1);
    ctx.clearRect(0, 0, W, H);

    const pad = { top: 40, bottom: 50, left: 60, right: 40 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    // Determine values to plot
    let values: number[];
    let label: string;
    let unit: string;
    if (demoMode === '3R') {
      values = validationResults.map(r => r.threeR.computedMonthlySlope);
      label = '3R (ms/month)';
      unit = 'ms/mo';
    } else if (demoMode === 'IES') {
      values = validationResults.map(r => r.ies.computed);
      label = 'IES (%)';
      unit = '%';
    } else {
      values = validationResults.map(r => r.res.computedChurnRisk * 100);
      label = 'Churn Risk (%)';
      unit = '%';
    }

    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;

    // Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
      const val = maxVal - (range * i) / 4;
      ctx.fillStyle = '#71717a';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(1), pad.left - 8, y + 4);
    }

    // Labels
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    validationResults.forEach((r, i) => {
      const x = pad.left + (chartW * (i + 0.5)) / validationResults.length;
      ctx.fillText(r.profileId, x, H - pad.bottom + 20);
    });

    // Axes label
    ctx.fillStyle = '#71717a';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, W / 2, H - 5);

    // Bars
    values.forEach((v, i) => {
      const barW = Math.max(8, (chartW / validationResults.length) * 0.6);
      const x = pad.left + (chartW * (i + 0.5)) / validationResults.length - barW / 2;
      const barH = ((v - minVal) / range) * chartH;
      const y = pad.top + chartH - barH;

      const gradient = ctx.createLinearGradient(x, y, x, pad.top + chartH);
      gradient.addColorStop(0, '#8b5cf6');
      gradient.addColorStop(1, '#06b6d4');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();
    });

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Synthetic Validation — ${label}`, pad.left, 22);

  }, [validationResults, demoMode]);

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-zinc-400">arrow_back</span>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">KPI Engine Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{validationResults.length} synthetic profiles · {passedCount}/{validationResults.length} passed</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={onBack} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm transition-colors">Back to Dashboard</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Regulation Recovery Rate (3R)" accent="border-violet-500/30">
            <div className="text-3xl font-bold text-violet-400">{avg3R.toFixed(1)} <span className="text-sm text-zinc-500 font-normal">ms/month</span></div>
            <p className="text-xs text-zinc-500 mt-1">Avg slope across all profiles</p>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="px-2 py-0.5 bg-violet-900/50 text-violet-300 rounded-full">{validationResults.filter(r => r.threeR.passed).length} passed</span>
            </div>
          </Card>

          <Card title="Intervention Efficacy Score (IES)" accent="border-cyan-500/30">
            <div className="text-3xl font-bold text-cyan-400">{avgIES.toFixed(1)} <span className="text-sm text-zinc-500 font-normal">%</span></div>
            <p className="text-xs text-zinc-500 mt-1">Avg sessions with ΔSDNN ≥ +5ms</p>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="px-2 py-0.5 bg-cyan-900/50 text-cyan-300 rounded-full">{validationResults.filter(r => r.ies.interpretation === 'excellent' || r.ies.interpretation === 'good').length} effective</span>
            </div>
          </Card>

          <Card title="Churn Risk (RES Component)" accent="border-amber-500/30">
            <div className="text-3xl font-bold text-amber-400">{(avgCHURN * 100).toFixed(0)}<span className="text-sm text-zinc-500 font-normal">%</span></div>
            <p className="text-xs text-zinc-500 mt-1">Avg logistic churn probability</p>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="px-2 py-0.5 bg-amber-900/50 text-amber-300 rounded-full">{validationResults.filter(r => r.res.computedChurnRisk > 0.5).length} at risk</span>
            </div>
          </Card>
        </div>

        {/* Trend Chart */}
        <Card title="Synthetic Validation — Bar Chart">
          <div className="flex gap-2 mb-4">
            {(['3R', 'IES', 'RES'] as const).map(m => (
              <button
                key={m}
                onClick={() => setDemoMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  demoMode === m
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {m === '3R' ? '3R (ms/mo)' : m === 'IES' ? 'IES (%)' : 'Churn Risk (%)'}
              </button>
            ))}
          </div>
          <canvas ref={canvasRef} className="w-full h-[300px] rounded-xl" style={{ background: '#09090b' }} />
        </Card>

        {/* Per-Profile Breakdown */}
        <Card title="Per-Profile Validation Results">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left py-2 pr-4">Profile</th>
                  <th className="text-right py-2 pr-4">3R (ms/mo)</th>
                  <th className="text-right py-2 pr-4">IES (%)</th>
                  <th className="text-right py-2 pr-4">Churn</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {validationResults.map(r => (
                  <tr key={r.profileId} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                    <td className="py-2 pr-4">
                      <span className="text-zinc-400 text-xs font-mono">{r.profileId}</span>
                      <span className="text-zinc-300 ml-2">{r.profileAlias.slice(0, 40)}</span>
                    </td>
                    <td className={`text-right py-2 pr-4 font-mono ${r.threeR.computedMonthlySlope > 3 ? 'text-green-400' : r.threeR.computedMonthlySlope > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {r.threeR.computedMonthlySlope.toFixed(1)}
                    </td>
                    <td className="text-right py-2 pr-4 font-mono text-cyan-400">
                      {r.ies.computed.toFixed(0)}
                    </td>
                    <td className="text-right py-2 pr-4 font-mono text-amber-400">
                      {(r.res.computedChurnRisk * 100).toFixed(0)}%
                    </td>
                    <td className="text-center py-2">
                      {r.threeR.passed && r.res.passed && r.ies.passed
                        ? <span className="text-green-400 text-xs">✅ Pass</span>
                        : <span className="text-red-400 text-xs">⚠️ Fail</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-600 mt-3">{validationSummary()}</p>
        </Card>

        {/* Quick Stats */}
        <Card title="Validation Summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-zinc-900 rounded-xl">
              <div className="text-2xl font-bold text-violet-400">{validationResults.length}</div>
              <div className="text-xs text-zinc-500">Profiles Tested</div>
            </div>
            <div className="text-center p-3 bg-zinc-900 rounded-xl">
              <div className="text-2xl font-bold text-green-400">{passedCount}</div>
              <div className="text-xs text-zinc-500">All KPIs Passed</div>
            </div>
            <div className="text-center p-3 bg-zinc-900 rounded-xl">
              <div className="text-2xl font-bold text-cyan-400">{validationResults.filter(r => r.ies.computed >= 40).length}</div>
              <div className="text-xs text-zinc-500">IES ≥ 40%</div>
            </div>
            <div className="text-center p-3 bg-zinc-900 rounded-xl">
              <div className="text-2xl font-bold text-amber-400">{validationResults.filter(r => r.res.computedChurnRisk <= 0.5).length}</div>
              <div className="text-xs text-zinc-500">Low Churn Risk</div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default KpiDashboard;