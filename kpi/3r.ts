/**
 * Regulation Recovery Rate (3R) — KPI-REG-RECOVERY
 *
 * Measures the rate of change in morning HRV (SDNN) over a rolling 90-day window.
 * Computed as the slope of OLS linear regression of daily morning SDNN values,
 * normalized to ms/month.
 *
 * Algorithm steps:
 * 1. Collect morning SDNN samples (05:00-09:00 window)
 * 2. Aggregate to daily median
 * 3. Impute missing days (≤7 consecutive via linear interpolation)
 * 4. Remove outliers (>3σ from rolling 14-day mean → clip at 3σ)
 * 5. OLS linear regression: SDNN = β₀ + β₁·days
 * 6. Normalize: 3R = β₁ × 30 (ms/month)
 * 7. Significance test (p < 0.05)
 */

import { linearRegression, clip } from './linearRegression';
import { RegulationRecoveryResult } from './types';

/**
 * Options for 3R computation.
 */
export interface ThreeROptions {
  /** Rolling window in days (default 90) */
  windowDays?: number;
  /** Maximum consecutive missing days for imputation (default 7) */
  maxConsecutiveMissing?: number;
  /** Outlier sigma threshold (default 3) */
  outlierSigma?: number;
  /** Rolling window for outlier detection (default 14) */
  outlierWindow?: number;
}

const DEFAULTS: Required<ThreeROptions> = {
  windowDays: 90,
  maxConsecutiveMissing: 7,
  outlierSigma: 3,
  outlierWindow: 14,
};

/**
 * Computes the Regulation Recovery Rate (3R) from daily morning SDNN values.
 *
 * @param dailyValues - Array of { date: string (YYYY-MM-DD), sdnn: number | null }
 *                      where sdnn is the median morning (05:00-09:00) SDNN for each day.
 *                      null = no data for that day.
 * @param options - Computation options
 * @returns RegulationRecoveryResult
 */
export function computeThreeR(
  dailyValues: { date: string; sdnn: number | null }[],
  options: ThreeROptions = {}
): RegulationRecoveryResult {
  const opts = { ...DEFAULTS, ...options };

  // Sort by date
  const sorted = [...dailyValues]
    .filter(d => d.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Take the most recent `windowDays`
  const windowed = sorted.slice(-opts.windowDays);

  // Step 1: Extract valid values; track missing gaps
  const valid: number[] = [];
  const indices: number[] = []; // indices within the window
  let consecutiveMissing = 0;
  let totalMissing = 0;

  for (let i = 0; i < windowed.length; i++) {
    if (windowed[i].sdnn !== null && windowed[i].sdnn !== undefined) {
      valid.push(windowed[i].sdnn!);
      indices.push(i);
      consecutiveMissing = 0;
    } else {
      consecutiveMissing++;
      totalMissing++;
      // Check if gap too large
      if (consecutiveMissing > opts.maxConsecutiveMissing) {
        return emptyResult('nonResponse', 'Too many consecutive missing days');
      }
    }
  }

  // If too few data points after filtering
  if (valid.length < 7) {
    return emptyResult('nonResponse', 'Insufficient data points');
  }

  // Step 2: Imputation — linear interpolation for missing days (≤7 consecutive)
  const imputed: number[] = [];
  let imputedCount = 0;

  for (let i = 0; i < windowed.length; i++) {
    if (windowed[i].sdnn !== null) {
      imputed.push(windowed[i].sdnn!);
    } else {
      // Find nearest valid neighbors for interpolation
      const leftIdx = findLastValid(windowed, i);
      const rightIdx = findNextValid(windowed, i);
      if (leftIdx !== -1 && rightIdx !== -1) {
        const leftVal = windowed[leftIdx].sdnn!;
        const rightVal = windowed[rightIdx].sdnn!;
        const totalGap = rightIdx - leftIdx;
        const position = i - leftIdx;
        const interpolated = leftVal + (rightVal - leftVal) * (position / totalGap);
        imputed.push(interpolated);
        imputedCount++;
      } else {
        // Edge case — no valid neighbor on one side, use nearest
        if (leftIdx !== -1) imputed.push(windowed[leftIdx].sdnn!);
        else if (rightIdx !== -1) imputed.push(windowed[rightIdx].sdnn!);
        else imputed.push(50); // fallback to population median
        imputedCount++;
      }
    }
  }

  // Step 3: Outlier detection and clipping (rolling 14-day window)
  const cleaned = [...imputed];
  for (let i = 0; i < cleaned.length; i++) {
    const windowStart = Math.max(0, i - opts.outlierWindow + 1);
    const windowValues = imputed.slice(windowStart, i + 1); // include current
    if (windowValues.length < 3) continue;

    const mean = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
    const variance = windowValues.reduce((a, b) => a + (b - mean) ** 2, 0) / windowValues.length;
    const std = Math.sqrt(variance);

    if (std > 0) {
      const threshold = opts.outlierSigma * std;
      if (Math.abs(cleaned[i] - mean) > threshold) {
        cleaned[i] = clip(cleaned[i], mean - threshold, mean + threshold);
      }
    }
  }

  // Step 4: OLS Linear Regression
  const x = cleaned.map((_, i) => i);
  const result = linearRegression(x, cleaned);

  // Step 5: Normalize to ms/month
  const dailySlope = result.slope;
  const monthlySlope = dailySlope * 30;

  // Step 6: Interpretation
  let interpretation: RegulationRecoveryResult['interpretation'];
  if (monthlySlope > 5) interpretation = 'strongResponse';
  else if (monthlySlope > 3) interpretation = 'moderateResponse';
  else if (monthlySlope > 1) interpretation = 'minimalResponse';
  else if (monthlySlope >= 0) interpretation = 'nonResponse';
  else interpretation = 'deterioration';

  const significant = result.pValue < 0.05 && monthlySlope > 0;

  return {
    monthlySlope: Math.round(monthlySlope * 100) / 100,
    dailySlope: Math.round(dailySlope * 100) / 100,
    rSquared: Math.round(result.rSquared * 1000) / 1000,
    pValue: Math.round(result.pValue * 10000) / 10000,
    dataPoints: cleaned.length,
    imputedDays: imputedCount,
    interpretation,
    significant,
  };
}

function findLastValid(data: { sdnn: number | null }[], fromIdx: number): number {
  for (let i = fromIdx - 1; i >= 0; i--) {
    if (data[i].sdnn !== null) return i;
  }
  return -1;
}

function findNextValid(data: { sdnn: number | null }[], fromIdx: number): number {
  for (let i = fromIdx + 1; i < data.length; i++) {
    if (data[i].sdnn !== null) return i;
  }
  return -1;
}

function emptyResult(interpretation: RegulationRecoveryResult['interpretation'], _reason: string): RegulationRecoveryResult {
  return {
    monthlySlope: 0,
    dailySlope: 0,
    rSquared: 0,
    pValue: 1,
    dataPoints: 0,
    imputedDays: 0,
    interpretation,
    significant: false,
  };
}