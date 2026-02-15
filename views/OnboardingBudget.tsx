
import React from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const BUDGET_RANGES = [
  "$100 — $500",
  "$500 — $2,000",
  "$2,000 — $5,000",
  "$5,000+ EXCLUSIVE"
];

const OnboardingBudget: React.FC<Props> = ({ value, onChange, onNext, onBack }) => {
  return (
    <div className="flex flex-col min-h-screen px-8 py-8">
      <header className="flex items-center justify-between mb-12">
        <button onClick={onBack} className="text-white hover:opacity-70 transition-opacity">
          <span className="material-symbols-outlined text-[28px]">arrow_back</span>
        </button>
        <div className="flex gap-1.5">
          <div className="h-1 w-8 rounded-full bg-white/20"></div>
          <div className="h-1 w-8 rounded-full bg-primary"></div>
          <div className="h-1 w-8 rounded-full bg-white/20"></div>
        </div>
        <div className="w-8"></div>
      </header>

      <div className="text-center mb-12">
        <h1 className="font-display text-[34px] tracking-[0.1em] font-medium leading-tight mb-4 uppercase">
          Set Your Budget
        </h1>
        <p className="text-white/60 text-sm font-light leading-relaxed max-w-[280px] mx-auto italic">
          Tell us your preferred price range to refine your recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-10">
        {BUDGET_RANGES.map((range) => (
          <label 
            key={range}
            className={`group relative flex cursor-pointer items-center justify-between rounded-lg border p-5 transition-all ${
              value === range 
              ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(244,37,140,0.1)]' 
              : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <span className={`text-lg font-light tracking-wide ${range.includes('EXCLUSIVE') ? 'text-white' : 'text-white/90'}`}>
              {range.split(' ')[0]} {range.includes('EXCLUSIVE') ? '' : '—'} {range.split(' ')[2] || ''}
              {range.includes('EXCLUSIVE') && <span className="ml-2 text-[10px] uppercase tracking-widest text-primary font-bold italic">Exclusive</span>}
            </span>
            <input 
              type="radio" 
              name="budget" 
              className="hidden" 
              checked={value === range}
              onChange={() => onChange(range)}
            />
            <div className={`size-5 rounded-full border flex items-center justify-center transition-all ${value === range ? 'border-primary bg-primary' : 'border-white/20'}`}>
              <div className={`size-2 rounded-full bg-white transition-opacity ${value === range ? 'opacity-100' : 'opacity-0'}`}></div>
            </div>
          </label>
        ))}
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Or set a custom limit</h3>
          <span className="text-primary text-sm font-medium">{value}</span>
        </div>
        <div className="relative px-2">
          <div className="h-[2px] w-full bg-white/10 rounded-full relative flex items-center">
            <div className="h-full bg-primary/40 w-[60%] ml-[15%] relative">
              <div className="absolute -left-2 -top-2 size-4 rounded-full bg-white border-2 border-primary shadow-[0_0_10px_rgba(244,37,140,0.3)]"></div>
              <div className="absolute -right-2 -top-2 size-4 rounded-full bg-white border-2 border-primary shadow-[0_0_10px_rgba(244,37,140,0.3)]"></div>
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <span className="text-[10px] text-white/30 uppercase tracking-widest">$0</span>
            <span className="text-[10px] text-white/30 uppercase tracking-widest">$10k+</span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <button 
          onClick={onNext}
          className="w-full bg-primary text-white font-semibold py-4 rounded-lg tracking-[0.1em] uppercase text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          Continue
        </button>
        <button onClick={onNext} className="w-full bg-transparent text-white/40 font-medium py-3 rounded-lg tracking-[0.1em] uppercase text-xs hover:text-white transition-all">
          I'll do this later
        </button>
      </div>

      <div className="h-32 w-full mt-8 opacity-20 grayscale overflow-hidden rounded-t-2xl">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800" 
          alt="Boutique interior"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default OnboardingBudget;
