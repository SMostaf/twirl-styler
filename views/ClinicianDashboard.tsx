import React, { useState, useEffect } from 'react';
import { UserProfile, NervousSystemState, BiometricLog, Intervention, Patient, computeNervousSystemState } from '../types';

interface Props {
  onSwitchToPatient: () => void;
}

// Preset clinical stats
const CLINIC_STATS = {
  activePatients: 4,
  avgHrv: 41, // ms
  regulationRate: 75, // % of sessions ending in ventral vagal
  alertsCount: 1, // Marcus Vance is in acute Sympathetic arousal
};

// Initial mock patients with fully detailed telemetry matching the research models
const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    name: 'Sarah Jenkins',
    icon: '🧘‍♀️',
    currentState: 'VENTRAL_VAGAL',
    vagalToneScore: 82,
    prescribedProtocolIds: ['coherent-breathing', 'body-scan-meditation'],
    biometrics: {
      timestamp: '16:45:12',
      heartRateVariabilitySDNN: 68,
      heartRate: 62,
      restingHeartRate: 58,
      respiratoryRate: 11,
      activeEnergyBurned: 380,
      stepCount: 8400,
      appleSleepingWristTemperature: 36.4,
      appleSleepingBreathingDisturbances: 1,
      sleepAnalysis: {
        sleepDuration: 7.8,
        sleepOnsetLatency: 14,
        waso: 12,
        sleepEfficiency: 93,
        deepSleepRatio: 22,
        remSleepRatio: 23,
        overnightHrvDelta: 14,
        restingHeartRateNadir: 55,
      },
      stressScore: 12,
    },
    historicalMetrics: {
      sevenDays: {
        dates: ['Jun 15', 'Jun 16', 'Jun 17', 'Jun 18', 'Jun 19', 'Jun 20', 'Jun 21'],
        hrv: [58, 62, 65, 60, 68, 72, 70],
        sleepDuration: [7.2, 7.5, 7.8, 8.0, 7.9, 8.1, 8.2],
        rhr: [62, 60, 59, 61, 58, 57, 56],
      },
      thirtyDays: {
        dates: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
        hrv: [52, 58, 63, 68],
        sleepDuration: [6.8, 7.2, 7.5, 7.9],
        rhr: [65, 62, 60, 58],
      },
      ninetyDays: {
        dates: ['Month 1', 'Month 2', 'Month 3'],
        hrv: [45, 56, 68],
        sleepDuration: [6.2, 7.1, 7.9],
        rhr: [69, 63, 58],
      },
    },
  },
  {
    id: 'pat-2',
    name: 'Marcus Vance',
    icon: '🏃‍♂️',
    currentState: 'SYMPATHETIC',
    vagalToneScore: 18,
    prescribedProtocolIds: ['physiological-sigh'],
    biometrics: {
      timestamp: '16:52:04',
      heartRateVariabilitySDNN: 18,
      heartRate: 98,
      restingHeartRate: 85,
      respiratoryRate: 21,
      activeEnergyBurned: 120,
      stepCount: 2900,
      appleSleepingWristTemperature: 36.8,
      appleSleepingBreathingDisturbances: 6,
      sleepAnalysis: {
        sleepDuration: 4.8,
        sleepOnsetLatency: 45,
        waso: 55,
        sleepEfficiency: 72,
        deepSleepRatio: 10,
        remSleepRatio: 12,
        overnightHrvDelta: 2,
        restingHeartRateNadir: 78,
      },
      stressScore: 84,
    },
    historicalMetrics: {
      sevenDays: {
        dates: ['Jun 15', 'Jun 16', 'Jun 17', 'Jun 18', 'Jun 19', 'Jun 20', 'Jun 21'],
        hrv: [24, 20, 18, 22, 19, 15, 18],
        sleepDuration: [5.2, 5.0, 4.8, 5.5, 4.9, 4.2, 4.8],
        rhr: [80, 82, 85, 83, 86, 88, 85],
      },
      thirtyDays: {
        dates: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
        hrv: [28, 25, 21, 18],
        sleepDuration: [5.8, 5.4, 5.1, 4.8],
        rhr: [75, 78, 82, 85],
      },
      ninetyDays: {
        dates: ['Month 1', 'Month 2', 'Month 3'],
        hrv: [32, 26, 18],
        sleepDuration: [6.1, 5.5, 4.8],
        rhr: [72, 79, 85],
      },
    },
  },
  {
    id: 'pat-3',
    name: 'Elena Rostova',
    icon: '🥀',
    currentState: 'DORSAL_VAGAL',
    vagalToneScore: 24,
    prescribedProtocolIds: ['dorsal-mobilization', 'grounding-5-4-3-2-1'],
    biometrics: {
      timestamp: '16:31:55',
      heartRateVariabilitySDNN: 28,
      heartRate: 51,
      restingHeartRate: 50,
      respiratoryRate: 9,
      activeEnergyBurned: 95,
      stepCount: 1400,
      appleSleepingWristTemperature: 36.1,
      appleSleepingBreathingDisturbances: 2,
      sleepAnalysis: {
        sleepDuration: 9.2,
        sleepOnsetLatency: 8,
        waso: 18,
        sleepEfficiency: 82,
        deepSleepRatio: 14,
        remSleepRatio: 11,
        overnightHrvDelta: 4,
        restingHeartRateNadir: 46,
      },
      stressScore: 68,
    },
    historicalMetrics: {
      sevenDays: {
        dates: ['Jun 15', 'Jun 16', 'Jun 17', 'Jun 18', 'Jun 19', 'Jun 20', 'Jun 21'],
        hrv: [26, 29, 28, 25, 27, 24, 28],
        sleepDuration: [9.0, 9.4, 9.2, 8.8, 9.5, 9.1, 9.2],
        rhr: [52, 51, 50, 52, 49, 50, 50],
      },
      thirtyDays: {
        dates: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
        hrv: [24, 25, 27, 28],
        sleepDuration: [8.5, 8.8, 9.1, 9.2],
        rhr: [55, 53, 51, 50],
      },
      ninetyDays: {
        dates: ['Month 1', 'Month 2', 'Month 3'],
        hrv: [20, 24, 28],
        sleepDuration: [7.8, 8.6, 9.2],
        rhr: [58, 53, 50],
      },
    },
  },
  {
    id: 'pat-4',
    name: 'David Kim',
    icon: '💼',
    currentState: 'SYMPATHETIC',
    vagalToneScore: 31,
    prescribedProtocolIds: ['coherent-breathing', 'box-breathing'],
    biometrics: {
      timestamp: '16:15:20',
      heartRateVariabilitySDNN: 25,
      heartRate: 88,
      restingHeartRate: 78,
      respiratoryRate: 17,
      activeEnergyBurned: 210,
      stepCount: 4200,
      appleSleepingWristTemperature: 36.6,
      appleSleepingBreathingDisturbances: 4,
      sleepAnalysis: {
        sleepDuration: 5.8,
        sleepOnsetLatency: 28,
        waso: 35,
        sleepEfficiency: 81,
        deepSleepRatio: 13,
        remSleepRatio: 16,
        overnightHrvDelta: 5,
        restingHeartRateNadir: 68,
      },
      stressScore: 54,
    },
    historicalMetrics: {
      sevenDays: {
        dates: ['Jun 15', 'Jun 16', 'Jun 17', 'Jun 18', 'Jun 19', 'Jun 20', 'Jun 21'],
        hrv: [21, 23, 19, 22, 20, 18, 25],
        sleepDuration: [5.5, 5.8, 5.2, 5.0, 5.3, 4.9, 5.8],
        rhr: [78, 80, 82, 79, 81, 83, 78],
      },
      thirtyDays: {
        dates: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
        hrv: [18, 20, 22, 25],
        sleepDuration: [4.9, 5.2, 5.4, 5.8],
        rhr: [84, 82, 80, 78],
      },
      ninetyDays: {
        dates: ['Month 1', 'Month 2', 'Month 3'],
        hrv: [15, 20, 25],
        sleepDuration: [4.5, 5.1, 5.8],
        rhr: [88, 83, 78],
      },
    },
  },
];

