/**
 * KPI Engine — validation test cases derived from VALIDATION_DATASET.json
 *
 * Tests the 3 core KPIs against the synthetic patient profiles' projected
 * 90-day trajectories. Each profile has expected HRV values at weeks 2, 4, 8, 12
 * which we use to verify 3R calculations and IES heuristics.
 */

import { SyntheticPatientProfile } from './types';
import { computeThreeR } from './3r';
import { computeRes } from './res';
import { computeIes } from './ies';

/**
 * Pre-baked test profiles from VALIDATION_DATASET.json projected trajectories.
 * These are the essential ones for validation.
 */
const TEST_TRAJECTORIES: { id: string; alias: string; archetype: string; baselineSdnn: number; week2: number; week4: number; week8: number; week12: number; baselineSteps: number }[] = [
  { id: 'P001', alias: 'Chronic Hyperarousal — Combat Veteran', archetype: 'Recovery', baselineSdnn: 18, week2: 20, week4: 24, week8: 30, week12: 35, baselineSteps: 3200 },
  { id: 'P002', alias: 'Dissociative Type — Childhood Trauma', archetype: 'Recovery', baselineSdnn: 58, week2: 52, week4: 48, week8: 55, week12: 62, baselineSteps: 1800 },
  { id: 'P003', alias: 'Burnout / HPA Axis Dysregulation', archetype: 'Recovery', baselineSdnn: 22, week2: 24, week4: 27, week8: 32, week12: 38, baselineSteps: 4500 },
  { id: 'P004', alias: 'High-Functioning Anxiety / ADHD', archetype: 'Recovery', baselineSdnn: 28, week2: 29, week4: 32, week8: 36, week12: 40, baselineSteps: 7200 },
  { id: 'P005', alias: 'Chronic Pain & Fibromyalgia', archetype: 'Slow Recovery', baselineSdnn: 16, week2: 17, week4: 18, week8: 20, week12: 22, baselineSteps: 2200 },
  { id: 'P006', alias: 'Postpartum Neuroendocrine Shift', archetype: 'Recovery', baselineSdnn: 22, week2: 24, week4: 28, week8: 33, week12: 38, baselineSteps: 3800 },
  { id: 'P007', alias: 'Complex Grief & Loss', archetype: 'Recovery', baselineSdnn: 32, week2: 33, week4: 35, week8: 38, week12: 40, baselineSteps: 3100 },
  { id: 'P008', alias: 'Substance Use Recovery', archetype: 'Volatile Recovery', baselineSdnn: 20, week2: 22, week4: 28, week8: 26, week12: 33, baselineSteps: 5100 },
  { id: 'P009', alias: 'Concussion / TBI Recovery', archetype: 'Slow Recovery', baselineSdnn: 24, week2: 25, week4: 26, week8: 28, week12: 30, baselineSteps: 1600 },
  { id: 'P010', alias: 'High Resilience Baseline', archetype: 'Maintenance', baselineSdnn: 52, week2: 53, week4: 55, week8: 56, week12: 58, baselineSteps: 8500 },
];

/** Convert a test trajectory to daily morning SDNN values (linear interpolation between weeks) */
function trajectoryToDailyValues(traj: typeof TEST_TRAJECTORIES[0]): { date: string; sdnn: number | null }[] {
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
    const threeRPassed = threeRResult.monthlySlope > 0 === expectedSlopeDirection === 'positive';

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