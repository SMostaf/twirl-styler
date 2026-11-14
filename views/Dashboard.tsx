import React, { useState, useEffect, useRef } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { AppView, UserProfile, NervousSystemState, BiometricLog, Intervention, computeNervousSystemState } from '../types';
import { generateNeuroIntervention, generateCoachMessage } from '../geminiService';

/** Sign-out button shown when Clerk is configured */
function SignOutButton() {
  const clerk = useClerk();
  // Only render if Clerk is actually initialized (publishable key present)
  if (!clerk || !clerk.client) return null;
  return (
    <button 
      onClick={() => clerk.signOut()}
      className="flex items-center justify-center p-2 rounded-lg bg-white border border-stone-300 text-rose-600/40 hover:text-rose-600 hover:border-rose-200/80 transition-colors"
      title="Sign out"
    >
      <span className="material-symbols-outlined text-sm">logout</span>
    </button>
  );
}

interface Props {
  user: UserProfile;
  onReset: () => void;
  onViewChange: (view: AppView) => void;
}

// Preset interventions as static fallback if interventions.json cannot be fetched
const FALLBACK_INTERVENTIONS: Record<NervousSystemState, Intervention> = {
  VENTRAL_VAGAL: {
    id: 'coherent-breathing',
    title: 'Resonant Coherent Breathing',
    type: 'breathwork',
    duration: '10 min',
    description: 'Breathe at a rate of 5.5 to 6 breaths per minute to maximize heart rate variability and optimize autonomic nervous system balance.',
    steps: [
      'Sit in an upright, relaxed posture with your spine straight and feet flat on the floor.',
      'Inhale gently through your nose for 5.0 seconds, letting your abdomen expand naturally.',
      'Without pausing, exhale slowly and smoothly through your mouth or nose for 5.0 seconds.',
      'Maintain this continuous, rhythmic cycle for the duration of the practice.',
      'Focus your attention on the smooth transitions between the inhalation and exhalation.'
    ],
    scienceDescription: 'Engages respiratory sinus arrhythmia (RSA) and baroreflex loops to maximize HRV amplitude. Promotes high parasympathetic vagal tone and restores prefrontal connectivity.'
  },
  SYMPATHETIC: {
    id: 'physiological-sigh',
    title: 'The Physiological Sigh',
    type: 'breathwork',
    duration: '2 min',
    description: 'A rapid autonomic reset to discharge accumulated carbon dioxide, slow heart rate, and deactivate acute sympathetic stress responses.',
    steps: [
      'Inhale deeply through your nose, expanding your chest.',
      'At the very peak of the inhalation, take a sharp, quick secondary sip of air to fully expand your lungs\' alveoli.',
      'Exhale fully through your mouth with a slow, relaxed, long sighing sound (\'ahhh\').',
      'Repeat this cycle of double-inhale followed by an extended sigh 3 to 5 times.',
      'Pause and observe the immediate reduction in physical muscle tension.'
    ],
    scienceDescription: 'Double inhalation opens collapsed alveoli, increasing surface area for rapid CO2 removal. The subsequent extended exhale activates the vagal brake, triggering immediate parasympathetic dominance.'
  },
  DORSAL_VAGAL: {
    id: 'dorsal-mobilization',
    title: 'Somatic Orienting & Freeze Mobilization',
    type: 'somatic',
    duration: '4 min',
    description: 'Gently cue safety to your brainstem to lift your system out of a shut-down, flatlined, or dissociated Dorsal Vagal state without triggering anxiety.',
    steps: [
      'Slowly let your eyes scan the room. Notice and name out loud 3 objects that are blue, then 3 objects that are green.',
      "Gently rub your hands together, generating physical heat and friction. Press your warm palms to your cheeks.",
      "Wrap your arms around your torso, squeezing firmly to feel your body's physical boundaries in space.",
      "Slowly press your feet flat into the floor, feeling the physical support and resistance of the ground beneath you.",
      "Gently roll your shoulders back and take a shallow, comfortable breath, letting out a soft hum on the exhale."
    ],
    scienceDescription: "Engages visual and somatosensory orienting networks to communicate current ambient safety. Activates gentle sympathetic mobilization to lift the system out of the metabolic conservation mode of Dorsal freeze."
  }
};

