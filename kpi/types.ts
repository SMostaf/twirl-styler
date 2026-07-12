/** KPI Engine — shared types for all computation modules */

/** Result of Regulation Recovery Rate (3R) computation */
export interface RegulationRecoveryResult {
  /** Normalized slope in ms/month */
  monthlySlope: number;
  /** Raw daily slope (ms/day) */
  dailySlope: number;
  /** R-squared of the linear fit */
  rSquared: number;
  /** p-value of the slope coefficient */
  pValue: number;
  /** Number of data points used */
  dataPoints: number;
  /** Number of imputed days */
  imputedDays: number;
  /** Interpretation label */
  interpretation: 'strongResponse' | 'moderateResponse' | 'minimalResponse' | 'nonResponse' | 'deterioration';
  /** clinically significant? */
  significant: boolean;
}

/** Per-type IES breakdown */
export interface IesByType {
  breathwork: number;
  somatic: number;
  sleep: number;
  cognitive: number;
}

/** Result of Intervention Efficacy Score (IES) computation */
export interface InterventionEfficacyResult {
  /** Overall IES percentage (0-100) */
  overall: number;
  /** total sessions */
  totalSessions: number;
  /** sessions with positive shift */
  positiveShifts: number;
  /** breakdown by intervention type */
  byType: IesByType;
  /** Voice-augmented multi-modal score (if voice data available) */
  multiModalScore?: number;
  /** Interpretation label */
  interpretation: 'excellent' | 'good' | 'moderate' | 'poor';
}

/** Result of Retention & Engagement Score (RES) computation */
export interface RetentionEngagementResult {
  /** Active usage ratio (0-1) */
  activeRatio: number;
  /** Churn risk (0-1), >0.5 triggers retention protocol */
  churnRisk: number;
  /** Session completion rate (0-1) */
  sessionCompletionRate: number;
  /** 14-day HRV trend (ms/day) */
  hrvTrend14d: number;
  /** Days since last completed session */
  daysSinceLastSession: number;
  /** 14-day step trend (steps/day) */
  stepTrend: number;
  /** Aggregated RES score (0-100 composite) */
  compositeScore: number;
  /** Whether retention protocol is recommended */
  retentionRecommended: boolean;
}

/** Result of Sleep Quality Index (SQI) */
export interface SleepQualityResult {
  score: number; // 0-100
  sleepEfficiencyZ: number;
  deepSleepZ: number;
  onsetLatencyZ: number;
  wasoZ: number;
  regularityZ: number;
}

/** Result of Autonomic Balance Score (ABS) */
export interface AutonomicBalanceResult {
  score: number; // 0-100
  hrvZ: number;
  restingHrZ: number;
  respiratoryRateZ: number;
}

/** Result of Voice Recovery Score (VRS) */
export interface VoiceRecoveryResult {
  score: number; // 0-100
  hnrZ: number;
  jitterZ: number;
  shimmerZ: number;
  f0VarianceZ: number;
  speechRateZ: number;
}

/** Aggregated KPI snapshot for a user */
export interface KpiSnapshot {
  userId: string;
  timestamp: string;
  threeR: RegulationRecoveryResult;
  ies: InterventionEfficacyResult;
  res: RetentionEngagementResult;
  sqi?: SleepQualityResult;
  abs?: AutonomicBalanceResult;
  vrs?: VoiceRecoveryResult;
}

/** Synthetic patient profile (from VALIDATION_DATASET.json) */
export interface SyntheticPatientProfile {
  id: string;
  alias: string;
  archetype: string;
  demographics: {
    age: number;
    gender: string;
    condition: string;
    medication: string;
  };
  baselineBiometrics: Record<string, number>;
  traumaPresentation: {
    primaryPhase: string;
    symptomProfile: string[];
    polyvagalState: string;
    clinicalSeverity: string;
    treatmentHistory: string;
  };
  projected90DayTrajectory: {
    interventionProtocol: string;
    week2: Record<string, number>;
    week4: Record<string, number>;
    week8: Record<string, number>;
    week12: Record<string, number>;
    statusAt90Days: string;
  };
}

/** Session record used by IES */
export interface InterventionSession {
  id: string;
  type: 'breathwork' | 'somatic' | 'sleep' | 'cognitive';
  startTime: string;
  endTime: string;
  completionStatus: 'completed' | 'abandoned' | 'in_progress';
  preSdnn: number;  // median SDNN in 10-min window before
  postSdnn: number; // median SDNN in 10-min window after
  voicePre?: { hnr: number; jitter: number; shimmer: number };
  voicePost?: { hnr: number; jitter: number; shimmer: number };
}

/** Daily biometric record used by RES and 3R */
export interface DailyBiometricRecord {
  date: string;
  morningSdnn: number | null;
  stepCount: number;
  hasData: boolean;
  sessionCompleted: boolean;
  sessionStarted: boolean;
}