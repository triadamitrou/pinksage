"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Cell } from "@/components/Cell";
import { availabilityOf, statePill, stateLabel } from "@/lib/availability";
import { allCategories, useStudio } from "@/lib/store";
import { useGridKeys } from "@/lib/useGridKeys";
import type { Product } from "@/lib/types";

type View = "all" | "out" | "limited" | "unknown" | "changed";

const VIEWS: { id: View; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "out", label: "Sold out" },
  { id: "limited", label: "Limited" },
  { id: "unknown", label: "No recipe" },
  { id: "changed", label: "Unpublished" },
];

/**
 * The sheet.
 *
 * Arrow keys walk the cells, Enter opens one, typing replaces it. Ticking
 * rows turns the toolbar into a bulk editor, because the slow part of a
 * florist's week is not editing one product, it is putting the same
 * change through forty.
 *
 * The availability column is worked out, never typed: it is the recipe
 * divided into the buckets, recalculated on every keystroke anywhere in
 * the dashboard.
 */
export default function Sheet({
  initialView = "all",
  openId,
  onOpen,
}: {
  initialView?: View;
  openId: string | null;
  onOpen: (id: string | null) => void;
}) {
  const { products, stock, dirty, updateProduct, updateProducts, ready } =
    useStudio();

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [view, setView] = useState<View>(initialView);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      if (cat && !p.cats.includes(cat)) return false;
      if (needle && !`${p.name} ${p.desc} ${p.id}`.toLowerCase().includes(needle))
        return false;
      if (view === "changed") return dirty.has(p.id);
      if (view !== "all") {
        const a = availabilityOf(p, stock);
        if (view === "out" && a.state !== "out") return false;
        if (view === "limited" && a.state !== "limited") return false;
        if (view === "unknown" && !(a.state === "unknown" && p.status === "live"))
          return false;
      }
      return true;
    });
  }, [products, q, cat, view, stock, dirty]);

  const onGridKey = useGridKeys();

  const allPicked = rows.length > 0 && rows.every((r) => picked.has(r.id));
  const pickedList = [...picked];

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Toolbar ----------------------------------------------------- */}
      <div className="border-line bg-panel sticky top-0 z-20 border-b px-3 py-2.5 lg:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a product"
            aria-label="Find a product"
            className="u-field w-48 sm:w-60"
          />
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            aria-label="Category"
            className="u-field w-auto"
          >
            <option value="">All categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div
            role="group"
            aria-label="View"
            className="border-line flex overflow-hidden rounded-md border"
          >
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-pressed={view === v.id}
                className={`px-2.5 py-[0.38rem] text-[0.78rem] font-semibold transition-colors ${
                  view === v.id
                    ? "bg-sage-deep text-white"
                    : "text-ink-2 hover:bg-sage-wash"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <p className="u-num text-ink-3 ml-auto text-[0.78rem]">
            {rows.length} of {products.length}
          </p>
        </div>

        {/* The toolbar becomes a bulk editor once rows are ticked. */}
        {picked.size > 0 && (
          <div className="border-sage-pale bg-sage-wash mt-2.5 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2">
            <p className="u-num text-sage-deep text-[0.82rem] font-semibold">
              {picked.size} selected
            </p>
            <span className="text-ink-3 text-[0.78rem]">Set all to</span>
            <button
              type="button"
              className="u-btn"
              onClick={() => updateProducts(pickedList, { status: "live" })}
            >
              Live
            </button>
            <button
              type="button"
              className="u-btn"
              onClick={() => updateProducts(pickedList, { status: "off" })}
            >
              Off the website
            </button>
            <button
              type="button"
              className="u-btn"
              onClick={() => updateProducts(pickedList, { stockMode: "always" })}
            >
              Always available
            </button>
            <button
              type="button"
              className="u-btn"
              onClick={() => updateProducts(pickedList, { stockMode: "stems" })}
            >
              Count from stems
            </button>
            <PriceNudge
              onApply={(pct) => {
                for (const id of pickedList) {
                  const p = products.find((x) => x.id === id);
                  if (!p) continue;
                  updateProduct(id, {
                    tiers: p.tiers.map((t) => ({
                      ...t,
                      price: Math.round(t.price * (1 + pct / 100) * 100) / 100,
                    })),
                  });
                }
              }}
            />
            <button
              type="button"
              className="u-btn u-btn--quiet ml-auto"
              onClick={() => setPicked(new Set())}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* The grid ---------------------------------------------------- */}
      <div className="flex-1 overflow-x-auto">
        <table className="u-sheet">
          <thead>
            <tr>
              <th scope="col" className="w-9">
                <input
                  type="checkbox"
                  checked={allPicked}
                  aria-label="Select every row shown"
                  onChange={(e) =>
                    setPicked(
                      e.target.checked ? new Set(rows.map((r) => r.id)) : new Set(),
                    )
                  }
                />
              </th>
              <th scope="col" className="w-12" />
              <th scope="col" className="min-w-52">
                Product
              </th>
              <th scope="col">Prices</th>
              <th scope="col">Recipe</th>
              <th scope="col" className="text-right">
                Can make
              </th>
              <th scope="col">Short of</th>
              <th scope="col">Counted by</th>
              <th scope="col">On the website</th>
            </tr>
          </thead>

          <tbody onKeyDown={onGridKey}>
            {rows.map((p) => (
              <Row
                key={p.id}
                p={p}
                picked={picked.has(p.id)}
                dirty={ready && dirty.has(p.id)}
                open={openId === p.id}
                onPick={(on) =>
                  setPicked((s) => {
                    const n = new Set(s);
                    if (on) n.add(p.id);
                    else n.delete(p.id);
                    return n;
                  })
                }
                onOpen={() => onOpen(p.id)}
              />
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="text-ink-3 px-4 py-10 text-center">
            Nothing matches. Clear the search or pick another view.
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  p,
  picked,
  dirty,
  open,
  onPick,
  onOpen,
}: {
  p: Product;
  picked: boolean;
  dirty: boolean;
  open: boolean;
  onPick: (on: boolean) => void;
  onOpen: () => void;
}) {
  const { stock, updateProduct } = useStudio();
  const a = availabilityOf(p, stock);
  const short = a.limiting ? (stock.get(a.limiting)?.name ?? a.limiting) : null;

  return (
    <tr className={`${dirty ? "u-dirty" : ""} ${open ? "bg-sage-wash" : ""}`}>
      <td className="px-2 text-center">
        <input
          type="checkbox"
          checked={picked}
          aria-label={`Select ${p.name}`}
          onChange={(e) => onPick(e.target.checked)}
        />
      </td>

      <td className="px-1.5">
        {p.img ? (
          <Image
            src={p.img}
            alt=""
            width={64}
            height={64}
            className="bg-line-2 h-9 w-9 rounded object-cover"
          />
        ) : (
          <span className="bg-line-2 block h-9 w-9 rounded" />
        )}
      </td>

      <td>
        <Cell
          value={p.name}
          onCommit={(v) => updateProduct(p.id, { name: v.trim() || p.name })}
          display={
            <span className="flex flex-col">
              <span className="font-medium">{p.name}</span>
              <span className="text-ink-3 text-[0.72rem]">
                {p.cats[0] ?? "Uncategorised"}
              </span>
            </span>
          }
        />
      </td>

      {/* Price tiers edit as one string, the way they read on the site. */}
      <td className="max-w-80 overflow-hidden">
        <Cell
          value={p.tiers.map((t) => `${t.label} ${t.price.toFixed(2)}`).join("; ")}
          title="Label and price, separated by semicolons"
          onCommit={(v) => {
            const tiers = v
              .split(/[;|]/)
              .map((s) => s.trim())
              .filter(Boolean)
              .map((s) => {
                const m = s.match(/^(.*?)[\s£]*£?\s*([\d.,]+)\s*$/);
                const price = m ? Number(m[2].replace(/,/g, "")) : NaN;
                return {
                  label: (m?.[1] ?? "").trim() || "Standard",
                  price: Number.isFinite(price) ? price : 0,
                };
              })
              .filter((t) => t.price > 0);
            if (tiers.length) updateProduct(p.id, { tiers });
          }}
          display={
            <span className="u-num block truncate whitespace-nowrap">
              {p.tiers.map((t, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-line px-1.5">/</span>}
                  <span className="text-ink-3 text-[0.72rem]">{t.label}</span>{" "}
                  £{t.price.toFixed(2)}
                </span>
              ))}
            </span>
          }
        />
      </td>

      {/* Recipes are too structured for one cell, so this opens the panel. */}
      <td className="max-w-56 overflow-hidden">
        <button
          type="button"
          data-cell
          onClick={onOpen}
          title={p.recipe
            .map((r) => `${stock.get(r.variety)?.name ?? r.variety} x${r.stems}`)
            .join(", ")}
          className="u-cell truncate text-left whitespace-nowrap"
        >
          {p.recipe.length ? (
            <span className="text-ink-2">
              {p.recipe
                .slice(0, 3)
                .map((r) => `${stock.get(r.variety)?.name ?? r.variety} ×${r.stems}`)
                .join(", ")}
              {p.recipe.length > 3 && (
                <span className="text-ink-3"> +{p.recipe.length - 3}</span>
              )}
            </span>
          ) : p.stockMode === "always" ? (
            <span className="text-ink-3">not counted</span>
          ) : (
            <span className="text-blush font-medium">write one</span>
          )}
        </button>
      </td>

      <td className="u-num px-2.5 text-right">
        {p.stockMode === "manual" ? (
          <Cell
            value={String(p.manualStock)}
            type="number"
            align="right"
            onCommit={(v) =>
              updateProduct(p.id, {
                manualStock: Math.max(0, Math.floor(Number(v) || 0)),
              })
            }
          />
        ) : a.count === null ? (
          <span className="text-ink-3">-</span>
        ) : (
          <span className="font-semibold">{a.count}</span>
        )}
      </td>

      <td className="text-ink-2 px-2.5 text-[0.8rem]">
        {short ?? <span className="text-ink-3">-</span>}
      </td>

      <td className="px-2.5">
        <select
          data-cell
          value={p.stockMode}
          aria-label={`How ${p.name} is counted`}
          onChange={(e) =>
            updateProduct(p.id, {
              stockMode: e.target.value as Product["stockMode"],
            })
          }
          className="w-full border-0 bg-transparent py-1.5 text-[0.8rem]"
        >
          <option value="stems">Stems in stock</option>
          <option value="manual">A number I type</option>
          <option value="always">Always available</option>
        </select>
      </td>

      <td className="px-2.5">
        <span className="flex items-center gap-2">
          <span className={`u-pill ${statePill[a.state]}`}>
            {stateLabel[a.state]}
          </span>
          {p.status !== "live" && (
            <span className="u-pill u-pill--draft">
              {p.status === "off" ? "Off" : "Draft"}
            </span>
          )}
        </span>
      </td>
    </tr>
  );
}

/** Putting a percentage through a selection: the pre-Christmas job. */
function PriceNudge({ onApply }: { onApply: (pct: number) => void }) {
  const [pct, setPct] = useState("5");
  return (
    <span className="flex items-center gap-1">
      <label className="text-ink-3 text-[0.78rem]" htmlFor="nudge">
        prices
      </label>
      <input
        id="nudge"
        value={pct}
        onChange={(e) => setPct(e.target.value)}
        inputMode="decimal"
        className="u-field u-num w-14 text-right"
      />
      <span className="text-ink-3 text-[0.78rem]">%</span>
      <button
        type="button"
        className="u-btn"
        onClick={() => {
          const n = Number(pct);
          if (Number.isFinite(n) && n !== 0) onApply(n);
        }}
      >
        Apply
      </button>
    </span>
  );
}
