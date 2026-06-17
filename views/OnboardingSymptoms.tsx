import React from 'react';

interface SymptomOption {
  id: string;
  name: string;
  description: string;
  science: string;
  icon: string;
  color: string;
}

const SYMPTOM_OPTIONS: SymptomOption[] = [
  {
    id: 'hyperarousal',
    name: 'Anxiety & Hyperarousal',
    description: 'Panic, racing thoughts, fast heart rate, physical restlessness.',
    science: 'Sympathetic nervous system overdrive (Fight or Flight).',
    icon: 'bolt',
    color: 'from-amber-500/20 to-red-500/20 border-amber-500/30 text-amber-400'
  },
  {
    id: 'brainfog',
    name: 'ADHD & Brain Fog',
    description: 'Difficulty focusing, sensory overload, cognitive fatigue.',
    science: 'Prefrontal cortex deregulation & dopamine pathway depletion.',
    icon: 'psychology',
    color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-400'
  },
  {
    id: 'burnout',
    name: 'Burnout & Fatigue',
    description: 'Chronic exhaustion, physical depletion, emotional flatlining.',
    science: 'HPA-axis dysfunction and nervous system energy depletion.',
    icon: 'battery_very_low',
    color: 'from-orange-500/20 to-amber-700/20 border-orange-500/30 text-orange-400'
  },
  {
    id: 'trauma',
    name: 'Trauma & Tension',
    description: 'Chronic muscle tightness, hypervigilance, emotional flashbacks.',
    science: 'Trapped somatic memories in fascia & neuromuscular junctions.',
    icon: 'healing',
    color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-400'
  },
  {
    id: 'hypoarousal',
    name: 'Freeze & Numbness',
    description: 'Feeling disconnected, low motivation, emotional flatlining.',
    science: 'Dorsal vagal shutdown of the parasympathetic system.',
    icon: 'severe_cold',
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400'
  }
];

interface Props {
  selected: string[];
  onToggle: (id: string) => void;
  onNext: () => void;
}

const OnboardingSymptoms: React.FC<Props> = ({ selected, onToggle, onNext }) => {
  return (
    <div className="flex flex-col h-full min-h-screen px-6 py-8">
      <header className="flex justify-between items-center mb-8">
        <div className="w-8" />
        <h1 className="font-display text-lg tracking-[0.2em] uppercase text-violet-400 font-semibold">NEUROPATH</h1>
        <button onClick={onNext} className="text-white/40 text-xs tracking-widest uppercase hover:text-white transition-colors">Skip</button>
      </header>

      <div className="text-center mb-8">
        <span className="text-[10px] font-bold tracking-[0.3em] text-violet-500 uppercase">STEP 1 OF 3</span>
        <h2 className="font-display text-3xl font-bold mt-2 mb-3 text-white">Calibrate Your State</h2>
        <p className="text-white/60 text-sm font-light leading-relaxed">
          Select the physiological symptoms you experience most. We will configure your Digital Twin based on these baseline markers.
        </p>
      </div>

      <div className="flex-1 space-y-4 mb-28 overflow-y-auto custom-scrollbar pr-1">
        {SYMPTOM_OPTIONS.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <div
              key={option.id}
              onClick={() => onToggle(option.id)}
              className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 bg-gradient-to-r ${
                isSelected 
                  ? `${option.color} scale-[1.02] ring-1 ring-violet-500` 
                  : 'bg-zinc-950/40 border-zinc-900 text-white/70 hover:border-zinc-800'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center ${isSelected ? 'text-violet-400' : 'text-white/40'}`}>
                  <span className="material-symbols-outlined font-light text-2xl">{option.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-sm text-white">{option.name}</h3>
                    {isSelected && (
                      <span className="material-symbols-outlined text-violet-400 text-sm font-bold">check_circle</span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mb-2 leading-relaxed">{option.description}</p>
                  <p className="text-[10px] text-violet-400/80 font-mono italic leading-snug">
                    <span className="font-bold uppercase text-[9px] tracking-wide not-italic mr-1">BIO-MARKER:</span>
                    {option.science}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent max-w-md mx-auto">
        <button
          onClick={onNext}
          disabled={selected.length === 0}
          className={`w-full h-14 rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-[0.25em] text-sm transition-all shadow-xl ${
            selected.length > 0 
              ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-violet-900/20' 
              : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
          }`}
        >
          Calibrate System
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
        <p className="text-center text-[9px] text-white/40 mt-4 tracking-[0.1em] uppercase">
          {selected.length === 0 
            ? 'Select at least one symptom to calibrate' 
            : `Selected ${selected.length} symptom${selected.length > 1 ? 's' : ''}`
          }
        </p>
      </div>
    </div>
  );
};

export default OnboardingSymptoms;
