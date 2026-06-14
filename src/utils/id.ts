// Never use Math.random() for IDs — not cryptographically random
// This generates a UUID v4 style ID without external dependencies
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}_${random}`;
}

// Format amounts: cents → display string
export function formatCurrency(
  cents: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

// Parse display string → cents
export function parseToCents(value: string): number {
  const numeric = parseFloat(value.replace(/[^0-9.]/g, ''));
  if (isNaN(numeric)) return 0;
  return Math.round(numeric * 100); // Round to avoid float errors
}

// 'YYYY-MM-DD' from a Date object
export function toDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0] as string;
}

// 'YYYY-MM' for budget month keys
export function toMonthString(date: Date = new Date()): string {
  return date.toISOString().substring(0, 7);
}