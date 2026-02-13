/**
 * @progress/shared
 *
 * Shared types, schemas, API functions, and utilities for the Progress app.
 */

// ============================================================================
// Types
// ============================================================================

export type {
  // Result type
  Result,

  // Common types
  UUID,
  ISODateTime,
  ISODate,
  FeedbackRating,
  TrackingType,
  ExerciseCategory,
  MuscleGroup,
  ExerciseIcon,

  // Profile
  Profile,
  ProfileInsert,
  ProfileUpdate,

  // Domain
  Domain,

  // Subject
  Subject,
  SubjectInsert,
  SubjectUpdate,
  SubjectWithStats,

  // Entry
  Entry,
  EntryInsert,
  EntryUpdate,
  EntryWithItems,

  // Item
  Item,
  ItemInsert,
  ItemUpdate,
  ItemWithSets,

  // ItemSet
  ItemSet,
  ItemSetInsert,
  ItemSetUpdate,

  // ItemFeedback
  ItemFeedback,
  ItemFeedbackInsert,
  ItemFeedbackUpdate,

  // Goal
  Goal,
  GoalTarget,
  GoalInsert,
  GoalUpdate,

  // Exercise
  Exercise,
  ExerciseInsert,

  // WorkoutTemplate
  TemplateSetConfig,
  WorkoutTemplate,
  WorkoutTemplateWithExercise,
  WorkoutTemplateInsert,
  WorkoutTemplateUpdate,

  // Settings
  DistanceUnit,
  WeightUnit,
  WorkoutModuleSettings,
  DailyLogModuleSettings,
  ModuleSettingsMap,
  UserSettings,
  UserSettingsUpdate,

  // Daily Log
  DailyLogEntry,
  DailyLogEntryInsert,
  DailyLogEntryUpdate,

  // Health Goals
  HealthGoals,
  HealthGoalsUpsert,

  // Utility types
  BaseRow,
  UserOwnedRow,
  PaginationParams,
  PaginatedResponse,
} from './types/index';

// Settings constants
export {
  DEFAULT_WORKOUT_SETTINGS,
  DEFAULT_DAILY_LOG_SETTINGS,
} from './types/index';

// Result helpers
export { ok, err, isOk, isErr, unwrap, unwrapOr, map, mapErr } from './types/index';

// ============================================================================
// Schemas
// ============================================================================

export {
  // Common
  uuidSchema,
  isoDateTimeSchema,
  isoDateSchema,
  feedbackRatingSchema,

  // Profile
  profileSchema,
  profileInsertSchema,
  profileUpdateSchema,

  // Domain
  domainSchema,
  domainArraySchema,

  // Subject
  subjectSchema,
  subjectInsertSchema,
  subjectUpdateSchema,
  subjectArraySchema,
  subjectWithStatsSchema,

  // Entry
  entrySchema,
  entryInsertSchema,
  entryUpdateSchema,
  entryArraySchema,
  entryWithItemsSchema,

  // Item
  itemSchema,
  itemInsertSchema,
  itemUpdateSchema,
  itemArraySchema,
  itemWithSetsSchema,

  // ItemSet
  itemSetSchema,
  itemSetInsertSchema,
  itemSetUpdateSchema,
  itemSetArraySchema,

  // ItemFeedback
  itemFeedbackSchema,
  itemFeedbackInsertSchema,
  itemFeedbackUpdateSchema,

  // Goal
  goalSchema,
  goalInsertSchema,
  goalUpdateSchema,
  goalArraySchema,
  goalTargetSchema,

  // Exercise
  trackingTypeSchema,
  exerciseCategorySchema,
  muscleGroupSchema,
  exerciseIconSchema,
  exerciseSchema,
  exerciseInsertSchema,
  exerciseArraySchema,

  // WorkoutTemplate
  templateSetConfigSchema,
  workoutTemplateSchema,
  workoutTemplateWithExerciseSchema,
  workoutTemplateInsertSchema,
  workoutTemplateUpdateSchema,
  workoutTemplateArraySchema,
  workoutTemplateWithExerciseArraySchema,

  // Pagination
  paginationParamsSchema,
  createPaginatedResponseSchema,

  // Settings
  distanceUnitSchema,
  weightUnitSchema,
  workoutModuleSettingsSchema,
  dailyLogModuleSettingsSchema,
  moduleSettingsMapSchema,
  userSettingsSchema,
  userSettingsUpdateSchema,

  // Daily Log
  dailyLogEntrySchema,
  dailyLogEntryArraySchema,
  dailyLogEntryInsertSchema,
  dailyLogEntryUpdateSchema,

  // Health Goals
  healthGoalsSchema,
  healthGoalsUpsertSchema,
} from './schemas/index';

