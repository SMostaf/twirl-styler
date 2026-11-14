/**
 * Synthetic business data generator for NeuroPath Business Analytics Dashboard.
 *
 * Generates 50 synthetic users with realistic signup dates, activity patterns,
 * and churn events. Structured to be easily swapped with live data.
 *
 * Data patterns:
 * - Users sign up over a 90-day period
 * - ~60% are still active (healthy), ~25% churned (early/mid), ~15% sporadic
 * - Activity frequency: daily (30%), weekly (40%), sporadic (30%)
 */

export interface BusinessUser {
  id: string;
  name: string;
  signupDate: Date;
  avatar: string;
  /** Dates the user was active (logged in / had data) */
  activityDates: Date[];
  /** If the user churned, their last active date */
  churnDate?: Date;
  /** Total intervention sessions completed */
  sessionsCompleted: number;
  /** Latest HRV value for RES calculations */
  latestHrv: number;
  /** Whether the user is currently active */
  isActive: boolean;
  /** Archetype for grouping */
  archetype: string;
}

export interface BusinessMetrics {
  totalUsers: number;
  activeUsers: number;
  churnedUsers: number;
  churnRate: number;
  retentionRate: number;
  dauMauRatio: number;
  avgSessionsPerUser: number;
}

export interface DailyMetric {
  date: string;
  newSignups: number;
  cumulativeUsers: number;
  activeUsers: number;
  churnedUsers: number;
  churnRate: number;
}

export interface CohortRetention {
  cohortDate: string;
  size: number;
  day7: number;
  day14: number;
  day30: number;
  day60: number;
  day90: number;
}

/** Generate a deterministic-ish name from a user ID */
function generateName(id: number): string {
  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Skyler', 'Sage',
    'Ellis', 'Drew', 'Blake', 'Hayden', 'Cameron', 'Reese', 'Finley', 'Rowan', 'Dakota', 'Parker',
    'Emerson', 'Logan', 'Sawyer', 'Harper', 'Aiden', 'Luna', 'Kai', 'Zoe', 'Milo', 'Ivy',
    'Theo', 'Eden', 'Liam', 'Nova', 'Max', 'Aria', 'Lucas', 'Stella', 'Ezra', 'Maya',
    'Leo', 'Clara', 'Felix', 'Hazel', 'Oscar', 'Violet', 'Henry', 'Aurora', 'Jack', 'Lily'];
  const lastNames = ['River', 'Storm', 'Wolf', 'Star', 'Moon', 'Sky', 'Lake', 'Forest', 'Stone', 'Rain',
    'Snow', 'Dawn', 'Flux', 'Nexus', 'Apex', 'Core', 'Tide', 'Peak', 'Vale', 'Cove',
    'Glen', 'Heath', 'Meadow', 'Brook', 'Ridge', 'Woods', 'Field', 'Pond', 'Cliff', 'Dune',
    'Haven', 'Oasis', 'Shore', 'Grove', 'Pine', 'Fern', 'Moss', 'Briar', 'Ash', 'Elm',
    'Oak', 'Ivy', 'Yew', 'Fir', 'Holly', 'Jade', 'Onyx', 'Opal', 'Ruby', 'Sage'];
  return `${firstNames[id % firstNames.length]} ${lastNames[id % lastNames.length]}`;
}

/** Random float between min and max */
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Random integer between min and max inclusive */
function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