const getSimulatedMetricsForState = (state: NervousSystemState, nowTime?: string): BiometricLog => {
  const timestamp = nowTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  if (state === 'VENTRAL_VAGAL') {
    return {
      timestamp,
      heartRateVariabilitySDNN: Math.round(55 + Math.random() * 15),
      heartRate: Math.round(62 + Math.random() * 8),
      restingHeartRate: Math.round(60 + Math.random() * 4),
      respiratoryRate: Math.round(11 + Math.random() * 2),
      activeEnergyBurned: Math.round(350 + Math.random() * 100),
      stepCount: Math.round(8000 + Math.random() * 2000),
      appleSleepingWristTemperature: Math.round((36.2 + Math.random() * 0.4) * 10) / 10,
      appleSleepingBreathingDisturbances: Math.round(Math.random() * 2),
      sleepAnalysis: {
        sleepDuration: Math.round((7.5 + Math.random() * 1) * 10) / 10,
        sleepOnsetLatency: Math.round(12 + Math.random() * 5),
        waso: Math.round(15 + Math.random() * 10),
        sleepEfficiency: Math.round(92 + Math.random() * 4),
        deepSleepRatio: Math.round(21 + Math.random() * 4),
        remSleepRatio: Math.round(22 + Math.random() * 3),
        overnightHrvDelta: Math.round(12 + Math.random() * 6),
        restingHeartRateNadir: Math.round(56 + Math.random() * 4)
      },
      stressScore: Math.round(10 + Math.random() * 8)
    };
  } else if (state === 'SYMPATHETIC') {
    return {
      timestamp,
      heartRateVariabilitySDNN: Math.round(16 + Math.random() * 6),
      heartRate: Math.round(96 + Math.random() * 14),
      restingHeartRate: Math.round(84 + Math.random() * 6),
      respiratoryRate: Math.round(19 + Math.random() * 4),
      activeEnergyBurned: Math.round(150 + Math.random() * 100),
      stepCount: Math.round(3000 + Math.random() * 1500),
      appleSleepingWristTemperature: Math.round((36.7 + Math.random() * 0.3) * 10) / 10,
      appleSleepingBreathingDisturbances: Math.round(4 + Math.random() * 5),
      sleepAnalysis: {
        sleepDuration: Math.round((5.2 + Math.random() * 1) * 10) / 10,
        sleepOnsetLatency: Math.round(38 + Math.random() * 15),
        waso: Math.round(52 + Math.random() * 15),
        sleepEfficiency: Math.round(74 + Math.random() * 6),
        deepSleepRatio: Math.round(11 + Math.random() * 3),
        remSleepRatio: Math.round(16 + Math.random() * 4),
        overnightHrvDelta: Math.round(-4 + Math.random() * 6),
        restingHeartRateNadir: Math.round(72 + Math.random() * 6)
      },
      stressScore: Math.round(78 + Math.random() * 12)
    };
  } else { // DORSAL_VAGAL
    return {
      timestamp,
      heartRateVariabilitySDNN: Math.round(28 + Math.random() * 10),
      heartRate: Math.round(48 + Math.random() * 5),
      restingHeartRate: Math.round(52 + Math.random() * 3),
      respiratoryRate: Math.round(8 + Math.random() * 2),
      activeEnergyBurned: Math.round(50 + Math.random() * 50),
      stepCount: Math.round(1000 + Math.random() * 1000),
      appleSleepingWristTemperature: Math.round((35.8 + Math.random() * 0.4) * 10) / 10,
      appleSleepingBreathingDisturbances: Math.round(2 + Math.random() * 3),
      sleepAnalysis: {
        sleepDuration: Math.round((9.5 + Math.random() * 1.5) * 10) / 10,
        sleepOnsetLatency: Math.round(25 + Math.random() * 10),
        waso: Math.round(60 + Math.random() * 20),
        sleepEfficiency: Math.round(70 + Math.random() * 8),
        deepSleepRatio: Math.round(9 + Math.random() * 3),
        remSleepRatio: Math.round(14 + Math.random() * 4),
        overnightHrvDelta: Math.round(1 + Math.random() * 3),
        restingHeartRateNadir: Math.round(46 + Math.random() * 4)
      },
      stressScore: Math.round(48 + Math.random() * 10)
    };
  }
};