// ============================================================================
// Errors
// ============================================================================

export {
  AppError,
  AuthError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
  DuplicateError,
  NetworkError,
  DatabaseError,
  InternalError,
  mapSupabaseError,
  mapSupabaseAuthError,
  isNetworkError,
} from './errors/index';

// ============================================================================
// Config
// ============================================================================

export {
  validateEnv,
  validateEnvSafe,
  isDevelopment,
  isProduction,
  type Env,
  type EnvValidationResult,
} from './config/index';

// ============================================================================
// Supabase
// ============================================================================

export {
  initSupabase,
  getSupabase,
  isSupabaseInitialized,
  resetSupabase,
  type Database,
} from './supabase/index';

// ============================================================================
// API Functions
// ============================================================================

export {
  // Profiles
  getProfile,
  updateProfile,

  // Domains
  getDomains,
  getDomainByKey,
  getDomainById,

  // Subjects
  getSubjects,
  getAllSubjects,
  getSubjectsByDomain,
  getSubjectById,
  getSubjectByOrdinal,
  getSubjectsWithStats,
  createSubject,
  updateSubject,
  deleteSubject,
  restoreSubject,
  hardDeleteSubject,

  // Entries
  getEntriesBySubject,
  getRecentEntries,
  getEntryById,
  getEntryByOrdinal,
  getEntryWithItems,
  getEntryWithItemsByOrdinal,
  getLastEntryForSubject,
  createEntry,
  createEntryWithTemplate,
  updateEntry,
  completeEntry,
  deleteEntry,

  // Items
  getItemsByEntry,
  getItemWithSets,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,

  // ItemSets
  getSetsByItem,
  createSet,
  updateSet,
  deleteSet,
  createSets,

  // ItemFeedback
  getFeedbackByItem,
  setFeedback,
  updateFeedback,
  deleteFeedback,

  // Goals
  getGoals,
  getGoalsBySubject,
  getGoalForItem,
  getAchievedGoals,
  createGoal,
  updateGoal,
  achieveGoal,
  setGoal,
  deleteGoal,

  // Exercises
  searchExercises,
  getAllExercises,
  getExercisesByMuscleGroup,
  getExerciseById,
  createCustomExercise,
  deleteCustomExercise,
  updateExerciseIcon,

  // Templates
  getWorkoutTemplate,
  addToTemplate,
  addMultipleToTemplate,
  updateTemplateItem,
  removeFromTemplate,
  hardRemoveFromTemplate,
  reorderTemplate,
  getNextTemplatePosition,

  // Settings
  getUserSettings,
  updateUserSettings,
  updateModuleSettings,
  getModuleSettings,

  // Daily Log
  getDailyLogEntries,
  getDailyLogEntryByDate,
  getDailyLogEntryById,
  upsertDailyLogEntry,
  updateDailyLogEntry,
  deleteDailyLogEntry,

  // Health Goals
  getHealthGoals,
  upsertHealthGoals,
} from './api/index';

// ============================================================================
// Constants
// ============================================================================

export {
  WORKOUT_DOMAIN_ID,
  DAILY_LOG_DOMAIN_ID,
} from './constants/index';

// ============================================================================
// Utilities
// ============================================================================

export {
  // Volume calculations
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

  // Weight conversions
  kgToLbs,
  lbsToKg,

  // Formatting
  formatWeight,
  formatDuration,
  formatDurationLong,
  formatDistance,
  formatVolume,
  formatChange,
  formatPercentChange,

  // Date utilities
  getTodayISO,
  getNowISO,
  getOrdinalSuffix,
  formatDate,
  formatRelativeDate,
  isToday,
  isWithinDays,
  getWeekStartISO,
  getMonthStartISO,
  addDays,
  getDayOfWeek,
  calculateStreak,

  // Logger utilities
  logDebug,
  logInfo,
  logWarn,
  logError,

  // KPI utilities
  waistToHeightRatio,
  averageOfValues,
  goalPercentage,
  getKpiStatus,
  getWaistToHeightStatus,
  type KpiStatus,
} from './utils/index';
