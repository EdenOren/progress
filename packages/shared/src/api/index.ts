// Profile API
export {
  getProfile,
  updateProfile,
} from './profiles';

// Domain API
export {
  getDomains,
  getDomainByKey,
  getDomainById,
} from './domains';

// Subject API
export {
  getSubjects,
  getAllSubjects,
  getSubjectsByDomain,
  getSubjectById,
  getSubjectsWithStats,
  createSubject,
  updateSubject,
  deleteSubject,
  restoreSubject,
  hardDeleteSubject,
} from './subjects';

// Entry API
export {
  getEntriesBySubject,
  getRecentEntries,
  getEntryById,
  getEntryWithItems,
  getLastEntryForSubject,
  createEntry,
  createEntryWithTemplate,
  updateEntry,
  completeEntry,
  deleteEntry,
} from './entries';

// Item API
export {
  getItemsByEntry,
  getItemWithSets,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
} from './items';

// ItemSet API
export {
  getSetsByItem,
  createSet,
  updateSet,
  deleteSet,
  createSets,
} from './items';

// ItemFeedback API
export {
  getFeedbackByItem,
  setFeedback,
  updateFeedback,
  deleteFeedback,
} from './items';

// Goal API
export {
  getGoals,
  getGoalsBySubject,
  getGoalForItem,
  getAchievedGoals,
  createGoal,
  updateGoal,
  achieveGoal,
  setGoal,
  deleteGoal,
} from './goals';

// Exercise API
export {
  searchExercises,
  getAllExercises,
  getExercisesByMuscleGroup,
  getExerciseById,
  createCustomExercise,
  deleteCustomExercise,
  updateExerciseIcon,
} from './exercises';

// Template API
export {
  getWorkoutTemplate,
  addToTemplate,
  addMultipleToTemplate,
  updateTemplateItem,
  removeFromTemplate,
  hardRemoveFromTemplate,
  reorderTemplate,
  getNextTemplatePosition,
} from './templates';

// Settings API
export {
  getUserSettings,
  updateUserSettings,
  toggleModule,
  updateModuleSettings,
  getModuleSettings,
  isModuleEnabled,
  updateActiveModule,
} from './settings';
