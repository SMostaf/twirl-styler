
import React from 'react';
import { StyleOption } from '../types';

interface Props {
  options: StyleOption[];
  selected: string[];
  onToggle: (id: string) => void;
  onNext: () => void;
}

const OnboardingStyle: React.FC<Props> = ({ options, selected, onToggle, onNext }) => {
  return (
    <div className="flex flex-col h-full min-h-screen px-6 py-8">
      <header className="flex justify-between items-center mb-8">
        <div className="w-8" />
        <h1 className="font-display text-lg tracking-[0.2em] uppercase">Élan Style</h1>
        <button onClick={onNext} className="text-white/40 text-xs tracking-widest uppercase hover:text-white transition-colors">Skip</button>
      </header>

      <div className="text-center mb-10">
        <h2 className="font-display text-4xl font-semibold mb-3">Define Your Vibe</h2>
        <p className="text-white/50 text-sm font-light leading-relaxed">Select at least 3 styles to personalize your luxury feed.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 mb-24 overflow-y-auto custom-scrollbar">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <div 
              key={option.id}
              onClick={() => onToggle(option.id)}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg cursor-pointer transition-all duration-500 ${isSelected ? 'ring-2 ring-accent' : ''}`}
            >
              <img 
                src={option.image} 
                alt={option.name}
                className={`w-full h-full object-cover transition-transform duration-700 ${isSelected ? 'scale-110 grayscale-0' : 'grayscale'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {isSelected && (
                <div className="absolute top-3 right-3 bg-accent rounded-full p-1 shadow-lg">
                  <span className="material-symbols-outlined text-black text-xs font-bold">check</span>
                </div>
              )}

              <div className="absolute bottom-4 left-4">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white">{option.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent max-w-md mx-auto">
        <button 
          onClick={onNext}
          disabled={selected.length < 3}
          className={`w-full h-14 rounded-lg flex items-center justify-center gap-2 font-bold uppercase tracking-[0.25em] text-sm transition-all shadow-xl shadow-accent/10 ${selected.length >= 3 ? 'bg-accent text-black hover:bg-accent/90' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
        >
          Continue
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
        <p className="text-center text-[9px] text-white/40 mt-4 tracking-[0.1em] uppercase">
          Selected {selected.length}/3 styles required
        </p>
      </div>
    </div>
  );
};

export default OnboardingStyle;
