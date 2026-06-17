export type AppView = 'ONBOARDING_SYMPTOMS' | 'ONBOARDING_DEVICES' | 'ONBOARDING_PROFILE' | 'DASHBOARD';

export type NervousSystemState = 'VENTRAL_VAGAL' | 'SYMPATHETIC' | 'DORSAL_VAGAL';

export interface UserProfile {
  name: string;
  symptoms: string[];
  devices: string[];
  goals: string[];
  baselineState: NervousSystemState;
  bio: string;
}

export interface BiometricLog {
  timestamp: string;
  hrv: number;
  hr: number;
  respiration: number;
  stressScore: number;
}

export interface Intervention {
  id: string;
  title: string;
  type: 'breathwork' | 'somatic' | 'cognitive' | 'sleep';
  duration: string;
  description: string;
  steps: string[];
  scienceDescription: string;
}
