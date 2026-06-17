import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, NervousSystemState, BiometricLog, Intervention } from '../types';
import { generateNeuroIntervention, generateCoachMessage } from '../geminiService';

interface Props {
  user: UserProfile;
  onReset: () => void;
}

// Preset quick interventions based on nervous system states
const PRESET_INTERVENTIONS: Record<NervousSystemState, Intervention> = {
  VENTRAL_VAGAL: {
    id: 'ventral-anchor',
    title: 'Ventral Safety Anchor',
    type: 'cognitive',
    duration: '5 min',
    description: 'Anchor and expand your current state of safety and social connection to build nervous system resilience.',
    steps: [
      'Find a comfortable posture and scan your body for areas of ease and relaxation.',
      'Bring to mind a person, place, or memory that brings a feeling of deep safety and warmth.',
      'Savor this feeling in your body for 30 seconds, noticing any physical sensations of expansion or softness.',
      'Gently smile, acknowledging your system’s capacity for regulation and healing.'
    ],
    scienceDescription: 'Strengthens ventral vagal pathways by reinforcing myelinated parasympathetic fibers, promoting positive neuroplasticity.'
  },
  SYMPATHETIC: {
    id: 'sympathetic-down',
    title: 'Physiological Sigh & Shake-off',
    type: 'somatic',
    duration: '3 min',
    description: 'Rapidly discharge sympathetic arousal, reducing heart rate and triggering the parasympathetic brake.',
    steps: [
      'Take a deep double-inhale through your nose (one deep breath, then a sharp extra sip of air at the top).',
      'Exhale slowly and fully through your mouth with a soft sighing sound.',
      'Repeat this breathing pattern 5 times.',
      'Stand up and shake out your hands, arms, and legs vigorously for 1 minute to release physical muscular tension.'
    ],
    scienceDescription: 'The physiological sigh opens collapsed alveoli and spikes blood CO2 clearing, immediately activating the vagus nerve to reduce heart rate.'
  },
  DORSAL_VAGAL: {
    id: 'dorsal-up',
    title: 'Somatic Orienting & Mobilization',
    type: 'somatic',
    duration: '4 min',
    description: 'Gently cue safety to your brain to lift your system out of shut-down and freeze states without triggering panic.',
    steps: [
      'Slowly let your eyes scan the room you are in. Find 3 objects that are blue and name them out loud.',
      'Gently rub your hands together, feeling the warmth and friction of your palms.',
      'Wrap your arms around your torso in a firm, self-supportive hug, feeling your boundaries in space.',
      'Stomp your feet softly on the ground, connecting to the physical support of the floor.'
    ],
    scienceDescription: 'Engages sensory orienting pathways to signal ambient physical safety to the brainstem, breaking the dorsal vagal immobilization response.'
  }
};

