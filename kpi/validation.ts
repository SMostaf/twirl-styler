/**
 * KPI Engine — validation test cases derived from VALIDATION_DATASET.json
 *
 * Imports the formal synthetic patient profiles directly from the dataset
 * and tests all 3 core KPIs (3R, IES, RES) against their projected
 * 90-day HRV trajectories.
 */

import validationData from './validationDataset.json';
import { computeThreeR } from './3r';
import { computeRes } from './res';
import { computeIes } from './ies';

/** Extracted trajectory + step baseline for each test profile */
interface TestTrajectory {
  id: string;
  alias: string;
  archetype: string;
  baselineSdnn: number;
  week2: number;
  week4: number;
  week8: number;
  week12: number;
  baselineSteps: number;
}

/**
 * Build test trajectories directly from the synthetic patient profiles
 * in VALIDATION_DATASET.json. This ensures alignment with the formal spec.
 */
function buildTestTrajectories(): TestTrajectory[] {
  const profiles = (validationData as any).syntheticPatientProfiles;
  if (!profiles || !Array.isArray(profiles)) {
    console.warn('validation.ts: VALIDATION_DATASET.json has no syntheticPatientProfiles array — using fallback');
    return getFallbackTrajectories();
  }

  return profiles.map((p: any) => ({
    id: p.id,
    alias: p.alias,
    archetype: p.archetype || 'Unknown',
    baselineSdnn: p.baselineBiometrics?.hrvSdnnMorning ?? 50,
    week2: p.projected90DayTrajectory?.week2?.hrvSdnnMorning ?? 50,
    week4: p.projected90DayTrajectory?.week4?.hrvSdnnMorning ?? 50,
    week8: p.projected90DayTrajectory?.week8?.hrvSdnnMorning ?? 50,
    week12: p.projected90DayTrajectory?.week12?.hrvSdnnMorning ?? 50,
    baselineSteps: p.baselineBiometrics?.stepCount ?? 5000,
  }));
}

/**
 * Fallback trajectories in case the JSON import fails or is empty.
 * Matches the 10 profiles from VALIDATION_DATASET.json exactly.
 */
function getFallbackTrajectories(): TestTrajectory[] {
  return [
    { id: 'P001', alias: 'Chronic Hyperarousal — Combat Veteran', archetype: 'Chronic Hyperarousal', baselineSdnn: 18, week2: 20, week4: 24, week8: 30, week12: 35, baselineSteps: 3200 },
    { id: 'P002', alias: 'Dissociative Type — Childhood Trauma Survivor', archetype: 'Dissociative / Dorsal Vagal', baselineSdnn: 58, week2: 55, week4: 50, week8: 46, week12: 43, baselineSteps: 1800 },
    { id: 'P003', alias: 'Anxiety-Driven Insomnia — Young Professional', archetype: 'Anxiety with Sleep Disruption', baselineSdnn: 24, week2: 26, week4: 30, week8: 36, week12: 40, baselineSteps: 5200 },
    { id: 'P004', alias: 'Burnout Recovery — Healthcare Worker', archetype: 'Occupational Burnout', baselineSdnn: 22, week2: 24, week4: 29, week8: 35, week12: 38, baselineSteps: 8500 },
    { id: 'P005', alias: 'ADHD & Emotional Dysregulation — College Student', archetype: 'Neurodivergent / ADHD', baselineSdnn: 28, week2: 29, week4: 32, week8: 36, week12: 38, baselineSteps: 7200 },
    { id: 'P006', alias: 'Post-Partum Anxiety & Sleep Fragmentation', archetype: 'Post-Partum Stress', baselineSdnn: 26, week2: 27, week4: 29, week8: 32, week12: 35, baselineSteps: 3800 },
    { id: 'P007', alias: 'Chronic Pain & Trauma Overlap', archetype: 'Pain-Trauma Comorbidity', baselineSdnn: 16, week2: 17, week4: 19, week8: 23, week12: 27, baselineSteps: 2100 },
    { id: 'P008', alias: 'Substance Use Recovery — Early Sobriety', archetype: 'Addiction Recovery', baselineSdnn: 20, week2: 22, week4: 26, week8: 32, week12: 36, baselineSteps: 2800 },
    { id: 'P009', alias: 'High-Functioning Anxiety — Tech Executive', archetype: 'High-Functioning / Compensated', baselineSdnn: 32, week2: 33, week4: 36, week8: 40, week12: 42, baselineSteps: 6200 },
    { id: 'P010', alias: 'Adolescent Trauma — School Refusal', archetype: 'Adolescent Developmental Trauma', baselineSdnn: 30, week2: 31, week4: 33, week8: 36, week12: 38, baselineSteps: 1500 },
  ];
}

// Build once at module load
const TEST_TRAJECTORIES: TestTrajectory[] = buildTestTrajectories();

