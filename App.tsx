import React, { useState } from 'react';
import { AppView, UserProfile } from './types';
import OnboardingSymptoms from './views/OnboardingSymptoms';
import OnboardingDevices from './views/OnboardingDevices';
import OnboardingProfile from './views/OnboardingProfile';
import Dashboard from './views/Dashboard';
import ClinicianDashboard from './views/ClinicianDashboard';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('ONBOARDING_SYMPTOMS');
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
            onSwitchToClinician={() => setView('CLINICIAN_DASHBOARD')}
          />
        );
      case 'CLINICIAN_DASHBOARD':
        return (
          <ClinicianDashboard 
            onSwitchToPatient={() => setView('DASHBOARD')}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  const isClinician = view === 'CLINICIAN_DASHBOARD';

  return (
    <div className={`min-h-screen ${isClinician ? 'max-w-5xl' : 'max-w-md'} w-full mx-auto bg-black text-white relative flex flex-col overflow-x-hidden border-x border-white/5 transition-all duration-300`}>
      {renderView()}
    </div>
  );
};

export default App;
