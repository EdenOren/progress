import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getTodayISO,
  getOrdinalSuffix,
  formatDate,
  formatRelativeDate,
  isToday,
  isWithinDays,
  addDays,
  calculateStreak,
} from './dates';

describe('Date Utilities', () => {
  describe('getTodayISO', () => {
    it('returns date in YYYY-MM-DD format', () => {
      const today = getTodayISO();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getOrdinalSuffix', () => {
    it('returns "st" for 1, 21, 31', () => {
      expect(getOrdinalSuffix(1)).toBe('st');
      expect(getOrdinalSuffix(21)).toBe('st');
      expect(getOrdinalSuffix(31)).toBe('st');
    });

    it('returns "nd" for 2, 22', () => {
      expect(getOrdinalSuffix(2)).toBe('nd');
      expect(getOrdinalSuffix(22)).toBe('nd');
    });

    it('returns "rd" for 3, 23', () => {
      expect(getOrdinalSuffix(3)).toBe('rd');
      expect(getOrdinalSuffix(23)).toBe('rd');
    });

    it('returns "th" for 11, 12, 13 (special cases)', () => {
      expect(getOrdinalSuffix(11)).toBe('th');
      expect(getOrdinalSuffix(12)).toBe('th');
      expect(getOrdinalSuffix(13)).toBe('th');
    });

    it('returns "th" for other numbers', () => {
      expect(getOrdinalSuffix(4)).toBe('th');
      expect(getOrdinalSuffix(15)).toBe('th');
      expect(getOrdinalSuffix(20)).toBe('th');
    });
  });

  describe('formatDate', () => {
    it('formats date with day name, ordinal day, short month, and year', () => {
      // 2024-01-15 is a Monday
      const result = formatDate('2024-01-15');
      expect(result).toMatch(/Monday,\s*15th\s*Jan,\s*2024/);
    });

    it('uses correct ordinal for 1st', () => {
      // 2024-02-01 is a Thursday
      const result = formatDate('2024-02-01');
      expect(result).toMatch(/Thursday,\s*1st\s*Feb,\s*2024/);
    });

    it('uses correct ordinal for 2nd', () => {
      // 2024-02-02 is a Friday
      const result = formatDate('2024-02-02');
      expect(result).toMatch(/Friday,\s*2nd\s*Feb,\s*2024/);
    });

    it('uses correct ordinal for 3rd', () => {
      // 2024-02-03 is a Saturday
      const result = formatDate('2024-02-03');
      expect(result).toMatch(/Saturday,\s*3rd\s*Feb,\s*2024/);
    });

    it('uses "th" for 11th, 12th, 13th', () => {
      // 2024-01-11 is a Thursday
      const result = formatDate('2024-01-11');
      expect(result).toMatch(/Thursday,\s*11th\s*Jan,\s*2024/);
    });
  });

  describe('formatRelativeDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "Today" for today', () => {
      expect(formatRelativeDate('2024-01-15')).toBe('Today');
    });

    it('returns "Yesterday" for yesterday', () => {
      expect(formatRelativeDate('2024-01-14')).toBe('Yesterday');
    });

    it('returns "X days ago" for recent dates', () => {
      expect(formatRelativeDate('2024-01-12')).toBe('3 days ago');
    });

    it('returns "1 week ago" for 7-13 days', () => {
      expect(formatRelativeDate('2024-01-08')).toBe('1 week ago');
    });

    it('returns "X weeks ago" for 14-29 days', () => {
      expect(formatRelativeDate('2024-01-01')).toBe('2 weeks ago');
    });
  });

  describe('isToday', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true for today', () => {
      expect(isToday('2024-01-15')).toBe(true);
    });

    it('returns false for yesterday', () => {
      expect(isToday('2024-01-14')).toBe(false);
    });
  });

  describe('isWithinDays', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true for dates within range', () => {
      expect(isWithinDays('2024-01-14', 7)).toBe(true);
      expect(isWithinDays('2024-01-10', 7)).toBe(true);
    });

    it('returns false for dates outside range', () => {
      expect(isWithinDays('2024-01-01', 7)).toBe(false);
    });
  });

  describe('addDays', () => {
    it('adds positive days', () => {
      expect(addDays('2024-01-15', 5)).toBe('2024-01-20');
    });

    it('subtracts with negative days', () => {
      expect(addDays('2024-01-15', -5)).toBe('2024-01-10');
    });

    it('handles month boundaries', () => {
      expect(addDays('2024-01-30', 5)).toBe('2024-02-04');
    });
  });

  describe('calculateStreak', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns 0 for empty dates', () => {
      expect(calculateStreak([])).toBe(0);
    });

    it('returns 0 if most recent is more than 1 day ago', () => {
      expect(calculateStreak(['2024-01-12', '2024-01-11'])).toBe(0);
    });

    it('counts consecutive days starting from today', () => {
      const dates = ['2024-01-15', '2024-01-14', '2024-01-13'];
      expect(calculateStreak(dates)).toBe(3);
    });

    it('counts consecutive days starting from yesterday', () => {
      const dates = ['2024-01-14', '2024-01-13', '2024-01-12'];
      expect(calculateStreak(dates)).toBe(3);
    });

    it('stops counting when streak breaks', () => {
      const dates = ['2024-01-15', '2024-01-14', '2024-01-12']; // gap on 13th
      expect(calculateStreak(dates)).toBe(2);
    });

    it('handles duplicate dates', () => {
      const dates = ['2024-01-15', '2024-01-15', '2024-01-14'];
      expect(calculateStreak(dates)).toBe(2);
    });
  });
});