const Dashboard: React.FC<Props> = ({ user, onReset, onViewChange }) => {
  // Initialize biometric log representing user's initial baseline state
  const [log, setLog] = useState<BiometricLog>(() => getSimulatedMetricsForState(user.baselineState || 'VENTRAL_VAGAL'));
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  // Custom AI Intervention state
  const [customIntervention, setCustomIntervention] = useState<Intervention | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [additionalContext, setAdditionalContext] = useState('');

  // Chat state
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'TWIN' | 'AI_COACH'>('TWIN');

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Compute the nervous system state dynamically using our scientifically-backed diagnostic logic
  const { state: activeState, vagalToneScore, explanation } = computeNervousSystemState(log);

  // Fetch dynamic intervention library on mount
  useEffect(() => {
    fetch('/interventions.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch JSON library');
        return res.json();
      })
      .then((data: Intervention[]) => {
        setInterventions(data);
      })
      .catch(err => {
        console.warn('Using fallback interventions. interventions.json could not be loaded relative to origin:', err);
      });
  }, []);

  // Initialize chat messages
  useEffect(() => {
    setChatMessages([
      {
        role: 'model',
        text: `Hello ${user.name || 'there'}. I am your trauma-informed NeuroPath Coach. Analyzing your real-time physiological telemetry, I see your nervous system is in a ${getStateName(activeState)} state. How is your body feeling right now?`
      }
    ]);
  }, [user.name, activeState]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Telemetry loop - background biometric updates resembling continuous watch streaming
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setLog(prev => {
        const fresh = getSimulatedMetricsForState(activeState, prev.timestamp);
        // Retain the rolling clock sequence and minor jitter to emulate real streaming
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return {
          ...fresh,
          timestamp: now
        };
      });
    }, 5000);

    return () => clearInterval(updateInterval);
  }, [activeState]);

  function getStateName(state: NervousSystemState) {
    if (state === 'VENTRAL_VAGAL') return 'Ventral Vagal (Regulated)';
    if (state === 'SYMPATHETIC') return 'Sympathetic (Fight/Flight)';
    return 'Dorsal Vagal (Freeze/Shutdown)';
  }

  const getActiveStateSuggestedProtocol = (): Intervention => {
    const idealId = activeState === 'VENTRAL_VAGAL' ? 'coherent-breathing' :
                    activeState === 'SYMPATHETIC' ? 'physiological-sigh' : 'dorsal-mobilization';

    const libraryMatch = interventions.find(item => item.id === idealId);
    if (libraryMatch) return libraryMatch;

    return FALLBACK_INTERVENTIONS[activeState];
  };

  // Handle generating custom intervention via Gemini
  const handleGenerateCustom = async () => {
    setIsGenerating(true);
    setCustomIntervention(null);
    try {
      const res = await generateNeuroIntervention(activeState, user, additionalContext);
      if (res) {
        setCustomIntervention(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle sending message to AI Coach
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg = userInput;
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsSendingMessage(true);

    try {
      const nextHistory = [...chatMessages, { role: 'user' as const, text: userMsg }];
      const reply = await generateCoachMessage(activeState, user, nextHistory);
      setChatMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'model', text: "I am having trouble syncing with your neural model. Let's take a slow resonant breath together." }]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Apple Watch Concordric Rings calculations (relative to baseline thresholds)
  const outerRadius = 36;
  const outerCircumference = 2 * Math.PI * outerRadius;
  // Outer Ring: HRV SDNN - Target: 75ms (normal night/surging peak)
  const hrvPercent = Math.min(100, (log.heartRateVariabilitySDNN / 75) * 100);
  const outerStrokeDashoffset = outerCircumference - (hrvPercent / 100) * outerCircumference;

  // Middle Ring: Resonant Coherence Score (Target respiration rate: 12 bpm)
  const middleRadius = 26;
  const middleCircumference = 2 * Math.PI * middleRadius;
  const coherenceScore = Math.max(10, 100 - Math.abs(log.respiratoryRate - 12) * 12);
  const middleStrokeDashoffset = middleCircumference - (coherenceScore / 100) * middleCircumference;

  // Inner Ring: System Calm Index (calmer as heart rate is closer to resting nadir / 60bpm)
  const innerRadius = 16;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const calmScore = Math.max(10, 100 - Math.max(0, log.heartRate - 60) * 1.5);
  const innerStrokeDashoffset = innerCircumference - (calmScore / 100) * innerCircumference;

  const currentSuggested = getActiveStateSuggestedProtocol();

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900 px-5 py-6">
      {/* Top Header info */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-violet-100/80 border border-violet-300/50 flex items-center justify-center text-lg">
            {user.icon || '🧠'}
          </div>
          <div>
            <h3 className="text-xs text-stone-500/50 font-medium">Digital Twin of</h3>
            <h1 className="text-sm font-bold text-stone-900 tracking-wide">{user.name || 'User'}</h1>
          </div>
        </div>
        
        {/* Apple Watch Pairing Status Badge */}
        <div className="flex items-center gap-1.5 bg-white border border-stone-300/80 px-2.5 py-1 rounded-full text-[9px] text-stone-600/60 font-medium">
          <span className="material-symbols-outlined text-rose-500 text-[10px] animate-pulse">watch_button_press</span>
          Watch Sync: Active
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => onViewChange('KPI_DASHBOARD')}
            className="flex items-center justify-center p-2 rounded-lg bg-white border border-stone-300 text-violet-600/60 hover:text-violet-600 transition-colors"
            title="KPI Engine Dashboard"
          >
            <span className="material-symbols-outlined text-sm">monitoring</span>
          </button>
          <button 
            onClick={() => onViewChange('BUSINESS_DASHBOARD')}
            className="flex items-center justify-center p-2 rounded-lg bg-white border border-stone-300 text-cyan-600/60 hover:text-cyan-600 transition-colors"
            title="Business Analytics Dashboard"
          >
            <span className="material-symbols-outlined text-sm">bar_chart</span>
          </button>
          <button 
            onClick={onReset}
            className="flex items-center justify-center p-2 rounded-lg bg-white border border-stone-300 text-stone-400/40 hover:text-stone-900 transition-colors"
            title="Recalibrate profile"
          >
            <span className="material-symbols-outlined text-sm">settings_backup_restore</span>
          </button>
          <SignOutButton />
        </div>
      </header>

      {/* PRIVACY-FIRST & TRAUMA-INFORMED BANNER */}
      <div className="mb-6 p-3 bg-violet-50/80 border border-violet-200/50 rounded-xl flex items-start gap-2.5">
        <span className="material-symbols-outlined text-violet-600 text-sm mt-0.5">verified_user</span>
        <div className="space-y-0.5">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-violet-300">Privacy-First Architecture</h4>
          <p className="text-[9px] text-stone-500/50 leading-tight">
            Raw biometrics and voice audio are processed strictly on-device. Only secure, anonymous mathematical feature vectors are synced to protect your trauma recovery path.
          </p>
        </div>
      </div>

      {/* Tabs selector */}
      <div className="flex bg-white border border-stone-200 p-1.5 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('TWIN')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'TWIN' ? 'bg-violet-600 text-stone-900 shadow-lg' : 'text-stone-400/40 hover:text-stone-600/60'
          }`}
        >
          <span className="material-symbols-outlined text-xs">biotech</span>
          Autonomic Twin
        </button>
        <button
          onClick={() => setActiveTab('AI_COACH')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'AI_COACH' ? 'bg-violet-600 text-stone-900 shadow-lg' : 'text-stone-400/40 hover:text-stone-600/60'
          }`}
        >
          <span className="material-symbols-outlined text-xs">forum</span>
          AI Coach
        </button>
      </div>

      {activeTab === 'TWIN' ? (
        <div className="flex-1 flex flex-col space-y-6">
          
          {/* DIGITAL TWIN VISUALIZER */}
          <div className="relative p-5 rounded-2xl border bg-stone-100/50 border-stone-200 flex flex-col items-center overflow-hidden">
            <div className="absolute top-4 left-4 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                activeState === 'VENTRAL_VAGAL' ? 'bg-emerald-500 animate-ping' :
                activeState === 'SYMPATHETIC' ? 'bg-rose-500 animate-ping' : 'bg-cyan-400 animate-ping'
              }`} />
              <span className="text-[9px] font-bold tracking-wider uppercase text-stone-500/50">LIVE TWIN MATRIX</span>
            </div>

            {/* Glowing Pulse Visualizer */}
            <div className="w-48 h-48 relative flex items-center justify-center my-6">
              {activeState === 'VENTRAL_VAGAL' && (
                <>
                  <div className="absolute w-40 h-40 rounded-full border border-emerald-200/50 animate-pulse" />
                  <div className="absolute w-32 h-32 rounded-full bg-emerald-500/5 border border-emerald-200/60 animate-ping" style={{ animationDuration: '3.5s' }} />
                  <div className="absolute w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <span className="material-symbols-outlined text-4xl text-emerald-600 animate-pulse">spa</span>
                  </div>
                </>
              )}

              {activeState === 'SYMPATHETIC' && (
                <>
                  <div className="absolute w-40 h-40 rounded-full border border-rose-500/10 animate-spin" style={{ animationDuration: '6s' }} />
                  <div className="absolute w-32 h-32 rounded-full bg-rose-500/5 border border-rose-500/20 animate-ping" style={{ animationDuration: '0.9s' }} />
                  <div className="absolute w-24 h-24 rounded-full bg-rose-500/10 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-500/10">
                    <span className="material-symbols-outlined text-4xl text-rose-600 animate-bounce">bolt</span>
                  </div>
                </>
              )}

              {activeState === 'DORSAL_VAGAL' && (
                <>
                  <div className="absolute w-40 h-40 rounded-full border border-cyan-500/5" />
                  <div className="absolute w-32 h-32 rounded-full bg-cyan-500/5 border border-cyan-500/20 opacity-30 animate-pulse" style={{ animationDuration: '6s' }} />
                  <div className="absolute w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-300/50 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                    <span className="material-symbols-outlined text-4xl text-cyan-300">severe_cold</span>
                  </div>
                </>
              )}
            </div>

            {/* State details */}
            <div className="text-center w-full">
              <h2 className={`text-base font-bold uppercase tracking-wider mb-1 ${
                activeState === 'VENTRAL_VAGAL' ? 'text-emerald-600' :
                activeState === 'SYMPATHETIC' ? 'text-rose-600' : 'text-cyan-300'
              }`}>
                {activeState === 'VENTRAL_VAGAL' ? 'VENTRAL VAGAL (REGULATED)' :
                 activeState === 'SYMPATHETIC' ? 'SYMPATHETIC HYPERAROUSAL' : 'DORSAL VAGAL SHUTDOWN'}
              </h2>
              <p className="text-[10px] text-stone-500/50 leading-relaxed px-4">
                {explanation}
              </p>
            </div>

            {/* MANUAL OVERRIDE (to show dynamic metric mapping) */}
            <div className="w-full border-t border-stone-200 mt-5 pt-4">
              <p className="text-center text-[8px] font-bold tracking-widest text-stone-400/40 uppercase mb-2">Simulate Watch Telemetry Sync</p>
              <div className="flex gap-1.5 justify-center">
                {(['VENTRAL_VAGAL', 'SYMPATHETIC', 'DORSAL_VAGAL'] as NervousSystemState[]).map((state) => (
                  <button
                    key={state}
                    onClick={() => setLog(getSimulatedMetricsForState(state))}
                    className={`text-[8px] tracking-wide py-1.5 px-3 rounded-md font-bold transition-all border ${
                      activeState === state 
                        ? 'bg-violet-600 border-violet-500 text-stone-900 shadow-md' 
                        : 'bg-stone-100/60 border-stone-300 text-stone-400/40 hover:text-stone-600/60'
                    }`}
                  >
                    {state === 'VENTRAL_VAGAL' ? 'CALM (VENTRAL)' : state === 'SYMPATHETIC' ? 'STRESSED (SYMPATHETIC)' : 'FREEZE (DORSAL)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* APPLE HEALTHKIT RECOVERY RINGS WIDGET */}
          <div className="p-4 rounded-xl border bg-stone-100/80 border-stone-200 flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold tracking-widest text-violet-600 uppercase">HealthKit Balance rings</h3>
              <p className="text-[11px] text-stone-600/60 leading-tight">Overnight and waking autonomic indices mapped directly from watch sensors.</p>
              
              <div className="flex flex-col gap-1 pt-1.5 font-mono text-[9px] text-stone-500/50">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  <span>HRV Recovery (SDNN): {log.heartRateVariabilitySDNN}ms</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Resonant Coherence: {coherenceScore}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>System Calm Index: {calmScore}%</span>
                </div>
              </div>
            </div>

            {/* Apple Activity concentric rings */}
            <div className="w-24 h-24 relative flex items-center justify-center flex-shrink-0">
              <svg className="w-20 h-24 transform -rotate-90">
                {/* Background tracks */}
                <circle cx="48" cy="48" r={outerRadius} fill="transparent" stroke="#8b5cf6" strokeWidth="6" className="opacity-10" />
                <circle cx="48" cy="48" r={middleRadius} fill="transparent" stroke="#06b6d4" strokeWidth="6" className="opacity-10" />
                <circle cx="48" cy="48" r={innerRadius} fill="transparent" stroke="#10b981" strokeWidth="6" className="opacity-10" />

                {/* Concentric Progress loops */}
                <circle
                  cx="48"
                  cy="48"
                  r={outerRadius}
                  fill="transparent"
                  stroke="#8b5cf6"
                  strokeWidth="6"
                  strokeDasharray={outerCircumference}
                  strokeDashoffset={outerStrokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-in-out"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={middleRadius}
                  fill="transparent"
                  stroke="#06b6d4"
                  strokeWidth="6"
                  strokeDasharray={middleCircumference}
                  strokeDashoffset={middleStrokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-in-out"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={innerRadius}
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="6"
                  strokeDasharray={innerCircumference}
                  strokeDashoffset={innerStrokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-in-out"
                />
              </svg>
              {/* Center apple icon */}
              <span className="absolute material-symbols-outlined text-[14px] text-stone-400/30">watch</span>
            </div>
          </div>

          {/* RESEARCH-DRIVEN BIOMETRIC HEALTHKIT CARDS */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* HRV SDNN Card */}
            <div className="p-4 rounded-xl border bg-stone-100/80 border-stone-200">
              <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold tracking-wider text-stone-400/40 uppercase">HRV (SDNN)</span>
                  <span className="text-[8px] text-violet-600/70 font-mono">Quantity Identifier</span>
                </div>
                <span className="material-symbols-outlined text-violet-600 text-base font-light">network_intelligence_history</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-stone-900">{log.heartRateVariabilitySDNN}</span>
                <span className="text-xs text-stone-500/50">ms</span>
              </div>
              <p className="text-[8px] text-stone-400/30 mt-2 font-mono leading-tight">
                Trauma cut: &lt;25ms | Night: 40-80ms
              </p>
            </div>

            {/* Heart Rate / RHR Card */}
            <div className="p-4 rounded-xl border bg-stone-100/80 border-stone-200">
              <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold tracking-wider text-stone-400/40 uppercase">Heart Rate</span>
                  <span className="text-[8px] text-rose-600/70 font-mono">Real-time / Resting</span>
                </div>
                <span className="material-symbols-outlined text-rose-500 text-base font-light">favorite</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-stone-900">{log.heartRate}</span>
                <span className="text-xs text-stone-500/50">bpm</span>
                <span className="text-[10px] text-stone-400/40 font-mono ml-auto">RHR: {log.restingHeartRate}</span>
              </div>
              <p className="text-[8px] text-stone-400/30 mt-2 font-mono leading-tight">
                {activeState === 'SYMPATHETIC' ? 'Sympathetic spike' : 'Balanced baseline'}
              </p>
            </div>

            {/* Respiration Card */}
            <div className="p-4 rounded-xl border bg-stone-100/80 border-stone-200">
              <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold tracking-wider text-stone-400/40 uppercase">Respiratory Rate</span>
                  <span className="text-[8px] text-emerald-600/70 font-mono">Resting/Paced</span>
                </div>
                <span className="material-symbols-outlined text-emerald-600 text-base font-light">air</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-stone-900">{log.respiratoryRate}</span>
                <span className="text-xs text-stone-500/50">/ min</span>
              </div>
              <p className="text-[8px] text-stone-400/30 mt-2 font-mono leading-tight">
                {activeState === 'VENTRAL_VAGAL' ? 'Resonant (10-14)' : activeState === 'SYMPATHETIC' ? 'Shallow Hypervent (&gt;18)' : 'Suppressed (&lt;10)'}
              </p>
            </div>

            {/* Behavioral Activation Card */}
            <div className="p-4 rounded-xl border bg-stone-100/80 border-stone-200">
              <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold tracking-wider text-stone-400/40 uppercase">Behavioral Act.</span>
                  <span className="text-[8px] text-amber-600/70 font-mono">Steps / Active Burn</span>
                </div>
                <span className="material-symbols-outlined text-amber-600 text-base font-light">directions_run</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono tracking-tight text-stone-900">{log.stepCount.toLocaleString()}</span>
                <span className="text-[9px] text-stone-400/40">st</span>
                <span className="text-sm font-bold font-mono text-amber-600/80 ml-auto">{log.activeEnergyBurned} <span className="text-[8px]">kcal</span></span>
              </div>
              <p className="text-[8px] text-stone-400/30 mt-2 font-mono leading-tight">
                {log.stepCount < 2000 ? 'Low (Freeze Withdrawal)' : 'Active (Neuro-Resilience)'}
              </p>
            </div>

            {/* Sleeping Wrist Temperature & Breathing Disturbances */}
            <div className="p-4 rounded-xl border bg-stone-100/80 border-stone-200">
              <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold tracking-wider text-stone-400/40 uppercase">Circadian Temp</span>
                  <span className="text-[8px] text-cyan-600/70 font-mono">Wrist Sensor / Apnea</span>
                </div>
                <span className="material-symbols-outlined text-cyan-600 text-base font-light">device_thermostat</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-stone-900">{log.appleSleepingWristTemperature}°C</span>
                <span className="text-[9px] text-stone-400/40 ml-auto">Disturb: {log.appleSleepingBreathingDisturbances}</span>
              </div>
              <p className="text-[8px] text-stone-400/30 mt-2 font-mono leading-tight">
                Overnight deviations index cortisol dysregulation
              </p>
            </div>

            {/* Overall Autonomic Stress & Vagal Tone Card */}
            <div className="p-4 rounded-xl border bg-stone-100/80 border-stone-200">
              <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold tracking-wider text-stone-400/40 uppercase">Autonomic Index</span>
                  <span className="text-[8px] text-purple-400/70 font-mono">Computed Vagal Tone</span>
                </div>
                <span className="material-symbols-outlined text-purple-400 text-base font-light">analytics</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-stone-900">{log.stressScore}</span>
                <span className="text-xs text-stone-500/50">/100</span>
                <span className="text-[10px] text-emerald-600 font-bold ml-auto">{vagalToneScore}% Vagal</span>
              </div>
              <p className="text-[8px] text-stone-400/30 mt-2 font-mono leading-tight">
                Derived from HRV SDNN + RHR + Resonant Breathing
              </p>
            </div>
          </div>

          {/* APPLE WATCH SLEEP STAGE ARCHITECTURE WIDGET */}
          <div className="p-5 rounded-2xl border border-stone-200 bg-stone-100/50 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-600 text-lg">bedtime</span>
                <h4 className="font-bold text-xs uppercase tracking-widest text-cyan-600 font-display">Apple Watch Sleep Architecture</h4>
              </div>
              <span className="text-[9px] font-mono bg-white px-2 py-0.5 rounded-md text-stone-600/60">
                Duration: {log.sleepAnalysis.sleepDuration} hrs
              </span>
            </div>

            <p className="text-[10px] text-stone-500/50 leading-relaxed italic">
              Trauma and complex PTSD selectively disrupt core, slow-wave (deep), and REM sleep staging. Below is your overnight sleep analysis.
            </p>

            <div className="space-y-3 pt-2">
              {/* Deep sleep progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="font-medium text-stone-800/80">Deep Sleep (Slow Wave N3)</span>
                  <span className="font-mono text-cyan-300 font-bold">{log.sleepAnalysis.deepSleepRatio}% <span className="text-stone-400/40 font-normal">(Target &gt;20%)</span></span>
                </div>
                <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full transition-all duration-1000" style={{ width: `${log.sleepAnalysis.deepSleepRatio * 4}%` }} />
                </div>
                <p className="text-[8px] text-cyan-600/80 font-mono leading-tight">
                  💡 Clinical Focus: Reduced in chronic stress and trauma. Essential for emotional memory consolidation &amp; metabolic clearance.
                </p>
              </div>

              {/* REM sleep progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="font-medium text-stone-800/80">REM Sleep (Dream State)</span>
                  <span className="font-mono text-violet-300 font-bold">{log.sleepAnalysis.remSleepRatio}% <span className="text-stone-400/40 font-normal">(Target 20-25%)</span></span>
                </div>
                <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full transition-all duration-1000" style={{ width: `${log.sleepAnalysis.remSleepRatio * 4}%` }} />
                </div>
                <p className="text-[8px] text-violet-600/80 font-mono leading-tight">
                  💡 Clinical Focus: Fragmentation or shortening hampers fear extinction pathways, predisposing the brain to trauma nightmare loops.
                </p>
              </div>

              {/* Secondary calculated Sleep vectors */}
              <div className="grid grid-cols-2 gap-3 border-t border-stone-200/60 pt-3 text-[10px] font-mono text-stone-600/60">
                <div className="space-y-1">
                  <div>Sleep Efficiency: <span className="text-stone-900 font-bold">{log.sleepAnalysis.sleepEfficiency}%</span></div>
                  <div className="text-[8px] text-stone-400/40">Trauma typical: &lt;85% (Fragmented)</div>
                </div>
                <div className="space-y-1">
                  <div>Sleep Onset Latency: <span className="text-stone-900 font-bold">{log.sleepAnalysis.sleepOnsetLatency}m</span></div>
                  <div className="text-[8px] text-stone-400/40">Hyperarousal latency: &gt;30m</div>
                </div>
                <div className="space-y-1">
                  <div>Wake After Onset (WASO): <span className="text-stone-900 font-bold">{log.sleepAnalysis.waso}m</span></div>
                  <div className="text-[8px] text-stone-400/40">Awakenings typical of PTSD: &gt;45m</div>
                </div>
                <div className="space-y-1">
                  <div>Overnight HRV Delta: <span className="text-stone-900 font-bold">+{log.sleepAnalysis.overnightHrvDelta}ms</span></div>
                  <div className="text-[8px] text-stone-400/40">Target surge: &gt;10ms overnight</div>
                </div>
              </div>
            </div>
          </div>

          {/* PRESCRIPTION & INTERVENTION ZONE */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-stone-400/40">Suggested Autonomic Protocol</h3>

            {/* Curated Dynamic Intervention from Library */}
            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-100/50 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] bg-violet-500/10 text-violet-600 border border-violet-500/20 px-2 py-0.5 rounded-full uppercase font-mono font-bold tracking-wider">
                    {currentSuggested.type}
                  </span>
                  <h4 className="font-bold text-sm text-stone-900 mt-2">{currentSuggested.title}</h4>
                </div>
                <span className="text-xs text-stone-400/40 font-bold tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {currentSuggested.duration}
                </span>
              </div>

              <p className="text-xs text-stone-600/60 leading-relaxed">
                {currentSuggested.description}
              </p>

              <div className="space-y-2 border-t border-stone-200/60 pt-4">
                <p className="text-[9px] font-bold tracking-widest text-stone-400/40 uppercase">Protocol Steps:</p>
                {currentSuggested.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-xs text-stone-700/70">
                    <span className="font-mono text-violet-600 font-bold text-[10px] bg-violet-500/5 w-5 h-5 rounded-md flex items-center justify-center border border-violet-200/50 flex-shrink-0 mt-0.5">{idx + 1}</span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>

              <div className="bg-stone-100/80 p-3 rounded-xl border border-stone-200 text-[10px] text-violet-600/80 font-mono leading-relaxed italic">
                <span className="font-bold uppercase tracking-wide text-[9px] not-italic mr-1 text-violet-600">NEUROLOGICAL MECHANISM:</span>
                {currentSuggested.scienceDescription}
              </div>
            </div>

            {/* INTERVENTION LIBRARY EXPLORER */}
            {interventions.length > 0 && (
              <div className="p-5 rounded-2xl border border-stone-200 bg-stone-100/50 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-violet-600">library_books</span>
                  <h4 className="font-bold text-xs uppercase tracking-widest text-stone-900 font-display">Explore Somatic Library</h4>
                </div>
                <p className="text-[10px] text-stone-500/50 leading-relaxed">
                  Browse and select clinical somatic modalities mapped specifically to other states.
                </p>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  {interventions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedIntervention(selectedIntervention?.id === item.id ? null : item)}
                      className="w-full text-left p-2.5 rounded-lg bg-stone-100/60 border border-zinc-850 hover:bg-white transition-colors flex items-center justify-between text-xs font-semibold text-stone-800/80"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                        <span>{item.title}</span>
                      </div>
                      <span className="text-[10px] text-stone-400/40">{item.duration} ({item.type})</span>
                    </button>
                  ))}
                </div>

                {selectedIntervention && (
                  <div className="border border-stone-300 bg-stone-50/80 p-4 rounded-xl mt-3 space-y-3 animate-fade-in text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[8px] bg-stone-200 text-stone-600/60 px-2 py-0.5 rounded-full uppercase font-mono font-bold tracking-wider">
                          {selectedIntervention.type}
                        </span>
                        <h5 className="font-bold text-xs text-stone-900 mt-1.5">{selectedIntervention.title}</h5>
                      </div>
                      <span className="text-[10px] text-stone-400/40 font-semibold">{selectedIntervention.duration}</span>
                    </div>
                    
                    <p className="text-stone-600/60 leading-relaxed text-[11px]">
                      {selectedIntervention.description}
                    </p>

                    <div className="space-y-1.5 border-t border-stone-300/80 pt-2.5">
                      <p className="text-[8px] font-bold text-stone-400/40 uppercase">Steps:</p>
                      {selectedIntervention.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-2 items-start text-stone-800/80">
                          <span className="font-mono text-violet-600 font-bold text-[9px] bg-violet-500/10 w-4 h-4 rounded-md flex items-center justify-center border border-violet-500/15 flex-shrink-0 mt-0.5">{idx + 1}</span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-stone-100/80 p-2 rounded-lg border border-zinc-850 text-[9px] text-violet-600/80 font-mono leading-relaxed italic">
                      <span className="font-bold uppercase tracking-wide text-[8px] not-italic mr-1 text-violet-600 font-sans">SCIENCE BASIS:</span>
                      {selectedIntervention.scienceDescription}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* GEMINI PERSONALIZED INTERVENTION GENERATOR */}
            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-100/50 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-600">neurology</span>
                <h4 className="font-bold text-sm text-stone-900">AI-Generated Neuro-Intervention</h4>
              </div>
              <p className="text-xs text-stone-500/50 leading-relaxed">
                Need a completely tailored protocol? Provide details of how you are feeling (e.g. "tense shoulders", "mind spinning"), and Gemini will synthesize a personalized real-time intervention.
              </p>

              <input
                className="w-full bg-white border border-stone-200 rounded-xl py-3 px-4 text-xs text-stone-900 placeholder:text-stone-400/20 focus:ring-1 focus:ring-violet-500 outline-none transition-all"
                placeholder="What physical or mental sensations do you feel?"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
              />

              <button
                onClick={handleGenerateCustom}
                disabled={isGenerating}
                className="w-full h-12 rounded-xl bg-violet-600 text-stone-900 font-bold uppercase tracking-[0.2em] text-xs hover:bg-violet-600 transition-all shadow-xl shadow-violet-900/10 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing Autonomic Tone...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">psychology_alt</span>
                    Synthesize Custom Protocol
                  </>
                )}
              </button>

              {customIntervention && (
                <div className="border border-violet-500/20 bg-violet-950/5 p-4 rounded-xl mt-4 space-y-4 animate-fade-in">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[8px] bg-violet-500/15 text-violet-600 border border-violet-300/50 px-2 py-0.5 rounded-full uppercase font-mono font-bold tracking-wider">
                        {customIntervention.type}
                      </span>
                      <h5 className="font-bold text-xs text-stone-900 mt-1.5">{customIntervention.title}</h5>
                    </div>
                    <span className="text-[10px] text-stone-500/50 font-semibold">{customIntervention.duration}</span>
                  </div>
                  
                  <p className="text-[11px] text-stone-700/70 leading-relaxed">
                    {customIntervention.description}
                  </p>

                  <div className="space-y-2.5 border-t border-stone-200 pt-3">
                    <p className="text-[9px] font-bold text-stone-400/40 uppercase">Customized Steps:</p>
                    {customIntervention.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-2 items-start text-xs text-stone-800/80">
                        <span className="font-mono text-violet-600 font-bold text-[9px] bg-violet-500/10 w-4.5 h-4.5 rounded-md flex items-center justify-center border border-violet-500/15 flex-shrink-0">{idx + 1}</span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-stone-100/80 p-2.5 rounded-lg border border-stone-200 text-[9px] text-violet-600/80 font-mono leading-relaxed italic">
                    <span className="font-bold uppercase tracking-wide text-[8px] not-italic mr-1 text-violet-600">SCIENCE BASIS:</span>
                    {customIntervention.scienceDescription}
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      ) : (
        /* CHAT INTERACTIVE AI COACH */
        <div className="flex-1 flex flex-col min-h-0 bg-stone-50/80 border border-stone-200 rounded-2xl p-4 overflow-hidden relative">
          
          <div className="flex items-center gap-2 pb-3 border-b border-stone-200 mb-4">
            <div className="w-8 h-8 rounded-full bg-violet-100/80 border border-violet-300/50 flex items-center justify-center text-sm">
              🧘
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900">Neuro-Coach</h4>
              <p className="text-[9px] text-violet-600">Attuning to your {getStateName(activeState)} state</p>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 custom-scrollbar min-h-[300px]">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-violet-600 text-stone-900 rounded-br-none' 
                    : 'bg-white text-stone-900/90 rounded-bl-none border border-stone-300'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[8px] text-stone-400/30 font-mono mt-1 px-1">
                  {msg.role === 'user' ? 'You' : 'Neuro-Coach'}
                </span>
              </div>
            ))}
            {isSendingMessage && (
              <div className="mr-auto flex flex-col items-start max-w-[80%]">
                <div className="bg-white border border-stone-300 p-3 rounded-xl rounded-bl-none text-xs flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-stone-200/60 pt-3">
            <input
              type="text"
              disabled={isSendingMessage}
              className="flex-1 bg-white border border-stone-200 rounded-xl py-3 px-4 text-xs text-stone-900 placeholder:text-stone-400/20 focus:ring-1 focus:ring-violet-500 outline-none transition-all"
              placeholder="Tell the coach how you are feeling physically..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={isSendingMessage}
              className="flex items-center justify-center p-3 rounded-xl bg-violet-600 text-stone-900 hover:bg-violet-600 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </form>
        </div>
      )}

      {/* Footer Info */}
      <footer className="mt-8 text-center text-[9px] text-stone-400/30 font-mono leading-relaxed">
        NeuroPath System • Version 0.1.0 • E2E Encrypted<br/>
        Clinical Somatic Interventions Powered by Gemini Core
      </footer>
    </div>
  );
};

export default Dashboard;
