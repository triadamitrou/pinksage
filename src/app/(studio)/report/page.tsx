"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { availabilityOf } from "@/lib/availability";
import {
  DAY_LETTER,
  daysLabel,
  daysUntilNext,
  horizon,
  useToday,
} from "@/lib/days";
import { useStudio } from "@/lib/store";
import type { Product, Variety } from "@/lib/types";

/**
 * The fortnight ahead.
 *
 * Two tracks on one 14-day grid. The top one is the delivery schedule,
 * variety by variety. The bottom one is every product that is counted
 * from stems, drawn as a bar running from today to the day its limiting
 * flower next arrives: the stretch it has to cover on what is already in
 * the bucket.
 *
 * What this is NOT is a forecast. Nothing here knows the rate things
 * sell at, because no order data reaches this dashboard yet. A long red
 * bar means "this has to last nine days on two stems", which is a fact,
 * not "this will sell out on Thursday", which would be a guess.
 */

const DAYS = 14;

/** Status colours, stepped for the chart rather than reused from the UI. */
const TONE = {
  ok: { fill: "#557c33", label: "Covered" },
  watch: { fill: "#d08a12", label: "Tight" },
  out: { fill: "#a83a60", label: "Sold out" },
  unknown: { fill: "#c4cac1", label: "No delivery day set" },
} as const;

type Tone = keyof typeof TONE;

export default function Report() {
  const { products, varieties, stock, ready } = useStudio();
  const [showAll, setShowAll] = useState(false);

  const today = useToday();
  const dates = useMemo(() => (today ? horizon(DAYS, today) : []), [today]);

  /** Varieties anybody actually builds with, in the order they matter. */
  const inUse = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      for (const r of p.recipe) {
        counts.set(r.variety, (counts.get(r.variety) ?? 0) + 1);
      }
    }
    return varieties
      .filter((v) => counts.has(v.id))
      .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
  }, [products, varieties]);

  const rows = useMemo(() => {
    const out: {
      p: Product;
      count: number;
      limiting: Variety | null;
      /** Days from today until the limiting flower next arrives. */
      gap: number | null;
      tone: Tone;
      risk: number;
    }[] = [];

    if (!today) return out;

    for (const p of products) {
      if (p.status !== "live" || p.stockMode !== "stems") continue;
      const a = availabilityOf(p, stock);
      if (a.state === "unknown" || a.count === null) continue;

      const limiting = a.limiting ? (stock.get(a.limiting) ?? null) : null;
      const gap = limiting ? daysUntilNext(limiting.days, today) : null;

      const tone: Tone =
        a.count === 0
          ? "out"
          : gap === null
            ? "unknown"
            : a.count <= p.lowAt
              ? "watch"
              : "ok";

      // Sold out first, then the tight ones with the longest wait, then
      // the ones nobody has given a delivery day to.
      const risk =
        a.count === 0
          ? 1000
          : tone === "watch"
            ? 500 + (gap ?? 7) * 10 - a.count
            : tone === "unknown"
              ? 200 - a.count
              : -a.count;

      out.push({ p, count: a.count, limiting, gap, tone, risk });
    }
    return out.sort((x, y) => y.risk - x.risk);
  }, [products, stock, today]);

  const atRisk = rows.filter((r) => r.tone !== "ok");
  const shown = showAll ? rows : atRisk;

  // Held until the browser says what day it is, rather than drawn on the
  // build machine's date and corrected a moment later.
  if (!today) {
    return (
      <div className="u-wrap max-w-6xl py-10">
        <h1 className="u-serif text-[1.75rem]">The fortnight ahead</h1>
      </div>
    );
  }

  return (
    <div className="u-wrap max-w-6xl py-7 lg:py-10">
      <header className="border-line border-b pb-5">
        <h1 className="u-serif text-[1.75rem] leading-tight lg:text-[2.1rem]">
          The fortnight ahead
        </h1>
        <p className="text-ink-2 mt-1.5 max-w-[64ch] leading-relaxed">
          When each flower comes in, and how long every product has to last
          on what is in the bucket before it does.
        </p>
      </header>

      {ready && inUse.every((v) => v.days.length === 0) && (
        <p className="border-amber bg-amber-wash text-amber mt-5 rounded-md border-l-2 px-3 py-2 text-[0.82rem] leading-relaxed">
          No delivery days are set yet, so there is nothing to count
          towards. They go on each flower in{" "}
          <Link href="/flowers" className="underline">
            flower stock
          </Link>
          , as a row of day buttons.
        </p>
      )}

      {/* Deliveries ------------------------------------------------- */}
      <section className="mt-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="u-serif text-[1.25rem]">Deliveries</h2>
          <p className="text-ink-3 text-[0.78rem]">
            {inUse.length} varieties in use
          </p>
        </div>

        <div className="mt-3 overflow-x-auto">
          <div className="min-w-[46rem]">
            <Scale dates={dates} />
            <ul className="mt-1">
              {inUse.map((v) => (
                <li
                  key={v.id}
                  className="border-line-2 grid grid-cols-[11rem_1fr] items-center gap-3 border-b py-1.5 last:border-0"
                >
                  <span className="flex items-baseline justify-between gap-2 pr-1">
                    <Link
                      href="/flowers"
                      className="hover:text-sage-deep truncate text-[0.85rem] font-medium"
                    >
                      {v.name}
                    </Link>
                    <span className="u-num text-ink-3 shrink-0 text-[0.75rem]">
                      {v.stems}
                    </span>
                  </span>

                  <span
                    className="grid gap-px"
                    style={{ gridTemplateColumns: `repeat(${DAYS}, 1fr)` }}
                  >
                    {dates.map((d, i) => {
                      const on = v.days.includes(d.getDay());
                      return (
                        <span
                          key={i}
                          title={
                            on
                              ? `${v.name} comes in on ${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}`
                              : undefined
                          }
                          className={`h-4 rounded-[3px] ${
                            on ? "bg-sage-deep" : "bg-line-2"
                          }`}
                        />
                      );
                    })}
                  </span>
                </li>
              ))}
            </ul>
            {inUse.length === 0 && (
              <p className="text-ink-3 py-6 text-[0.85rem]">
                No variety is in a recipe yet, so there is nothing to
                schedule.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Cover ------------------------------------------------------ */}
      <section className="border-line mt-9 border-t pt-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="u-serif text-[1.25rem]">
              How long each product has to last
            </h2>
            <p className="text-ink-2 mt-1 max-w-[62ch] text-[0.85rem] leading-relaxed">
              Each bar runs from today to the day the product&rsquo;s
              limiting flower next comes in. The number is how many can be
              made right now.
            </p>
          </div>
          <button
            type="button"
            className="u-btn"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll
              ? `Only the ${atRisk.length} at risk`
              : `All ${rows.length} counted products`}
          </button>
        </div>

        <Legend />

        <div className="mt-3 overflow-x-auto">
          <div className="min-w-[52rem]">
            <Scale dates={dates} wide />
            <ul className="mt-1">
              {shown.slice(0, 60).map((r) => (
                <li
                  key={r.p.id}
                  className="border-line-2 grid grid-cols-[14rem_3rem_1fr] items-center gap-3 border-b py-1.5 last:border-0"
                >
                  <span className="min-w-0">
                    <Link
                      href={`/products?open=${r.p.id}`}
                      className="hover:text-sage-deep block truncate text-[0.85rem] font-medium"
                    >
                      {r.p.name}
                    </Link>
                    <span className="text-ink-3 block truncate text-[0.72rem]">
                      {r.limiting
                        ? `short of ${r.limiting.name}${
                            r.limiting.days.length
                              ? ` · in ${daysLabel(r.limiting.days)}`
                              : " · no delivery day"
                          }`
                        : "nothing limiting it"}
                    </span>
                  </span>

                  {/* The count in words as well as colour, so the state
                      never rests on the bar's hue alone. */}
                  <span
                    className="u-num text-right text-[0.9rem] font-semibold"
                    style={{ color: TONE[r.tone].fill }}
                  >
                    {r.count}
                  </span>

                  <span
                    className="relative grid gap-px"
                    style={{ gridTemplateColumns: `repeat(${DAYS}, 1fr)` }}
                  >
                    {dates.map((d, i) => {
                      const within = r.gap === null ? i < DAYS : i <= r.gap;
                      const arrives =
                        r.limiting?.days.includes(d.getDay()) ?? false;
                      return (
                        <span key={i} className="relative h-5">
                          <span
                            className={`absolute inset-0 rounded-[3px] ${
                              within ? "" : "bg-line-2"
                            }`}
                            style={
                              within
                                ? { background: TONE[r.tone].fill }
                                : undefined
                            }
                          />
                          {arrives && (
                            <span
                              title={`${r.limiting!.name} comes in on ${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}`}
                              className="border-panel bg-ink absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                            />
                          )}
                        </span>
                      );
                    })}
                  </span>
                </li>
              ))}
            </ul>

            {shown.length === 0 && (
              <p className="text-ink-2 py-6 text-[0.88rem]">
                Nothing is at risk. Every product counted from stems can be
                made more times than its limited threshold.
              </p>
            )}
            {shown.length > 60 && (
              <p className="text-ink-3 pt-3 text-[0.8rem]">
                Showing the first 60 of {shown.length}.
              </p>
            )}
          </div>
        </div>
      </section>

      <p className="text-ink-3 mt-8 max-w-[64ch] text-[0.78rem] leading-relaxed">
        This is not a forecast. Nothing here knows how fast anything
        sells, because no order data reaches this dashboard yet. A long
        bar means a product has to last that many days on what is in the
        bucket, which is a fact. When Strelitzia is connected, the same
        chart can carry the selling rate on top and say when, rather than
        how long.
      </p>
    </div>
  );
}

