import type { Availability, Product, Variety } from "./types";

/**
 * How many of a thing can be made out of what is in the buckets.
 *
 * The whole answer is one line - the smallest number of times any one
 * ingredient goes into its bucket - but the three cases around it are
 * what make it usable in a shop:
 *
 *   always   cards, chocolates, champagne, relay orders. Never counted.
 *   manual   a number the florist types, for anything made to order.
 *   stems    worked out, and only when a recipe has actually been written.
 *
 * An empty recipe returns unknown rather than nought. A product with no
 * recipe is not sold out, it is unmeasured, and showing it as sold out
 * on the shop front would cost them the order.
 */
export function availabilityOf(
  product: Product,
  stock: Map<string, Variety>,
): Availability {
  if (product.status !== "live") {
    return { count: null, state: "unknown", limiting: null };
  }

  if (product.stockMode === "always") {
    return { count: null, state: "always", limiting: null };
  }

  if (product.stockMode === "manual") {
    const n = Math.max(0, Math.floor(product.manualStock));
    return { count: n, state: stateFor(n, product.lowAt), limiting: null };
  }

  const recipe = product.recipe.filter((r) => r.variety && r.stems > 0);
  if (recipe.length === 0) {
    return { count: null, state: "unknown", limiting: null };
  }

  let count = Infinity;
  let limiting: string | null = null;

  for (const line of recipe) {
    const bucket = stock.get(line.variety);
    const have = bucket ? Math.max(0, Math.floor(bucket.stems)) : 0;
    const makes = Math.floor(have / line.stems);
    if (makes < count) {
      count = makes;
      limiting = line.variety;
    }
  }

  const n = Number.isFinite(count) ? count : 0;
  return { count: n, state: stateFor(n, product.lowAt), limiting };
}

function stateFor(n: number, lowAt: number): Availability["state"] {
  if (n <= 0) return "out";
  if (n <= Math.max(0, lowAt)) return "limited";
  return "available";
}

/** What the shop front would say, in the shop's own words. */
export const stateLabel: Record<Availability["state"], string> = {
  available: "Available",
  limited: "Limited",
  out: "Sold out",
  unknown: "No recipe",
  always: "Always on",
};

export const statePill: Record<Availability["state"], string> = {
  available: "u-pill--live",
  limited: "u-pill--low",
  out: "u-pill--out",
  unknown: "u-pill--draft",
  always: "u-pill--live",
};

/**
 * Every product that would be held back by one variety running dry.
 * This is what makes a stem count worth typing: the florist changes one
 * number and sees the eleven bouquets it decides.
 */
export function productsBlockedBy(
  varietyId: string,
  products: Product[],
  stock: Map<string, Variety>,
): Product[] {
  return products.filter(
    (p) => availabilityOf(p, stock).limiting === varietyId,
  );
}

/** What a recipe costs in stems, where stem costs have been filled in. */
export function recipeCost(product: Product, stock: Map<string, Variety>) {
  let total = 0;
  let complete = true;
  for (const line of product.recipe) {
    const v = stock.get(line.variety);
    if (!v || !v.cost) {
      complete = false;
      continue;
    }
    total += v.cost * line.stems;
  }
  return { total, complete };
}
