import { describe, it, expect } from 'vitest';
import {
  uuidSchema,
  isoDateSchema,
  isoDateTimeSchema,
  feedbackRatingSchema,
  subjectSchema,
  subjectInsertSchema,
  entrySchema,
  itemSetSchema,
  goalTargetSchema,
} from './domain';

describe('Common Schemas', () => {
  describe('uuidSchema', () => {
    it('accepts valid UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        '00000000-0000-0000-0000-000000000000',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      ];

      for (const uuid of validUUIDs) {
        expect(uuidSchema.safeParse(uuid).success).toBe(true);
      }
    });

    it('rejects invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456',
        '123e4567e89b12d3a456426614174000',
        '',
        123,
      ];

      for (const uuid of invalidUUIDs) {
        expect(uuidSchema.safeParse(uuid).success).toBe(false);
      }
    });
  });

  describe('isoDateSchema', () => {
    it('accepts valid ISO dates', () => {
      const validDates = ['2024-01-01', '2023-12-31', '2025-06-15'];

      for (const date of validDates) {
        expect(isoDateSchema.safeParse(date).success).toBe(true);
      }
    });

    it('rejects invalid date formats', () => {
      const invalidDates = [
        '01-01-2024',
        '2024/01/01',
        '2024-1-1',
        'January 1, 2024',
        '2024-01-01T00:00:00Z',
      ];

      for (const date of invalidDates) {
        expect(isoDateSchema.safeParse(date).success).toBe(false);
      }
    });
  });

  describe('isoDateTimeSchema', () => {
    it('accepts valid ISO datetime strings', () => {
      const validDateTimes = [
        '2024-01-01T00:00:00Z',
        '2024-01-01T12:30:45.123Z',
        '2024-06-15T23:59:59Z',
      ];

      for (const dt of validDateTimes) {
        expect(isoDateTimeSchema.safeParse(dt).success).toBe(true);
      }
    });

    it('rejects invalid datetime formats', () => {
      const invalidDateTimes = [
        '2024-01-01',
        '2024-01-01 00:00:00',
        'not-a-date',
      ];

      for (const dt of invalidDateTimes) {
        expect(isoDateTimeSchema.safeParse(dt).success).toBe(false);
      }
    });
  });

  describe('feedbackRatingSchema', () => {
    it('accepts valid ratings', () => {
      expect(feedbackRatingSchema.safeParse('done').success).toBe(true);
      expect(feedbackRatingSchema.safeParse('up').success).toBe(true);
    });

    it('rejects invalid ratings', () => {
      expect(feedbackRatingSchema.safeParse('success').success).toBe(false);
      expect(feedbackRatingSchema.safeParse('hard').success).toBe(false);
      expect(feedbackRatingSchema.safeParse('fail').success).toBe(false);
      expect(feedbackRatingSchema.safeParse('').success).toBe(false);
    });
  });
});

describe('Subject Schemas', () => {
  const validSubject = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    domain_id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Monday Practice',
    description: 'Weekly strength training',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  describe('subjectSchema', () => {
    it('validates a complete subject', () => {
      const result = subjectSchema.safeParse(validSubject);
      expect(result.success).toBe(true);
    });

    it('validates subject with null description', () => {
      const result = subjectSchema.safeParse({
        ...validSubject,
        description: null,
      });
      expect(result.success).toBe(true);
    });

    it('rejects subject with missing required fields', () => {
      const { name, ...missingName } = validSubject;
      expect(subjectSchema.safeParse(missingName).success).toBe(false);
    });

    it('rejects name exceeding max length', () => {
      const result = subjectSchema.safeParse({
        ...validSubject,
        name: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('subjectInsertSchema', () => {
    it('validates insert with required fields only', () => {
      const result = subjectInsertSchema.safeParse({
        user_id: validSubject.user_id,
        domain_id: validSubject.domain_id,
        name: validSubject.name,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true); // default
      }
    });

    it('accepts optional fields', () => {
      const result = subjectInsertSchema.safeParse({
        user_id: validSubject.user_id,
        domain_id: validSubject.domain_id,
        name: validSubject.name,
        description: 'My workout',
        is_active: false,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Entry Schema', () => {
  const validEntry = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    subject_id: '123e4567-e89b-12d3-a456-426614174002',
    performed_at: '2024-01-15',
    notes: 'Great session',
    is_completed: true,
    duration_seconds: null,
    started_at: null,
    completed_at: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
  };

  it('validates a complete entry', () => {
    const result = entrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it('validates entry with null notes', () => {
    const result = entrySchema.safeParse({
      ...validEntry,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects notes exceeding max length', () => {
    const result = entrySchema.safeParse({
      ...validEntry,
      notes: 'a'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe('ItemSet Schema', () => {
  const validSet = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    item_id: '123e4567-e89b-12d3-a456-426614174001',
    user_id: '123e4567-e89b-12d3-a456-426614174002',
    set_index: 0,
    weight_kg: 100.5,
    reps: 8,
    duration_sec: null,
    distance_m: null,
    target_reps: null,
    target_duration_sec: null,
    notes: null,
    created_at: '2024-01-15T10:30:00Z',
  };

  it('validates a complete set', () => {
    const result = itemSetSchema.safeParse(validSet);
    expect(result.success).toBe(true);
  });

  it('validates set with only duration', () => {
    const result = itemSetSchema.safeParse({
      ...validSet,
      weight_kg: null,
      reps: null,
      duration_sec: 300,
    });
    expect(result.success).toBe(true);
  });

  it('rejects weight exceeding max', () => {
    const result = itemSetSchema.safeParse({
      ...validSet,
      weight_kg: 1001,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative reps', () => {
    const result = itemSetSchema.safeParse({
      ...validSet,
      reps: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects duration exceeding 24 hours', () => {
    const result = itemSetSchema.safeParse({
      ...validSet,
      duration_sec: 86401,
    });
    expect(result.success).toBe(false);
  });
});

describe('GoalTarget Schema', () => {
  it('validates target with weight and reps', () => {
    const result = goalTargetSchema.safeParse({
      weight_kg: 120,
      reps: 10,
    });
    expect(result.success).toBe(true);
  });

  it('validates target with only sets', () => {
    const result = goalTargetSchema.safeParse({
      sets: 5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty target', () => {
    const result = goalTargetSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects target with all undefined', () => {
    const result = goalTargetSchema.safeParse({
      weight_kg: undefined,
      reps: undefined,
    });
    expect(result.success).toBe(false);
  });
});
