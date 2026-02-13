import { describe, it, expect } from 'vitest';
import type { ItemSet, ItemWithSets, EntryWithItems, GoalTarget } from '../types/domain';
import {
  calculateSetVolume,
  calculateItemVolume,
  calculateEntryVolume,
  getMaxWeight,
  getMaxReps,
  getAverageWeight,
  getTotalReps,
  compareEntryProgress,
  calculateGoalProgress,
  calculateEntryCompletion,
  formatWeight,
  formatDuration,
  formatDistance,
  formatChange,
} from './calculations';

// Helper to create a mock set
function createSet(overrides: Partial<ItemSet> = {}): ItemSet {
  return {
    id: 'set-1',
    item_id: 'item-1',
    user_id: 'user-1',
    set_index: 0,
    weight_kg: null,
    reps: null,
    duration_sec: null,
    distance_m: null,
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('Volume Calculations', () => {
  describe('calculateSetVolume', () => {
    it('calculates volume as weight * reps', () => {
      const set = createSet({ weight_kg: 100, reps: 8 });
      expect(calculateSetVolume(set)).toBe(800);
    });

    it('returns 0 when weight is null', () => {
      const set = createSet({ weight_kg: null, reps: 8 });
      expect(calculateSetVolume(set)).toBe(0);
    });

    it('returns 0 when reps is null', () => {
      const set = createSet({ weight_kg: 100, reps: null });
      expect(calculateSetVolume(set)).toBe(0);
    });

    it('returns 0 when both are null', () => {
      const set = createSet({ weight_kg: null, reps: null });
      expect(calculateSetVolume(set)).toBe(0);
    });
  });

  describe('calculateItemVolume', () => {
    it('sums volume across all sets', () => {
      const sets = [
        createSet({ weight_kg: 100, reps: 8 }),
        createSet({ weight_kg: 100, reps: 6 }),
        createSet({ weight_kg: 90, reps: 8 }),
      ];
      // 800 + 600 + 720 = 2120
      expect(calculateItemVolume(sets)).toBe(2120);
    });

    it('returns 0 for empty sets', () => {
      expect(calculateItemVolume([])).toBe(0);
    });
  });

  describe('calculateEntryVolume', () => {
    it('sums volume across all items', () => {
      const entry: EntryWithItems = {
        id: 'entry-1',
        user_id: 'user-1',
        subject_id: 'subject-1',
        performed_at: '2024-01-15',
        notes: null,
        is_completed: true,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        items: [
          {
            id: 'item-1',
            entry_id: 'entry-1',
            user_id: 'user-1',
            name: 'Deadlift',
            position: 0,
            created_at: '2024-01-15T00:00:00Z',
            sets: [createSet({ weight_kg: 100, reps: 5 })], // 500
            feedback: null,
          },
          {
            id: 'item-2',
            entry_id: 'entry-1',
            user_id: 'user-1',
            name: 'Squats',
            position: 1,
            created_at: '2024-01-15T00:00:00Z',
            sets: [createSet({ weight_kg: 80, reps: 8 })], // 640
            feedback: null,
          },
        ],
      };
      expect(calculateEntryVolume(entry)).toBe(1140);
    });
  });
});

describe('Set Statistics', () => {
  const sets = [
    createSet({ weight_kg: 100, reps: 8 }),
    createSet({ weight_kg: 110, reps: 6 }),
    createSet({ weight_kg: 105, reps: 7 }),
  ];

  describe('getMaxWeight', () => {
    it('returns the maximum weight', () => {
      expect(getMaxWeight(sets)).toBe(110);
    });

    it('returns null for empty sets', () => {
      expect(getMaxWeight([])).toBe(null);
    });

    it('returns null when all weights are null', () => {
      const nullSets = [createSet(), createSet()];
      expect(getMaxWeight(nullSets)).toBe(null);
    });
  });

  describe('getMaxReps', () => {
    it('returns the maximum reps', () => {
      expect(getMaxReps(sets)).toBe(8);
    });
  });

  describe('getAverageWeight', () => {
    it('calculates average weight', () => {
      expect(getAverageWeight(sets)).toBeCloseTo(105, 1);
    });
  });

  describe('getTotalReps', () => {
    it('sums all reps', () => {
      expect(getTotalReps(sets)).toBe(21);
    });
  });
});

describe('Progress Comparison', () => {
  const createEntry = (items: ItemWithSets[]): EntryWithItems => ({
    id: 'entry-1',
    user_id: 'user-1',
    subject_id: 'subject-1',
    performed_at: '2024-01-15',
    notes: null,
    is_completed: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    items,
  });

  const createItem = (name: string, sets: ItemSet[]): ItemWithSets => ({
    id: 'item-1',
    entry_id: 'entry-1',
    user_id: 'user-1',
    name,
    position: 0,
    created_at: '2024-01-15T00:00:00Z',
    sets,
    feedback: null,
  });

  it('detects improvement when volume increases', () => {
    const previous = createEntry([
      createItem('Deadlift', [createSet({ weight_kg: 100, reps: 5 })]),
    ]);
    const current = createEntry([
      createItem('Deadlift', [createSet({ weight_kg: 110, reps: 5 })]),
    ]);

    const comparison = compareEntryProgress(current, previous);
    expect(comparison.isImprovement).toBe(true);
    expect(comparison.volumeChange).toBe(50); // 550 - 500
  });

  it('calculates percentage change correctly', () => {
    const previous = createEntry([
      createItem('Deadlift', [createSet({ weight_kg: 100, reps: 10 })]),
    ]);
    const current = createEntry([
      createItem('Deadlift', [createSet({ weight_kg: 100, reps: 12 })]),
    ]);

    const comparison = compareEntryProgress(current, previous);
    expect(comparison.volumeChangePercent).toBeCloseTo(20, 1); // 1200/1000 - 1 = 20%
  });
});

describe('Goal Progress', () => {
  it('calculates progress towards weight goal', () => {
    const sets = [createSet({ weight_kg: 90, reps: 8 })];
    const target: GoalTarget = { weight_kg: 100 };

    const progress = calculateGoalProgress(sets, target);
    expect(progress.weightProgress).toBe(90); // 90%
    expect(progress.achieved).toBe(false);
  });

  it('marks goal as achieved when all targets met', () => {
    const sets = [createSet({ weight_kg: 100, reps: 10 })];
    const target: GoalTarget = { weight_kg: 100, reps: 10 };

    const progress = calculateGoalProgress(sets, target);
    expect(progress.achieved).toBe(true);
  });

  it('marks goal as achieved when targets exceeded', () => {
    const sets = [createSet({ weight_kg: 110, reps: 12 })];
    const target: GoalTarget = { weight_kg: 100, reps: 10 };

    const progress = calculateGoalProgress(sets, target);
    expect(progress.achieved).toBe(true);
    expect(progress.weightProgress).toBeCloseTo(110);
    expect(progress.repsProgress).toBeCloseTo(120);
  });
});

describe('Entry Completion', () => {
  it('calculates completion percentage', () => {
    const entry: EntryWithItems = {
      id: 'entry-1',
      user_id: 'user-1',
      subject_id: 'subject-1',
      performed_at: '2024-01-15',
      notes: null,
      is_completed: false,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      items: [
        {
          id: 'item-1',
          entry_id: 'entry-1',
          user_id: 'user-1',
          name: 'Deadlift',
          position: 0,
          created_at: '2024-01-15T00:00:00Z',
          sets: [createSet({ weight_kg: 100, reps: 5 })],
          feedback: null,
        },
        {
          id: 'item-2',
          entry_id: 'entry-1',
          user_id: 'user-1',
          name: 'Squats',
          position: 1,
          created_at: '2024-01-15T00:00:00Z',
          sets: [], // No sets logged
          feedback: null,
        },
      ],
    };

    expect(calculateEntryCompletion(entry)).toBe(50);
  });

  it('returns 0 for entry with no items', () => {
    const entry: EntryWithItems = {
      id: 'entry-1',
      user_id: 'user-1',
      subject_id: 'subject-1',
      performed_at: '2024-01-15',
      notes: null,
      is_completed: false,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      items: [],
    };

    expect(calculateEntryCompletion(entry)).toBe(0);
  });
});

describe('Formatting', () => {
  describe('formatWeight', () => {
    it('formats weight in kg', () => {
      expect(formatWeight(100)).toBe('100.0 kg');
      expect(formatWeight(100.5)).toBe('100.5 kg');
    });

    it('formats weight in lbs', () => {
      expect(formatWeight(100, 'lbs')).toBe('220.5 lbs');
    });
  });

  describe('formatDuration', () => {
    it('formats seconds', () => {
      expect(formatDuration(45)).toBe('45s');
    });

    it('formats minutes', () => {
      expect(formatDuration(120)).toBe('2m');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(90)).toBe('1m 30s');
    });
  });

  describe('formatDistance', () => {
    it('formats meters', () => {
      expect(formatDistance(500)).toBe('500 m');
    });

    it('formats kilometers', () => {
      expect(formatDistance(1500)).toBe('1.50 km');
    });
  });

  describe('formatChange', () => {
    it('formats positive change with plus sign', () => {
      expect(formatChange(10.5, ' kg')).toBe('+10.5 kg');
    });

    it('formats negative change', () => {
      expect(formatChange(-5.5, ' kg')).toBe('-5.5 kg');
    });
  });
});
