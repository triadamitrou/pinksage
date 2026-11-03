"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import catalogue from "./catalogue.json";
import type { Ingredient, Product, Variety } from "./types";

/**
 * The whole dashboard's state, in one place.
 *
 * It is deliberately a browser-only store. This is a mock up of the back
 * office: everything lives in localStorage, so the florist can open it,
 * work for an hour, close the laptop and find the work still there, and
 * a wrong turn costs nothing because Reset puts the live catalogue back.
 * Wiring it to Strelitzia and floristPro is the next job, not this one,
 * and a pretend API call would only hide where that work starts.
 *
 * It is a plain external store read through useSyncExternalStore rather
 * than useState, because the pages are prerendered: the server has no
 * localStorage, so the saved catalogue can only be read once the browser
 * has taken over. Doing that inside the store's own subscribe, rather
 * than in an effect somewhere up the tree, keeps the first paint honest
 * and costs one render.
 *
 * Products load from catalogue.json: their 198 real product pages,
 * scraped from pinksage.co.uk. Recipes and stem counts start empty,
 * because the shop has never published either anywhere.
 */

const KEY = "pinksage:studio:v1";

type Seed = {
  varieties: { id: string; name: string }[];
  products: Omit<
    Product,
    "recipe" | "status" | "stockMode" | "manualStock" | "lowAt"
  >[];
};

const seed = catalogue as Seed;

function freshProducts(): Product[] {
  return seed.products.map((p) => ({
    ...p,
    recipe: [],
    status: "live" as const,
    // A product whose copy names no flowers is almost always a card, a
    // balloon or a box of chocolates. It starts as always available, so
    // nobody is asked to write a recipe for a bottle of champagne.
    stockMode: p.varieties.length ? ("stems" as const) : ("always" as const),
    manualStock: 0,
    lowAt: 3,
  }));
}

function freshVarieties(): Variety[] {
  return seed.varieties.map((v) => ({ ...v, stems: 0, cost: 0, delivery: "" }));
}

type Saved = {
  products: Product[];
  varieties: Variety[];
  /** The catalogue as the website last saw it, for the publish diff. */
  published: Record<string, Product>;
  lastPublished: string | null;
  exampleLoaded: boolean;
};

/**
 * A new session starts level with the live website: the 198 products as
 * pinksage.co.uk currently has them, already published. So the first
 * thing that needs publishing is the first thing somebody changes.
 */
function blank(): Saved {
  const products = freshProducts();
  return {
    products,
    varieties: freshVarieties(),
    published: Object.fromEntries(products.map((p) => [p.id, p])),
    lastPublished: null,
    exampleLoaded: false,
  };
}

/* ------------------------------------------------- the external store */

const server = blank();
let current: Saved = server;
let loaded = false;
const listeners = new Set<() => void>();

function set(next: Saved | ((s: Saved) => Saved)) {
  current = typeof next === "function" ? next(current) : next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Full or blocked storage. The session works, it just will not keep.
  }
  for (const fn of listeners) fn();
}

