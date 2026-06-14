import { toDateString } from './id';

// Returns first and last day of current month as ISO date strings
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: toDateString(start),
    end: toDateString(end),
  };
}

// Human-friendly relative date: "Today", "Yesterday", or "March 24"
export function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateStr = toDateString(date);
  const todayStr = toDateString(today);
  const yesterdayStr = toDateString(yesterday);

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

// Time only: "2:45 PM"
export function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Group transactions by relative date for sectioned lists
export function groupByDate<T extends { date: string }>(
  items: T[]
): Array<{ title: string; data: T[] }> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = formatRelativeDate(item.date);
    const existing = groups.get(key) ?? [];
    existing.push(item);
    groups.set(key, existing);
  }

  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}