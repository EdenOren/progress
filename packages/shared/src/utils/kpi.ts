/**
 * KPI calculation utilities.
 * Pure functions for computing health dashboard metrics.
 */

export type KpiStatus = 'good' | 'warning' | 'neutral';

/**
 * Waist-to-height ratio. Values below 0.5 are considered healthy.
 */
export function waistToHeightRatio(waistCm: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  return waistCm / heightCm;
}

/**
 * Average of non-null values from an array.
 * Returns null if no valid values.
 */
export function averageOfValues(values: (number | null | undefined)[]): number | null {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length === 0) return null;
  const sum = valid.reduce((a, b) => a + b, 0);
  return sum / valid.length;
}

/**
 * Percentage of current value relative to a target.
 * Returns value between 0 and 100+.
 */
export function goalPercentage(current: number, target: number): number {
  if (target <= 0) return 0;
  return (current / target) * 100;
}

/**
 * Determine KPI status based on value vs target.
 * For "higher is better" metrics (water, sleep): >= target is good, >= 80% is warning.
 * For "lower is better" metrics (waist): <= target is good.
 */
export function getKpiStatus(
  current: number,
  target: number,
  lowerIsBetter: boolean = false
): KpiStatus {
  if (lowerIsBetter) {
    if (current <= target) return 'good';
    if (current <= target * 1.1) return 'warning';
    return 'neutral';
  }

  const pct = goalPercentage(current, target);
  if (pct >= 100) return 'good';
  if (pct >= 80) return 'warning';
  return 'neutral';
}

/**
 * Get waist-to-height ratio status.
 * < 0.5 is healthy, 0.5-0.6 is warning.
 */
export function getWaistToHeightStatus(ratio: number): KpiStatus {
  if (ratio < 0.5) return 'good';
  if (ratio < 0.6) return 'warning';
  return 'neutral';
}
