import type { Trip, TripDetail } from './types';

/**
 * A minimal RFC 5545 writer.
 *
 * Hand-rolled rather than pulling in a dependency: the spec surface a read-only
 * trip feed needs is small, but the details are unforgiving — calendar clients
 * reject a document that gets line endings, folding or escaping wrong.
 */

const PRODID = '-//Travel OS//Trip Feed//EN';
const UID_DOMAIN = 'travel-os';
/** RFC 5545 §3.1: content lines are folded at 75 octets, excluding the CRLF. */
const MAX_OCTETS = 75;

const encoder = new TextEncoder();

/** RFC 5545 §3.3.11: backslash, semicolon, comma and newlines are escaped in TEXT values. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Folds a long content line, counting octets rather than characters so a
 * multi-byte character is never split across the boundary.
 */
function foldLine(line: string): string {
  if (encoder.encode(line).length <= MAX_OCTETS) return line;
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > MAX_OCTETS) {
      parts.push(current);
      // Continuation lines begin with a single space, which counts toward the limit.
      current = ` ${char}`;
      bytes = 1 + size;
    } else {
      current += char;
      bytes += size;
    }
  }
  parts.push(current);
  return parts.join('\r\n');
}

/** '2026-09-12' → '20260912' */
function toICalDate(date: string): string {
  return date.replace(/-/g, '');
}

/** DTEND is exclusive for all-day events, so a trip ending the 20th ends on the 21st. */
function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return toICalDate(d.toISOString().slice(0, 10));
}

function toICalTimestamp(now: Date): string {
  return `${now.toISOString().slice(0, 19).replace(/[-:]/g, '')}Z`;
}

function event(
  uid: string,
  stamp: string,
  start: string,
  end: string,
  summary: string,
  description: string,
): string[] {
  const out = [
    'BEGIN:VEVENT',
    `UID:${uid}@${UID_DOMAIN}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeText(summary)}`,
  ];
  if (description) out.push(`DESCRIPTION:${escapeText(description)}`);
  out.push('END:VEVENT');
  return out;
}

export function buildCalendar(
  trips: Trip[],
  details: Record<string, TripDetail>,
  options: { now: Date },
): string {
  const stamp = toICalTimestamp(options.now);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Travel OS',
  ];

  for (const trip of trips) {
    if (trip.stage === 'archived') continue;
    if (!trip.start_date || !trip.end_date) continue;

    lines.push(...event(
      `trip-${trip.id}`,
      stamp,
      toICalDate(trip.start_date),
      nextDay(trip.end_date),
      trip.destination,
      trip.notes,
    ));

    const detail = details[trip.id];
    if (!detail) continue;
    detail.bookings.forEach((booking, index) => {
      if (!booking.travel_date) return;
      const parts = [booking.vendor, booking.confirmation].filter(Boolean);
      lines.push(...event(
        `booking-${trip.id}-${index}`,
        stamp,
        toICalDate(booking.travel_date),
        nextDay(booking.travel_date),
        booking.title,
        parts.join(' · '),
      ));
    });
  }

  lines.push('END:VCALENDAR');
  // RFC 5545 §3.1: the document is a sequence of content lines, each terminated
  // by CRLF — including the last one.
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}
