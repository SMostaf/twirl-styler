export type AppView = 'ONBOARDING_SYMPTOMS' | 'ONBOARDING_DEVICES' | 'ONBOARDING_PROFILE' | 'DASHBOARD';

export type NervousSystemState = 'VENTRAL_VAGAL' | 'SYMPATHETIC' | 'DORSAL_VAGAL';

export interface UserProfile {
  name: string;
  icon?: string;
  symptoms: string[];
  devices: string[];
  goals: string[];
  baselineState: NervousSystemState;
  bio: string;
}

export interface SleepMetrics {
  sleepDuration: number; // total sleep time (TST) in hours
  sleepOnsetLatency: number; // minutes to fall asleep
  waso: number; // wake after sleep onset in minutes
  sleepEfficiency: number; // percentage (TIB vs TST)
  deepSleepRatio: number; // percentage of slow wave sleep (N3)
  remSleepRatio: number; // percentage of REM sleep
  overnightHrvDelta: number; // overnight HRV surge (morning HRV - evening HRV) in ms
  restingHeartRateNadir: number; // lowest overnight heart rate in bpm
}

export interface BiometricLog {
  timestamp: string;
  heartRateVariabilitySDNN: number; // standard deviation of NN (normal-to-normal) intervals (ms)
  heartRate: number; // beat-to-beat current heart rate (bpm)
  restingHeartRate: number; // baseline heart rate when inactive (bpm)
  respiratoryRate: number; // breaths per minute during rest/sleep (bpm)
  activeEnergyBurned: number; // daily active calories burned (kcal)
  stepCount: number; // daily step count
  appleSleepingWristTemperature: number; // sleeping wrist temperature (°C)
  appleSleepingBreathingDisturbances: number; // respiratory events count during sleep
  sleepAnalysis: SleepMetrics;
  stressScore: number; // calculated overall autonomic stress metric
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

/**
 * Computes the autonomic nervous system (ANS) state based on Apple HealthKit metrics 
 * and Polyvagal Theory principles.
 */
export function computeNervousSystemState(metrics: BiometricLog): {
  state: NervousSystemState;
  vagalToneScore: number; // 0-100%
  explanation: string;
} {
  const hrv = metrics.heartRateVariabilitySDNN;
  const hr = metrics.heartRate;
  const rhr = metrics.restingHeartRate;
  const rr = metrics.respiratoryRate;
  const sleep = metrics.sleepAnalysis;

  let sympatheticScore = 0;
  let ventralScore = 0;
  let dorsalScore = 0;

  // 1. HRV SDNN - Autonomic Resilience indicator
  if (hrv >= 50) {
    ventralScore += 35;
  } else if (hrv < 25) {
    sympatheticScore += 25;
    dorsalScore += 20; // dorsal also exhibits depressed HRV, but can have low heart rate
  } else { // 25 - 49 ms
    dorsalScore += 25;
    sympatheticScore += 15;
  }

  // 2. Heart Rate - Real-time Arousal indicator
  if (hr > 90 || rhr > 80) {
    sympatheticScore += 35;
  } else if (hr < 55) {
    dorsalScore += 35; // bradycardia associated with conservation / immobilization
  } else { // 55 - 79 bpm (healthy calm/resting)
    ventralScore += 35;
  }

  // 3. Respiratory Rate - Biofeedback & CO2 tolerance indicator
  if (rr > 16) {
    sympatheticScore += 20; // rapid shallow breathing -> sympathetic activation
  } else if (rr < 10) {
    dorsalScore += 20; // suppressed breathing
  } else { // 10 - 15 breaths/min (resonant resting rate)
    ventralScore += 20;
  }

  // 4. Sleep Metrics - Nighttime Recovery indicator
  if (sleep.sleepEfficiency > 90 && sleep.sleepOnsetLatency < 20) {
    ventralScore += 15;
  } else if (sleep.sleepOnsetLatency > 30 || sleep.waso > 45) {
    sympatheticScore += 15; // hyperarousal at bedtime/fragmentation
  } else if (sleep.sleepEfficiency < 85 && sleep.overnightHrvDelta < 5) {
    dorsalScore += 15; // failure to recover / lack of sleep consolidation
  }

  // Resolve the dominant autonomic branch
  let state: NervousSystemState = 'VENTRAL_VAGAL';
  let explanation = '';
  let vagalToneScore = 0;

  const maxScore = Math.max(ventralScore, sympatheticScore, dorsalScore);
  if (maxScore === ventralScore) {
    state = 'VENTRAL_VAGAL';
    vagalToneScore = Math.round(50 + (hrv / 150) * 50); // scales up to 100% based on HRV
    explanation = `Ventral Vagal (Safe & Connected). Your healthy HRV (${hrv} ms) and coherent breathing (${rr} bpm) indicate robust vagal tone and prefrontal regulation.`;
  } else if (maxScore === sympatheticScore) {
    state = 'SYMPATHETIC';
    vagalToneScore = Math.round((hrv / 100) * 25); // severely depressed vagal tone
    explanation = `Sympathetic Hyperarousal (Fight/Flight). Adrenaline and cortisol overload detected. Elevated resting heart rate (${rhr} bpm) and rapid respiration (${rr} bpm) signal hypervigilance.`;
  } else {
    state = 'DORSAL_VAGAL';
    vagalToneScore = Math.round(15 + (hrv / 100) * 15); // blunted vagal tone
    explanation = `Dorsal Vagal Shutdown (Freeze/Numbness). Bradycardia (${hr} bpm) and shallow respiration indicate your system has initiated a metabolic conservation response due to chronic distress.`;
  }

  return { state, vagalToneScore, explanation };
}
