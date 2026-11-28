import type { TripCategory, TripStage, BookingCategory } from './types';

/** The pipeline board's columns in order, with the label each shows. `archived` is not a column. */
export const STAGES: { key: TripStage; label: string }[] = [
  { key: 'dreaming', label: 'Dreaming' },
  { key: 'planning', label: 'Planning' },
  { key: 'booked', label: 'Booked' },
  { key: 'upcoming', label: 'Upcoming' },
];

/** Every trip category with its label and the CSS variable that colours it. */
export const CATEGORIES: { key: TripCategory; label: string; color: string }[] = [
  { key: 'family',  label: 'Family',  color: 'var(--cat-family)'  },
  { key: 'couple',  label: 'Couple',  color: 'var(--cat-couple)'  },
  { key: 'solo',    label: 'Solo',    color: 'var(--cat-solo)'    },
  { key: 'race',    label: 'Race',    color: 'var(--cat-race)'    },
  { key: 'friends', label: 'Friends', color: 'var(--cat-friends)' },
  { key: 'work',    label: 'Work',    color: 'var(--cat-work)'    },
];

/** `CATEGORIES` indexed by key, for looking up a category's label and colour. */
export const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<
  TripCategory, { key: TripCategory; label: string; color: string }
>;

/** The name of the icon (a key of `Icon`) that stands for each booking category. */
export const BOOKING_CATEGORY_ICONS: Record<BookingCategory, string> = {
  flight: 'Plane', lodging: 'Bed', transport: 'Car',
  dining: 'Cutlery', activity: 'Ticket', other: 'MoreH',
};

/**
 * Formats a `YYYY-MM-DD` string for display, as a short month and day unless
 * told otherwise. Null in, null out. The date is read as local midnight so the
 * day never shifts with the timezone.
 */
export function fmtDate(d: string | null, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string | null {
  if (!d) return null;
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', opts);
}

/**
 * Formats a trip's dates as one range, such as `Jun 1 – 8, 2026`, dropping the
 * month or year when it repeats. Null unless both dates exist.
 */
export function fmtDateRange(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const sameMonth = s.getMonth() === e.getMonth();
  const sameYear = s.getFullYear() === e.getFullYear();
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const sStr = s.toLocaleDateString('en-US', opts);
  const eStr = sameMonth ? String(e.getDate()) : e.toLocaleDateString('en-US', opts);
  const yr = sameYear ? s.getFullYear() : `${s.getFullYear()}–${e.getFullYear()}`;
  return `${sStr} – ${eStr}, ${yr}`;
}

/**
 * Whole days from one date to another, negative when `to` is earlier. It takes
 * `YYYY-MM-DD` strings or dates, and rounds so a daylight-saving change does
 * not move the count.
 */
export function daysBetween(from: string | Date, to: string | Date): number {
  const f = from instanceof Date ? from : new Date(from + 'T00:00:00');
  const t = to instanceof Date ? to : new Date(to + 'T00:00:00');
  return Math.round((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
}

/** Formats a number as whole US dollars, such as `$2,000`. For another currency, use `fmtMoneyIn`. */
export function fmtMoney(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/** A gradient background for a trip's cover, built from the cover's hue (30 when it has none). */
export function coverStyle(cover: { hue: number; label: string }): React.CSSProperties {
  const h = cover?.hue ?? 30;
  return {
    background: `linear-gradient(135deg,
      oklch(52% 0.14 ${h}) 0%,
      oklch(42% 0.12 ${h + 25}) 50%,
      oklch(32% 0.08 ${h - 20}) 100%)`,
  };
}
