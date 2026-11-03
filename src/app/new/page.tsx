"use client";

import Link from "next/link";
import { useState } from "react";
import { availabilityOf } from "@/lib/availability";
import { useStudio } from "@/lib/store";
import type { Ingredient, Product, Tier } from "@/lib/types";

/**
 * Setting up a new product.
 *
 * Built around the recipe rather than around the photograph, because the
 * recipe is the thing the old system had no room for and the thing that
 * is hardest to go back and add later. The running total at the bottom
 * answers the question that actually decides whether a product is worth
 * listing: how many of these can be made out of what is in the shop, and
 * what will stop it.
 *
 * It saves as a draft. Nothing new appears on the website until somebody
 * sets it live and publishes, which is the point.
 */
export default function NewProduct() {
  const { varieties, stock, addProduct, products } = useStudio();

  const [name, setName] = useState("");
  const [cats, setCats] = useState("");
  const [desc, setDesc] = useState("");
  const [tiers, setTiers] = useState<Tier[]>([{ label: "Standard", price: 0 }]);
  const [recipe, setRecipe] = useState<Ingredient[]>([]);
  const [mode, setMode] = useState<Product["stockMode"]>("stems");
  const [lowAt, setLowAt] = useState(3);
  const [saved, setSaved] = useState<string | null>(null);

  const used = new Set(recipe.map((r) => r.variety));
  const existing = products.find(
    (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );

  /** The same maths the rest of the dashboard uses, on an unsaved draft. */
  const preview = availabilityOf(
    {
      id: "draft",
      name,
      slug: "draft",
      desc,
      note: "",
      cats: [],
      tiers,
      img: null,
      varieties: [],
      recipe,
      status: "live",
      stockMode: mode,
      manualStock: 0,
      lowAt,
    },
    stock,
  );

  const stems = recipe.reduce((n, r) => n + r.stems, 0);
  const cost = recipe.reduce(
    (n, r) => n + (stock.get(r.variety)?.cost ?? 0) * r.stems,
    0,
  );
  const costKnown = recipe.every((r) => (stock.get(r.variety)?.cost ?? 0) > 0);
  const top = tiers[0]?.price ?? 0;

  function save() {
    const id = addProduct({
      name: name.trim() || "Untitled product",
      desc: desc.trim(),
      cats: cats
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      tiers: tiers.filter((t) => t.price > 0 || t.label.trim()),
      recipe: recipe.filter((r) => r.stems > 0),
      stockMode: mode,
      lowAt,
    });
    setSaved(id);
  }

  if (saved) {
    return (
      <div className="u-wrap max-w-2xl py-10">
        <h1 className="u-serif text-[1.75rem]">Saved as a draft</h1>
        <p className="text-ink-2 mt-2 leading-relaxed">
          {name.trim() || "The product"} is in the sheet, marked draft. It
          is not on the website and will not be until somebody sets it live
          and publishes.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/products?open=${saved}`} className="u-btn u-btn--go">
            Open it in the sheet
          </Link>
          <button
            type="button"
            className="u-btn"
            onClick={() => {
              setSaved(null);
              setName("");
              setDesc("");
              setCats("");
              setTiers([{ label: "Standard", price: 0 }]);
              setRecipe([]);
            }}
          >
            Set up another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="u-wrap max-w-3xl py-7 lg:py-10">
      <header className="border-line border-b pb-5">
        <h1 className="u-serif text-[1.75rem] leading-tight lg:text-[2.1rem]">
          Set up a product
        </h1>
        <p className="text-ink-2 mt-1.5 max-w-[58ch] leading-relaxed">
          The recipe is the part worth getting right while the arrangement
          is still on the bench. Everything else can be tidied later; the
          stem counts are almost impossible to reconstruct afterwards.
        </p>
      </header>

      {/* What it is --------------------------------------------------- */}
      <section className="mt-7">
        <h2 className="u-label">What it is</h2>

        <label className="mt-3 block">
          <span className="u-label">Name</span>
          <input
            className="u-field mt-1"
            value={name}
            placeholder="Autumn Hand Tied"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {existing && (
          <p className="text-amber mt-1.5 text-[0.8rem]">
            There is already a product called {existing.name}. Two with the
            same name are hard to tell apart in the sheet.
          </p>
        )}

        <label className="mt-4 block">
          <span className="u-label">Categories</span>
          <span className="text-ink-3 mt-0.5 block text-[0.75rem]">
            Separated by commas, as they read on the website.
          </span>
          <input
            className="u-field mt-1.5"
            value={cats}
            placeholder="Bouquets, Romance"
            onChange={(e) => setCats(e.target.value)}
          />
        </label>

        <label className="mt-4 block">
          <span className="u-label">Description</span>
          <textarea
            className="u-field mt-1.5 h-24 resize-y py-2 leading-relaxed"
            value={desc}
            placeholder="A seasonal mix of..."
            onChange={(e) => setDesc(e.target.value)}
          />
        </label>
      </section>

      {/* Sizes -------------------------------------------------------- */}
      <section className="border-line mt-7 border-t pt-6">
        <h2 className="u-label">Sizes and prices</h2>
        <ul className="mt-3">
          {tiers.map((t, i) => (
            <li key={i} className="mb-1.5 flex gap-2">
              <input
                aria-label="Size"
                className="u-field flex-1"
                value={t.label}
                onChange={(e) => {
                  const next = [...tiers];
                  next[i] = { ...t, label: e.target.value };
                  setTiers(next);
                }}
              />
              <span className="text-ink-3 self-center">£</span>
              <input
                aria-label="Price"
                inputMode="decimal"
                className="u-field u-num w-28 text-right"
                value={t.price || ""}
                onChange={(e) => {
                  const next = [...tiers];
                  next[i] = { ...t, price: Number(e.target.value) || 0 };
                  setTiers(next);
                }}
              />
              <button
                type="button"
                aria-label={`Remove the ${t.label} size`}
                className="u-btn u-btn--quiet px-2"
                disabled={tiers.length === 1}
                onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
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
            setTiers([...tiers, { label: "Grand", price: top || 0 }])
          }
        >
          Add a size
        </button>
      </section>

      {/* The recipe --------------------------------------------------- */}
      <section className="border-line mt-7 border-t pt-6">
        <h2 className="u-serif text-[1.3rem]">What goes in it</h2>
        <p className="text-ink-2 mt-1 max-w-[58ch] text-[0.88rem] leading-relaxed">
          Stems of each variety, for one of the smallest size. The count
          underneath updates as the lines are typed.
        </p>

        <ul className="mt-4">
          {recipe.map((line, i) => {
            const v = stock.get(line.variety);
            const makes = v ? Math.floor(v.stems / Math.max(1, line.stems)) : 0;
            return (
              <li key={i} className="mb-1.5 flex items-center gap-2">
                <select
                  aria-label="Flower"
                  className="u-field flex-1"
                  value={line.variety}
                  onChange={(e) => {
                    const next = [...recipe];
                    next[i] = { ...line, variety: e.target.value };
                    setRecipe(next);
                  }}
                >
                  {varieties.map((x) => (
                    <option
                      key={x.id}
                      value={x.id}
                      disabled={used.has(x.id) && x.id !== line.variety}
                    >
                      {x.name}
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
                    const next = [...recipe];
                    next[i] = {
                      ...line,
                      stems: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                    };
                    setRecipe(next);
                  }}
                />
                {/* What this one line alone allows, so a single greedy
                    ingredient is obvious while it is being typed. */}
                <span
                  className={`u-num w-20 shrink-0 text-right text-[0.78rem] ${
                    v && v.stems === 0 ? "text-blush" : "text-ink-3"
                  }`}
                >
                  {v && v.stems === 0 ? "none in" : `allows ${makes}`}
                </span>
                <button
                  type="button"
                  aria-label="Remove this flower"
                  className="u-btn u-btn--quiet px-2"
                  onClick={() => setRecipe(recipe.filter((_, j) => j !== i))}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="u-btn mt-1"
          onClick={() => {
            const free = varieties.find((v) => !used.has(v.id));
            if (free) setRecipe([...recipe, { variety: free.id, stems: 1 }]);
          }}
        >
          Add a flower
        </button>

        {recipe.length > 0 && (
          <dl className="border-sage-pale bg-sage-wash mt-5 grid grid-cols-2 gap-y-2 rounded-lg border p-4 text-[0.88rem]">
            <dt className="text-ink-2">Can be made, from stock</dt>
            <dd className="u-num text-right text-[1.1rem] font-semibold">
              {preview.count ?? "-"}
            </dd>
            <dt className="text-ink-2">Runs out of first</dt>
            <dd className="text-right">
              {preview.limiting
                ? (stock.get(preview.limiting)?.name ?? preview.limiting)
                : "-"}
            </dd>
            <dt className="text-ink-2">Stems in one</dt>
            <dd className="u-num text-right">{stems}</dd>
            {costKnown && top > 0 && (
              <>
                <dt className="text-ink-2">
                  Flower cost against £{top.toFixed(2)}
                </dt>
                <dd className="u-num text-right">
                  £{cost.toFixed(2)} · {Math.round((cost / top) * 100)}%
                </dd>
              </>
            )}
            {!costKnown && (
              <dd className="text-ink-3 col-span-2 text-[0.78rem]">
                Stem costs are not filled in for everything here, so there
                is no margin to show.
              </dd>
            )}
          </dl>
        )}
      </section>

      {/* How it is counted -------------------------------------------- */}
      <section className="border-line mt-7 border-t pt-6">
        <h2 className="u-label">How the website counts it</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="u-label">Counted by</span>
            <select
              className="u-field mt-1"
              value={mode}
              onChange={(e) =>
                setMode(e.target.value as Product["stockMode"])
              }
            >
              <option value="stems">Stems in stock, from the recipe</option>
              <option value="manual">A number I type</option>
              <option value="always">Always available, never counted</option>
            </select>
          </label>
          {mode !== "always" && (
            <label className="block">
              <span className="u-label">Say limited at or below</span>
              <input
                type="number"
                min={0}
                className="u-field u-num mt-1 w-24"
                value={lowAt}
                onChange={(e) =>
                  setLowAt(Math.max(0, Math.floor(Number(e.target.value) || 0)))
                }
              />
            </label>
          )}
        </div>
      </section>

      <div className="border-line mt-7 flex flex-wrap items-center gap-3 border-t pt-6">
        <button
          type="button"
          className="u-btn u-btn--go"
          disabled={!name.trim()}
          onClick={save}
        >
          Save as a draft
        </button>
        <Link href="/products" className="u-btn u-btn--quiet">
          Back to the sheet
        </Link>
        <p className="text-ink-3 text-[0.78rem]">
          Drafts are not on the website. The photograph can be added in the
          sheet afterwards.
        </p>
      </div>
    </div>
  );
}
