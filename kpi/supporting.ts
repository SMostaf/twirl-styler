/**
 * Supporting Metrics: SQI (Sleep Quality Index), ABS (Autonomic Balance Score),
 * VRS (Voice Recovery Score).
 *
 * These are composite z-score-based metrics normalized to 0-100.
 */

import { zScore } from './linearRegression';
import { SleepQualityResult, AutonomicBalanceResult, VoiceRecoveryResult } from './types';

/** Population statistics for sleep metrics (from RESEARCH.md norms) */
const SLEEP_POP = {
  efficiency: { mean: 85, std: 8 },
  deepSleepPct: { mean: 20, std: 5 },
  onsetLatency: { mean: 15, std: 10 },
  waso: { mean: 25, std: 15 },
  regularityIndex: { mean: 65, std: 20 },
};

/** Population statistics for autonomic metrics */
const AUTONOMIC_POP = {
  sdnn: { mean: 40, std: 20 },
  restingHr: { mean: 65, std: 10 },
  respiratoryRate: { mean: 14, std: 3 },
};

/** Population statistics for voice biomarkers */
const VOICE_POP = {
  hnr: { mean: 12, std: 4 },
  jitter: { mean: 0.5, std: 0.4 },
  shimmer: { mean: 3.0, std: 2.0 },
  f0Variance: { mean: 20, std: 10 },
  speechRate: { mean: 3.5, std: 1.0 },
};

/**
 * Normalize a z-score composite to 0-100 using logistic scaling:
 * score = 100 / (1 + exp(-z)), then scaled to 0-100.
 */
function normalizeTo100(z: number): number {
  // Clamp z to reasonable range to avoid extreme values
  const clampedZ = Math.max(-4, Math.min(4, z));
  return Math.round((100 / (1 + Math.exp(-clampedZ))) * 100) / 100;
}

/**
 * Compute Sleep Quality Index (SQI).
 *
 * SQI = 0.30 × z(sleep_efficiency) + 0.25 × z(deep_sleep_pct)
 *     + 0.15 × z(-sleep_onset_latency) + 0.15 × z(-WASO)
 *     + 0.15 × z(sleep_regularity_index), normalized to 0-100
 */
export function computeSqi(params: {
  sleepEfficiency: number;
  deepSleepPercent: number;
  sleepOnsetLatency: number;
  waso: number;
  sleepRegularityIndex: number;
}): SleepQualityResult {
  const sleepEfficiencyZ = zScore(params.sleepEfficiency, SLEEP_POP.efficiency.mean, SLEEP_POP.efficiency.std);
  const deepSleepZ = zScore(params.deepSleepPercent, SLEEP_POP.deepSleepPct.mean, SLEEP_POP.deepSleepPct.std);
  const onsetLatencyZ = -zScore(params.sleepOnsetLatency, SLEEP_POP.onsetLatency.mean, SLEEP_POP.onsetLatency.std);
  const wasoZ = -zScore(params.waso, SLEEP_POP.waso.mean, SLEEP_POP.waso.std);
  const regularityZ = zScore(params.sleepRegularityIndex, SLEEP_POP.regularityIndex.mean, SLEEP_POP.regularityIndex.std);

  const compositeZ = 0.30 * sleepEfficiencyZ
    + 0.25 * deepSleepZ
    + 0.15 * onsetLatencyZ
    + 0.15 * wasoZ
    + 0.15 * regularityZ;

  return {
    score: normalizeTo100(compositeZ),
    sleepEfficiencyZ: Math.round(sleepEfficiencyZ * 100) / 100,
    deepSleepZ: Math.round(deepSleepZ * 100) / 100,
    onsetLatencyZ: Math.round(onsetLatencyZ * 100) / 100,
    wasoZ: Math.round(wasoZ * 100) / 100,
    regularityZ: Math.round(regularityZ * 100) / 100,
  };
}

/**
 * Compute Autonomic Balance Score (ABS).
 *
 * ABS = 0.50 × z(SDNN) + 0.30 × z(-restingHR) + 0.20 × z(-respiratoryRate)
 * normalized to 0-100. Higher = more parasympathetic / regulated.
 */
export function computeAbs(params: {
  sdnn: number;
  restingHeartRate: number;
  respiratoryRate: number;
}): AutonomicBalanceResult {
  const hrvZ = zScore(params.sdnn, AUTONOMIC_POP.sdnn.mean, AUTONOMIC_POP.sdnn.std);
  const restingHrZ = -zScore(params.restingHeartRate, AUTONOMIC_POP.restingHr.mean, AUTONOMIC_POP.restingHr.std);
  const respiratoryRateZ = -zScore(params.respiratoryRate, AUTONOMIC_POP.respiratoryRate.mean, AUTONOMIC_POP.respiratoryRate.std);

  const compositeZ = 0.50 * hrvZ + 0.30 * restingHrZ + 0.20 * respiratoryRateZ;

  return {
    score: normalizeTo100(compositeZ),
    hrvZ: Math.round(hrvZ * 100) / 100,
    restingHrZ: Math.round(restingHrZ * 100) / 100,
    respiratoryRateZ: Math.round(respiratoryRateZ * 100) / 100,
  };
}

/**
 * Compute Voice Recovery Score (VRS).
 *
 * VRS = 0.35 × z(HNR) + 0.25 × z(-jitter) + 0.20 × z(-shimmer)
 *     + 0.10 × z(F0_variance) + 0.10 × z(-speech_rate), normalized to 0-100
 */
export function computeVrs(params: {
  hnr: number;
  jitter: number;
  shimmer: number;
  f0Variance: number;
  speechRate: number;
}): VoiceRecoveryResult {
  const hnrZ = zScore(params.hnr, VOICE_POP.hnr.mean, VOICE_POP.hnr.std);
  const jitterZ = -zScore(params.jitter, VOICE_POP.jitter.mean, VOICE_POP.jitter.std);
  const shimmerZ = -zScore(params.shimmer, VOICE_POP.shimmer.mean, VOICE_POP.shimmer.std);
  const f0VarianceZ = zScore(params.f0Variance, VOICE_POP.f0Variance.mean, VOICE_POP.f0Variance.std);
  const speechRateZ = -zScore(params.speechRate, VOICE_POP.speechRate.mean, VOICE_POP.speechRate.std);

  const compositeZ = 0.35 * hnrZ
    + 0.25 * jitterZ
    + 0.20 * shimmerZ
    + 0.10 * f0VarianceZ
    + 0.10 * speechRateZ;

  return {
    score: normalizeTo100(compositeZ),
    hnrZ: Math.round(hnrZ * 100) / 100,
    jitterZ: Math.round(jitterZ * 100) / 100,
    shimmerZ: Math.round(shimmerZ * 100) / 100,
    f0VarianceZ: Math.round(f0VarianceZ * 100) / 100,
    speechRateZ: Math.round(speechRateZ * 100) / 100,
  };
}