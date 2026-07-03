/**
 * Intervention Efficacy Score (IES) — KPI-INTERVENTION-EFFICACY
 *
 * Measures the percentage of intervention sessions that produce a clinically
 * meaningful HRV increase (ΔSDNN ≥ +5 ms).
 *
 * Algorithm:
 * 1. Identify completed intervention sessions
 * 2. Compute ΔSDNN = POST_median - PRE_median (10-min windows)
 * 3. Classify as 'positive_shift' if ΔSDNN ≥ +5 ms
 * 4. IES = positive_shifts / total_completed × 100 (rolling 30-day)
 * 5. Break out by intervention type
 * 6. Voice-augmented multi-modal variant
 */

import { InterventionEfficacyResult, InterventionSession } from './types';
import { zScore } from './linearRegression';

/** Options for IES computation */
export interface IesOptions {
  /** Rolling window in days (default 30) */
  windowDays?: number;
  /** Minimum ΔSDNN for positive shift in ms (default 5) */
  positiveThreshold?: number;
  /** Minimum ΔSDNN for negative shift in ms (default -5) */
  negativeThreshold?: number;
}

const DEFAULTS: Required<IesOptions> = {
  windowDays: 30,
  positiveThreshold: 5,
  negativeThreshold: -5,
};

/** Population statistics for voice biomarker normalization */
const VOICE_POP = {
  hnr: { mean: 12, std: 4 },
  jitter: { mean: 0.5, std: 0.4 },
  shimmer: { mean: 3.0, std: 2.0 },
};

const SDNN_POP = { mean: 40, std: 20 };

/**
 * Computes the Intervention Efficacy Score from a list of intervention sessions.
 *
 * @param sessions - Array of completed intervention sessions
 * @param options - Computation options
 * @returns InterventionEfficacyResult
 */
export function computeIes(
  sessions: InterventionSession[],
  options: IesOptions = {}
): InterventionEfficacyResult {
  const opts = { ...DEFAULTS, ...options };

  // Filter to completed sessions within the rolling window
  const now = new Date();
  const cutoff = new Date(now.getTime() - opts.windowDays * 24 * 60 * 60 * 1000);

  const completed = sessions.filter(s => {
    const sessionDate = new Date(s.endTime);
    return s.completionStatus === 'completed' && sessionDate >= cutoff;
  });

  if (completed.length === 0) {
    return {
      overall: 0,
      totalSessions: 0,
      positiveShifts: 0,
      byType: { breathwork: 0, somatic: 0, sleep: 0, cognitive: 0 },
      interpretation: 'poor',
    };
  }

  // Classify each session
  let positiveShifts = 0;
  let negativeShifts = 0;
  const typeCounts: Record<string, { total: number; positive: number }> = {
    breathwork: { total: 0, positive: 0 },
    somatic: { total: 0, positive: 0 },
    sleep: { total: 0, positive: 0 },
    cognitive: { total: 0, positive: 0 },
  };

  let totalMultiModalScore = 0;
  let multiModalSessions = 0;

  for (const session of completed) {
    const delta = session.postSdnn - session.preSdnn;
    const isPositive = delta >= opts.positiveThreshold;
    const isNegative = delta <= opts.negativeThreshold; // used for tracking

    if (isPositive) positiveShifts++;
    if (isNegative) negativeShifts++;

    // Track by type
    const t = session.type;
    if (typeCounts[t]) {
      typeCounts[t].total++;
      if (isPositive) typeCounts[t].positive++;
    }

    // Multi-modal voice-augmented score
    if (session.voicePre && session.voicePost) {
      const deltaSdnnZ = zScore(delta, 0, SDNN_POP.std);
      const deltaHnr = session.voicePost.hnr - session.voicePre.hnr;
      const deltaJitter = session.voicePre.jitter - session.voicePost.jitter; // decrease is good
      const deltaShimmer = session.voicePre.shimmer - session.voicePost.shimmer;

      const deltaHnrZ = zScore(deltaHnr, 0, VOICE_POP.hnr.std);
      const deltaJitterZ = zScore(deltaJitter, 0, VOICE_POP.jitter.std);
      const deltaShimmerZ = zScore(deltaShimmer, 0, VOICE_POP.shimmer.std);

      const multiScore = 0.6 * deltaSdnnZ + 0.2 * deltaHnrZ + 0.1 * deltaJitterZ + 0.1 * deltaShimmerZ;
      totalMultiModalScore += multiScore;
      multiModalSessions++;
    }
  }

  // Aggregate
  const overall = completed.length > 0 ? (positiveShifts / completed.length) * 100 : 0;

  // Per-type IES
  const byType = {
    breathwork: typeCounts.breathwork.total > 0
      ? Math.round((typeCounts.breathwork.positive / typeCounts.breathwork.total) * 100)
      : 0,
    somatic: typeCounts.somatic.total > 0
      ? Math.round((typeCounts.somatic.positive / typeCounts.somatic.total) * 100)
      : 0,
    sleep: typeCounts.sleep.total > 0
      ? Math.round((typeCounts.sleep.positive / typeCounts.sleep.total) * 100)
      : 0,
    cognitive: typeCounts.cognitive.total > 0
      ? Math.round((typeCounts.cognitive.positive / typeCounts.cognitive.total) * 100)
      : 0,
  };

  // Interpretation
  let interpretation: InterventionEfficacyResult['interpretation'];
  if (overall > 60) interpretation = 'excellent';
  else if (overall >= 40) interpretation = 'good';
  else if (overall >= 25) interpretation = 'moderate';
  else interpretation = 'poor';

  return {
    overall: Math.round(overall * 10) / 10,
    totalSessions: completed.length,
    positiveShifts,
    byType,
    multiModalScore: multiModalSessions > 0
      ? Math.round((totalMultiModalScore / multiModalSessions) * 100) / 100
      : undefined,
    interpretation,
  };
}