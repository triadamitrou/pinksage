"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { availabilityOf, statePill, stateLabel } from "@/lib/availability";
import { DAY_LETTER, DAY_LONG } from "@/lib/days";
import { useStudio } from "@/lib/store";
import type { Availability, Product, Variety } from "@/lib/types";

/**
 * One flower, and everything it decides.
 *
 * A stem count on its own is a number in a box. What makes it worth
 * counting is the second half of this panel: every product that uses the
 * variety, what each can make at the moment, and - as the number is
 * typed - which of them would change if it were different.
 *
 * The what-if is worked out against a copy of the stock map, so nothing
 * is written anywhere until Set to is pressed. Typing in it is free.
 */
export default function VarietyPanel({
  variety,
  onClose,
}: {
  variety: Variety;
  onClose: () => void;
}) {
  const { products, stock, updateVariety } = useStudio();
  const [whatIf, setWhatIf] = useState<string>(String(variety.stems));
  const [shownFor, setShownFor] = useState(variety.id);
  const panel = useRef<HTMLDivElement>(null);

  // A different flower was opened, or this one's count was committed:
  // start the what-if from whatever it now says, during render rather
  // than in an effect, so the box never shows the old flower's number.
  if (shownFor !== variety.id) {
    setShownFor(variety.id);
    setWhatIf(String(variety.stems));
  }

  useEffect(() => {
    panel.current?.focus();
  }, [variety.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /** Every live product whose recipe calls for this flower. */
  const users = useMemo(
    () =>
      products
        .filter(
          (p) =>
            p.stockMode === "stems" &&
            p.recipe.some((r) => r.variety === variety.id && r.stems > 0),
        )
        .map((p) => ({
          p,
          needs: p.recipe.find((r) => r.variety === variety.id)!.stems,
          now: availabilityOf(p, stock),
        }))
        .sort((a, b) => b.needs - a.needs),
    [products, stock, variety.id],
  );

  const proposed = Number(whatIf);
  const valid = Number.isFinite(proposed) && proposed >= 0;
  const changed = valid && Math.floor(proposed) !== variety.stems;

  /**
   * The same products counted against the proposed number. One copy of
   * the stock map with this one bucket swapped: every other variety, and
   * so every other limit, stays exactly as it is.
   */
  const after = useMemo(() => {
    if (!valid) return null;
    const trial = new Map(stock);
    trial.set(variety.id, { ...variety, stems: Math.floor(proposed) });
    return users.map((u) => ({ ...u, then: availabilityOf(u.p, trial) }));
  }, [users, stock, variety, proposed, valid]);

  const movers = after?.filter((u) => u.then.state !== u.now.state) ?? [];

  return (
    <aside
      ref={panel}
      tabIndex={-1}
      aria-label={`${variety.name} stock`}
      className="border-line bg-panel fixed inset-0 z-40 flex flex-col overflow-hidden border-l lg:static lg:z-auto lg:w-[26rem] lg:shrink-0"
    >
      <div className="border-line flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="u-label">In the bucket</p>
          <h2 className="u-serif truncate text-[1.15rem]">{variety.name}</h2>
        </div>
        <button type="button" onClick={onClose} className="u-btn shrink-0">
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <label className="mb-4 block">
          <span className="u-label">Name</span>
          <input
            className="u-field mt-1"
            value={variety.name}
            onChange={(e) =>
              updateVariety(variety.id, { name: e.target.value })
            }
          />
        </label>

        {/* The count ------------------------------------------------ */}
        <label className="block">
          <span className="u-label">Stems counted</span>
          <span className="mt-1.5 flex gap-2">
            <input
              type="number"
              min={0}
              value={whatIf}
              onChange={(e) => setWhatIf(e.target.value)}
              className="u-field u-num flex-1 !h-11 text-[1.2rem] font-semibold"
            />
            <button
              type="button"
              disabled={!changed}
              onClick={() =>
                updateVariety(variety.id, { stems: Math.floor(proposed) })
              }
              className="u-btn u-btn--go !h-11"
            >
              Set to {valid ? Math.floor(proposed) : "?"}
            </button>
          </span>
        </label>
        <p className="text-ink-3 mt-1.5 text-[0.78rem] leading-relaxed">
          {changed
            ? `Counted as ${variety.stems} at the moment. Nothing below is saved until Set to is pressed.`
            : "Type a different number to see what it would change, before changing it."}
        </p>

        <div className="mt-4 grid gap-3">
          <label className="block">
            <span className="u-label">Cost a stem</span>
            <span className="mt-1 flex items-center gap-1.5">
              <span className="text-ink-3">£</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={variety.cost || ""}
                placeholder="not set"
                onChange={(e) =>
                  updateVariety(variety.id, {
                    cost: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="u-field u-num text-right"
              />
            </span>
          </label>
          <div>
            <span className="u-label">Comes in on</span>
            {/* Toggles, not a text box: the report has to count the days
                between one delivery and the next. */}
            <div className="mt-1 flex gap-1" role="group" aria-label="Delivery days">
              {DAY_LETTER.map((letter, d) => {
                const on = variety.days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    aria-label={DAY_LONG[d]}
                    title={DAY_LONG[d]}
                    onClick={() =>
                      updateVariety(variety.id, {
                        days: on
                          ? variety.days.filter((x) => x !== d)
                          : [...variety.days, d].sort((a, b) => a - b),
                      })
                    }
                    className={`h-8 flex-1 rounded text-[0.75rem] font-semibold transition-colors ${
                      on
                        ? "bg-sage-deep text-white"
                        : "border-line text-ink-3 hover:bg-sage-wash border"
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* What would move -------------------------------------------- */}
        {changed && (
          <section className="border-blush bg-blush-wash mt-5 rounded-lg border p-3">
            <h3 className="text-blush text-[0.85rem] font-semibold">
              {movers.length === 0
                ? "Nothing would change"
                : `${movers.length} product${movers.length === 1 ? "" : "s"} would change`}
            </h3>
            {movers.length > 0 && (
              <ul className="mt-2">
                {movers.slice(0, 14).map((u) => (
                  <li
                    key={u.p.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 py-1 text-[0.82rem]"
                  >
                    <span className="min-w-0 truncate">{u.p.name}</span>
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className={`u-pill ${statePill[u.now.state]}`}>
                        {stateLabel[u.now.state]}
                      </span>
                      <span className="text-ink-3">to</span>
                      <span className={`u-pill ${statePill[u.then.state]}`}>
                        {stateLabel[u.then.state]}
                      </span>
                    </span>
                  </li>
                ))}
                {movers.length > 14 && (
                  <li className="text-ink-3 pt-1 text-[0.78rem]">
                    and {movers.length - 14} more
                  </li>
                )}
              </ul>
            )}
          </section>
        )}

        {/* Who uses it ----------------------------------------------- */}
        <section className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="u-serif text-[1.1rem]">
              In {users.length} product{users.length === 1 ? "" : "s"}
            </h3>
            <p className="text-ink-3 text-[0.75rem]">
              stems each · can make
            </p>
          </div>

          {users.length === 0 ? (
            <p className="text-ink-2 mt-2 text-[0.85rem] leading-relaxed">
              No recipe calls for {variety.name} yet, so counting it
              changes nothing. It is named in the product copy of{" "}
              {
                products.filter((p) => p.varieties.includes(variety.id)).length
              }{" "}
              products, which is where to start.
            </p>
          ) : (
            <ul className="mt-2">
              {users.map((u) => (
                <li
                  key={u.p.id}
                  className="border-line-2 flex items-baseline justify-between gap-3 border-b py-2 last:border-0"
                >
                  <Link
                    href={`/products?open=${u.p.id}`}
                    className="hover:text-sage-deep min-w-0 truncate text-[0.88rem]"
                  >
                    {u.p.name}
                  </Link>
                  <span className="flex shrink-0 items-baseline gap-2.5">
                    <span className="u-num text-ink-3 text-[0.8rem]">
                      ×{u.needs}
                    </span>
                    <Count a={u.now} />
                    {changed && (
                      <>
                        <span className="text-ink-3 text-[0.75rem]">to</span>
                        <Count
                          a={
                            after!.find((x) => x.p.id === u.p.id)!
                              .then as Availability
                          }
                          highlight
                        />
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </aside>
  );
}

function Count({ a, highlight }: { a: Availability; highlight?: boolean }) {
  const tone =
    a.state === "out"
      ? "text-blush"
      : a.state === "limited"
        ? "text-amber"
        : "text-ink";
  return (
    <span
      className={`u-num w-7 text-right text-[0.88rem] font-semibold ${tone} ${
        highlight ? "" : ""
      }`}
    >
      {a.count ?? "-"}
    </span>
  );
}

/** Used by the flowers page to decide what a row click opens. */
export type { Product };
