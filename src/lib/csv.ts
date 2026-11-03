import type { Ingredient, Product, Variety } from "./types";

/**
 * The spreadsheet round trip.
 *
 * Excel is the one tool every florist already has, so the bulk edit is a
 * download, a morning's typing and an upload - not a second interface to
 * learn. Two rules make that safe:
 *
 *   The id column is the key. Rows match on it, so a sheet can be sorted,
 *   filtered or half deleted and still apply to the right products.
 *   A missing column is left alone rather than blanked, so somebody can
 *   send back a sheet of nothing but id and stems.
 *
 * Recipes travel as one readable cell - "Rose x7; Lisianthus x5" - rather
 * than forty columns of mostly nothing.
 */

const COLUMNS = [
  "id",
  "name",
  "status",
  "categories",
  "description",
  "stock_mode",
  "manual_stock",
  "low_at",
  "recipe",
  "tiers",
] as const;

function esc(v: string | number) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function productsToCsv(products: Product[], names: Map<string, string>) {
  const lines = [COLUMNS.join(",")];
  for (const p of products) {
    lines.push(
      [
        p.id,
        p.name,
        p.status,
        p.cats.join(" | "),
        p.desc,
        p.stockMode,
        p.manualStock,
        p.lowAt,
        p.recipe
          .map((r) => `${names.get(r.variety) ?? r.variety} x${r.stems}`)
          .join("; "),
        p.tiers.map((t) => `${t.label} £${t.price.toFixed(2)}`).join("; "),
      ]
        .map(esc)
        .join(","),
    );
  }
  return lines.join("\n");
}

export function varietiesToCsv(varieties: Variety[]) {
  const lines = ["id,name,stems,cost_per_stem,delivery"];
  for (const v of varieties) {
    lines.push([v.id, v.name, v.stems, v.cost, v.delivery].map(esc).join(","));
  }
  return lines.join("\n");
}

/** A small CSV reader: quoted fields, doubled quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export type ImportResult = {
  products: Product[];
  changed: string[];
  skipped: number;
  /** Lines the sheet asked for that could not be done, in plain words. */
  problems: string[];
};

/** Reads a sheet back over the catalogue, without trusting any of it. */
export function applyProductCsv(
  text: string,
  products: Product[],
  varietyIds: Map<string, string>,
): ImportResult {
  const rows = parseCsv(text);
  const problems: string[] = [];
  if (rows.length < 2) {
    return { products, changed: [], skipped: 0, problems: ["The sheet is empty."] };
  }

  const head = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const at = (name: string) => head.indexOf(name);
  const idAt = at("id");
  if (idAt < 0) {
    return {
      products,
      changed: [],
      skipped: 0,
      problems: ["No id column, so there is no way to tell which product each row is."],
    };
  }

  const byId = new Map(products.map((p) => [p.id, p]));
  const next = new Map(products.map((p) => [p.id, { ...p }]));
  const changed = new Set<string>();
  let skipped = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const id = (row[idAt] ?? "").trim();
    const base = byId.get(id);
    if (!base) {
      skipped++;
      if (id) problems.push(`Row ${r + 1}: no product with id ${id}.`);
      continue;
    }
    const p = next.get(id)!;
    const cell = (name: string) => {
      const i = at(name);
      return i >= 0 && i < row.length ? row[i].trim() : null;
    };

    const name = cell("name");
    if (name) p.name = name;

    const desc = cell("description");
    if (desc !== null && desc !== "") p.desc = desc;

    const cats = cell("categories");
    if (cats) p.cats = cats.split("|").map((c) => c.trim()).filter(Boolean);

    const status = cell("status")?.toLowerCase();
    if (status) {
      if (["live", "draft", "off"].includes(status)) {
        p.status = status as Product["status"];
      } else {
        problems.push(`Row ${r + 1}: "${status}" is not live, draft or off.`);
      }
    }

    const mode = cell("stock_mode")?.toLowerCase();
    if (mode) {
      if (["stems", "manual", "always"].includes(mode)) {
        p.stockMode = mode as Product["stockMode"];
      } else {
        problems.push(`Row ${r + 1}: "${mode}" is not stems, manual or always.`);
      }
    }

    const manual = cell("manual_stock");
    if (manual) {
      const n = Number(manual);
      if (Number.isFinite(n)) p.manualStock = Math.max(0, Math.floor(n));
      else problems.push(`Row ${r + 1}: "${manual}" is not a number of items.`);
    }

    const low = cell("low_at");
    if (low) {
      const n = Number(low);
      if (Number.isFinite(n)) p.lowAt = Math.max(0, Math.floor(n));
    }

    const tiers = cell("tiers");
    if (tiers) {
      const parsed = parseTiers(tiers);
      if (parsed.length) p.tiers = parsed;
      else problems.push(`Row ${r + 1}: could not read the prices in "${tiers}".`);
    }

    // An empty cell leaves the recipe alone, the same as every other
    // column: somebody editing prices in Excel should never lose a
    // recipe by widening a selection. The word "none" clears it on
    // purpose.
    const recipe = cell("recipe");
    if (recipe) {
      if (recipe.toLowerCase() === "none") {
        p.recipe = [];
      } else {
        const { lines, unknown } = parseRecipe(recipe, varietyIds);
        p.recipe = lines;
        for (const u of unknown) {
          problems.push(`Row ${r + 1}: no flower called "${u}" in the stock list.`);
        }
      }
    }

    if (JSON.stringify(p) !== JSON.stringify(base)) changed.add(id);
  }

  return {
    products: products.map((p) => next.get(p.id) ?? p),
    changed: [...changed],
    skipped,
    problems,
  };
}