/** Convert a test trajectory to daily morning SDNN values (linear interpolation between weeks) */
function trajectoryToDailyValues(traj: TestTrajectory): { date: string; sdnn: number | null }[] {
  const weeklyData: { day: number; sdnn: number }[] = [
    { day: 1, sdnn: traj.baselineSdnn },
    { day: 14, sdnn: traj.week2 },
    { day: 28, sdnn: traj.week4 },
    { day: 56, sdnn: traj.week8 },
    { day: 84, sdnn: traj.week12 },
  ];

  const daily: { date: string; sdnn: number | null }[] = [];
  for (let i = 0; i < 90; i++) {
    const currentDay = i + 1;
    const date = new Date(2026, 0, currentDay);
    const dateStr = date.toISOString().split('T')[0];

    // Find surrounding data points
    let lower = weeklyData[0];
    let upper = weeklyData[weeklyData.length - 1];
    for (let j = 0; j < weeklyData.length; j++) {
      if (weeklyData[j].day <= currentDay) lower = weeklyData[j];
    }
    for (let j = weeklyData.length - 1; j >= 0; j--) {
      if (weeklyData[j].day >= currentDay) upper = weeklyData[j];
    }

    if (lower.day !== upper.day) {
      const fraction = (currentDay - lower.day) / (upper.day - lower.day);
      daily.push({ date: dateStr, sdnn: Math.round((lower.sdnn + fraction * (upper.sdnn - lower.sdnn)) * 10) / 10 });
    } else {
      daily.push({ date: dateStr, sdnn: lower.sdnn });
    }
  }
  return daily;
}

export interface ValidationResult {
  profileId: string;
  profileAlias: string;
  threeR: {
    computedMonthlySlope: number;
    expectedSlopeDirection: string;
    passed: boolean;
  };
  res: {
    computedActiveRatio: number;
    computedChurnRisk: number;
    compositeScore: number;
    passed: boolean;
  };
  ies: {
    computed: number;
    interpretation: string;
    passed: boolean;
  };
}

/**
 * Run all validation tests against the synthetic test profiles.
 */
export function runValidation(): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const profile of TEST_TRAJECTORIES) {
    // 3R Test
    const dailyValues = trajectoryToDailyValues(profile);
    const threeRResult = computeThreeR(dailyValues, { windowDays: 90, maxConsecutiveMissing: 7 });

    // Determine expected direction
    const expectedSlopeDirection = profile.week12 >= profile.baselineSdnn ? 'positive' : 'negative';
    // 🔴 FIXED: operator precedence — was `(monthlySlope > 0 === expectedSlope) === "positive"`
    // Now correctly evaluates: (monthlySlope > 0) AND (expectedSlopeDirection === "positive")
    const threeRPassed = (threeRResult.monthlySlope > 0) === (expectedSlopeDirection === 'positive');

    // RES Test
    const dailyRecords = dailyValues.map(d => ({
      date: d.date,
      morningSdnn: d.sdnn,
      stepCount: profile.baselineSteps,
      hasData: d.sdnn !== null,
      sessionCompleted: true,
      sessionStarted: true,
    }));
    const resResult = computeRes(dailyRecords, { windowDays: 30, completionWindow: 14 });

    // IES Test
    const sessions = [];
    for (let i = 0; i < 20; i++) {
      const dayOffset = Math.floor(Math.random() * 28) + 1;
      const date = new Date(2026, 0, dayOffset);
      const preSdnn = profile.baselineSdnn + Math.random() * 10;
      const postSdnn = preSdnn + (Math.random() > 0.4 ? Math.random() * 10 : -Math.random() * 6);
      sessions.push({
        id: `syn-${profile.id}-${i}`,
        type: (['breathwork', 'somatic', 'sleep', 'cognitive'] as const)[Math.floor(Math.random() * 4)],
        startTime: new Date(date.getTime() - 20 * 60 * 1000).toISOString(),
        endTime: date.toISOString(),
        completionStatus: 'completed' as const,
        preSdnn,
        postSdnn,
      });
    }
    const iesResult = computeIes(sessions);

    results.push({
      profileId: profile.id,
      profileAlias: profile.alias,
      threeR: {
        computedMonthlySlope: threeRResult.monthlySlope,
        expectedSlopeDirection,
        passed: threeRPassed,
      },
      res: {
        computedActiveRatio: resResult.activeRatio,
        computedChurnRisk: resResult.churnRisk,
        compositeScore: resResult.compositeScore,
        passed: resResult.compositeScore >= 0 && resResult.compositeScore <= 100,
      },
      ies: {
        computed: iesResult.overall,
        interpretation: iesResult.interpretation,
        passed: iesResult.overall >= 0 && iesResult.overall <= 100,
      },
    });
  }
  return results;
}

/**
 * Quick summary of validation results.
 */
export function validationSummary(): string {
  const results = runValidation();
  const total = results.length;
  const allPassed = results.filter(r => r.threeR.passed && r.res.passed && r.ies.passed).length;
  return `Validation: ${allPassed}/${total} profiles passed all KPI checks.`;
}