function subscribe(fn: () => void) {
  // The first subscriber is the browser arriving. Read what was saved.
  if (!loaded) {
    loaded = true;
    try {
      const raw = window.localStorage.getItem(KEY);
      const parsed = raw ? (JSON.parse(raw) as Saved) : null;
      // A fresh copy either way, so the snapshot stops being the server's
      // one and the pages can tell that the browser has taken over.
      current = parsed?.products?.length ? parsed : blank();
    } catch {
      // Private mode: carry on with the live catalogue.
      current = blank();
    }
  }
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const getSnapshot = () => current;
const getServerSnapshot = () => server;

/* ---------------------------------------------------- what pages use */

type Store = {
  /** False until the browser has read whatever was saved. */
  ready: boolean;
  products: Product[];
  varieties: Variety[];
  /** Keyed, because the availability maths runs on every render. */
  stock: Map<string, Variety>;
  /** Product ids changed since the last publish. */
  dirty: Set<string>;
  published: Record<string, Product>;
  lastPublished: string | null;
  exampleLoaded: boolean;

  updateProduct: (id: string, patch: Partial<Product>) => void;
  updateProducts: (ids: string[], patch: Partial<Product>) => void;
  setRecipe: (id: string, recipe: Ingredient[]) => void;
  updateVariety: (id: string, patch: Partial<Variety>) => void;
  addVariety: (name: string) => void;
  replaceAll: (next: Partial<Pick<Saved, "products" | "varieties">>) => void;
  publish: () => void;
  reset: () => void;
  loadExample: () => void;
};

const Ctx = createContext<Store | null>(null);

/** A row's fingerprint, for working out what changed since publishing. */
function fingerprint(p: Product) {
  return JSON.stringify([
    p.name,
    p.desc,
    p.tiers,
    p.status,
    p.stockMode,
    p.manualStock,
    p.lowAt,
    p.recipe,
    p.img,
    p.cats,
  ]);
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = state !== server;

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    set((s) => ({
      ...s,
      products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const updateProducts = useCallback((ids: string[], patch: Partial<Product>) => {
    const want = new Set(ids);
    set((s) => ({
      ...s,
      products: s.products.map((p) => (want.has(p.id) ? { ...p, ...patch } : p)),
    }));
  }, []);

  const setRecipe = useCallback((id: string, recipe: Ingredient[]) => {
    set((s) => ({
      ...s,
      products: s.products.map((p) => (p.id === id ? { ...p, recipe } : p)),
    }));
  }, []);

  const updateVariety = useCallback((id: string, patch: Partial<Variety>) => {
    set((s) => ({
      ...s,
      varieties: s.varieties.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }));
  }, []);

  const addVariety = useCallback((name: string) => {
    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!id) return;
    set((s) =>
      s.varieties.some((v) => v.id === id)
        ? s
        : {
            ...s,
            varieties: [
              ...s.varieties,
              { id, name: name.trim(), stems: 0, cost: 0, delivery: "" },
            ],
          },
    );
  }, []);

  const replaceAll = useCallback(
    (next: Partial<Pick<Saved, "products" | "varieties">>) => {
      set((s) => ({ ...s, ...next }));
    },
    [],
  );

  const publish = useCallback(() => {
    set((s) => ({
      ...s,
      published: Object.fromEntries(s.products.map((p) => [p.id, p])),
      lastPublished: new Date().toISOString(),
    }));
  }, []);

  const reset = useCallback(() => set(blank()), []);

  /**
   * Fills the buckets and writes a recipe for every product whose own
   * copy names its flowers, so the arithmetic can be seen working before
   * the shop has typed anything.
   *
   * These stem numbers are invented, and the dashboard says so wherever
   * they show. The varieties are not: they are read out of Pink Sage's
   * own product descriptions.
   */
  const loadExample = useCallback(() => {
    set((s) => ({
      ...s,
      exampleLoaded: true,
      // Only the buckets nobody has counted yet. A real number that has
      // been typed is never written over by an example one.
      varieties: s.varieties.map((v, i) =>
        v.stems > 0
          ? v
          : {
              ...v,
              stems: [120, 80, 60, 45, 36, 24, 18][i % 7],
              delivery: v.delivery || (i % 2 ? "Monday & Thursday" : "Tuesday"),
            },
      ),
      products: s.products.map((p) =>
        p.stockMode !== "stems" || p.recipe.length || !p.varieties.length
          ? p
          : {
              ...p,
              recipe: p.varieties.map((variety, i) => ({
                variety,
                stems: [7, 5, 3, 3, 2, 2][i % 6],
              })),
            },
      ),
    }));
  }, []);

  const stock = useMemo(
    () => new Map(state.varieties.map((v) => [v.id, v])),
    [state.varieties],
  );

  const dirty = useMemo(() => {
    const out = new Set<string>();
    for (const p of state.products) {
      const was = state.published[p.id];
      if (!was || fingerprint(was) !== fingerprint(p)) out.add(p.id);
    }
    return out;
  }, [state.products, state.published]);

  const value = useMemo<Store>(
    () => ({
      ready,
      products: state.products,
      varieties: state.varieties,
      published: state.published,
      lastPublished: state.lastPublished,
      exampleLoaded: state.exampleLoaded,
      stock,
      dirty,
      updateProduct,
      updateProducts,
      setRecipe,
      updateVariety,
      addVariety,
      replaceAll,
      publish,
      reset,
      loadExample,
    }),
    [
      ready,
      state,
      stock,
      dirty,
      updateProduct,
      updateProducts,
      setRecipe,
      updateVariety,
      addVariety,
      replaceAll,
      publish,
      reset,
      loadExample,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudio() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStudio must be used inside StudioProvider");
  return v;
}

/** Every category the catalogue actually uses, for the filter bar. */
export const allCategories = Array.from(
  new Set(seed.products.flatMap((p) => p.cats)),
)
  .filter((c) => c.length < 30)
  .sort();
