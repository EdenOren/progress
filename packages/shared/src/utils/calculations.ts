import type { ItemSet, ItemWithSets, EntryWithItems, GoalTarget } from '../types/domain';

// ============================================================================
// VOLUME CALCULATIONS
// ============================================================================

/**
 * Calculate total volume for a single set (weight * reps)
 */
export function calculateSetVolume(set: ItemSet): number {
  const weight = set.weight_kg ?? 0;
  const reps = set.reps ?? 0;
  return weight * reps;
}

/**
 * Calculate total volume for all sets of an item
 */
export function calculateItemVolume(sets: ItemSet[]): number {
  return sets.reduce((total, set) => total + calculateSetVolume(set), 0);
}

/**
 * Calculate total volume for an entire entry
 */
export function calculateEntryVolume(entry: EntryWithItems): number {
  return entry.items.reduce((total, item) => total + calculateItemVolume(item.sets), 0);
}

// ============================================================================
// SET STATISTICS
// ============================================================================

/**
 * Get the maximum weight used in a list of sets
 */
export function getMaxWeight(sets: ItemSet[]): number | null {
  const weights = sets.map((s) => s.weight_kg).filter((w): w is number => w !== null);
  return weights.length > 0 ? Math.max(...weights) : null;
}

/**
 * Get the maximum reps in a list of sets
 */
export function getMaxReps(sets: ItemSet[]): number | null {
  const reps = sets.map((s) => s.reps).filter((r): r is number => r !== null);
  return reps.length > 0 ? Math.max(...reps) : null;
}

/**
 * Get average weight across sets
 */
export function getAverageWeight(sets: ItemSet[]): number | null {
  const weights = sets.map((s) => s.weight_kg).filter((w): w is number => w !== null);
  if (weights.length === 0) return null;
  return weights.reduce((sum, w) => sum + w, 0) / weights.length;
}

/**
 * Get total reps across all sets
 */
export function getTotalReps(sets: ItemSet[]): number {
  return sets.reduce((total, set) => total + (set.reps ?? 0), 0);
}

/**
 * Get total duration across all sets (in seconds)
 */
export function getTotalDuration(sets: ItemSet[]): number {
  return sets.reduce((total, set) => total + (set.duration_sec ?? 0), 0);
}

/**
 * Get total distance across all sets (in meters)
 */
export function getTotalDistance(sets: ItemSet[]): number {
  return sets.reduce((total, set) => total + (set.distance_m ?? 0), 0);
}

// ============================================================================
// PROGRESS COMPARISON
// ============================================================================

export interface ProgressComparison {
  volumeChange: number;
  volumeChangePercent: number | null;
  maxWeightChange: number | null;
  totalRepsChange: number;
  isImprovement: boolean;
}

/**
 * Compare current entry to previous entry
 */
export function compareEntryProgress(
  current: EntryWithItems,
  previous: EntryWithItems
): ProgressComparison {
  const currentVolume = calculateEntryVolume(current);
  const previousVolume = calculateEntryVolume(previous);
  const volumeChange = currentVolume - previousVolume;
  const volumeChangePercent = previousVolume > 0
    ? ((volumeChange / previousVolume) * 100)
    : null;

  // Get max weights
  const currentMaxWeights = current.items.map((item) => getMaxWeight(item.sets));
  const previousMaxWeights = previous.items.map((item) => getMaxWeight(item.sets));
  const currentOverallMax = Math.max(...currentMaxWeights.filter((w): w is number => w !== null), 0);
  const previousOverallMax = Math.max(...previousMaxWeights.filter((w): w is number => w !== null), 0);
  const maxWeightChange = currentOverallMax > 0 || previousOverallMax > 0
    ? currentOverallMax - previousOverallMax
    : null;

  // Get total reps
  const currentTotalReps = current.items.reduce((sum, item) => sum + getTotalReps(item.sets), 0);
  const previousTotalReps = previous.items.reduce((sum, item) => sum + getTotalReps(item.sets), 0);
  const totalRepsChange = currentTotalReps - previousTotalReps;

  // Consider improvement if volume increased or max weight increased
  const isImprovement = volumeChange > 0 || (maxWeightChange !== null && maxWeightChange > 0);

  return {
    volumeChange,
    volumeChangePercent,
    maxWeightChange,
    totalRepsChange,
    isImprovement,
  };
}

export interface ItemProgressComparison {
  itemName: string;
  volumeChange: number;
  maxWeightChange: number | null;
  repsChange: number;
  setsChange: number;
}