const Dashboard: React.FC<Props> = ({ user, onReset }) => {
  const [activeState, setActiveState] = useState<NervousSystemState>(user.baselineState || 'VENTRAL_VAGAL');
  const [log, setLog] = useState<BiometricLog>({
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    hrv: 82,
    hr: 64,
    respiration: 12,
    stressScore: 18
  });
  
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

  // Initialize chat messages
  useEffect(() => {
    setChatMessages([
      {
        role: 'model',
        text: `Hello ${user.name || 'there'}. I am your NeuroPath AI Coach. I see your system is currently in a ${getStateName(activeState)} state. How is your body feeling right now?`
      }
    ]);
  }, [user.name, activeState]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Update biometrics when nervous system state is changed
  useEffect(() => {
    let interval: Timer;
    
    const updateBiometrics = () => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      if (activeState === 'VENTRAL_VAGAL') {
        setLog({
          timestamp: now,
          hrv: Math.round(80 + Math.random() * 12),
          hr: Math.round(60 + Math.random() * 6),
          respiration: Math.round(11 + Math.random() * 2),
          stressScore: Math.round(12 + Math.random() * 6)
        });
      } else if (activeState === 'SYMPATHETIC') {
        setLog({
          timestamp: now,
          hrv: Math.round(20 + Math.random() * 8),
          hr: Math.round(98 + Math.random() * 12),
          respiration: Math.round(20 + Math.random() * 4),
          stressScore: Math.round(75 + Math.random() * 15)
        });
      } else { // DORSAL_VAGAL
        setLog({
          timestamp: now,
          hrv: Math.round(35 + Math.random() * 10),
          hr: Math.round(50 + Math.random() * 5),
          respiration: Math.round(8 + Math.random() * 2),
          stressScore: Math.round(45 + Math.random() * 10)
        });
      }
    };

    updateBiometrics();
    interval = setInterval(updateBiometrics, 4000);
    return () => clearInterval(interval);
  }, [activeState]);

  function getStateName(state: NervousSystemState) {
    if (state === 'VENTRAL_VAGAL') return 'Ventral Vagal (Regulated)';
    if (state === 'SYMPATHETIC') return 'Sympathetic (Fight/Flight)';
    return 'Dorsal Vagal (Freeze/Shutdown)';
  }

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
      setChatMessages(prev => [...prev, { role: 'model', text: "I'm having trouble syncing with your neural model. Let's take a slow breath together." }]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white px-5 py-6">
      {/* Top Header info */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-violet-950/40 border border-violet-500/30 flex items-center justify-center text-lg">
            {user.icon || '🧠'}
          </div>
          <div>
            <h3 className="text-xs text-white/50 font-medium">Digital Twin Of</h3>
            <h1 className="text-sm font-bold text-white tracking-wide">{user.name || 'User'}</h1>
          </div>
        </div>
        <button 
          onClick={onReset}
          className="flex items-center justify-center p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white/40 hover:text-white transition-colors"
          title="Recalibrate profile"
        >
          <span className="material-symbols-outlined text-sm">settings_backup_restore</span>
        </button>
      </header>

      {/* Tabs selector */}
      <div className="flex bg-zinc-950 border border-zinc-900 p-1.5 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('TWIN')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'TWIN' ? 'bg-violet-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <span className="material-symbols-outlined text-xs">biotech</span>
          Nervous System Twin
        </button>
        <button
          onClick={() => setActiveTab('AI_COACH')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'AI_COACH' ? 'bg-violet-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <span className="material-symbols-outlined text-xs">forum</span>
          AI Coach
        </button>
      </div>

      {activeTab === 'TWIN' ? (
        <div className="flex-1 flex flex-col space-y-6">
          
          {/* DIGITAL TWIN VISUALIZER */}
          <div className="relative p-5 rounded-2xl border bg-zinc-950/20 border-zinc-900 flex flex-col items-center overflow-hidden">
            <div className="absolute top-4 left-4 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                activeState === 'VENTRAL_VAGAL' ? 'bg-emerald-500 animate-ping' :
                activeState === 'SYMPATHETIC' ? 'bg-rose-500 animate-ping' : 'bg-cyan-400 animate-ping'
              }`} />
              <span className="text-[9px] font-bold tracking-wider uppercase text-white/50">LIVE TWIN MATRIX</span>
            </div>

            {/* Animation representing state of the body */}
            <div className="w-48 h-48 relative flex items-center justify-center my-6">
              
              {/* Ventral state circle */}
              {activeState === 'VENTRAL_VAGAL' && (
                <>
                  <div className="absolute w-40 h-40 rounded-full border border-emerald-500/10 animate-pulse" />
                  <div className="absolute w-32 h-32 rounded-full bg-emerald-500/5 border border-emerald-500/20 animate-ping" style={{ animationDuration: '4s' }} />
                  <div className="absolute w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <span className="material-symbols-outlined text-4xl text-emerald-400 animate-pulse">spa</span>
                  </div>
                </>
              )}

              {/* Sympathetic state circle */}
              {activeState === 'SYMPATHETIC' && (
                <>
                  <div className="absolute w-40 h-40 rounded-full border border-rose-500/10 animate-spin" style={{ animationDuration: '10s' }} />
                  <div className="absolute w-32 h-32 rounded-full bg-rose-500/5 border border-rose-500/20 animate-ping" style={{ animationDuration: '1.2s' }} />
                  <div className="absolute w-24 h-24 rounded-full bg-rose-500/10 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-500/10">
                    <span className="material-symbols-outlined text-4xl text-rose-400 animate-bounce">bolt</span>
                  </div>
                </>
              )}

              {/* Dorsal state circle */}
              {activeState === 'DORSAL_VAGAL' && (
                <>
                  <div className="absolute w-40 h-40 rounded-full border border-cyan-500/10" />
                  <div className="absolute w-32 h-32 rounded-full bg-cyan-500/5 border border-cyan-500/20 opacity-30" />
                  <div className="absolute w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                    <span className="material-symbols-outlined text-4xl text-cyan-300">severe_cold</span>
                  </div>
                </>
              )}
            </div>

            {/* State details */}
            <div className="text-center w-full">
              <h2 className={`text-base font-bold uppercase tracking-wider mb-1 ${
                activeState === 'VENTRAL_VAGAL' ? 'text-emerald-400' :
                activeState === 'SYMPATHETIC' ? 'text-rose-400' : 'text-cyan-300'
              }`}>
                {activeState === 'VENTRAL_VAGAL' ? 'VENTRAL VAGAL SAFETY' :
                 activeState === 'SYMPATHETIC' ? 'SYMPATHETIC HYPERAROUSAL' : 'DORSAL VAGAL SHUTDOWN'}
              </h2>
              <p className="text-[10px] text-white/50 leading-relaxed px-4">
                {activeState === 'VENTRAL_VAGAL' ? 'System in restorative calm. Heart Rate Variability (HRV) is elevated; prefrontal networks fully operational.' :
                 activeState === 'SYMPATHETIC' ? 'Adrenaline & cortisol flooding. High physical tension, shallow breathing. System primed for active defensive threat response.' :
                 'Conservation state active. Oxygen reservation, low perfusion, heavy flatlining of emotional engagement. Immobilization active.'}
              </p>
            </div>

            {/* MANUAL OVERRIDE (for demo/telemetry syncing) */}
            <div className="w-full border-t border-zinc-900 mt-5 pt-4">
              <p className="text-center text-[8px] font-bold tracking-widest text-white/40 uppercase mb-2">Simulate Telemetry Sync</p>
              <div className="flex gap-1.5 justify-center">
                {(['VENTRAL_VAGAL', 'SYMPATHETIC', 'DORSAL_VAGAL'] as NervousSystemState[]).map((state) => (
                  <button
                    key={state}
                    onClick={() => setActiveState(state)}
                    className={`text-[8px] tracking-wide py-1 px-2.5 rounded-md font-bold transition-all border ${
                      activeState === state 
                        ? 'bg-violet-600 border-violet-500 text-white' 
                        : 'bg-zinc-900/60 border-zinc-800 text-white/40 hover:text-white/60'
                    }`}
                  >
                    {state === 'VENTRAL_VAGAL' ? 'CALM' : state === 'SYMPATHETIC' ? 'STRESSED' : 'FREEZE'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* REAL-TIME BIOMETRICS CARDS */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* HRV Card */}
            <div className="p-4 rounded-xl border bg-zinc-950/40 border-zinc-900">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold tracking-wider text-white/40 uppercase">HRV (Baseline)</span>
                <span className="material-symbols-outlined text-violet-400 text-base font-light">network_intelligence_history</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-white">{log.hrv}</span>
                <span className="text-xs text-white/50">ms</span>
              </div>
              
              {/* Mini Sparkline Chart */}
              <div className="h-6 w-full mt-3 flex items-end">
                <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path
                    d={
                      activeState === 'VENTRAL_VAGAL' 
                        ? "M 0 10 Q 25 2, 50 15 T 100 5" 
                        : activeState === 'SYMPATHETIC' 
                          ? "M 0 15 L 20 12 L 40 16 L 60 14 L 80 18 L 100 15"
                          : "M 0 12 L 25 12 L 50 11 L 75 12 L 100 12"
                    }
                    fill="none"
                    stroke={activeState === 'VENTRAL_VAGAL' ? '#10b981' : activeState === 'SYMPATHETIC' ? '#f43f5e' : '#22d3ee'}
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>

            {/* Heart Rate Card */}
            <div className="p-4 rounded-xl border bg-zinc-950/40 border-zinc-900">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold tracking-wider text-white/40 uppercase">Heart Rate</span>
                <span className="material-symbols-outlined text-rose-500 text-base font-light">favorite</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-white">{log.hr}</span>
                <span className="text-xs text-white/50">bpm</span>
              </div>

              {/* HR Pulsing animation representation */}
              <div className="h-6 w-full mt-3 flex items-center justify-center gap-1">
                <span className={`w-1 h-3 rounded-full bg-rose-500/50 ${activeState === 'SYMPATHETIC' ? 'animate-bounce' : 'animate-pulse'}`} style={{ animationDelay: '0s' }} />
                <span className={`w-1 h-5 rounded-full bg-rose-500/80 ${activeState === 'SYMPATHETIC' ? 'animate-bounce' : 'animate-pulse'}`} style={{ animationDelay: '0.1s' }} />
                <span className={`w-1 h-4 rounded-full bg-rose-500/50 ${activeState === 'SYMPATHETIC' ? 'animate-bounce' : 'animate-pulse'}`} style={{ animationDelay: '0.2s' }} />
                <span className={`w-1 h-2 rounded-full bg-rose-500/30 ${activeState === 'SYMPATHETIC' ? 'animate-bounce' : 'animate-pulse'}`} style={{ animationDelay: '0.3s' }} />
              </div>
            </div>

            {/* Respiration Card */}
            <div className="p-4 rounded-xl border bg-zinc-950/40 border-zinc-900">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold tracking-wider text-white/40 uppercase">Respiration</span>
                <span className="material-symbols-outlined text-emerald-400 text-base font-light">air</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-white">{log.respiration}</span>
                <span className="text-xs text-white/50">/ min</span>
              </div>
              <p className="text-[9px] text-white/40 mt-3 font-mono">Depth: {activeState === 'VENTRAL_VAGAL' ? 'Resonant/Deep' : activeState === 'SYMPATHETIC' ? 'Shallow' : 'Suppressed'}</p>
            </div>

            {/* Stress Score Card */}
            <div className="p-4 rounded-xl border bg-zinc-950/40 border-zinc-900">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold tracking-wider text-white/40 uppercase">Stress Score</span>
                <span className="material-symbols-outlined text-amber-400 text-base font-light">speed</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-white">{log.stressScore}</span>
                <span className="text-xs text-white/50">/ 100</span>
              </div>
              <p className="text-[9px] text-white/40 mt-3 font-mono">Vagal Tone: {activeState === 'VENTRAL_VAGAL' ? 'Strong' : activeState === 'SYMPATHETIC' ? 'Weak/Exhausted' : 'Numb'}</p>
            </div>
          </div>

          {/* PRESCRIPTION & INTERVENTION ZONE */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-white/40">Suggested Autonomic Protocol</h3>

            {/* Preset Intervention */}
            <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full uppercase font-mono font-bold tracking-wider">
                    {PRESET_INTERVENTIONS[activeState].type}
                  </span>
                  <h4 className="font-bold text-sm text-white mt-2">{PRESET_INTERVENTIONS[activeState].title}</h4>
                </div>
                <span className="text-xs text-white/40 font-bold tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {PRESET_INTERVENTIONS[activeState].duration}
                </span>
              </div>

              <p className="text-xs text-white/60 leading-relaxed">
                {PRESET_INTERVENTIONS[activeState].description}
              </p>

              <div className="space-y-2 border-t border-zinc-900/60 pt-4">
                <p className="text-[9px] font-bold tracking-widest text-white/40 uppercase">Steps:</p>
                {PRESET_INTERVENTIONS[activeState].steps.map((step, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-xs text-white/70">
                    <span className="font-mono text-violet-400 font-bold text-[10px] bg-violet-500/5 w-5 h-5 rounded-md flex items-center justify-center border border-violet-500/10 flex-shrink-0 mt-0.5">{idx + 1}</span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-900 text-[10px] text-violet-400/80 font-mono leading-relaxed italic">
                <span className="font-bold uppercase tracking-wide text-[9px] not-italic mr-1 text-violet-400">NEUROLOGICAL MECHANISM:</span>
                {PRESET_INTERVENTIONS[activeState].scienceDescription}
              </div>
            </div>

            {/* GEMINI PERSONALIZED INTERVENTION GENERATOR */}
            <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-400">neurology</span>
                <h4 className="font-bold text-sm text-white">AI-Generated Neuro-Intervention</h4>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                Need a completely tailored protocol? Provide details of how you are feeling (e.g. "tense shoulders", "mind spinning"), and Gemini will synthesize a personalized real-time intervention.
              </p>

              <input
                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-3 px-4 text-xs text-white placeholder:text-white/20 focus:ring-1 focus:ring-violet-500 outline-none transition-all"
                placeholder="What physical or mental sensations do you feel?"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
              />

              <button
                onClick={handleGenerateCustom}
                disabled={isGenerating}
                className="w-full h-12 rounded-xl bg-violet-600 text-white font-bold uppercase tracking-[0.2em] text-xs hover:bg-violet-500 transition-all shadow-xl shadow-violet-900/10 flex items-center justify-center gap-2"
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
                      <span className="text-[8px] bg-violet-500/15 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full uppercase font-mono font-bold tracking-wider">
                        {customIntervention.type}
                      </span>
                      <h5 className="font-bold text-xs text-white mt-1.5">{customIntervention.title}</h5>
                    </div>
                    <span className="text-[10px] text-white/50 font-semibold">{customIntervention.duration}</span>
                  </div>
                  
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    {customIntervention.description}
                  </p>

                  <div className="space-y-2.5 border-t border-zinc-900 pt-3">
                    <p className="text-[9px] font-bold text-white/40 uppercase">Customized Steps:</p>
                    {customIntervention.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-2 items-start text-xs text-white/80">
                        <span className="font-mono text-violet-400 font-bold text-[9px] bg-violet-500/10 w-4.5 h-4.5 rounded-md flex items-center justify-center border border-violet-500/15 flex-shrink-0">{idx + 1}</span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-900 text-[9px] text-violet-400/80 font-mono leading-relaxed italic">
                    <span className="font-bold uppercase tracking-wide text-[8px] not-italic mr-1 text-violet-400">SCIENCE BASIS:</span>
                    {customIntervention.scienceDescription}
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      ) : (
        /* CHAT INTERACTIVE AI COACH */
        <div className="flex-1 flex flex-col min-h-0 bg-zinc-950/10 border border-zinc-900 rounded-2xl p-4 overflow-hidden relative">
          
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-900 mb-4">
            <div className="w-8 h-8 rounded-full bg-violet-950/40 border border-violet-500/30 flex items-center justify-center text-sm">
              🧘
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Neuro-Coach</h4>
              <p className="text-[9px] text-violet-400">Attuning to your {getStateName(activeState)} state</p>
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
                    ? 'bg-violet-600 text-white rounded-br-none' 
                    : 'bg-zinc-900 text-white/90 rounded-bl-none border border-zinc-800'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[8px] text-white/30 font-mono mt-1 px-1">
                  {msg.role === 'user' ? 'You' : 'Neuro-Coach'}
                </span>
              </div>
            ))}
            {isSendingMessage && (
              <div className="mr-auto flex flex-col items-start max-w-[80%]">
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl rounded-bl-none text-xs flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-zinc-900/60 pt-3">
            <input
              type="text"
              disabled={isSendingMessage}
              className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl py-3 px-4 text-xs text-white placeholder:text-white/20 focus:ring-1 focus:ring-violet-500 outline-none transition-all"
              placeholder="Tell the coach how you are feeling physically..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={!userInput.trim() || isSendingMessage}
              className="w-11 h-11 bg-violet-600 text-white hover:bg-violet-500 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </form>

        </div>
      )}

      {/* Decorative footer */}
      <footer className="mt-8 mb-4 flex justify-center opacity-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-[1px] bg-white"></div>
          <div className="w-1 h-1 rounded-full bg-white animate-ping"></div>
          <div className="w-8 h-[1px] bg-white"></div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
