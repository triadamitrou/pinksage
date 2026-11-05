"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { Sub } from "@/lib/shelf";
import type { ShopProduct } from "@/lib/shopdata";
import ProductCard from "./ProductCard";

/**
 * Browsing one section.
 *
 * The live site makes a customer pick one of 22 flat categories from a
 * menu before seeing a single flower, and gives no way back out of a
 * category except the menu again. Here the whole section is on one page,
 * already sorted into shelves, and the shelves are filters rather than
 * separate pages - so changing your mind costs a tap and never a page
 * load.
 *
 * Everything is kept client side on purpose: 105 funeral tributes is a
 * long page, and somebody comparing two sheaves should not lose their
 * place in it to a round trip.
 */

type Shelf = { sub: Sub; items: ShopProduct[] };

/** How many of a shelf to show before offering the rest. */
const PREVIEW = 8;

const BANDS = [
  { id: "under-50", label: "Under £50", test: (n: number) => n < 50 },
  { id: "50-100", label: "£50 to £100", test: (n: number) => n >= 50 && n <= 100 },
  { id: "over-100", label: "Over £100", test: (n: number) => n > 100 },
] as const;

type Sort = "popular" | "low" | "high" | "name";

const SORTS: { id: Sort; label: string }[] = [
  { id: "popular", label: "Shop's own order" },
  { id: "low", label: "Price, lowest first" },
  { id: "high", label: "Price, highest first" },
  { id: "name", label: "Name, A to Z" },
];

export default function SectionBrowser({ shelves }: { shelves: Shelf[] }) {
  const [sub, setSub] = useState<string | null>(null);
  const [band, setBand] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("popular");

  /**
   * A ?sub= in the URL opens that shelf, so the footer can link straight
   * to "Corporate and venues". Read from window rather than through
   * useSearchParams: these pages are exported as plain HTML, and that
   * hook's Suspense boundary never resolves when one is opened from a
   * file:// folder. Taken once, during render, so a later tap on a chip
   * is never argued with by the URL it came from.
   */
  const query = useSyncExternalStore(noUrlUpdates, readQuery, () => "");
  const [tookFromUrl, setTookFromUrl] = useState(false);
  if (!tookFromUrl && query) {
    const wanted = new URLSearchParams(query).get("sub");
    setTookFromUrl(true);
    if (wanted && shelves.some((s) => s.sub.id === wanted)) setSub(wanted);
  }

  const total = shelves.reduce((n, s) => n + s.items.length, 0);

  /** The price filter applies everywhere, so the counts have to follow it. */
  const filtered = useMemo(() => {
    const b = BANDS.find((x) => x.id === band);
    return shelves
      .map((s) => ({
        sub: s.sub,
        items: b ? s.items.filter((p) => b.test(p.from)) : s.items,
      }))
      .filter((s) => s.items.length > 0);
  }, [shelves, band]);

  const order = useMemo(() => {
    const by: Record<Sort, (a: ShopProduct, b: ShopProduct) => number> = {
      popular: () => 0,
      low: (a, b) => a.from - b.from,
      high: (a, b) => b.from - a.from,
      name: (a, b) => a.name.localeCompare(b.name, "en-GB"),
    };
    return by[sort];
  }, [sort]);

  const shown = sub ? filtered.filter((s) => s.sub.id === sub) : filtered;
  const showing = shown.reduce((n, s) => n + s.items.length, 0);

  return (
    <>
      {/* Filters. One row, above the work, and it stays put while the
          page scrolls so the way back out is never off screen. */}
      <div className="border-line bg-paper/95 sticky top-[var(--shop-bar)] z-20 border-y backdrop-blur">
        <div className="s-wrap py-3">
          <div className="s-scroller -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <button
              type="button"
              className="s-chip"
              data-on={sub === null}
              onClick={() => setSub(null)}
            >
              Everything
              <span className="s-chip__n">{total}</span>
            </button>
            {filtered.map((s) => (
              <button
                key={s.sub.id}
                type="button"
                className="s-chip"
                data-on={sub === s.sub.id}
                onClick={() => setSub(sub === s.sub.id ? null : s.sub.id)}
              >
                {s.sub.name}
                <span className="s-chip__n">{s.items.length}</span>
              </button>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {BANDS.map((b) => (
              <button
                key={b.id}
                type="button"
                className="s-chip !h-8 !text-[0.8rem]"
                data-on={band === b.id}
                onClick={() => setBand(band === b.id ? null : b.id)}
              >
                {b.label}
              </button>
            ))}

            <label className="ml-auto flex items-center gap-2">
              <span className="u-label">Order</span>
              <select
                className="u-field !h-8 !w-auto !text-[0.8rem]"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="s-wrap pt-8 pb-4">
        {showing === 0 ? (
          <p className="text-ink-2 py-14 text-center">
            Nothing on this shelf in that price range.{" "}
            <button
              type="button"
              className="text-sage-deep font-semibold underline"
              onClick={() => setBand(null)}
            >
              Show every price
            </button>
          </p>
        ) : (
          shown.map((s) => {
            const items = [...s.items].sort(order);
            const capped = sub ? items : items.slice(0, PREVIEW);
            return (
              <section key={s.sub.id} className="mb-12 last:mb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2 className="s-h2">{s.sub.name}</h2>
                  {!sub && items.length > PREVIEW && (
                    <button
                      type="button"
                      className="text-sage-deep text-[0.88rem] font-semibold hover:underline"
                      onClick={() => setSub(s.sub.id)}
                    >
                      See all {items.length} &rarr;
                    </button>
                  )}
                </div>
                {s.sub.note && (
                  <p className="text-ink-2 mt-1 max-w-[56ch] text-[0.92rem]">
                    {s.sub.note}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {capped.map((p, i) => (
                    <ProductCard key={p.id} p={p} priority={i < 5} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      {sub && (
        <div className="s-wrap pb-6">
          <button type="button" className="s-btn" onClick={() => setSub(null)}>
            &larr; Back to everything
          </button>
        </div>
      )}
    </>
  );
}

const noUrlUpdates = () => () => {};
const readQuery = () => window.location.search;

/** Used by the section page for the "nothing here yet" case. */
export function EmptyShelf({ href }: { href: string }) {
  return (
    <p className="s-wrap text-ink-2 py-16 text-center">
      Nothing is listed here at the moment.{" "}
      <Link href={href} className="text-sage-deep font-semibold underline">
        Browse everything instead
      </Link>
    </p>
  );
}
