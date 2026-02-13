// Result type
export {
  type Result,
  ok,
  err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  map,
  mapErr,
} from './result';

// Settings types
export type {
  DistanceUnit,
  WeightUnit,
  WorkoutModuleSettings,
  DailyLogModuleSettings,
  ModuleSettingsMap,
  UserSettings,
  UserSettingsUpdate,
} from './settings';

export {
  DEFAULT_WORKOUT_SETTINGS,
  DEFAULT_DAILY_LOG_SETTINGS,
} from './settings';

// Domain types
export type {
  // Common
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

  // Utility
  BaseRow,
  UserOwnedRow,
  PaginationParams,
  PaginatedResponse,
} from './domain';

// Daily Log types
export type {
  DailyLogEntry,
  DailyLogEntryInsert,
  DailyLogEntryUpdate,
} from './dailyLog';

// Health Goals types
export type {
  HealthGoals,
  HealthGoalsUpsert,
} from './healthGoals';
