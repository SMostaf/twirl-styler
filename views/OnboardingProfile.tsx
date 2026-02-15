
import React from 'react';
import { UserProfile } from '../types';

interface Props {
  user: UserProfile;
  onChange: (updates: Partial<UserProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

const OnboardingProfile: React.FC<Props> = ({ user, onChange, onNext, onBack }) => {
  return (
    <div className="flex flex-col min-h-screen px-6 py-8">
      <header className="flex items-center justify-between mb-12">
        <button onClick={onBack} className="text-white hover:text-accent transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-serif text-2xl font-bold tracking-widest uppercase">Set Profile</h1>
        <div className="w-6"></div>
      </header>

      <div className="flex flex-col items-center mb-12">
        <div className="relative group cursor-pointer">
          <div className="w-32 h-32 rounded-full border border-white/40 flex items-center justify-center overflow-hidden bg-zinc-900 shadow-2xl">
            {user.icon ? (
              <img src={user.icon} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="bg-center bg-no-repeat aspect-square bg-cover w-full h-full opacity-60" style={{ backgroundImage: `url(https://picsum.photos/seed/avatar/200)` }}></div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
            </div>
          </div>
        </div>
        <button className="mt-4 text-[10px] tracking-[0.2em] uppercase text-white/60 hover:text-accent transition-colors">
          Change Photo
        </button>
      </div>

      <div className="space-y-8 flex-1">
        <div className="space-y-1">
          <label className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-bold">Full Name</label>
          <input 
            className="w-full bg-transparent border-0 border-b border-white/20 py-2 text-lg text-white placeholder:text-white/10 focus:ring-0 focus:border-accent transition-all"
            placeholder="Coco Chanel"
            value={user.name}
            onChange={e => onChange({ name: e.target.value })}
          />
        </div>

        <div className="space-y-3 pb-4 border-b border-white/10">
          <label className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-bold">Mood Board</label>
          <div className="relative">
            <input 
              className="w-full bg-white/5 border border-white/20 rounded-lg py-4 pl-12 pr-4 text-xs tracking-wider placeholder:text-white/20 focus:ring-1 focus:ring-accent/50 outline-none"
              placeholder="Paste Pinterest Board URL"
              value={user.pinterestBoard}
              onChange={e => onChange({ pinterestBoard: e.target.value })}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
               <svg className="w-5 h-5 fill-white/50" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.966 1.406-5.966s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.621 0 11.988-5.367 11.988-11.987C24.005 5.367 18.638 0 12.017 0z"></path>
              </svg>
            </div>
          </div>
          <p className="text-[9px] italic text-white/30 uppercase tracking-widest text-center">Sync your Pinterest board for AI-powered styling</p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-bold">Style Bio</label>
          <textarea 
            className="w-full bg-transparent border-0 border-b border-white/20 py-2 text-lg text-white placeholder:text-white/10 focus:ring-0 focus:border-accent transition-all resize-none h-20"
            placeholder="Fashion fades, only style remains the same."
            value={user.bio}
            onChange={e => onChange({ bio: e.target.value })}
          />
        </div>
      </div>

      <div className="pt-10 flex flex-col gap-4">
        <button 
          onClick={onNext}
          className="bg-accent text-black font-bold py-5 rounded-lg tracking-[0.2em] uppercase text-sm hover:brightness-110 transition-all shadow-2xl shadow-accent/20"
        >
          Complete Profile
        </button>
        <button 
          onClick={onNext}
          className="text-white/40 font-normal py-2 tracking-[0.1em] text-xs hover:text-white transition-colors"
        >
          Skip for now
        </button>
      </div>

      <footer className="mt-12 flex justify-center opacity-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-[1px] bg-white"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          <div className="w-12 h-[1px] bg-white"></div>
        </div>
      </footer>
    </div>
  );
};

export default OnboardingProfile;
