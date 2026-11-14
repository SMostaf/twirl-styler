import React, { useState } from 'react';
import { AppView, UserProfile } from './types';
import OnboardingSymptoms from './views/OnboardingSymptoms';
import OnboardingDevices from './views/OnboardingDevices';
import OnboardingProfile from './views/OnboardingProfile';
import Dashboard from './views/Dashboard';
import KpiDashboard from './views/KpiDashboard';
import BusinessDashboard from './views/BusinessDashboard';
import LandingPage from './views/LandingPage';
import { AuthWrapper, SignInPage, SignUpPage } from './auth';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LANDING');
  const [user, setUser] = useState<UserProfile>({
    name: '',
    icon: '🧠',
    baselineState: 'VENTRAL_VAGAL',
    bio: '',
    symptoms: [],
    devices: [],
    goals: [],
  });

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (view === 'ONBOARDING_SYMPTOMS') setView('ONBOARDING_DEVICES');
    else if (view === 'ONBOARDING_DEVICES') setView('ONBOARDING_PROFILE');
    else if (view === 'ONBOARDING_PROFILE') setView('DASHBOARD');
  };

  const handleBack = () => {
    if (view === 'ONBOARDING_DEVICES') setView('ONBOARDING_SYMPTOMS');
    else if (view === 'ONBOARDING_PROFILE') setView('ONBOARDING_DEVICES');
  };

  const handleReset = () => {
    setView('ONBOARDING_SYMPTOMS');
    setUser({
      name: '',
      icon: '🧠',
      baselineState: 'VENTRAL_VAGAL',
      bio: '',
      symptoms: [],
      devices: [],
      goals: [],
    });
  };

  const renderView = () => {
    switch (view) {
      case 'LANDING':
        return (
          <LandingPage
            onStart={handleNext}
            onViewChange={setView}
          />
        );
      case 'ONBOARDING_SYMPTOMS':
        return (
          <OnboardingSymptoms 
            selected={user.symptoms}
            onToggle={(id) => {
              const next = user.symptoms.includes(id) 
                ? user.symptoms.filter(s => s !== id)
                : [...user.symptoms, id];
              updateProfile({ symptoms: next });
            }}
            onNext={handleNext}
          />
        );
      case 'ONBOARDING_DEVICES':
        return (
          <OnboardingDevices 
            selected={user.devices}
            onToggle={(id) => {
              const next = user.devices.includes(id) 
                ? user.devices.filter(d => d !== id)
                : [...user.devices, id];
              updateProfile({ devices: next });
            }}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'ONBOARDING_PROFILE':
        return (
          <OnboardingProfile 
            user={user}
            onChange={updateProfile}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'DASHBOARD':
        return (
          <Dashboard 
            user={user}
            onReset={handleReset}
            onViewChange={setView}
          />
        );
      case 'KPI_DASHBOARD':
        return (
          <KpiDashboard 
            onBack={() => setView('DASHBOARD')}
            onViewChange={setView}
          />
        );
      case 'BUSINESS_DASHBOARD':
        return (
          <BusinessDashboard
            onBack={() => setView('DASHBOARD')}
            onViewChange={setView}
          />
        );
      case 'SIGN_IN':
        return <SignInPage />;
      case 'SIGN_UP':
        return <SignUpPage />;
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <AuthWrapper>
      <div className={`min-h-screen bg-stone-50 text-stone-900 relative flex flex-col overflow-x-hidden ${view === 'KPI_DASHBOARD' || view === 'BUSINESS_DASHBOARD' ? '' : 'max-w-md mx-auto border-x border-stone-200/50'}`}>
        {renderView()}
      </div>
    </AuthWrapper>
  );
};

export default App;
