import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

const s = (p: P) => ({ width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none', ...p });

export const Icon = {
  Plus:         (p: P) => <svg {...s(p)}><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Search:       (p: P) => <svg {...s(p)}><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  ChevronLeft:  (p: P) => <svg {...s(p)}><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevronRight: (p: P) => <svg {...s(p)}><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Close:        (p: P) => <svg {...s(p)}><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Check:        (p: P) => <svg {...s(p)}><path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Clock:        (p: P) => <svg {...s(p)}><circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.25"/><path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  Map:          (p: P) => <svg {...s(p)}><path d="M1 3l4-1 4 1 4-1v9l-4 1-4-1-4 1V3z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/><path d="M5 2v10M9 3v10" stroke="currentColor" strokeWidth="1.25"/></svg>,
  Calendar:     (p: P) => <svg {...s(p)}><rect x="1.75" y="2.5" width="10.5" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/><path d="M1.75 5.5h10.5M4.5 1.5v2M9.5 1.5v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  Archive:      (p: P) => <svg {...s(p)}><path d="M1.5 3.5h11v2h-11zM2.5 5.5v6h9v-6M5.5 8h3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Pipeline:     (p: P) => <svg {...s(p)}><rect x="1.5" y="2" width="3" height="10" rx="0.75" stroke="currentColor" strokeWidth="1.25"/><rect x="5.5" y="2" width="3" height="7" rx="0.75" stroke="currentColor" strokeWidth="1.25"/><rect x="9.5" y="2" width="3" height="4" rx="0.75" stroke="currentColor" strokeWidth="1.25"/></svg>,
  Sun:          (p: P) => <svg {...s(p)}><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.25"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.75 2.75l1 1M10.25 10.25l1 1M2.75 11.25l1-1M10.25 3.75l1-1" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  Moon:         (p: P) => <svg {...s(p)}><path d="M11.5 8.5a5 5 0 1 1-6-6 4 4 0 0 0 6 6z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/></svg>,
  Sliders:      (p: P) => <svg {...s(p)}><path d="M2 4h10M2 10h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/><circle cx="5" cy="4" r="1.5" fill="var(--surface)" stroke="currentColor" strokeWidth="1.25"/><circle cx="9" cy="10" r="1.5" fill="var(--surface)" stroke="currentColor" strokeWidth="1.25"/></svg>,
  Sparkle:      (p: P) => <svg {...s(p)}><path d="M7 1l1.5 4L12 6.5 8.5 8 7 12 5.5 8 2 6.5 5.5 5 7 1z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/></svg>,
  Plane:        (p: P) => <svg {...s(p)}><path d="M1 7l12-5-5 12-1.5-5L1 7z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/></svg>,
  Bed:          (p: P) => <svg {...s(p)}><path d="M1.5 5v6M12.5 8v3M1.5 8h11M1.5 11h11M3.5 7h3v1h-3z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Car:          (p: P) => <svg {...s(p)}><path d="M1.5 9v-1l1-3h9l1 3v1M1.5 9h11v1.5h-11zM3 10.5v1M11 10.5v1" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Cutlery:      (p: P) => <svg {...s(p)}><path d="M4 1v5.5c0 .5-1 1-1 1v5M9 1v4.5M11 1v12M5 1H3v5.5c0 .5 1 1 1 1" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Ticket:       (p: P) => <svg {...s(p)}><path d="M2 4h10v2a1 1 0 0 0 0 2v2H2V8a1 1 0 0 0 0-2V4zM6 4v6" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" strokeDasharray="1.5 1.5"/></svg>,
  MoreH:        (p: P) => <svg {...s(p)}><circle cx="3" cy="7" r="1" fill="currentColor"/><circle cx="7" cy="7" r="1" fill="currentColor"/><circle cx="11" cy="7" r="1" fill="currentColor"/></svg>,
  Settings:     (p: P) => <svg {...s(p)}><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.25"/><path d="M7 1v2M7 11v2M1 7h2M11 7h2M3 3l1.5 1.5M9.5 9.5l1.5 1.5M3 11l1.5-1.5M9.5 4.5L11 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  Notes:        (p: P) => <svg {...s(p)}><rect x="2.5" y="1.5" width="9" height="11" rx="1" stroke="currentColor" strokeWidth="1.25"/><path d="M4.5 4.5h5M4.5 7h5M4.5 9.5h3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  Inbox:        (p: P) => <svg {...s(p)}><path d="M1.5 9.5h3l1 2h3l1-2h3M1.5 9.5V3.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v6" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/></svg>,
};

export const BOOKING_ICONS: Record<string, (p: P) => JSX.Element> = {
  flight: Icon.Plane, lodging: Icon.Bed, transport: Icon.Car,
  dining: Icon.Cutlery, activity: Icon.Ticket, other: Icon.MoreH,
};