/**
 * Compare items between current and previous entry by name
 */
export function compareItemProgress(
  currentItems: ItemWithSets[],
  previousItems: ItemWithSets[]
): ItemProgressComparison[] {
  const comparisons: ItemProgressComparison[] = [];
  const previousByName = new Map(previousItems.map((item) => [item.name.toLowerCase(), item]));

  for (const current of currentItems) {
    const previous = previousByName.get(current.name.toLowerCase());

    if (previous) {
      const currentVolume = calculateItemVolume(current.sets);
      const previousVolume = calculateItemVolume(previous.sets);
      const currentMax = getMaxWeight(current.sets);
      const previousMax = getMaxWeight(previous.sets);

      comparisons.push({
        itemName: current.name,
        volumeChange: currentVolume - previousVolume,
        maxWeightChange: currentMax !== null && previousMax !== null
          ? currentMax - previousMax
          : null,
        repsChange: getTotalReps(current.sets) - getTotalReps(previous.sets),
        setsChange: current.sets.length - previous.sets.length,
      });
    }
  }

  return comparisons;
}

// ============================================================================
// GOAL PROGRESS
// ============================================================================

export interface GoalProgress {
  achieved: boolean;
  weightProgress: number | null; // percentage (0-100+)
  repsProgress: number | null;
  setsProgress: number | null;
  overallProgress: number; // average of non-null metrics
}

/**
 * Calculate progress towards a goal based on current sets
 */
export function calculateGoalProgress(
  sets: ItemSet[],
  target: GoalTarget
): GoalProgress {
  const progresses: number[] = [];

  // Weight progress
  let weightProgress: number | null = null;
  if (target.weight_kg !== undefined && target.weight_kg > 0) {
    const maxWeight = getMaxWeight(sets);
    if (maxWeight !== null) {
      weightProgress = (maxWeight / target.weight_kg) * 100;
      progresses.push(weightProgress);
    }
  }

  // Reps progress
  let repsProgress: number | null = null;
  if (target.reps !== undefined && target.reps > 0) {
    const maxReps = getMaxReps(sets);
    if (maxReps !== null) {
      repsProgress = (maxReps / target.reps) * 100;
      progresses.push(repsProgress);
    }
  }

  // Sets progress
  let setsProgress: number | null = null;
  if (target.sets !== undefined && target.sets > 0) {
    setsProgress = (sets.length / target.sets) * 100;
    progresses.push(setsProgress);
  }

  // Overall progress (average)
  const overallProgress = progresses.length > 0
    ? progresses.reduce((sum, p) => sum + p, 0) / progresses.length
    : 0;

  // Achieved if all non-null metrics are >= 100%
  const achieved = progresses.length > 0 && progresses.every((p) => p >= 100);

  return {
    achieved,
    weightProgress,
    repsProgress,
    setsProgress,
    overallProgress,
  };
}

// ============================================================================
// ENTRY COMPLETION
// ============================================================================

/**
 * Calculate entry completion percentage
 * Based on items that have at least one set logged
 */
export function calculateEntryCompletion(entry: EntryWithItems): number {
  if (entry.items.length === 0) return 0;

  const itemsWithSets = entry.items.filter((item) => item.sets.length > 0);
  return (itemsWithSets.length / entry.items.length) * 100;
}

// ============================================================================
// WEIGHT CONVERSIONS
// ============================================================================

const KG_TO_LBS = 2.20462;

/**
 * Convert kilograms to pounds
 */
export function kgToLbs(kg: number): number {
  return kg * KG_TO_LBS;
}

/**
 * Convert pounds to kilograms
 */
export function lbsToKg(lbs: number): number {
  return lbs / KG_TO_LBS;
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format weight with unit
 */
export function formatWeight(kg: number, unit: 'kg' | 'lbs' = 'kg'): string {
  if (unit === 'lbs') {
    const lbs = kgToLbs(kg);
    return `${lbs.toFixed(1)} lbs`;
  }
  return `${kg.toFixed(1)} kg`;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format distance with appropriate unit
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters} m`;
}

/**
 * Format volume
 */
export function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k kg`;
  }
  return `${volume.toFixed(0)} kg`;
}

/**
 * Format change with sign
 */
export function formatChange(value: number, suffix: string = ''): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}${suffix}`;
}

/**
 * Format percentage change
 */
export function formatPercentChange(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
