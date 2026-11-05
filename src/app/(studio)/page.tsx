"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { availabilityOf } from "@/lib/availability";
import { provenance, shop, systems } from "@/lib/shop";
import { useStudio } from "@/lib/store";
import type { Product } from "@/lib/types";

/**
 * The morning list.
 *
 * Not counts in boxes. A florist opening this at seven wants the names
 * of the things that are wrong, in the order they cost money: what the
 * website is selling that cannot be made, what is nearly gone, what has
 * never been measured, and what is sitting unpublished.
 *
 * So the page is one list, longest line first, and every line is a link
 * into the row that fixes it.
 */
export default function Today() {
  const {
    products,
    stock,
    dirty,
    ready,
    lastPublished,
    exampleLoaded,
    loadExample,
  } = useStudio();

  const { out, limited, unmeasured, live } = useMemo(() => {
    const out: Product[] = [];
    const limited: Product[] = [];
    const unmeasured: Product[] = [];
    let live = 0;
    for (const p of products) {
      if (p.status !== "live") continue;
      live++;
      const a = availabilityOf(p, stock);
      if (a.state === "out") out.push(p);
      else if (a.state === "limited") limited.push(p);
      else if (a.state === "unknown") unmeasured.push(p);
    }
    return { out, limited, unmeasured, live };
  }, [products, stock]);

  // Read in the browser, never on the server: a day name baked into
  // prerendered HTML would be whichever day the build happened to run.
  const weekday = useSyncExternalStore(noClockUpdates, dayName, () => "");

  const nothingWrong = out.length === 0 && limited.length === 0;

  return (
    <div className="u-wrap max-w-5xl py-7 lg:py-10">
      <header className="border-line flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b pb-5">
        <div>
          <h1 className="u-serif text-[1.75rem] leading-tight lg:text-[2.1rem]">
            {shop.town}
            {weekday && `, ${weekday}`}
          </h1>
          <p className="text-ink-2 mt-1 text-[0.9rem]">
            <span className="u-num font-semibold">{live}</span> products live
            on pinksage.co.uk
            {ready && dirty.size > 0 && (
              <>
                {" · "}
                <Link href="/publish" className="text-blush font-semibold">
                  {dirty.size} changed and unpublished
                </Link>
              </>
            )}
          </p>
        </div>
        <p className="text-ink-3 text-[0.75rem]">
          {ready && lastPublished
            ? `Published ${new Date(lastPublished).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "Never published"}
        </p>
      </header>

      {ready && nothingWrong && (
        <p className="text-ink-2 mt-6 text-[0.95rem]">
          Nothing is sold out and nothing is running short.
          {unmeasured.length > 0 && (
            <>
              {" "}
              <span className="text-ink-3">
                Though {unmeasured.length} live products have no recipe, so
                they are not being counted at all.
              </span>
            </>
          )}
        </p>
      )}

      <Group
        title="Cannot be made today"
        aside="The website is refusing these orders"
        tone="out"
        items={out}
        stock={stock}
        empty="Nothing is sold out."
      />

      <Group
        title="Down to the last few"
        aside="One more order and these go"
        tone="low"
        items={limited}
        stock={stock}
        empty="Nothing is running short."
      />

      <Group
        title="Never measured"
        aside="No recipe, so no count"
        tone="calm"
        items={unmeasured}
        stock={stock}
        empty="Every live product has a recipe."
        limit={6}
      />

      {ready && !exampleLoaded && (
        <section className="border-sage-pale bg-sage-wash mt-9 rounded-lg border p-5">
          <h2 className="text-sage-deep font-semibold">
            The buckets are empty, so nothing can be counted yet
          </h2>
          <p className="text-ink-2 mt-2 max-w-[62ch] leading-relaxed">
            Stem counts and recipes start blank, because Pink Sage has
            never published either one: that is the gap this is built to
            close. To see the arithmetic work before typing a real number,
            this fills the buckets and writes a recipe for every product
            whose own description names its flowers.
          </p>
          <p className="text-ink-2 mt-2 max-w-[62ch] leading-relaxed">
            The stem counts it writes are invented and labelled as such.
            The products, prices and words around them are real.
          </p>
          <button type="button" onClick={loadExample} className="u-btn u-btn--go mt-4">
            Load example stock
          </button>
        </section>
      )}

      <section className="mt-10">
        <h2 className="u-label">Reading from, writing to</h2>
        <dl className="mt-3">
          {systems.map((s) => (
            <div
              key={s.id}
              className="border-line-2 grid gap-x-5 gap-y-0.5 border-t py-3 sm:grid-cols-[9rem_1fr]"
            >
              <dt className="flex items-baseline gap-2 font-semibold">
                {s.name}
                <span className="u-pill u-pill--draft">Not wired up</span>
              </dt>
              <dd className="text-ink-2 text-[0.85rem] leading-relaxed">
                {s.note}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-ink-3 mt-4 max-w-[62ch] text-[0.78rem] leading-relaxed">
          {provenance.products} products, their prices, tiers and
          descriptions were read off {provenance.source} on{" "}
          {provenance.read}. This is a mock up: publishing changes this
          browser and reaches no live system.
        </p>
      </section>
    </div>
  );
}

function Group({
  title,
  aside,
  tone,
  items,
  stock,
  empty,
  limit = 12,
}: {
  title: string;
  aside: string;
  tone: "out" | "low" | "calm";
  items: Product[];
  stock: Map<string, import("@/lib/types").Variety>;
  empty: string;
  limit?: number;
}) {
  if (items.length === 0) return null;

  const rule =
    tone === "out"
      ? "border-blush"
      : tone === "low"
        ? "border-amber"
        : "border-line";

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 className="u-serif text-[1.2rem]">
          {title}{" "}
          <span className="u-num text-ink-3 text-[0.95rem]">
            {items.length}
          </span>
        </h2>
        <p className="text-ink-3 text-[0.78rem]">{aside}</p>
      </div>

      <ul className={`mt-2.5 border-l-2 ${rule} pl-4`}>
        {items.slice(0, limit).map((p) => {
          const a = availabilityOf(p, stock);
          const short = a.limiting
            ? stock.get(a.limiting)?.name ?? a.limiting
            : null;
          return (
            <li
              key={p.id}
              className="border-line-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b py-2 last:border-0"
            >
              <Link
                href={`/products?open=${p.id}`}
                className="hover:text-sage-deep font-medium"
              >
                {p.name}
              </Link>
              <span className="text-ink-3 text-[0.8rem]">
                {short ? (
                  <>
                    short of <span className="text-ink-2">{short}</span>
                  </>
                ) : a.state === "unknown" ? (
                  p.varieties.length ? (
                    <>
                      its copy names{" "}
                      <span className="text-ink-2">{p.varieties.length}</span>{" "}
                      flower{p.varieties.length === 1 ? "" : "s"}, no stem
                      counts
                    </>
                  ) : (
                    "no flowers named in its copy"
                  )
                ) : (
                  <span className="u-num">{a.count} left</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {items.length > limit && (
        <p className="text-ink-3 mt-2 text-[0.8rem]">
          and {items.length - limit} more.{" "}
          <Link href="/products" className="text-sage-deep underline">
            Open the sheet
          </Link>
        </p>
      )}
      <span className="sr-only">{empty}</span>
    </section>
  );
}

const noClockUpdates = () => () => {};
const dayName = () =>
  new Date().toLocaleDateString("en-GB", { weekday: "long" });
