"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  availabilityOf,
  recipeCost,
  statePill,
  stateLabel,
} from "@/lib/availability";
import { useStudio } from "@/lib/store";
import type { Product } from "@/lib/types";

/**
 * One product, opened beside the sheet.
 *
 * The recipe editor is the reason the whole dashboard exists. Pink Sage's
 * current shop front has nowhere to say that a bouquet is seven roses and
 * five lisianthus, so nothing can work out how many of them exist. Here
 * it is two columns and an Add line button, and the answer appears under
 * it as the numbers are typed.
 */
export default function EditorPanel({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { stock, varieties, updateProduct, setRecipe } = useStudio();
  const panel = useRef<HTMLDivElement>(null);

  const a = availabilityOf(product, stock);
  const cost = recipeCost(product, stock);
  const top = product.tiers[0]?.price ?? 0;

  // Escape closes, as it does everywhere else in the dashboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    panel.current?.focus();
  }, [product.id]);

  const used = new Set(product.recipe.map((r) => r.variety));

  return (
    <aside
      ref={panel}
      tabIndex={-1}
      aria-label={`Editing ${product.name}`}
      /* On a phone it covers the sheet: a drawer underneath it would
         mean scrolling back up to find the row again. From lg it sits
         beside the sheet, both usable at once. */
      className="border-line bg-panel fixed inset-0 z-40 flex flex-col overflow-hidden border-l lg:static lg:z-auto lg:w-[27rem] lg:shrink-0"
    >
      <div className="border-line bg-panel sticky top-0 z-10 flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="u-label">Editing</p>
          <h2 className="u-serif truncate text-[1.15rem]">{product.name}</h2>
        </div>
        <button type="button" onClick={onClose} className="u-btn shrink-0">
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-3">
          {product.img ? (
            <Image
              src={product.img}
              alt={product.name}
              width={160}
              height={160}
              className="bg-line-2 h-24 w-24 shrink-0 rounded-md object-cover"
            />
          ) : (
            <span className="bg-line-2 text-ink-3 grid h-24 w-24 shrink-0 place-items-center rounded-md text-[0.7rem]">
              No photo
            </span>
          )}
          <div className="min-w-0 flex-1">
            <span className={`u-pill ${statePill[a.state]}`}>
              {stateLabel[a.state]}
              {a.count !== null && ` · ${a.count}`}
            </span>
            <p className="text-ink-3 mt-2 text-[0.75rem] leading-relaxed">
              {product.cats.join(", ") || "Uncategorised"}
            </p>
            <p className="text-ink-3 mt-1 text-[0.72rem]">
              id {product.id}
            </p>
          </div>
        </div>

        <Field label="Name">
          <input
            className="u-field"
            value={product.name}
            onChange={(e) => updateProduct(product.id, { name: e.target.value })}
          />
        </Field>

        <Field
          label="Description"
          hint="This is the text customers read on the product page."
        >
          <textarea
            className="u-field h-28 resize-y py-2 leading-relaxed"
            value={product.desc}
            onChange={(e) => updateProduct(product.id, { desc: e.target.value })}
          />
        </Field>

        {product.note && (
          <p className="border-line bg-line-2 text-ink-2 mt-3 rounded-md border-l-2 px-3 py-2 text-[0.78rem] leading-relaxed">
            <span className="u-label block">Their own note, kept</span>
            {product.note}
          </p>
        )}

        {/* Prices -------------------------------------------------- */}
        <Field label="Sizes and prices">
          <ul>
            {product.tiers.map((t, i) => (
              <li key={i} className="mb-1.5 flex gap-2">
                <input
                  aria-label="Size"
                  className="u-field flex-1"
                  value={t.label}
                  onChange={(e) => {
                    const tiers = [...product.tiers];
                    tiers[i] = { ...t, label: e.target.value };
                    updateProduct(product.id, { tiers });
                  }}
                />
                <span className="text-ink-3 self-center">£</span>
                <input
                  aria-label="Price"
                  inputMode="decimal"
                  className="u-field u-num w-24 text-right"
                  value={t.price}
                  onChange={(e) => {
                    const tiers = [...product.tiers];
                    tiers[i] = { ...t, price: Number(e.target.value) || 0 };
                    updateProduct(product.id, { tiers });
                  }}
                />
                <button
                  type="button"
                  aria-label={`Remove the ${t.label} size`}
                  className="u-btn u-btn--quiet px-2"
                  onClick={() =>
                    updateProduct(product.id, {
                      tiers: product.tiers.filter((_, j) => j !== i),
                    })
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="u-btn mt-1"
            onClick={() =>
              updateProduct(product.id, {
                tiers: [
                  ...product.tiers,
                  { label: "New size", price: top || 0 },
                ],
              })
            }
          >
            Add a size
          </button>
        </Field>

        {/* The recipe ---------------------------------------------- */}
        <section className="border-line mt-6 border-t pt-5">
          <h3 className="u-serif text-[1.1rem]">What goes in it</h3>
          <p className="text-ink-2 mt-1 text-[0.8rem] leading-relaxed">
            Stems of each variety, for one of these. This is what turns
            the flower buckets into a number of bouquets.
          </p>

          {product.varieties.length > 0 && product.recipe.length === 0 && (
            <div className="border-sage-pale bg-sage-wash mt-3 rounded-md border p-3">
              <p className="text-sage-deep text-[0.8rem]">
                Its own description names{" "}
                {product.varieties
                  .map((v) => stock.get(v)?.name ?? v)
                  .join(", ")}
                .
              </p>
              <button
                type="button"
                className="u-btn mt-2"
                onClick={() =>
                  setRecipe(
                    product.id,
                    product.varieties.map((v) => ({ variety: v, stems: 1 })),
                  )
                }
              >
                Start the recipe from those
              </button>
            </div>
          )}

          <ul className="mt-3">
            {product.recipe.map((line, i) => (
              <li key={i} className="mb-1.5 flex gap-2">
                <select
                  aria-label="Flower"
                  className="u-field flex-1"
                  value={line.variety}
                  onChange={(e) => {
                    const next = [...product.recipe];
                    next[i] = { ...line, variety: e.target.value };
                    setRecipe(product.id, next);
                  }}
                >
                  {varieties.map((v) => (
                    <option
                      key={v.id}
                      value={v.id}
                      disabled={used.has(v.id) && v.id !== line.variety}
                    >
                      {v.name}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="Stems"
                  type="number"
                  min={1}
                  className="u-field u-num w-20 text-right"
                  value={line.stems}
                  onChange={(e) => {
                    const next = [...product.recipe];
                    next[i] = {
                      ...line,
                      stems: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                    };
                    setRecipe(product.id, next);
                  }}
                />
                <button
                  type="button"
                  aria-label="Remove this flower"
                  className="u-btn u-btn--quiet px-2"
                  onClick={() =>
                    setRecipe(
                      product.id,
                      product.recipe.filter((_, j) => j !== i),
                    )
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="u-btn mt-1"
            onClick={() => {
              const free = varieties.find((v) => !used.has(v.id));
              if (free) {
                setRecipe(product.id, [
                  ...product.recipe,
                  { variety: free.id, stems: 1 },
                ]);
              }
            }}
          >
            Add a flower
          </button>

          {product.recipe.length > 0 && (
            <dl className="border-line bg-sage-wash mt-4 grid grid-cols-2 gap-y-2 rounded-md border p-3 text-[0.82rem]">
              <dt className="text-ink-2">Makes, from stock</dt>
              <dd className="u-num text-right font-semibold">
                {a.count ?? "-"}
              </dd>
              <dt className="text-ink-2">Runs out of first</dt>
              <dd className="text-right">
                {a.limiting
                  ? (stock.get(a.limiting)?.name ?? a.limiting)
                  : "-"}
              </dd>
              <dt className="text-ink-2">Stems per bouquet</dt>
              <dd className="u-num text-right">
                {product.recipe.reduce((n, r) => n + r.stems, 0)}
              </dd>
              {cost.complete && top > 0 && (
                <>
                  <dt className="text-ink-2">Flower cost against £{top.toFixed(2)}</dt>
                  <dd className="u-num text-right">
                    £{cost.total.toFixed(2)} ·{" "}
                    {Math.round((cost.total / top) * 100)}%
                  </dd>
                </>
              )}
              {!cost.complete && (
                <dd className="text-ink-3 col-span-2 text-[0.75rem]">
                  Stem costs are not filled in, so there is no margin to
                  show. They go on the flower stock page.
                </dd>
              )}
            </dl>
          )}
        </section>

        {/* Availability rules -------------------------------------- */}
        <section className="border-line mt-6 border-t pt-5">
          <h3 className="u-serif text-[1.1rem]">What the website says</h3>

          <Field label="Counted by">
            <select
              className="u-field"
              value={product.stockMode}
              onChange={(e) =>
                updateProduct(product.id, {
                  stockMode: e.target.value as Product["stockMode"],
                })
              }
            >
              <option value="stems">Stems in stock, from the recipe</option>
              <option value="manual">A number I type</option>
              <option value="always">Always available, never counted</option>
            </select>
          </Field>

          {product.stockMode === "manual" && (
            <Field label="How many are there">
              <input
                type="number"
                min={0}
                className="u-field u-num"
                value={product.manualStock}
                onChange={(e) =>
                  updateProduct(product.id, {
                    manualStock: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                  })
                }
              />
            </Field>
          )}

          {product.stockMode !== "always" && (
            <Field
              label="Say limited at or below"
              hint="A nudge for the customer, and for the shop."
            >
              <input
                type="number"
                min={0}
                className="u-field u-num w-24"
                value={product.lowAt}
                onChange={(e) =>
                  updateProduct(product.id, {
                    lowAt: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                  })
                }
              />
            </Field>
          )}

          <Field label="On the website">
            <select
              className="u-field"
              value={product.status}
              onChange={(e) =>
                updateProduct(product.id, {
                  status: e.target.value as Product["status"],
                })
              }
            >
              <option value="live">Live, customers can order it</option>
              <option value="draft">Draft, not on the website yet</option>
              <option value="off">Taken off the website</option>
            </select>
          </Field>
        </section>
      </div>
    </aside>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-4 block">
      <span className="u-label">{label}</span>
      {hint && (
        <span className="text-ink-3 mt-0.5 block text-[0.75rem]">{hint}</span>
      )}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}
