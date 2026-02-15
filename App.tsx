
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, UserProfile, FashionItem, StyleOption } from './types';
import OnboardingStyle from './views/OnboardingStyle';
import OnboardingBudget from './views/OnboardingBudget';
import OnboardingProfile from './views/OnboardingProfile';
import DiscoveryFeed from './views/DiscoveryFeed';
import { curateFashionItems } from './geminiService';

const STYLE_OPTIONS: StyleOption[] = [
  { id: 'streetwear', name: 'Streetwear', image: 'https://picsum.photos/seed/fashion1/600/800' },
  { id: 'minimalist', name: 'Minimalist', image: 'https://picsum.photos/seed/fashion2/600/800' },
  { id: 'luxury', name: 'Luxury', image: 'https://picsum.photos/seed/fashion3/600/800' },
  { id: 'vintage', name: 'Vintage', image: 'https://picsum.photos/seed/fashion4/600/800' },
  { id: 'avant-garde', name: 'Avant-Garde', image: 'https://picsum.photos/seed/fashion5/600/800' },
  { id: 'athleisure', name: 'Athleisure', image: 'https://picsum.photos/seed/fashion6/600/800' },
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('ONBOARDING_STYLE');
  const [user, setUser] = useState<UserProfile>({
    name: '',
    icon: '',
    location: '',
    bio: '',
    budgetRange: '$500 — $2,000',
    selectedStyles: [],
    pinterestBoard: '',
  });
  const [curatedItems, setCuratedItems] = useState<FashionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCuration = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await curateFashionItems(user);
      setCuratedItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (view === 'DISCOVERY' && curatedItems.length === 0) {
      fetchCuration();
    }
  }, [view, curatedItems.length, fetchCuration]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (view === 'ONBOARDING_STYLE') setView('ONBOARDING_BUDGET');
    else if (view === 'ONBOARDING_BUDGET') setView('ONBOARDING_PROFILE');
    else if (view === 'ONBOARDING_PROFILE') setView('DISCOVERY');
  };

  const renderView = () => {
    switch (view) {
      case 'ONBOARDING_STYLE':
        return (
          <OnboardingStyle 
            options={STYLE_OPTIONS}
            selected={user.selectedStyles}
            onToggle={(id) => {
              const next = user.selectedStyles.includes(id) 
                ? user.selectedStyles.filter(s => s !== id)
                : [...user.selectedStyles, id];
              updateProfile({ selectedStyles: next });
            }}
            onNext={handleNext}
          />
        );
      case 'ONBOARDING_BUDGET':
        return (
          <OnboardingBudget 
            value={user.budgetRange}
            onChange={(val) => updateProfile({ budgetRange: val })}
            onNext={handleNext}
            onBack={() => setView('ONBOARDING_STYLE')}
          />
        );
      case 'ONBOARDING_PROFILE':
        return (
          <OnboardingProfile 
            user={user}
            onChange={updateProfile}
            onNext={handleNext}
            onBack={() => setView('ONBOARDING_BUDGET')}
          />
        );
      case 'DISCOVERY':
        return (
          <DiscoveryFeed 
            user={user}
            items={curatedItems}
            isLoading={isLoading}
            onRefresh={fetchCuration}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-black text-white relative flex flex-col overflow-x-hidden border-x border-white/5">
      {renderView()}
    </div>
  );
};

export default App;