/** Generate activity dates for a user based on their archetype */
function generateActivityDates(
  signupDate: Date,
  today: Date,
  archetype: string,
  churnDate?: Date
): Date[] {
  const dates: Date[] = [];
  const endDate = churnDate || today;
  const diffDays = Math.floor((endDate.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return [new Date(signupDate)];

  let frequency: number;
  switch (archetype) {
    case 'daily': frequency = 0.85; break;  // active ~85% of days
    case 'weekly': frequency = 0.30; break;  // active ~2-3 days/week
    case 'sporadic': frequency = 0.12; break; // active ~1 day/week
    default: frequency = 0.3;
  }

  for (let d = 0; d <= diffDays; d++) {
    if (Math.random() < frequency) {
      const date = new Date(signupDate);
      date.setDate(date.getDate() + d);
      dates.push(date);
    }
  }

  // Ensure at least signup date is included
  if (dates.length === 0) dates.push(new Date(signupDate));
  return dates;
}

/** Generate 50 synthetic business users */
export function generateSyntheticUsers(): BusinessUser[] {
  const today = new Date();
  const users: BusinessUser[] = [];

  // Archetype distribution
  const archetypes = [
    { type: 'daily', weight: 0.30, churnProb: 0.15 },
    { type: 'weekly', weight: 0.40, churnProb: 0.30 },
    { type: 'sporadic', weight: 0.30, churnProb: 0.50 },
  ];

  const archetypePool: string[] = [];
  for (const a of archetypes) {
    const count = Math.round(a.weight * 50);
    for (let i = 0; i < count; i++) archetypePool.push(a.type);
  }
  // Fill up to 50
  while (archetypePool.length < 50) archetypePool.push('weekly');

  const churnProbs: Record<string, number> = { daily: 0.15, weekly: 0.30, sporadic: 0.50 };

  for (let i = 0; i < 50; i++) {
    const archetype = archetypePool[i];
    // Signup spread over 90 days with more recent signups being more common
    const daysAgo = Math.floor(Math.abs(rand(0, 1) ** 1.5 * 90));
    const signupDate = new Date(today);
    signupDate.setDate(signupDate.getDate() - daysAgo);

    // Determine if churned
    const churnProb = churnProbs[archetype];
    let churnDate: Date | undefined;
    let isActive = true;

    if (Math.random() < churnProb && daysAgo > 14) {
      // Churn happens between 7 and daysAgo-1 days after signup
      const daysUntilChurn = randInt(7, Math.max(8, daysAgo - 1));
      churnDate = new Date(signupDate);
      churnDate.setDate(churnDate.getDate() + daysUntilChurn);
      isActive = false;
    }

    const activityDates = generateActivityDates(signupDate, today, archetype, churnDate);

    users.push({
      id: `USR-${String(i + 1).padStart(3, '0')}`,
      name: generateName(i),
      signupDate,
      avatar: ['🧠', '⚡', '🌊', '🔥', '🌿', '💎', '🪐', '🌀', '✨', '🌙'][i % 10],
      activityDates,
      churnDate,
      sessionsCompleted: randInt(3, churnDate ? 25 : 60),
      latestHrv: Math.round(rand(18, 65)),
      isActive,
      archetype,
    });
  }

  return users;
}

/** Compute daily metrics from user data */
export function computeDailyMetrics(users: BusinessUser[], days: number): DailyMetric[] {
  const today = new Date();
  const metrics: DailyMetric[] = [];
  let cumulative = 0;

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];

    // New signups on this day
    const newSignups = users.filter(u =>
      u.signupDate.toISOString().split('T')[0] === dateStr
    ).length;
    cumulative += newSignups;

    // Active users on this day (signed up before or on this day and still active on this day)
    const activeUsers = users.filter(u => {
      const signup = u.signupDate.toISOString().split('T')[0];
      if (signup > dateStr) return false;
      if (u.churnDate && u.churnDate.toISOString().split('T')[0] <= dateStr) return false;
      return true;
    }).length;

    // Churned users up to this day
    const churnedUsers = users.filter(u =>
      u.churnDate && u.churnDate.toISOString().split('T')[0] <= dateStr
    ).length;

    metrics.push({
      date: dateStr,
      newSignups,
      cumulativeUsers: cumulative,
      activeUsers,
      churnedUsers,
      churnRate: activeUsers > 0 ? Math.round((churnedUsers / (cumulative)) * 100) : 0,
    });
  }

  return metrics;
}

/** Compute cohort retention data */
export function computeCohortRetention(users: BusinessUser[]): CohortRetention[] {
  // Group users by signup week
  const cohorts: Map<string, BusinessUser[]> = new Map();

  for (const user of users) {
    const d = new Date(user.signupDate);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay()); // Start of week
    const key = weekStart.toISOString().split('T')[0];

    if (!cohorts.has(key)) cohorts.set(key, []);
    cohorts.get(key)!.push(user);
  }

  const result: CohortRetention[] = [];
  const today = new Date();

  for (const [cohortDate, cohortUsers] of cohorts.entries()) {
    const cohortStart = new Date(cohortDate);
    const size = cohortUsers.length;

    const getRetained = (days: number): number => {
      const cutoff = new Date(cohortStart);
      cutoff.setDate(cutoff.getDate() + days);
      if (cutoff > today) return -1; // Cohort hasn't reached this age yet
      return cohortUsers.filter(u => {
        if (u.churnDate && u.churnDate <= cutoff) return false;
        // Check if user had any activity after the cutoff
        return u.activityDates.some(ad => ad >= cutoff || ad.toISOString().split('T')[0] === cutoff.toISOString().split('T')[0]);
      }).length;
    };

    result.push({
      cohortDate,
      size,
      day7: getRetained(7),
      day14: getRetained(14),
      day30: getRetained(30),
      day60: getRetained(60),
      day90: getRetained(90),
    });
  }

  return result.sort((a, b) => a.cohortDate.localeCompare(b.cohortDate));
}

/** Compute overall business metrics */
export function computeBusinessMetrics(users: BusinessUser[]): BusinessMetrics {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const churnedUsers = users.filter(u => !u.isActive).length;
  const churnRate = totalUsers > 0 ? Math.round((churnedUsers / totalUsers) * 100) : 0;

  // Retention rate: % of users who signed up > 30 days ago and are still active
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const matureUsers = users.filter(u => u.signupDate <= thirtyDaysAgo);
  const retainedUsers = matureUsers.filter(u => u.isActive).length;
  const retentionRate = matureUsers.length > 0 ? Math.round((retainedUsers / matureUsers.length) * 100) : 0;

  // DAU/MAU ratio (approximate)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dau = users.filter(u =>
    u.isActive && u.activityDates.some(ad => ad.toISOString().split('T')[0] === todayStr)
  ).length;
  const mau = users.filter(u => u.isActive).length;

  // Avg sessions
  const totalSessions = users.reduce((sum, u) => sum + u.sessionsCompleted, 0);

  return {
    totalUsers,
    activeUsers,
    churnedUsers,
    churnRate,
    retentionRate,
    dauMauRatio: mau > 0 ? Math.round((dau / mau) * 100) : 0,
    avgSessionsPerUser: totalUsers > 0 ? Math.round((totalSessions / totalUsers) * 10) / 10 : 0,
  };
}