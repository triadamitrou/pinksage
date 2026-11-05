import catalogue from "./catalogue.json";
import { allergyNote, cleanDesc, cleanName, lowestPrice, priceLabel } from "./clean";
import { SECTIONS, TAGS, place, tagsFor, type SectionId, type TagId } from "./shelf";
import type { Tier } from "./types";

/**
 * The catalogue as a shop front needs it.
 *
 * Built once, at module load, from the same catalogue.json the dashboard
 * reads, so the two halves can never drift apart. Everything here is
 * derived: a shelf from `shelf.ts`, tidied copy from `clean.ts`, a price
 * from the tiers the shop already set. No product, price, photograph or
 * claim is added that pinksage.co.uk does not already carry.
 *
 * Availability is deliberately NOT here. It changes by the hour, it
 * belongs to the florist's stock counts, and it is read in the browser
 * from the dashboard's own store - so a page can be prerendered with the
 * copy and the price, and say what is actually in the buckets a moment
 * later. See components/shop/Stock.tsx.
 */

export type ShopProduct = {
  id: string;
  /** Unique, because five of their slugs collide with another product. */
  slug: string;
  name: string;
  desc: string;
  /** Their own substitution note, verbatim. */
  note: string;
  allergy: string;
  img: string | null;
  tiers: Tier[];
  from: number;
  price: string;
  section: SectionId;
  sub: string;
  tags: TagId[];
  /** The flowers their own copy names. No stem counts: nobody has written any. */
  varieties: string[];
};

type Raw = {
  id: string;
  name: string;
  slug: string;
  desc: string;
  note: string;
  cats: string[];
  tiers: Tier[];
  img: string | null;
  varieties: string[];
};

const raw = (catalogue as { products: Raw[] }).products;

/**
 * Five products share a slug with another product - two sympathy hand
 * ties, two seasonal vases, two Mother's Day boxes. They are genuinely
 * different products at different prices, so neither is dropped; the
 * second onwards carries its floristPro id so both have a URL.
 */
function uniqueSlugs(items: Raw[]): Map<string, string> {
  const seen = new Set<string>();
  const out = new Map<string, string>();
  for (const p of items) {
    const base = p.slug || p.id;
    const slug = seen.has(base) ? `${base}-${p.id}` : base;
    seen.add(slug);
    out.set(p.id, slug);
  }
  return out;
}

const slugs = uniqueSlugs(raw);

export const CATALOGUE: ShopProduct[] = raw.map((p) => {
  const { section, sub } = place(p);
  const name = cleanName(p.name);
  return {
    id: p.id,
    slug: slugs.get(p.id)!,
    name,
    desc: cleanDesc(p.desc, p.name),
    note: p.note?.trim() ?? "",
    allergy: allergyNote(p.desc),
    img: p.img,
    tiers: p.tiers,
    from: lowestPrice(p.tiers),
    price: priceLabel(p.tiers),
    section,
    sub,
    tags: tagsFor(p),
    varieties: p.varieties,
  };
});

export const BY_SLUG = new Map(CATALOGUE.map((p) => [p.slug, p]));

export function inSection(id: SectionId): ShopProduct[] {
  return CATALOGUE.filter((p) => p.section === id);
}

export function inSub(section: SectionId, sub: string): ShopProduct[] {
  return CATALOGUE.filter((p) => p.section === section && p.sub === sub);
}

export function withTag(tag: TagId): ShopProduct[] {
  return CATALOGUE.filter((p) => p.tags.includes(tag));
}

/** Only the shelves that have something on them, in the order declared. */
export function shelvesOf(id: SectionId) {
  const section = SECTIONS.find((s) => s.id === id);
  if (!section) return [];
  return section.subs
    .map((sub) => ({ sub, items: inSub(id, sub.id) }))
    .filter((s) => s.items.length > 0);
}

export const SECTION_COUNTS: Record<SectionId, number> = Object.fromEntries(
  SECTIONS.map((s) => [s.id, inSection(s.id).length]),
) as Record<SectionId, number>;

/** Collections with something in them, for the nav and the home page. */
export const LIVE_TAGS = TAGS.map((t) => ({
  ...t,
  items: withTag(t.id),
})).filter((t) => t.items.length > 0);

/**
 * A handful from one shelf, spread across its price range rather than
 * taken off the top - otherwise every row on the home page opens with
 * the cheapest thing on it, which is nobody's idea of a shop window.
 */
export function spread(items: ShopProduct[], n: number): ShopProduct[] {
  const withPhoto = items.filter((p) => p.img);
  const pool = withPhoto.length >= n ? withPhoto : items;
  if (pool.length <= n) return pool;
  const sorted = [...pool].sort((a, b) => a.from - b.from);
  // The bottom of a shelf is rarely what it should be judged on - a
  // single stem sits on the same shelf as a casket spray - so the row
  // starts above the cheapest sixth and spreads from there.
  const floor = Math.floor(sorted.length / 6);
  const band = sorted.slice(floor);
  const step = (band.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => band[Math.round(i * step)]);
}

/** Other things on the same shelf, nearest in price. */
export function alongside(p: ShopProduct, n = 4): ShopProduct[] {
  return CATALOGUE.filter(
    (x) => x.id !== p.id && x.section === p.section && x.sub === p.sub,
  )
    .sort((a, b) => Math.abs(a.from - p.from) - Math.abs(b.from - p.from))
    .slice(0, n);
}

export { SECTIONS, TAGS };
export type { SectionId, TagId };