/** The shared 14-day scale, with today marked. */
function Scale({ dates, wide }: { dates: Date[]; wide?: boolean }) {
  return (
    <div
      className={`grid items-end gap-3 ${
        wide ? "grid-cols-[14rem_3rem_1fr]" : "grid-cols-[11rem_1fr]"
      }`}
    >
      {wide && <span />}
      <span className="u-label">{wide ? "Can make" : ""}</span>
      <span
        className="grid gap-px"
        style={{ gridTemplateColumns: `repeat(${dates.length}, 1fr)` }}
      >
        {dates.map((d, i) => (
          <span key={i} className="text-center">
            <span
              className={`block text-[0.62rem] ${
                i === 0 ? "text-ink font-semibold" : "text-ink-3"
              }`}
            >
              {DAY_LETTER[d.getDay()]}
            </span>
            <span className="u-num text-ink-3 block text-[0.6rem]">
              {d.getDate()}
            </span>
          </span>
        ))}
      </span>
    </div>
  );
}

function Legend() {
  return (
    <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
      {(Object.keys(TONE) as Tone[]).map((k) => (
        <li key={k} className="flex items-center gap-1.5 text-[0.78rem]">
          <span
            className="h-2.5 w-4 rounded-[3px]"
            style={{ background: TONE[k].fill }}
          />
          <span className="text-ink-2">{TONE[k].label}</span>
        </li>
      ))}
      <li className="flex items-center gap-1.5 text-[0.78rem]">
        <span className="bg-ink h-1.5 w-1.5 rounded-full" />
        <span className="text-ink-2">Delivery</span>
      </li>
    </ul>
  );
}
