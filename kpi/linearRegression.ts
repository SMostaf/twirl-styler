/**
 * Simple Ordinary Least Squares (OLS) linear regression utility.
 * Fits y = β₀ + β₁·x and returns slope, intercept, R², p-value.
 */
export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  pValue: number;
  n: number;
}

/**
 * Performs OLS linear regression on (x, y) data points.
 * Returns slope (β₁), intercept (β₀), R², and p-value of slope.
 */
export function linearRegression(x: number[], y: number[]): RegressionResult {
  const n = x.length;
  if (n < 3) {
    return { slope: 0, intercept: y[0] || 0, rSquared: 0, pValue: 1, n };
  }

  // Means
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;

  // Sums of squares
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - xMean;
    const dy = y[i] - yMean;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }

  // Slope and intercept
  const slope = sxx !== 0 ? sxy / sxx : 0;
  const intercept = yMean - slope * xMean;

  // R-squared
  const rSquared = (syy !== 0 && sxx !== 0) ? (sxy * sxy) / (sxx * syy) : 0;

  // p-value of slope (t-test)
  let pValue = 1;
  if (n > 2 && sxx !== 0) {
    const sse = syy - slope * sxy; // sum of squared errors
    const mse = Math.max(sse / (n - 2), 1e-10); // mean squared error
    const seSlope = Math.sqrt(mse / sxx); // standard error of slope
    const tStat = seSlope !== 0 ? slope / seSlope : 0;
    // Two-tailed p-value from t-distribution (approximation using normal for n large)
    const df = n - 2;
    // Use a simplified t-distribution CDF approximation
    pValue = 2 * tCdf(-Math.abs(tStat), df);
  }

  return { slope, intercept, rSquared, pValue, n };
}

/**
 * Survival function (1 - CDF) of Student's t-distribution.
 * Uses a numerical approximation for the regularized incomplete beta function.
 */
function tCdf(t: number, df: number): number {
  if (df <= 0) return 0.5;
  const x = df / (df + t * t);
  // Using regularized incomplete beta function approximation
  return 0.5 * ibeta(x, df / 2, 0.5);
}

/**
 * Regularized incomplete beta function I_x(a, b).
 * Uses continued fraction approximation for speed.
 */
function ibeta(x: number, a: number, b: number): number {
  if (x < 0 || x > 1) return 0;
  if (x === 0 || x === 1) return x;

  // Use symmetry: I_x(a,b) = 1 - I_(1-x)(b,a)
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - ibeta(1 - x, b, a);
  }

  // Lentz's continued fraction
  const small = 1e-30;
  const fpmin = 1e-30;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    // even step
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    h *= d * c;
    // odd step
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-10) break;
  }

  return h * Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
}

/**
 * Log of the Gamma function (Lanczos approximation).
 */
function logGamma(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < c.length; i++) {
    a += c[i] / (x + i);
  }
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Computes z-score of a value given the population mean and std dev.
 * Returns 0 if std dev is 0.
 */
export function zScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Sigmoid function.
 */
export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Simple moving average (SMA).
 */
export function movingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return result;
}

/**
 * Clip a value within [min, max].
 */
export function clip(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}