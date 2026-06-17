import React from 'react';

interface DeviceOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  features: string[];
}

const DEVICE_OPTIONS: DeviceOption[] = [
  {
    id: 'apple',
    name: 'Apple Watch',
    description: 'High-frequency HRV monitoring and ECG neural-baseline sync.',
    icon: 'watch',
    features: ['Ventral Vagal baseline matching', 'Real-time hyperarousal alerts']
  },
  {
    id: 'oura',
    name: 'Oura Ring',
    description: 'High-precision sleep architecture tracking and temperature flux.',
    icon: 'trip_origin',
    features: ['Dorsal Vagal sleep recovery auditing', 'Autonomic stress scores']
  },
  {
    id: 'garmin',
    name: 'Garmin Active',
    description: 'Continuous Body Battery estimation and high-fidelity autonomic telemetry.',
    icon: 'watch_button_press',
    features: ['Somatic stress-response curves', 'Respiration rate analysis']
  },
  {
    id: 'fitbit',
    name: 'Fitbit / Pixel',
    description: 'Electrodermal activity (EDA) sensor alignment and active zone minutes.',
    icon: 'grid_view',
    features: ['Sympathetic tone activation indexes', 'Sleep staging alerts']
  },
  {
    id: 'none',
    name: 'No Wearable (Manual Sync)',
    description: 'Use camera-based heart-rate tracking and regular subjective nervous system audits.',
    icon: 'camera_front',
    features: ['Photoplethysmography (PPG) scan', 'Somatic self-attunement guides']
  }
];

interface Props {
  selected: string[];
  onToggle: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const OnboardingDevices: React.FC<Props> = ({ selected, onToggle, onNext, onBack }) => {
  return (
    <div className="flex flex-col h-full min-h-screen px-6 py-8">
      <header className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="flex items-center text-white/40 hover:text-white transition-colors">
          <span className="material-symbols-outlined font-light text-xl">arrow_back</span>
        </button>
        <h1 className="font-display text-lg tracking-[0.2em] uppercase text-violet-400 font-semibold">NEUROPATH</h1>
        <button onClick={onNext} className="text-white/40 text-xs tracking-widest uppercase hover:text-white transition-colors">Skip</button>
      </header>

      <div className="text-center mb-8">
        <span className="text-[10px] font-bold tracking-[0.3em] text-violet-500 uppercase">STEP 2 OF 3</span>
        <h2 className="font-display text-3xl font-bold mt-2 mb-3 text-white">Biometric Telemetry</h2>
        <p className="text-white/60 text-sm font-light leading-relaxed">
          Select your wearable devices. We integrate with their APIs to continuously feed real-time autonomic nervous system data into your Digital Twin.
        </p>
      </div>

      <div className="flex-1 space-y-4 mb-28 overflow-y-auto custom-scrollbar pr-1">
        {DEVICE_OPTIONS.map((device) => {
          const isSelected = selected.includes(device.id);
          return (
            <div
              key={device.id}
              onClick={() => onToggle(device.id)}
              className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 ${
                isSelected 
                  ? 'bg-violet-950/20 border-violet-500/50 text-white scale-[1.01] ring-1 ring-violet-500/20' 
                  : 'bg-zinc-950/40 border-zinc-900 text-white/70 hover:border-zinc-800'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center ${isSelected ? 'text-violet-400' : 'text-white/40'}`}>
                  <span className="material-symbols-outlined font-light text-2xl">{device.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-sm text-white">{device.name}</h3>
                    {isSelected && (
                      <span className="material-symbols-outlined text-violet-400 text-sm font-bold">check_circle</span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mb-3 leading-relaxed">{device.description}</p>
                  
                  {/* Features tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {device.features.map((feature, idx) => (
                      <span 
                        key={idx} 
                        className={`text-[9px] px-2 py-0.5 rounded-full font-medium tracking-wide ${
                          isSelected 
                            ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20' 
                            : 'bg-zinc-900 text-white/30 border border-zinc-800'
                        }`}
                      >
                        • {feature}
                      </span>
                    ))}
                  </div>
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
          Initialize Telemetry
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
        <p className="text-center text-[9px] text-white/40 mt-4 tracking-[0.1em] uppercase">
          {selected.length === 0 
            ? 'Select at least one tracking source to initialize' 
            : `Selected ${selected.length} telemetry source${selected.length > 1 ? 's' : ''}`
          }
        </p>
      </div>
    </div>
  );
};

export default OnboardingDevices;
