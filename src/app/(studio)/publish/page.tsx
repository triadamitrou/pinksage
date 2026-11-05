"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStudio } from "@/lib/store";
import type { Product } from "@/lib/types";

/**
 * What is about to change on pinksage.co.uk, in words, before it does.
 *
 * A publish button with nothing behind it is how a shop ends up with a
 * £45 bouquet priced at £4.50. So the list is field by field, old value
 * beside new, and the button carries the count.
 */
export default function Publish() {
  const { products, published, dirty, publish, reset, ready, lastPublished, stock } =
    useStudio();
  const [confirmReset, setConfirmReset] = useState(false);

  const names = useMemo(
    () => new Map([...stock].map(([id, v]) => [id, v.name])),
    [stock],
  );

  const changes = useMemo(
    () =>
      products
        .filter((p) => dirty.has(p.id))
        .map((p) => ({ p, lines: diff(published[p.id], p, names) }))
        .filter((c) => c.lines.length > 0),
    [products, published, dirty, names],
  );

  return (
    <div className="u-wrap max-w-4xl py-7 lg:py-10">
      <header className="border-line flex flex-wrap items-end justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="u-serif text-[1.75rem] leading-tight lg:text-[2.1rem]">
            Publish to the website
          </h1>
          <p className="text-ink-2 mt-1 text-[0.9rem]">
            {ready && lastPublished
              ? `Last sent ${new Date(lastPublished).toLocaleString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Nothing has been sent from here yet"}
          </p>
        </div>
        <button
          type="button"
          className="u-btn u-btn--go"
          disabled={!ready || changes.length === 0}
          onClick={publish}
        >
          {changes.length === 0
            ? "Nothing to publish"
            : `Publish ${changes.length} product${changes.length === 1 ? "" : "s"}`}
        </button>
      </header>

      <p className="border-line bg-line-2 text-ink-2 mt-5 rounded-md border-l-2 px-3 py-2 text-[0.8rem] leading-relaxed">
        This is a mock up. Publishing marks the catalogue as sent and
        changes nothing at pinksage.co.uk. Wiring it to floristPro is the
        next job, and this list is the shape of what would go over.
      </p>

      {ready && changes.length === 0 && (
        <p className="text-ink-2 mt-8">
          The dashboard and the website agree.{" "}
          <Link href="/products" className="text-sage-deep underline">
            Open the sheet
          </Link>{" "}
          to change something.
        </p>
      )}

      <ul className="mt-6">
        {changes.map(({ p, lines }) => (
          <li key={p.id} className="border-line-2 border-t py-4 first:border-t-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <h2 className="font-semibold">
                <Link
                  href={`/products?open=${p.id}`}
                  className="hover:text-sage-deep"
                >
                  {p.name}
                </Link>
              </h2>
              <p className="text-ink-3 text-[0.75rem]">id {p.id}</p>
            </div>
            <dl className="mt-2">
              {lines.map((l) => (
                <div
                  key={l.field}
                  className="grid gap-x-4 gap-y-0.5 py-1 text-[0.85rem] sm:grid-cols-[9rem_1fr]"
                >
                  <dt className="u-label pt-0.5">{l.field}</dt>
                  <dd className="min-w-0">
                    <span className="text-ink-3 line-through decoration-1">
                      {l.was}
                    </span>
                    <span className="text-ink-3 px-2">to</span>
                    <span className="text-sage-deep font-medium">{l.now}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      <section className="border-line mt-10 border-t pt-6">
        <h2 className="u-label">Start again</h2>
        <p className="text-ink-2 mt-2 max-w-[60ch] text-[0.85rem] leading-relaxed">
          This throws away every edit, recipe and stem count in this
          browser and puts back the 198 products as they were read off
          pinksage.co.uk. It cannot be undone, and it touches nothing
          outside this browser.
        </p>
        {confirmReset ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="u-btn"
              onClick={() => {
                reset();
                setConfirmReset(false);
              }}
            >
              Yes, throw it all away
            </button>
            <button
              type="button"
              className="u-btn u-btn--quiet"
              onClick={() => setConfirmReset(false)}
            >
              Keep my work
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="u-btn mt-3"
            onClick={() => setConfirmReset(true)}
          >
            Reset the catalogue
          </button>
        )}
      </section>
    </div>
  );
}

type Line = { field: string; was: string; now: string };

/** Field by field, in the words the florist uses for them. */
function diff(
  was: Product | undefined,
  now: Product,
  names: Map<string, string>,
): Line[] {
  if (!was) return [{ field: "New product", was: "not on the website", now: now.name }];
  const out: Line[] = [];

  const push = (field: string, a: string, b: string) => {
    if (a !== b) out.push({ field, was: a || "empty", now: b || "empty" });
  };

  push("Name", was.name, now.name);
  push("Description", short(was.desc), short(now.desc));
  push("Categories", was.cats.join(", "), now.cats.join(", "));
  push("Prices", priceLine(was), priceLine(now));
  push("On the website", statusWord(was.status), statusWord(now.status));
  push("Counted by", modeWord(was.stockMode), modeWord(now.stockMode));

  if (now.stockMode === "manual" || was.stockMode === "manual") {
    push("How many", String(was.manualStock), String(now.manualStock));
  }
  push("Limited at", String(was.lowAt), String(now.lowAt));
  push("Recipe", recipeLine(was, names), recipeLine(now, names));

  return out;
}

function short(s: string) {
  return s.length > 70 ? `${s.slice(0, 70)}...` : s;
}

function priceLine(p: Product) {
  return p.tiers.map((t) => `${t.label} £${t.price.toFixed(2)}`).join(", ");
}

function recipeLine(p: Product, names: Map<string, string>) {
  if (!p.recipe.length) return "none";
  return p.recipe
    .map((r) => `${names.get(r.variety) ?? r.variety} ×${r.stems}`)
    .join(", ");
}

function statusWord(s: Product["status"]) {
  return s === "live" ? "live" : s === "off" ? "taken off" : "draft";
}

function modeWord(m: Product["stockMode"]) {
  return m === "stems"
    ? "stems in stock"
    : m === "manual"
      ? "a typed number"
      : "always available";
}
