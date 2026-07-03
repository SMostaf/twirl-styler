/**
 * Retention & Engagement Score (RES) — KPI-RETENTION
 *
 * Two-component metric:
 * A: Active usage ratio (days_with_data / total_days)
 * B: Logistic regression churn risk model
 *   sigmoid(β₀ + β₁×HRV_trend + β₂×session_completion + β₃×recency + β₄×step_trend)
 *
 * Algorithm:
 * 1. Active ratio: days with any HealthKit data / total days
 * 2. Session completion rate (14-day rolling)
 * 3. HRV trend (14-day linear slope of morning SDNN)
 * 4. Recency: days since last completed session
 * 5. Step trend (14-day linear slope)
 * 6. Churn risk via logistic regression
 * 7. Composite score
 */

import { linearRegression } from './linearRegression';
import { RetentionEngagementResult, DailyBiometricRecord } from './types';

/** Coefficients for churn risk logistic regression */
export interface ResCoefficients {
  beta0: number; // intercept
  beta1: number; // HRV trend (positive = lower risk)
  beta2: number; // session completion rate (higher = lower risk)
  beta3: number; // days since last session (higher = higher risk)
  beta4: number; // step trend (positive = lower risk)
}

const DEFAULT_COEFFICIENTS: ResCoefficients = {
  beta0: 0.5,
  beta1: -0.15,
  beta2: -1.5,
  beta3: 0.08,
  beta4: -0.02,
};

/** Options for RES computation */
export interface ResOptions {
  /** Rolling window in days (default 30) */
  windowDays?: number;
  /** Completion rate window in days (default 14) */
  completionWindow?: number;
  /** HRV trend window in days (default 14) */
  hrvTrendWindow?: number;
  /** Step trend window in days (default 14) */
  stepTrendWindow?: number;
  /** Logistic regression coefficients */
  coefficients?: ResCoefficients;
  /** Churn risk threshold (default 0.50) */
  churnThreshold?: number;
}

const DEFAULTS: Required<ResOptions> = {
  windowDays: 30,
  completionWindow: 14,
  hrvTrendWindow: 14,
  stepTrendWindow: 14,
  coefficients: DEFAULT_COEFFICIENTS,
  churnThreshold: 0.50,
};

/**
 * Sigmoid function.
 */
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-Math.max(Math.min(z, 10), -10))); // clamp to avoid overflow
}

/**
 * Computes the Retention & Engagement Score from daily biometric records.
 *
 * @param records - Array of daily biometric records
 * @param options - Computation options
 * @returns RetentionEngagementResult
 */
export function computeRes(
  records: DailyBiometricRecord[],
  options: ResOptions = {}
): RetentionEngagementResult {
  const opts = { ...DEFAULTS, ...options };

  // Sort by date (ascending)
  const sorted = [...records]
    .filter(r => r.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return {
      activeRatio: 0,
      churnRisk: 0,
      sessionCompletionRate: 0,
      hrvTrend14d: 0,
      daysSinceLastSession: 0,
      stepTrend: 0,
      compositeScore: 0,
      retentionRecommended: false,
    };
  }

  // Take the most recent `windowDays`
  const windowed = sorted.slice(-opts.windowDays);

  // Component A: Active usage ratio
  const daysWithData = windowed.filter(r => r.hasData).length;
  const activeRatio = windowed.length > 0 ? daysWithData / windowed.length : 0;

  // Component: Session completion rate (14-day rolling)
  const completionWindowRecords = sorted.slice(-opts.completionWindow);
  const sessionsStarted = completionWindowRecords.filter(r => r.sessionStarted).length;
  const sessionsCompleted = completionWindowRecords.filter(r => r.sessionCompleted).length;
  const sessionCompletionRate = sessionsStarted > 0 ? sessionsCompleted / sessionsStarted : 0;

  // Component: 14-day HRV trend (slope of morning SDNN)
  const hrvRecords = sorted.slice(-opts.hrvTrendWindow).filter(r => r.morningSdnn !== null && r.morningSdnn !== undefined);
  let hrvTrend14d = 0;
  if (hrvRecords.length >= 3) {
    const x = hrvRecords.map((_, i) => i);
    const y = hrvRecords.map(r => r.morningSdnn!);
    hrvTrend14d = linearRegression(x, y).slope;
  }

  // Component: Days since last completed session
  let daysSinceLastSession = 999;
  const completedSessionDays = sorted
    .filter(r => r.sessionCompleted)
    .map(r => new Date(r.date));
  if (completedSessionDays.length > 0) {
    const lastSession = new Date(Math.max(...completedSessionDays.map(d => d.getTime())));
    daysSinceLastSession = Math.round((Date.now() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Component: 14-day step trend
  const stepRecords = sorted.slice(-opts.stepTrendWindow);
  let stepTrend = 0;
  if (stepRecords.length >= 3) {
    const x = stepRecords.map((_, i) => i);
    const y = stepRecords.map(r => r.stepCount);
    stepTrend = linearRegression(x, y).slope;
  }

  // Component B: Churn risk via logistic regression
  const c = opts.coefficients;
  const z = c.beta0
    + c.beta1 * hrvTrend14d
    + c.beta2 * sessionCompletionRate
    + c.beta3 * daysSinceLastSession
    + c.beta4 * stepTrend;
  const churnRisk = sigmoid(z);

  // Composite score (0-100): weighted combination favoring low churn + high engagement
  const compositeScore = Math.round(
    (activeRatio * 40) +
    (sessionCompletionRate * 25) +
    ((1 - churnRisk) * 25) +
    (Math.min(hrvTrend14d * 10, 10))
  );

  return {
    activeRatio: Math.round(activeRatio * 100) / 100,
    churnRisk: Math.round(churnRisk * 100) / 100,
    sessionCompletionRate: Math.round(sessionCompletionRate * 100) / 100,
    hrvTrend14d: Math.round(hrvTrend14d * 100) / 100,
    daysSinceLastSession,
    stepTrend: Math.round(stepTrend * 100) / 100,
    compositeScore: Math.min(100, Math.max(0, compositeScore)),
    retentionRecommended: churnRisk > opts.churnThreshold,
  };
}