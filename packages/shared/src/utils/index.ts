// Calculation utilities
export {
  // Volume
  calculateSetVolume,
  calculateItemVolume,
  calculateEntryVolume,

  // Statistics
  getMaxWeight,
  getMaxReps,
  getAverageWeight,
  getTotalReps,
  getTotalDuration,
  getTotalDistance,

  // Progress comparison
  compareEntryProgress,
  compareItemProgress,
  type ProgressComparison,
  type ItemProgressComparison,

  // Goal progress
  calculateGoalProgress,
  type GoalProgress,

  // Completion
  calculateEntryCompletion,

  // Formatting
  formatWeight,
  formatDuration,
  formatDistance,
  formatVolume,
  formatChange,
  formatPercentChange,
} from './calculations';

// Date utilities
export {
  getTodayISO,
  getNowISO,
  formatDate,
  formatRelativeDate,
  isToday,
  isWithinDays,
  getWeekStartISO,
  getMonthStartISO,
  addDays,
  getDayOfWeek,
  calculateStreak,
} from './dates';

// Logger utilities
export {
  logDebug,
  logInfo,
  logWarn,
  logError,
} from './logger';