const ClinicianDashboard: React.FC<Props> = ({ onSwitchToPatient }) => {
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat-1');
  const [timeline, setTimeline] = useState<'7' | '30' | '90'>('7');
  const [selectedMetric, setSelectedMetric] = useState<'hrv' | 'sleep' | 'rhr'>('hrv');
  const [searchTerm, setSearchTerm] = useState('');
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [prescribeSuccess, setPrescribeSuccess] = useState<string | null>(null);

  // Fetch standard intervention library
  useEffect(() => {
    fetch('/interventions.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch JSON library');
        return res.json();
      })
      .then((data: any) => {
        if (Array.isArray(data)) {
          setInterventions(data);
        } else if (data && Array.isArray(data.categories)) {
          // Flatten researcher categories
          const flattened: Intervention[] = [];
          data.categories.forEach((cat: any) => {
            if (Array.isArray(cat.interventions)) {
              cat.interventions.forEach((item: any) => {
                flattened.push({
                  id: item.id,
                  title: item.name || item.title,
                  type: (cat.id === 'cognitive-behavioral' ? 'cognitive' : cat.id) as any,
                  duration: typeof item.duration === 'string' ? item.duration : (item.instructions?.duration?.recommended || item.instructions?.duration?.minimum || '5 min'),
                  description: item.biologicalMechanism || item.description || '',
                  steps: item.instructions?.steps || item.steps || [],
                  scienceDescription: item.scienceDescription || `Evidence Level: ${item.evidenceLevel || 'moderate'}. Mechanism: ${item.biologicalMechanism || ''}`,
                });
              });
            }
          });
          setInterventions(flattened);
        }
      })
      .catch((err) => {
        console.warn('Clinician Portal: using custom fallback protocols:', err);
        // Fallback standard items if JSON isn't fully loaded
        const fallbackList: Intervention[] = [
          {
            id: 'coherent-breathing',
            title: 'Resonant Coherent Breathing',
            type: 'breathwork',
            duration: '10 min',
            description: 'Breathe at a rate of 5.5 to 6 breaths per minute to maximize heart rate variability.',
            steps: ['Inhale 5s', 'Exhale 5s', 'No pauses'],
            scienceDescription: 'Engages RSA and baroreflex system. Optimizes vagal tone.',
          },
          {
            id: 'physiological-sigh',
            title: 'The Physiological Sigh',
            type: 'breathwork',
            duration: '2 min',
            description: 'Double inhale through nose, followed by extended sigh.',
            steps: ['Inhale fully', 'Sharp second inhale', 'Extended exhale sigh'],
            scienceDescription: 'Collapsed alveoli reinflation, immediate parasympathetic shift.',
          },
          {
            id: 'dorsal-mobilization',
            title: 'Somatic Orienting & Freeze Mobilization',
            type: 'somatic',
            duration: '4 min',
            description: 'Cue safety to brainstem to lift dorsal vagal shutdown.',
            steps: ['Scan room for 3 blue objects', 'Rub hands and press to cheeks', 'Firm self-hug'],
            scienceDescription: 'Engages orienting networks, gentle safety activation.',
          },
          {
            id: 'grounding-5-4-3-2-1',
            title: '5-4-3-2-1 Sensory Grounding',
            type: 'somatic',
            duration: '3 min',
            description: 'Trauma-informed present-moment sensory anchoring.',
            steps: ['5 things you see', '4 things you touch', '3 things you hear', '2 smell', '1 taste'],
            scienceDescription: 'Enlists mammalian orienting circuits via superior colliculus.',
          },
          {
            id: 'body-scan-meditation',
            title: 'Mindfulness Body Scan',
            type: 'somatic',
            duration: '15 min',
            description: 'Interoceptive training that builds body safety.',
            steps: ['Focus on feet', 'Scan slowly up to knees', 'Move chest and face'],
            scienceDescription: 'Activates insula and anterior cingulate networks.',
          },
          {
            id: 'box-breathing',
            title: 'Box Breathing (Tactical)',
            type: 'breathwork',
            duration: '4 min',
            description: 'Predictable rhythmic breathing used by high-performance teams.',
            steps: ['Inhale 4s', 'Hold 4s', 'Exhale 4s', 'Hold empty 4s'],
            scienceDescription: 'Modulates adrenaline, cognitive anchoring.',
          }
        ];
        setInterventions(fallbackList);
      });
  }, []);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrescribe = (protocolId: string) => {
    if (selectedPatient.prescribedProtocolIds.includes(protocolId)) return;

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === selectedPatientId) {
          return {
            ...p,
            prescribedProtocolIds: [...p.prescribedProtocolIds, protocolId],
          };
        }
        return p;
      })
    );

    const protocol = interventions.find((i) => i.id === protocolId);
    setPrescribeSuccess(`Successfully prescribed "${protocol?.title || protocolId}"`);
    setTimeout(() => setPrescribeSuccess(null), 3000);
  };

  const handleRemovePrescription = (protocolId: string) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === selectedPatientId) {
          return {
            ...p,
            prescribedProtocolIds: p.prescribedProtocolIds.filter((id) => id !== protocolId),
          };
        }
        return p;
      })
    );
  };

  // Helper to resolve colors based on state
  const getStateColor = (state: NervousSystemState) => {
    if (state === 'VENTRAL_VAGAL') return 'emerald';
    if (state === 'SYMPATHETIC') return 'rose';
    return 'cyan';
  };

  const getStateText = (state: NervousSystemState) => {
    if (state === 'VENTRAL_VAGAL') return 'Ventral Vagal (Safe & Connected)';
    if (state === 'SYMPATHETIC') return 'Sympathetic (Fight/Flight)';
    return 'Dorsal Vagal (Freeze/Shut-down)';
  };

  // SVG Chart Plotter
  const renderTrendChart = () => {
    let dataset: number[] = [];
    let labels: string[] = [];
    let titleText = '';
    let colorHex = '#10b981'; // Default emerald

    const metricGroup =
      timeline === '7'
        ? selectedPatient.historicalMetrics.sevenDays
        : timeline === '30'
        ? selectedPatient.historicalMetrics.thirtyDays
        : selectedPatient.historicalMetrics.ninetyDays;

    labels = metricGroup.dates;

    if (selectedMetric === 'hrv') {
      dataset = metricGroup.hrv;
      titleText = 'Heart Rate Variability Trend (SDNN ms)';
      colorHex =
        selectedPatient.currentState === 'VENTRAL_VAGAL'
          ? '#10b981'
          : selectedPatient.currentState === 'SYMPATHETIC'
          ? '#f43f5e'
          : '#06b6d4';
    } else if (selectedMetric === 'sleep') {
      dataset = metricGroup.sleepDuration;
      titleText = 'Overnight Sleep Duration (Hours)';
      colorHex = '#a78bfa'; // violet
    } else {
      dataset = metricGroup.rhr;
      titleText = 'Resting Heart Rate (RHR bpm)';
      colorHex = '#fb923c'; // orange
    }

    if (dataset.length === 0) return null;

    const maxVal = Math.max(...dataset) * 1.2 || 100;
    const minVal = Math.min(...dataset) * 0.8 > 0 ? Math.min(...dataset) * 0.8 : 0;
    const range = maxVal - minVal;

    // Chart dimensions
    const width = 500;
    const height = 150;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 15;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Convert values to SVG coordinate points
    const points = dataset.map((val, idx) => {
      const x = paddingLeft + (idx / (dataset.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((val - minVal) / range) * chartHeight;
      return { x, y, val };
    });

    const pathD = points.reduce(
      (acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
      ''
    );

    const fillD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

    return (
      <div className="bg-neutral-950/70 border border-white/10 rounded-xl p-4 mt-3">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-neutral-300">{titleText}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/5 text-neutral-400">
            {timeline === '7' ? '7-Day View' : timeline === '30' ? '30-Day Trend' : '90-Day Progress'}
          </span>
        </div>
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingTop + chartHeight * ratio;
              const value = maxVal - ratio * range;
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="rgba(255,255,255,0.05)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="rgba(255,255,255,0.4)"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {Math.round(value)}
                  </text>
                </g>
              );
            })}

            {/* X Axis Labels */}
            {points.map((p, idx) => (
              <text
                key={idx}
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
                fontSize="9"
              >
                {labels[idx]}
              </text>
            ))}

            {/* Area Fill under the line */}
            <path d={fillD} fill={`url(#gradient-${selectedMetric})`} />

            {/* Core Line Path */}
            <path d={pathD} fill="none" stroke={colorHex} strokeWidth="2.5" strokeLinecap="round" />

            {/* Interactive Data Dots */}
            {points.map((p, idx) => (
              <g key={idx} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="4" fill="#000" stroke={colorHex} strokeWidth="2" />
                <circle cx={p.x} cy={p.y} r="8" fill={colorHex} opacity="0" className="hover:opacity-20 transition" />
                <title>{`${labels[idx]}: ${p.val}${selectedMetric === 'hrv' ? ' ms' : selectedMetric === 'sleep' ? ' hrs' : ' bpm'}`}</title>
              </g>
            ))}

            {/* SVG Gradients definitions */}
            <defs>
              <linearGradient id={`gradient-hrv`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorHex} stopOpacity="0.3" />
                <stop offset="100%" stopColor={colorHex} stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`gradient-sleep`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`gradient-rhr`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb923c" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full bg-black flex flex-col p-6 overflow-y-auto">
      {/* Clinician Portal Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              B2B SaaS Portal
            </span>
            <span className="text-xs font-medium text-neutral-500">v1.1</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">NeuroPath Clinician Portal</h1>
          <p className="text-sm text-neutral-400">Continuous Autonomic Intelligence & Clinical Intervention Engine</p>
        </div>
        <button
          onClick={onSwitchToPatient}
          className="px-4 py-2 bg-neutral-900 border border-white/10 text-neutral-300 rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-all flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
        >
          <span>←</span> Switch to Patient App
        </button>
      </div>

      {/* Clinic Performance / KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-neutral-500 tracking-wider uppercase">Active Monitoring</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-white">{CLINIC_STATS.activePatients}</span>
            <span className="text-xs text-neutral-400">Patients</span>
          </div>
        </div>
        <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-neutral-500 tracking-wider uppercase">Average Clinic HRV</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-emerald-400">{CLINIC_STATS.avgHrv} ms</span>
            <span className="text-xs text-neutral-400">SDNN</span>
          </div>
        </div>
        <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-neutral-500 tracking-wider uppercase">90d Regulation Recovery</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-indigo-400">{CLINIC_STATS.regulationRate}%</span>
            <span className="text-xs text-neutral-400">Efficacy Target</span>
          </div>
        </div>
        <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-neutral-500 tracking-wider uppercase">Arousal Flags</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-rose-500">{CLINIC_STATS.alertsCount}</span>
            <span className="text-xs text-rose-400/80 font-medium">Acute alert</span>
          </div>
        </div>
      </div>

      {/* Double Pane Clinical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Patient Directory */}
        <div className="lg:col-span-4 bg-neutral-950 border border-white/10 rounded-2xl p-4 flex flex-col h-[650px]">
          <div className="mb-4">
            <h2 className="text-base font-bold text-neutral-200">Patient Directory</h2>
            <div className="relative mt-2">
              <input
                type="text"
                placeholder="Search patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-900/60 border border-white/10 hover:border-white/25 focus:border-white/50 rounded-xl px-3 py-2 text-xs focus:outline-none transition-all text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredPatients.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-6">No patients found</p>
            ) : (
              filteredPatients.map((pat) => {
                const cColor = getStateColor(pat.currentState);
                const isSelected = pat.id === selectedPatientId;
                const isSympAlert = pat.currentState === 'SYMPATHETIC' && pat.biometrics.stressScore > 80;

                return (
                  <button
                    key={pat.id}
                    onClick={() => setSelectedPatientId(pat.id)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all border flex flex-col relative overflow-hidden ${
                      isSelected
                        ? `bg-neutral-900 border-${cColor}-500/40 shadow-[0_0_15px_rgba(255,255,255,0.02)]`
                        : 'bg-neutral-900/30 border-white/5 hover:bg-neutral-900/60 hover:border-white/10'
                    }`}
                  >
                    {/* Pulsing state aura indicator on active card */}
                    {isSelected && (
                      <span className={`absolute right-0 top-0 bottom-0 w-1 bg-${cColor}-500`} />
                    )}

                    <div className="flex justify-between items-start w-full">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{pat.icon}</span>
                        <div>
                          <span className="text-sm font-bold text-white flex items-center gap-1.5">
                            {pat.name}
                            {isSympAlert && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Stress alert!" />
                            )}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider text-${cColor}-400 mt-0.5 block`}>
                            {pat.currentState.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono text-neutral-400">Vagal Tone</span>
                        <div className={`text-sm font-black font-mono text-${cColor}-400`}>
                          {pat.vagalToneScore}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3.5 border-t border-white/5 pt-2.5 text-center">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-neutral-500 tracking-wider uppercase">HRV</span>
                        <span className="text-xs font-mono font-semibold text-neutral-300">
                          {pat.biometrics.heartRateVariabilitySDNN} ms
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-neutral-500 tracking-wider uppercase">Rest HR</span>
                        <span className="text-xs font-mono font-semibold text-neutral-300">
                          {pat.biometrics.restingHeartRate} bpm
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-neutral-500 tracking-wider uppercase">Sleep Eff</span>
                        <span className="text-xs font-mono font-semibold text-neutral-300">
                          {pat.biometrics.sleepAnalysis.sleepEfficiency}%
                        </span>
                      </div>
                    </div>

                    {isSympAlert && (
                      <div className="mt-2.5 px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded-md text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                        ⚠️ High Stress Alert: Sympathetic Spike Detected
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Detailed Diagnostic View & Prescription Panel */}
        <div className="lg:col-span-8 space-y-6">
          {/* Detailed Patient Biometric Header */}
          <div className="bg-neutral-950 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-48 h-48 bg-${getStateColor(selectedPatient.currentState)}-500/5 blur-[80px] rounded-full`} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl bg-neutral-900 border border-white/10 p-2.5 rounded-2xl shadow-inner">
                  {selectedPatient.icon}
                </span>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedPatient.name}</h2>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-${getStateColor(selectedPatient.currentState)}-400 mt-1`}>
                    <span className={`w-2 h-2 rounded-full bg-${getStateColor(selectedPatient.currentState)}-500 animate-ping`} />
                    {getStateText(selectedPatient.currentState)}
                  </span>
                </div>
              </div>
              <div className="text-left md:text-right bg-neutral-900/60 border border-white/5 rounded-xl px-4 py-2 flex items-center md:flex-col gap-4 md:gap-0 justify-between">
                <span className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase">System Calm Index</span>
                <span className={`text-2xl font-black font-mono text-${getStateColor(selectedPatient.currentState)}-400 mt-0.5`}>
                  {selectedPatient.vagalToneScore}/100
                </span>
              </div>
            </div>

            {/* Digital Twin SVG Aura and Telemetry stats */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Pulse / Twin visualizer panel */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-neutral-900/30 border border-white/5 rounded-xl text-center">
                <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-3">Autonomic Digital Twin</span>
                <div className="relative flex items-center justify-center h-28 w-28">
                  {/* Outer pulse wave */}
                  <div className={`absolute inset-0 rounded-full bg-${getStateColor(selectedPatient.currentState)}-500/10 animate-ping`} style={{ animationDuration: selectedPatient.currentState === 'SYMPATHETIC' ? '1s' : selectedPatient.currentState === 'VENTRAL_VAGAL' ? '2.5s' : '4s' }} />
                  {/* Central glowing core */}
                  <div className={`absolute h-16 w-16 rounded-full bg-${getStateColor(selectedPatient.currentState)}-500/20 border border-${getStateColor(selectedPatient.currentState)}-500/40 blur-md`} />
                  <svg viewBox="0 0 24 24" fill="currentColor" className={`h-10 w-10 text-${getStateColor(selectedPatient.currentState)}-400 relative z-10 animate-pulse`} style={{ animationDuration: selectedPatient.currentState === 'SYMPATHETIC' ? '0.6s' : selectedPatient.currentState === 'VENTRAL_VAGAL' ? '1.5s' : '3s' }}>
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                </div>
                <span className="text-xs text-neutral-300 font-medium mt-3">
                  Heart Rate: {selectedPatient.biometrics.heartRate} bpm
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5">
                  Respiration: {selectedPatient.biometrics.respiratoryRate} bpm
                </span>
              </div>

              {/* Specific clinical observations */}
              <div className="md:col-span-7 space-y-3.5">
                <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">Clinical Diagnostic Insights</span>
                <div className="space-y-2">
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/5 text-xs text-neutral-300 leading-relaxed">
                    {selectedPatient.currentState === 'VENTRAL_VAGAL' && (
                      <p>
                        <strong>Patient exhibits a resilient autonomic state.</strong> HRV SDNN of {selectedPatient.biometrics.heartRateVariabilitySDNN}ms indicates solid parasympathetic buffer. Sleep architecture is consolidated with high efficiency ({selectedPatient.biometrics.sleepAnalysis.sleepEfficiency}%). Focus on maintaining baseline with resonant exercises.
                      </p>
                    )}
                    {selectedPatient.currentState === 'SYMPATHETIC' && (
                      <p>
                        <strong>Significant sympathetic arousal detected.</strong> Elevated heart rate ({selectedPatient.biometrics.heartRate} bpm) paired with depressed HRV ({selectedPatient.biometrics.heartRateVariabilitySDNN}ms) points to prefrontal/vagal brake withdrawal. Sleep onset is delayed ({selectedPatient.biometrics.sleepAnalysis.sleepOnsetLatency}m SOL). Immediate parasympathetic off-ramps (Physiological Sigh, Coherent Breathing) recommended.
                      </p>
                    )}
                    {selectedPatient.currentState === 'DORSAL_VAGAL' && (
                      <p>
                        <strong>System shows clear metabolic conservation / freeze markers.</strong> Supressed respiration ({selectedPatient.biometrics.respiratoryRate} bpm) and low heart rate ({selectedPatient.biometrics.heartRate} bpm) signify dorsal vagal dominance. High total sleep duration ({selectedPatient.biometrics.sleepAnalysis.sleepDuration} hrs) but poor sleep restoration delta points to chronic distress. Gentle somatic orienting is required before attempting deep breathing.
                      </p>
                    )}
                  </div>

                  {/* Diagnostic details grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-neutral-900/50 p-2 border border-white/5 rounded">
                      <span className="text-[9px] text-neutral-500 uppercase block">Overnight HRV Delta</span>
                      <span className="font-mono font-bold text-neutral-300">
                        {selectedPatient.biometrics.sleepAnalysis.overnightHrvDelta > 0 ? `+${selectedPatient.biometrics.sleepAnalysis.overnightHrvDelta}` : selectedPatient.biometrics.sleepAnalysis.overnightHrvDelta} ms
                      </span>
                    </div>
                    <div className="bg-neutral-900/50 p-2 border border-white/5 rounded">
                      <span className="text-[9px] text-neutral-500 uppercase block">Sleep WASO (Wake Periods)</span>
                      <span className="font-mono font-bold text-neutral-300">
                        {selectedPatient.biometrics.sleepAnalysis.waso} minutes
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Trends Panel */}
          <div className="bg-neutral-950 border border-white/10 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Biometric Trend Analytics</h3>
                <p className="text-xs text-neutral-400">Evaluate chronic recovery metrics & regulation trajectory</p>
              </div>

              {/* Metric and Timeline Tabs */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="flex bg-neutral-900 p-0.5 rounded-lg border border-white/5 text-xs">
                  <button
                    onClick={() => setSelectedMetric('hrv')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      selectedMetric === 'hrv' ? 'bg-white/10 text-white font-bold' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    HRV
                  </button>
                  <button
                    onClick={() => setSelectedMetric('sleep')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      selectedMetric === 'sleep' ? 'bg-white/10 text-white font-bold' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Sleep
                  </button>
                  <button
                    onClick={() => setSelectedMetric('rhr')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      selectedMetric === 'rhr' ? 'bg-white/10 text-white font-bold' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    RHR
                  </button>
                </div>

                <div className="flex bg-neutral-900 p-0.5 rounded-lg border border-white/5 text-xs">
                  <button
                    onClick={() => setTimeline('7')}
                    className={`px-2 py-1 rounded-md font-medium transition-all ${
                      timeline === '7' ? 'bg-white/10 text-white font-bold' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    7d
                  </button>
                  <button
                    onClick={() => setTimeline('30')}
                    className={`px-2 py-1 rounded-md font-medium transition-all ${
                      timeline === '30' ? 'bg-white/10 text-white font-bold' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    30d
                  </button>
                  <button
                    onClick={() => setTimeline('90')}
                    className={`px-2 py-1 rounded-md font-medium transition-all ${
                      timeline === '90' ? 'bg-white/10 text-white font-bold' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    90d
                  </button>
                </div>
              </div>
            </div>

            {/* Custom SVG Line Chart */}
            {renderTrendChart()}
          </div>

          {/* Somatic Prescription Control Panel */}
          <div className="bg-neutral-950 border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white">Clinical Somatic Prescriptions</h3>
            <p className="text-xs text-neutral-400 mb-4">Prescribe evidence-based breathing & vagal stabilization protocols</p>

            {/* Prescribe success toast style banner */}
            {prescribeSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl px-4 py-3 text-xs font-semibold mb-4 animate-fade-in flex items-center justify-between">
                <span>{prescribeSuccess}</span>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-white">Active</span>
              </div>
            )}

            {/* Existing Prescribed Protocols */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase block mb-2.5">Currently Prescribed</span>
              <div className="flex flex-wrap gap-2">
                {selectedPatient.prescribedProtocolIds.length === 0 ? (
                  <span className="text-xs text-neutral-500 italic">No protocols currently prescribed to this patient.</span>
                ) : (
                  selectedPatient.prescribedProtocolIds.map((protoId) => {
                    const protocol = interventions.find((i) => i.id === protoId);
                    return (
                      <div
                        key={protoId}
                        className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-bold text-neutral-200">{protocol?.title || protoId}</span>
                          <span className="text-[10px] text-neutral-500 block">Duration: {protocol?.duration || '5 min'}</span>
                        </div>
                        <button
                          onClick={() => handleRemovePrescription(protoId)}
                          className="text-neutral-500 hover:text-rose-400 transition"
                          title="Remove prescription"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Protocol Library selector for Clinicians */}
            <span className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase block mb-3">Protocol Library (INTERVENTIONS.json)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
              {interventions.map((item) => {
                const isPrescribed = selectedPatient.prescribedProtocolIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-neutral-900/40 border border-white/5 hover:border-white/10 rounded-xl p-3.5 flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-bold text-xs text-white leading-tight">{item.title}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/5">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed mb-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-auto border-t border-white/5 pt-2.5">
                      <span className="text-[10px] font-mono text-neutral-500">{item.duration}</span>
                      <button
                        onClick={() => handlePrescribe(item.id)}
                        disabled={isPrescribed}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                          isPrescribed
                            ? 'bg-neutral-900 border border-white/5 text-neutral-500 cursor-not-allowed'
                            : 'bg-white text-black hover:bg-neutral-200'
                        }`}
                      >
                        {isPrescribed ? 'Prescribed' : 'Prescribe'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicianDashboard;