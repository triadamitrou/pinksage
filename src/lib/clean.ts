/**
 * Tidying what the scrape brought back, without rewriting it.
 *
 * The product copy on the live site is mixed in with the page furniture
 * around it, and the scrape could not tell them apart. A description
 * arrives looking like this:
 *
 *   "Or add something extra: Cadbury Dairy Milk 360 gm box chocolates
 *    £10.00 Select Bouquet £50 Created in-house by our team of artisan
 *    florists... Colour Choice -- please select -- Surprise Me Pastels"
 *
 * Three things are glued to one sentence of real copy: an upsell panel,
 * the product's own name repeated, and the colour dropdown. 47 of the 198
 * carry at least one of them, and the shop's internal codes - HTSYM2S,
 * MDHBOXP1, VASE1S - lead another handful.
 *
 * Everything here only ever REMOVES. Nothing is reworded and nothing is
 * added, so what shows on the shop front is a subset of what Pink Sage
 * already wrote. The functions run at render rather than being baked into
 * catalogue.json, so the scraped original stays verbatim in the file and
 * anybody can check this against it.
 */

/** Page furniture, in the order it has to come off. */
const UPSELL = /^\s*or add something extra\s*:?\s*/i;
/**
 * Their internal codes: HTSYM2S, C06191WS, MDHBOXP1, NHTW, VAL, 2734.
 * A digit anywhere, or two to four letters with nothing lower case: both
 * narrow enough that no word of real copy has matched across the 198.
 */
const CODE = /^(?:[A-Z]{1,}[0-9][0-9A-Z]*|[A-Z]{2,4}|\d{3,})\s+/;
/** Where the real copy stops and the order form starts. */
const FORM = /(please select|colour choice|\bor add something extra\b|what take your fancy|gift choice)/i;

const squash = (s: string) => s.replace(/[\s ]+/g, " ").trim();

/**
 * A product name as it should read in a heading.
 *
 * Only whitespace and the stray asterisk the platform appends to some
 * titles. Spelling and capitalisation are left exactly as the shop types
 * them, including "Lillies", because correcting a shop's own product
 * names is their call and not a tidy-up.
 */
export function cleanName(raw: string): string {
  return squash(raw)
    .replace(/\s*\*+\s*$/, "")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",");
}

/**
 * The description, cut back to the part the shop wrote about the product.
 *
 * `name` is passed in because the page furniture repeats it, and a
 * description that opens by restating its own heading reads like a fault.
 */
export function cleanDesc(raw: string, name: string): string {
  let s = squash(raw ?? "");
  if (!s) return "";

  // 1. The upsell panel. It lists one gift per "... £10.00 Select" pair
  //    and there can be several, so the cut goes after the LAST of them
  //    rather than the first - and only inside the panel's own length,
  //    so a price quoted in the real copy cannot pull the cut with it.
  if (UPSELL.test(s)) {
    const window = s.slice(0, 400);
    let last = -1;
    for (const m of window.matchAll(/£\s*[\d.,]+\s*select\s+/gi)) {
      last = (m.index ?? 0) + m[0].length;
    }
    s = last > 0 ? s.slice(last) : s.replace(UPSELL, "");
  }

  // 2. The product's own name, repeated. Twice over where the panel and
  //    the heading both carried it. A description that opens by restating
  //    its own heading reads like a fault.
  //    A name is only furniture when what follows it starts afresh. In
  //    "A single red rose for placing on the coffin" the name IS the
  //    sentence, and cutting it leaves "for placing on the coffin",
  //    so a lower-case remainder puts the name back.
  const bare = cleanName(name);
  for (let i = 0; i < 2 && bare; i++) {
    s = lead(s);
    const at = s.toLowerCase().indexOf(bare.toLowerCase());
    if (at === -1 || at >= 8) break;
    const rest = squash(s.slice(at + bare.length));
    if (/^[a-z]/.test(lead(rest))) break;
    s = rest;
  }

  // 3. A leading internal code, which can sit behind an asterisk.
  s = lead(s).replace(CODE, "");

  // 4. Everything from the order form onwards.
  const form = s.search(FORM);
  if (form !== -1) s = s.slice(0, form);

  s = lead(squash(s));

  // 5. The scrape cut some descriptions mid-word. Ending on a full stop
  //    is better; failing that, drop the half word rather than show it.
  if (s.length > 140 && !/[.!?\u201d"']$/.test(s)) {
    const stop = s.lastIndexOf(". ");
    if (stop > 110) s = s.slice(0, stop + 1);
    else s = s.replace(/\s+\S*$/, "") + "\u2026";
  }

  return s;
}

/** Leading punctuation the furniture leaves behind. */
const lead = (s: string) => s.replace(/^[-\u2013\u2014\u00b7*:,.\s]+/, "");

/**
 * Allergy and content notes, pulled out of the description rather than
 * left buried in the middle of it. Theirs, word for word.
 */
export function allergyNote(raw: string): string {
  const at = raw.search(/allergy information\s*:/i);
  if (at === -1) return "";
  const rest = squash(raw.slice(at));
  const end = rest.search(/\bSuitable\b|--\s*please select/i);
  return end === -1 ? rest : squash(rest.slice(0, end));
}

/** "from £45.00", or "£45.00" when there is only the one size. */
export function priceLabel(tiers: { price: number }[]): string {
  const prices = tiers.map((t) => t.price).filter((p) => p > 0);
  if (!prices.length) return "";
  const low = Math.min(...prices);
  const money = `£${low.toFixed(2)}`;
  return prices.length > 1 || tiers.length > 1 ? `from ${money}` : money;
}

export const lowestPrice = (tiers: { price: number }[]) => {
  const prices = tiers.map((t) => t.price).filter((p) => p > 0);
  return prices.length ? Math.min(...prices) : 0;
};
