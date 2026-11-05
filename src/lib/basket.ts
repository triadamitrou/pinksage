"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * The basket.
 *
 * It exists so the client can click the whole journey - shelf, product,
 * size, basket - rather than take the words for it. It stops at the
 * point where a real shop front hands over to a payment provider, and
 * says so there rather than pretending.
 *
 * Same shape as the dashboard's store and for the same reason: the pages
 * are prerendered, so localStorage can only be read once the browser has
 * taken over, and doing that inside subscribe keeps the first paint
 * honest. The two stores are deliberately separate - a customer's basket
 * and a florist's stock counts have nothing to say to each other.
 */

const KEY = "pinksage:basket:v1";

export type Line = {
  /** Product id and tier label together: one line per size. */
  key: string;
  id: string;
  slug: string;
  name: string;
  tier: string;
  price: number;
  img: string | null;
  qty: number;
};

const empty: Line[] = [];
let current: Line[] = empty;
let loaded = false;
const listeners = new Set<() => void>();

function set(next: Line[]) {
  current = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Private mode. The basket works for the session and does not keep.
  }
  for (const fn of listeners) fn();
}

function subscribe(fn: () => void) {
  if (!loaded) {
    loaded = true;
    try {
      const raw = window.localStorage.getItem(KEY);
      const parsed = raw ? (JSON.parse(raw) as Line[]) : null;
      // A fresh array either way, so the snapshot stops being the
      // server's one and the header can tell the browser has arrived.
      current = Array.isArray(parsed) ? parsed.filter(isLine) : [];
    } catch {
      current = [];
    }
  }
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function isLine(x: unknown): x is Line {
  const l = x as Line;
  return !!l && typeof l.key === "string" && typeof l.price === "number" && l.qty > 0;
}

const getSnapshot = () => current;
const getServerSnapshot = () => empty;

export function useBasket() {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = lines !== empty;

  const add = useCallback((line: Omit<Line, "key" | "qty">, qty = 1) => {
    const key = `${line.id}::${line.tier}`;
    const at = current.findIndex((l) => l.key === key);
    if (at === -1) set([...current, { ...line, key, qty }]);
    else
      set(
        current.map((l, i) => (i === at ? { ...l, qty: l.qty + qty } : l)),
      );
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    set(
      qty <= 0
        ? current.filter((l) => l.key !== key)
        : current.map((l) => (l.key === key ? { ...l, qty } : l)),
    );
  }, []);

  const clear = useCallback(() => set([]), []);

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((n, l) => n + l.qty * l.price, 0);

  return { ready, lines, count, total, add, setQty, clear };
}

export const money = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
