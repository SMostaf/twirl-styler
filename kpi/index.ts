/**
 * KPI Engine — Main Entry Point
 *
 * Exports all KPI computation functions and types for the NeuroPath platform.
 */

// Re-export types
export type {
  RegulationRecoveryResult,
  InterventionEfficacyResult,
  RetentionEngagementResult,
  SleepQualityResult,
  AutonomicBalanceResult,
  VoiceRecoveryResult,
  KpiSnapshot,
  SyntheticPatientProfile,
  InterventionSession,
  DailyBiometricRecord,
  IesByType,
} from './types';

// Core KPI computation functions
export { computeThreeR } from './3r';
export type { ThreeROptions } from './3r';

export { computeIes } from './ies';
export type { IesOptions } from './ies';

export { computeRes } from './res';
export type { ResOptions, ResCoefficients } from './res';

// Supporting metrics
export { computeSqi, computeAbs, computeVrs } from './supporting';

// Validation
export { runValidation, validationSummary } from './validation';
export type { ValidationResult } from './validation';

// Regression utility
export { linearRegression, zScore, sigmoid, movingAverage, clip } from './linearRegression';
export type { RegressionResult } from './linearRegression';

/**
 * Compute a full KPI snapshot for a user given all available data.
 *
 * @param userId - User identifier
 * @param dailyValues - Daily morning SDNN values for 3R
 * @param sessions - Intervention sessions for IES
 * @param records - Daily biometric records for RES
 * @param options - Optional config overrides
 * @returns Complete KpiSnapshot
 */
export function computeKpiSnapshot(
  userId: string,
  dailyValues: { date: string; sdnn: number | null }[],
  sessions: import('./types').InterventionSession[],
  records: import('./types').DailyBiometricRecord[],
): import('./types').KpiSnapshot {
  const threeR = computeThreeR(dailyValues);
  const ies = computeIes(sessions);
  const res = computeRes(records);

  return {
    userId,
    timestamp: new Date().toISOString(),
    threeR,
    ies,
    res,
  };
}