/** "Standard £50.00; Grand £60" in either order, with or without the sign. */
function parseTiers(text: string) {
  const out: { label: string; price: number }[] = [];
  for (const part of text.split(/[;|]/)) {
    const s = part.trim();
    if (!s) continue;
    const m = s.match(/^(.*?)[\s£]*£?\s*([\d.,]+)\s*$/);
    if (!m) continue;
    const price = Number(m[2].replace(/,/g, ""));
    if (!Number.isFinite(price)) continue;
    out.push({ label: m[1].trim() || "Standard", price });
  }
  return out;
}

/** "Rose x7; Lisianthus x5", matched on the flower's name or its id. */
function parseRecipe(text: string, varietyIds: Map<string, string>) {
  const lines: Ingredient[] = [];
  const unknown: string[] = [];
  for (const part of text.split(/[;|]/)) {
    const s = part.trim();
    if (!s) continue;
    const m = s.match(/^(.*?)\s*[x×*]\s*(\d+)$/i) ?? s.match(/^(\d+)\s*[x×*]?\s*(.*)$/);
    if (!m) continue;
    const [rawName, rawCount] = /^\d/.test(m[1]) ? [m[2], m[1]] : [m[1], m[2]];
    const key = rawName.trim().toLowerCase();
    const id = varietyIds.get(key);
    const stems = Number(rawCount);
    if (!id) {
      unknown.push(rawName.trim());
      continue;
    }
    if (Number.isFinite(stems) && stems > 0) lines.push({ variety: id, stems });
  }
  return { lines, unknown };
}

export function applyVarietyCsv(text: string, varieties: Variety[]) {
  const rows = parseCsv(text);
  const problems: string[] = [];
  if (rows.length < 2) return { varieties, changed: 0, problems: ["The sheet is empty."] };

  const head = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const idAt = head.indexOf("id");
  const nameAt = head.indexOf("name");
  if (idAt < 0 && nameAt < 0) {
    return { varieties, changed: 0, problems: ["No id or name column."] };
  }

  const next = varieties.map((v) => ({ ...v }));
  const find = (row: string[]) => {
    const id = idAt >= 0 ? (row[idAt] ?? "").trim().toLowerCase() : "";
    const name = nameAt >= 0 ? (row[nameAt] ?? "").trim().toLowerCase() : "";
    return next.find((v) => v.id === id || v.name.toLowerCase() === name);
  };

  let changed = 0;
  for (let r = 1; r < rows.length; r++) {
    const v = find(rows[r]);
    if (!v) {
      const label = (rows[r][nameAt] ?? rows[r][idAt] ?? "").trim();
      if (label) problems.push(`Row ${r + 1}: no flower called "${label}".`);
      continue;
    }
    const cell = (name: string) => {
      const i = head.indexOf(name);
      return i >= 0 && i < rows[r].length ? rows[r][i].trim() : null;
    };
    const stems = cell("stems");
    const cost = cell("cost_per_stem");
    const delivery = cell("delivery");
    let touched = false;
    if (stems && Number.isFinite(Number(stems))) {
      v.stems = Math.max(0, Math.floor(Number(stems)));
      touched = true;
    }
    if (cost && Number.isFinite(Number(cost))) {
      v.cost = Math.max(0, Number(cost));
      touched = true;
    }
    if (delivery !== null) {
      v.delivery = delivery;
      touched = true;
    }
    if (touched) changed++;
  }
  return { varieties: next, changed, problems };
}

/** Hands the browser a file without a round trip to anywhere. */
export function download(filename: string, text: string) {
  const blob = new Blob([`﻿${text}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
