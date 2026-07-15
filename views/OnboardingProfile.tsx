import React from 'react';
import { UserProfile, NervousSystemState } from '../types';

interface Props {
  user: UserProfile;
  onChange: (updates: Partial<UserProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

const BASELINE_STATES: { id: NervousSystemState; name: string; desc: string; color: string }[] = [
  {
    id: 'VENTRAL_VAGAL',
    name: 'Ventral Vagal (Safe / Regulated)',
    desc: 'You feel calm, socially connected, open, and physically relaxed.',
    color: 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10'
  },
  {
    id: 'SYMPATHETIC',
    name: 'Sympathetic (Stressed / Fight-Flight)',
    desc: 'You feel anxious, hyperactive, highly focused, or tense.',
    color: 'border-rose-300/50 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10'
  },
  {
    id: 'DORSAL_VAGAL',
    name: 'Dorsal Vagal (Shutdown / Freeze)',
    desc: 'You feel tired, emotionally flat, numb, or unmotivated.',
    color: 'border-cyan-300/50 text-cyan-600 bg-cyan-500/5 hover:bg-cyan-500/10'
  }
];

const GOAL_OPTIONS = [
  { id: 'alerts', label: 'Real-time Dysregulation Alerts' },
  { id: 'somatic', label: 'Somatic Trauma Release' },
  { id: 'sleep', label: 'Sleep Architecture Optimization' },
  { id: 'vagus', label: 'Vagus Nerve Stimulation' },
  { id: 'audit', label: 'Daily Nervous System Auditing' }
];

const AVATAR_OPTIONS = ['🧠', '🧘', '❤️', '✨', '⚡'];

const OnboardingProfile: React.FC<Props> = ({ user, onChange, onNext, onBack }) => {
  const toggleGoal = (goalId: string) => {
    const goals = user.goals || [];
    const updated = goals.includes(goalId)
      ? goals.filter(g => g !== goalId)
      : [...goals, goalId];
    onChange({ goals: updated });
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-8">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="text-white/40 hover:text-white transition-colors">
          <span className="material-symbols-outlined font-light text-xl">arrow_back</span>
        </button>
        <h1 className="font-display text-lg tracking-[0.2em] uppercase text-violet-600 font-semibold">NEUROPATH</h1>
        <button onClick={onNext} className="text-white/40 text-xs tracking-widest uppercase hover:text-white transition-colors">Skip</button>
      </header>

      <div className="text-center mb-8">
        <span className="text-[10px] font-bold tracking-[0.3em] text-violet-500 uppercase">STEP 3 OF 3</span>
        <h2 className="font-display text-3xl font-bold mt-2 mb-3 text-white">Create Your Profile</h2>
        <p className="text-white/60 text-sm font-light leading-relaxed">
          Configure your baseline state and goals to initialize your NeuroPath AI Coach and Digital Twin mapping.
        </p>
      </div>

      <div className="space-y-8 flex-1 mb-28 overflow-y-auto custom-scrollbar pr-1">
        {/* Avatar select */}
        <div className="space-y-3">
          <label className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-bold">Select Twin Anchor Avatar</label>
          <div className="flex justify-between gap-2">
            {AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar}
                onClick={() => onChange({ icon: avatar })}
                className={`w-14 h-14 rounded-xl border flex items-center justify-center text-2xl transition-all duration-300 ${
                  user.icon === avatar 
                    ? 'bg-violet-950/30 border-violet-500 scale-110 shadow-lg shadow-violet-500/20' 
                    : 'bg-stone-100/80 border-stone-200 hover:border-stone-300'
                }`}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        {/* Full name input */}
        <div className="space-y-2">
          <label className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-bold">Full Name</label>
          <input 
            className="w-full bg-stone-100/80 border border-stone-200 rounded-xl py-3 px-4 text-sm text-white placeholder:text-stone-400/50 focus:ring-1 focus:ring-violet-500 outline-none transition-all"
            placeholder="Dr. Jordan West"
            value={user.name}
            onChange={e => onChange({ name: e.target.value })}
          />
        </div>

        {/* Baseline State select */}
        <div className="space-y-3">
          <label className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-bold">Current Basline State</label>
          <div className="space-y-2">
            {BASELINE_STATES.map((state) => {
              const isSelected = user.baselineState === state.id;
              return (
                <div
                  key={state.id}
                  onClick={() => onChange({ baselineState: state.id })}
                  className={`p-3 rounded-xl cursor-pointer border transition-all duration-300 ${
                    isSelected 
                      ? `${state.color} scale-[1.01] ring-1 ring-violet-500/20` 
                      : 'bg-stone-100/80 border-stone-200 text-white/70 hover:border-stone-300'
                  }`}
                >
                  <h4 className="font-semibold text-xs text-white mb-0.5">{state.name}</h4>
                  <p className="text-[10px] text-white/40 leading-normal">{state.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Goals multi-select */}
        <div className="space-y-3">
          <label className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-bold">Your Main Optimization Goals</label>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((goal) => {
              const isSelected = (user.goals || []).includes(goal.id);
              return (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`text-[10px] tracking-wider py-2 px-3 rounded-xl border font-medium transition-all ${
                    isSelected 
                      ? 'bg-violet-950/30 border-violet-500 text-violet-300' 
                      : 'bg-stone-100/80 border-stone-200 text-white/40 hover:border-stone-300'
                  }`}
                >
                  {goal.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bio text area */}
        <div className="space-y-2">
          <label className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-bold">Your Personal Context (Trauma/Burnout Profile)</label>
          <textarea 
            className="w-full bg-stone-100/80 border border-stone-200 rounded-xl py-3 px-4 text-xs text-white placeholder:text-stone-400/50 focus:ring-1 focus:ring-violet-500 outline-none transition-all resize-none h-24"
            placeholder="Share what is happening in your nervous system. E.g., 'Dealing with executive dysfunction, persistent hyper-vigilance under pressure, and insomnia...'"
            value={user.bio}
            onChange={e => onChange({ bio: e.target.value })}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent max-w-md mx-auto">
        <button
          onClick={onNext}
          disabled={!user.name || !user.icon || (user.goals || []).length === 0}
          className={`w-full h-14 rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-[0.25em] text-sm transition-all shadow-xl ${
            user.name && user.icon && (user.goals || []).length > 0
              ? 'bg-violet-600 text-white hover:bg-violet-600 shadow-violet-900/20' 
              : 'bg-white/5 text-white/20 cursor-not-allowed border border-stone-200/50'
          }`}
        >
          Initialize Twin
          <span className="material-symbols-outlined text-sm">rocket_launch</span>
        </button>
        <p className="text-center text-[9px] text-white/40 mt-4 tracking-[0.1em] uppercase">
          Required: Avatar, Name, and at least one goal
        </p>
      </div>
    </div>
  );
};

export default OnboardingProfile;
