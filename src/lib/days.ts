"use client";

import { useSyncExternalStore } from "react";

/**
 * Weekdays, in the form a florist writes them and the form the report
 * does arithmetic on.
 *
 * 0 is Sunday through 6 is Saturday, matching Date.getDay, so nothing
 * has to be converted at the point of use.
 */

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_LETTER = ["S", "M", "T", "W", "T", "F", "S"];
export const DAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** "Mon, Thu" - or a plain line when nobody has said yet. */
export function daysLabel(days: number[]) {
  if (!days?.length) return "";
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => DAY_SHORT[d])
    .join(", ");
}

/**
 * Reads whatever somebody typed in a spreadsheet: "Monday & Thursday",
 * "mon/thu", "Tue". Anything it cannot place is ignored rather than
 * guessed at, and an empty result leaves the variety's days alone.
 */
export function parseDays(text: string): number[] {
  const found = new Set<number>();
  for (const word of text.toLowerCase().split(/[^a-z]+/)) {
    if (word.length < 3) continue;
    const i = DAY_LONG.findIndex((d) => d.toLowerCase().startsWith(word.slice(0, 3)));
    if (i >= 0) found.add(i);
  }
  return [...found].sort((a, b) => a - b);
}

/**
 * How many days from `from` until the next delivery, counting today as 0.
 * Returns null when no delivery day has been set, because "unknown" and
 * "never" are different answers and only one of them is alarming.
 */
export function daysUntilNext(days: number[], from: Date): number | null {
  if (!days?.length) return null;
  const today = from.getDay();
  let best = 8;
  for (const d of days) {
    const gap = (d - today + 7) % 7;
    if (gap < best) best = gap;
  }
  return best === 8 ? null : best;
}

/** The next `count` dates starting on `from`, for the report's columns. */
export function horizon(count: number, from: Date): Date[] {
  const out: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    d.setHours(0, 0, 0, 0);
    out.push(d);
  }
  return out;
}

/**
 * Today, read in the browser and never on the server.
 *
 * The pages are prerendered, so a date baked into the HTML would be
 * whichever day the build ran - and a fortnight chart starting on the
 * wrong day is worse than no chart. Returns null until the browser has
 * taken over, which the report uses to hold its first paint.
 */
export function useToday(): Date | null {
  return useSyncExternalStore(noClockUpdates, readToday, () => null);
}

const noClockUpdates = () => () => {};
let cached: Date | null = null;
let cachedKey = "";
function readToday(): Date {
  // The snapshot has to keep its identity between renders, or
  // useSyncExternalStore loops. One Date per calendar day is enough.
  const now = new Date();
  const key = now.toDateString();
  if (key !== cachedKey || !cached) {
    cachedKey = key;
    cached = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return cached;
}

/**
 * The wall clock, read in the browser only.
 *
 * Same reasoning as useToday, one step finer: the shop front wants to
 * say "open until 17:30" or "closed now", which needs the time and not
 * just the date. Returns null until the browser takes over, so nothing
 * about opening hours is ever baked into prerendered HTML.
 *
 * The snapshot has to keep its identity between renders or
 * useSyncExternalStore loops, so it is cached and only replaced when the
 * minute changes. Nothing subscribes to the tick: a header that is sixty
 * seconds stale has never cost anybody an order, and re-rendering the
 * whole shop every second to avoid it would.
 */
export type Clock = { day: number; minutes: number };

export function useClock(): Clock | null {
  return useSyncExternalStore(noClockUpdates, readClock, () => null);
}

let clock: Clock | null = null;
let clockKey = -1;
function readClock(): Clock {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes !== clockKey || !clock) {
    clockKey = minutes;
    clock = { day: now.getDay(), minutes };
  }
  return clock;
}

/** "09:00" as minutes past midnight. */
export const atMinute = (hhmm: string) =>
  Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
