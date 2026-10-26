import { DomainRuleError } from './model.js';

/**
 * Recurring service templates expand into distinct dated occurrences. Expansion is a pure
 * function of the template and the requested range, so generating the same range twice yields
 * the same occurrence dates; the database's (schedule_id, occurrence_date) key makes the
 * persistence step idempotent.
 */
export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  intervalCount: number;
  /** ISO weekdays 1 (Mon) … 7 (Sun); WEEKLY only. Defaults to the start date's weekday. */
  byWeekdays?: number[] | null;
  /** 1..28; MONTHLY only. Defaults to the start date's day. */
  dayOfMonth?: number | null;
  startDate: string; // YYYY-MM-DD (site-local calendar date)
  endDate?: string | null;
  windowStartTime: string; // HH:MM[:SS] site-local
  durationMinutes: number;
  timezone: string; // IANA zone of the site
}

export interface Occurrence {
  occurrenceDate: string;
  plannedStart: Date;
  plannedEnd: Date;
}

const DAY_MS = 86_400_000;
const MAX_OCCURRENCES = 400;

function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new DomainRuleError('INVALID_DATES', `Invalid date ${value}.`);
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new DomainRuleError('INVALID_DATES', `Invalid date ${value}.`);
  return d;
}

const fmt = (d: Date) => d.toISOString().slice(0, 10);
const isoWeekday = (d: Date) => ((d.getUTCDay() + 6) % 7) + 1;

/** Offset (ms) of `timeZone` from UTC at the given instant. */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find(p => p.type === t)!.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - instant.getTime();
}

/** Converts a site-local wall-clock time to a UTC instant (handles DST transitions). */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [h, m, s] = time.split(':').map(Number);
  const wall = Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), h, m || 0, s || 0);
  let guess = wall - zoneOffsetMs(new Date(wall), timeZone);
  guess = wall - zoneOffsetMs(new Date(guess), timeZone);
  return new Date(guess);
}

export function validateRule(rule: RecurrenceRule): void {
  const start = parseDate(rule.startDate);
  if (rule.endDate && parseDate(rule.endDate) < start) throw new DomainRuleError('INVALID_DATES', 'End date precedes start date.');
  if (!Number.isInteger(rule.intervalCount) || rule.intervalCount < 1 || rule.intervalCount > 52) {
    throw new DomainRuleError('INVALID_RULE', 'Interval must be between 1 and 52.');
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(rule.windowStartTime)) throw new DomainRuleError('INVALID_RULE', 'Start time must be HH:MM.');
  if (rule.durationMinutes < 15 || rule.durationMinutes > 1440) throw new DomainRuleError('INVALID_RULE', 'Duration must be 15–1440 minutes.');
  if (rule.byWeekdays && rule.byWeekdays.some(d => !Number.isInteger(d) || d < 1 || d > 7)) {
    throw new DomainRuleError('INVALID_RULE', 'Weekdays must be ISO weekday numbers 1–7.');
  }
  if (rule.dayOfMonth != null && (rule.dayOfMonth < 1 || rule.dayOfMonth > 28)) {
    throw new DomainRuleError('INVALID_RULE', 'Day of month must be 1–28.');
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: rule.timezone });
  } catch {
    throw new DomainRuleError('INVALID_RULE', `Unknown time zone ${rule.timezone}.`);
  }
}

/** Expands occurrences whose date lies in [from, to] (inclusive, site-local dates). */
export function expandOccurrences(rule: RecurrenceRule, from: string, to: string): Occurrence[] {
  validateRule(rule);
  const start = parseDate(rule.startDate);
  const end = rule.endDate ? parseDate(rule.endDate) : null;
  const rangeFrom = parseDate(from);
  const rangeTo = parseDate(to);
  if (rangeTo < rangeFrom) throw new DomainRuleError('INVALID_DATES', 'Range end precedes range start.');
  if ((rangeTo.getTime() - rangeFrom.getTime()) / DAY_MS > 366) {
    throw new DomainRuleError('RANGE_TOO_LARGE', 'Generate at most one year of occurrences at a time.');
  }

  const dates: Date[] = [];
  const within = (d: Date) => d >= start && (!end || d <= end) && d >= rangeFrom && d <= rangeTo;

  if (rule.frequency === 'DAILY') {
    for (let d = new Date(start); d <= rangeTo && (!end || d <= end); d = new Date(d.getTime() + rule.intervalCount * DAY_MS)) {
      if (within(d)) dates.push(d);
    }
  } else if (rule.frequency === 'WEEKLY') {
    const weekdays = rule.byWeekdays && rule.byWeekdays.length ? [...new Set(rule.byWeekdays)] : [isoWeekday(start)];
    const weekStart = new Date(start.getTime() - (isoWeekday(start) - 1) * DAY_MS); // Monday of start week
    for (let w = weekStart; w <= rangeTo && (!end || w <= end); w = new Date(w.getTime() + rule.intervalCount * 7 * DAY_MS)) {
      for (const wd of weekdays.sort()) {
        const d = new Date(w.getTime() + (wd - 1) * DAY_MS);
        if (within(d)) dates.push(d);
      }
    }
  } else {
    const dom = rule.dayOfMonth ?? Math.min(start.getUTCDate(), 28);
    for (let i = 0; ; i += rule.intervalCount) {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, dom));
      if (d > rangeTo || (end && d > end)) break;
      if (within(d)) dates.push(d);
    }
  }

  if (dates.length > MAX_OCCURRENCES) throw new DomainRuleError('RANGE_TOO_LARGE', `Range would create more than ${MAX_OCCURRENCES} occurrences.`);
  return dates.map(d => {
    const occurrenceDate = fmt(d);
    const plannedStart = zonedTimeToUtc(occurrenceDate, rule.windowStartTime, rule.timezone);
    return { occurrenceDate, plannedStart, plannedEnd: new Date(plannedStart.getTime() + rule.durationMinutes * 60_000) };
  });
}
