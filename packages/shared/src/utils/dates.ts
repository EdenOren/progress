/**
 * Date utility functions for the Progress app.
 */

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0] as string;
}

/**
 * Get current datetime in ISO format
 */
export function getNowISO(): string {
  return new Date().toISOString();
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, options ?? {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date as relative time (e.g., "2 days ago", "yesterday")
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 14) {
    return '1 week ago';
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} weeks ago`;
  } else if (diffDays < 60) {
    return '1 month ago';
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} months ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
}

/**
 * Check if a date is today
 */
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is within the last N days
 */
export function isWithinDays(dateString: string, days: number): boolean {
  const date = new Date(dateString);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

/**
 * Get the start of the current week (Monday)
 */
export function getWeekStartISO(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0] as string;
}

/**
 * Get the start of the current month
 */
export function getMonthStartISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Add days to a date string
 */
export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0] as string;
}

/**
 * Get day of week name
 */
export function getDayOfWeek(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { weekday: 'long' });
}

/**
 * Calculate streak of consecutive days with entries
 */
export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  // Sort dates descending
  const sortedDates = [...dates].sort((a, b) => b.localeCompare(a));

  // Check if most recent is today or yesterday
  const today = getTodayISO();
  const yesterday = addDays(today, -1);
  const mostRecent = sortedDates[0];

  if (mostRecent !== today && mostRecent !== yesterday) {
    return 0; // Streak is broken
  }

  let streak = 1;
  let currentDate = mostRecent;

  for (let i = 1; i < sortedDates.length; i++) {
    const expectedPrevious = addDays(currentDate, -1);
    const actualPrevious = sortedDates[i];

    if (actualPrevious === expectedPrevious) {
      streak++;
      currentDate = actualPrevious;
    } else if (actualPrevious !== currentDate) {
      // Not consecutive and not same day
      break;
    }
    // If same day, continue checking
  }

  return streak;
}
