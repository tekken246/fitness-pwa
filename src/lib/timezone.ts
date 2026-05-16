const weekdayMap = new Map<string, number>([
  ['Mon', 1],
  ['Tue', 2],
  ['Wed', 3],
  ['Thu', 4],
  ['Fri', 5],
  ['Sat', 6],
  ['Sun', 7],
]);

/** Returns a YYYY-MM-DD local date for the supplied IANA timezone. */
export function getLocalDateForTimezone(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Unable to resolve local date.');
  }

  return `${year}-${month}-${day}`;
}

/** Returns ISO weekday where Monday is 1 and Sunday is 7 for the supplied timezone. */
export function getIsoWeekdayForTimezone(date: Date, timezone: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(date);

  const day = weekdayMap.get(weekday);

  if (!day) {
    throw new Error('Unable to resolve local weekday.');
  }

  return day;
}

/** Returns true when an input is a valid IANA timezone identifier. */
export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}
