
import React from 'react';
import { UserProfile, FashionItem } from '../types';

interface Props {
  user: UserProfile;
  items: FashionItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

const DiscoveryFeed: React.FC<Props> = ({ user, items, isLoading, onRefresh }) => {
  return (
    <div className="flex flex-col min-h-screen bg-black overflow-y-auto custom-scrollbar pb-24">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl px-6 pt-8 pb-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full border border-accent p-0.5 overflow-hidden shadow-[0_0_10px_rgba(242,185,13,0.3)]">
              <img 
                src={user.icon || "https://picsum.photos/seed/avatar/200"} 
                className="w-full h-full object-cover rounded-full grayscale" 
                alt="Profile" 
              />
            </div>
            <div>
              <h1 className="font-display text-xl italic tracking-tight">Discovery</h1>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-accent">Curated for {user.name || 'You'}</p>
            </div>
          </div>
          <button 
            onClick={onRefresh}
            className={`flex size-10 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-all ${isLoading ? 'animate-spin' : ''}`}
          >
            <span className="material-symbols-outlined text-xl">sync</span>
          </button>
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/30 text-lg">search</span>
          <input 
            className="w-full bg-white/5 border border-white/10 rounded-none py-3 pl-11 pr-4 text-xs font-light tracking-widest text-white/80 focus:ring-1 focus:ring-accent outline-none" 
            placeholder="Search brands, styles, or trends..."
          />
        </div>
      </header>

      <main className="flex-1 p-6 space-y-10">
        {/* Horizontal Sections */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg uppercase tracking-[0.2em]">Top Brands</h3>
            <span className="text-[10px] font-bold text-accent tracking-[0.2em] uppercase">View All</span>
          </div>
          <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-2">
            {['Chanel', 'Dior', 'YSL', 'Prada', 'Gucci'].map(brand => (
              <div key={brand} className="flex flex-col items-center gap-2 shrink-0">
                <div className="size-16 rounded-full border border-white/10 p-1 flex items-center justify-center bg-white/5 group hover:border-accent transition-colors cursor-pointer">
                  <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center font-display text-xs text-white/60 group-hover:text-white">
                    {brand[0]}
                  </div>
                </div>
                <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/40">{brand}</span>
              </div>
            ))}
          </div>
        </section>

        {/* AI Curated Items Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg uppercase tracking-[0.2em]">Editor's Picks</h3>
            <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 px-2 py-0.5 rounded text-[9px] font-bold text-accent tracking-widest">
              <span className="material-symbols-outlined text-xs fill-1">bolt</span>
              AI STYLIST
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-8 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-[4/5] bg-white/5 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-12">
              {items.map((item) => (
                <div key={item.id} className="group">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-zinc-900 shadow-2xl">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <button className="size-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-accent hover:text-black transition-all">
                        <span className="material-symbols-outlined text-xl">favorite</span>
                      </button>
                      <button className="size-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-accent hover:text-black transition-all">
                        <span className="material-symbols-outlined text-xl">shopping_bag</span>
                      </button>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-accent tracking-[0.3em] uppercase">{item.brand}</p>
                          <h4 className="font-display text-2xl font-semibold text-white leading-tight">{item.name}</h4>
                          <div className="flex gap-2">
                             {item.tags?.slice(0, 2).map(tag => (
                               <span key={tag} className="text-[9px] px-2 py-0.5 border border-white/20 rounded-full text-white/50 uppercase tracking-widest">
                                 {tag}
                               </span>
                             ))}
                          </div>
                        </div>
                        <p className="font-serif text-lg font-bold text-white">${item.price}</p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-white/40 font-light leading-relaxed italic line-clamp-2">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-2xl border-t border-white/5 px-8 pb-8 pt-4 z-50 max-w-md mx-auto">
        <div className="flex items-center justify-around">
          <a href="#" className="flex flex-col items-center gap-1 text-accent">
            <span className="material-symbols-outlined fill-1 text-2xl">house</span>
            <span className="text-[9px] font-bold uppercase tracking-widest">Home</span>
          </a>
          <a href="#" className="flex flex-col items-center gap-1 text-white/30 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-2xl">storefront</span>
            <span className="text-[9px] font-bold uppercase tracking-widest">Shop</span>
          </a>
          <a href="#" className="flex flex-col items-center gap-1 text-white/30 hover:text-white transition-colors relative">
            <span className="material-symbols-outlined text-2xl">shopping_bag</span>
            <span className="text-[9px] font-bold uppercase tracking-widest">Bag</span>
            <div className="absolute -top-1 -right-1 size-3.5 bg-accent rounded-full text-[8px] flex items-center justify-center text-black border-2 border-black font-bold">3</div>
          </a>
          <a href="#" className="flex flex-col items-center gap-1 text-white/30 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-2xl">person</span>
            <span className="text-[9px] font-bold uppercase tracking-widest">Profile</span>
          </a>
        </div>
      </nav>
    </div>
  );
};

export default DiscoveryFeed;
