/**
 * Where each of the 198 products lives.
 *
 * The live site has 22 flat categories, 35 products in none of them, and
 * no level above any of it. Funeral work is 108 of the 198, split across
 * eleven separate top-level categories - Casket Sprays, Sheaves, Hearts,
 * Crosses, Wreath, Spray, Posies and Pillows, Specialist Tributes,
 * Service Arrangements, Funeral Finishing Touches, Sympathy - each one
 * sitting at the same level in the menu as Chocolates. Somebody ordering
 * flowers for a funeral has to guess which of eleven words the shop
 * filed their tribute under, and somebody buying a birthday bouquet
 * walks past all eleven to get there.
 *
 * This module gives every product exactly one home, so there is always a
 * single answer to "where does this live", and then adds collections on
 * top for the things that genuinely cut across - Valentine's Day, Mother's
 * Day, Christmas - rather than filing a Mother's Day hatbox away from
 * every other hatbox.
 *
 * Nothing here invents a product, a price or a claim. It only decides
 * where things that already exist should sit, reading the shop's own
 * categories first and their own product names and copy second.
 */

export type SectionId = "flowers" | "sympathy" | "gifts" | "weddings";

export type Sub = {
  id: string;
  name: string;
  /** One line under the heading. Describes the shelf, never sells it. */
  note: string;
};

export type Section = {
  id: SectionId;
  name: string;
  /** What the nav says, when it needs to be shorter than the name. */
  short: string;
  blurb: string;
  subs: Sub[];
};

/**
 * Four sections, in the order a customer arrives at them. Funeral work is
 * second rather than buried, because it is more than half the catalogue
 * and the person looking for it is in a hurry and not browsing.
 */
export const SECTIONS: Section[] = [
  {
    id: "flowers",
    name: "Flowers",
    short: "Flowers",
    blurb:
      "Hand tied in the shop on Rother Street and delivered across Stratford-upon-Avon the same day.",
    subs: [
      { id: "hand-tied", name: "Hand tied bouquets", note: "Wrapped and ready to go straight into a vase." },
      { id: "roses", name: "Roses", note: "Single-variety rose bouquets, by the half dozen upwards." },
      { id: "vases", name: "In a vase", note: "Arranged in water, so nothing needs doing on arrival." },
      { id: "hatboxes", name: "Hatboxes and gift boxes", note: "Arranged in a box with its own water source." },
      { id: "posies", name: "Posies", note: "Small, round and scented." },
      { id: "subscription", name: "Subscriptions", note: "The same arrangement, repeating." },
      { id: "corporate", name: "Corporate and venues", note: "Contract work for offices, hotels and restaurants." },
    ],
  },
  {
    id: "sympathy",
    name: "Funeral tributes",
    short: "Funerals",
    blurb:
      "Made to order for a date and a time. Ordering by telephone is often quicker, on 01789 292811.",
    subs: [
      { id: "sprays", name: "Casket and coffin sprays", note: "Made to lie along the top of a coffin." },
      { id: "sheaves", name: "Sheaves", note: "Flat-backed and tied, to be carried or laid." },
      { id: "wreaths", name: "Wreaths", note: "The traditional circle, open or closed." },
      { id: "hearts", name: "Hearts", note: "Open or closed hearts, on a frame." },
      { id: "crosses", name: "Crosses", note: "On a frame, in a single colour or mixed." },
      { id: "posies-pillows", name: "Posies and pillows", note: "Smaller tributes, often from a child or a grandchild." },
      { id: "tributes", name: "Lettering and specialist tributes", note: "Names, relations and shapes made to order." },
      { id: "finishing", name: "Finishing touches", note: "Single stems, ribbon and the smaller additions." },
    ],
  },
  {
    id: "gifts",
    name: "Gifts",
    short: "Gifts",
    blurb: "Added to an order of flowers, or sent on their own.",
    subs: [
      { id: "champagne", name: "Champagne and prosecco", note: "Sent with flowers or by itself." },
      { id: "chocolates", name: "Chocolates", note: "" },
      { id: "hampers", name: "Small gifts and hampers", note: "Keepsakes and gift sets, sent with flowers or alone." },
      { id: "balloons", name: "Balloons", note: "Helium filled, collected or delivered with an order." },
      { id: "soft-toys", name: "Teddies", note: "" },
      { id: "plants", name: "Plants", note: "Living, for indoors or out." },
      { id: "cards", name: "Cards and vouchers", note: "Gift vouchers are valid for six months." },
      { id: "workshops", name: "Workshops", note: "Evenings in the shop, making your own." },
    ],
  },
  {
    id: "weddings",
    name: "Weddings and events",
    short: "Weddings",
    blurb:
      "By appointment. Floristry, styling and event management, from a single buttonhole upwards.",
    subs: [],
  },
];

export const sectionOf = (id: string) => SECTIONS.find((s) => s.id === id);

export function subOf(section: SectionId, sub: string): Sub | undefined {
  return sectionOf(section)?.subs.find((s) => s.id === sub);
}

/* ------------------------------------------------------- collections */

/**
 * The cross-cutting shelves. A Mother's Day hatbox belongs with the other
 * hatboxes AND on the Mother's Day page; filing it under one or the other
 * is what produced the mess in the first place.
 *
 * `local` is the only one not about an occasion, and it is not decoration:
 * it is lifted out of the shop's own substitution note, which says on a
 * number of products that they are made in store and so cannot travel
 * down the relay network. That is the single most useful thing a customer
 * can know before ordering and it is currently buried in small print.
 */
export type TagId =
  | "valentines"
  | "mothers-day"
  | "christmas"
  | "romance"
  | "eco"
  | "local";

export const TAGS: { id: TagId; name: string; note: string }[] = [
  { id: "valentines", name: "Valentine's Day", note: "Available 7th to 15th February." },
  { id: "mothers-day", name: "Mother's Day", note: "" },
  { id: "christmas", name: "Christmas", note: "" },
  { id: "romance", name: "Romance", note: "" },
  { id: "eco", name: "Eco friendly", note: "Made without floral foam." },
  { id: "local", name: "Local delivery only", note: "Made in the shop, so it cannot be sent through the relay network." },
];

export const tagOf = (id: string) => TAGS.find((t) => t.id === id);

/* ---------------------------------------------------- the classifier */

export type Placed = { section: SectionId; sub: string };

type Readable = {
  name: string;
  desc: string;
  cats: string[];
  note?: string;
  tiers?: { label: string; price: number }[];
};

const FALLBACK: Placed = { section: "flowers", sub: "hand-tied" };

/**
 * One home per product.
 *
 * The shop's own categories are trusted first, because a florist filed
 * them and a wreath they called a wreath is a wreath. The name and copy
 * are only read for the 35 products that were never filed at all.
 *
 * Returns null when no rule matched, so a product can never be quietly
 * swept into a default shelf without somebody seeing it. `place` applies
 * the fallback; the build script checks for nulls.
 */
export function classify(p: Readable): Placed | null {
  const cat = new Set(p.cats);
  const has = (...names: string[]) => names.some((n) => cat.has(n));
  const t = `${p.name} ${p.desc}`.toLowerCase();
  const m = (re: RegExp) => re.test(t);
  /**
   * Name only. The narrow rules below have to use it: their gift voucher
   * is "valid in store for cut flowers, gifts, wedding flowers,
   * workshops", and reading that description for the word "workshop"
   * files a voucher as an evening class.
   */
  const n = (re: RegExp) => re.test(p.name.toLowerCase());

  // 1. Funeral work, by the shop's own filing. Eleven categories in, one
  //    section out, which is the entire point of this function.
  if (has("Casket Sprays", "Spray")) return { section: "sympathy", sub: "sprays" };
  if (has("Sheaves")) return { section: "sympathy", sub: "sheaves" };
  if (has("Crosses")) return { section: "sympathy", sub: "crosses" };
  if (has("Hearts")) return { section: "sympathy", sub: "hearts" };
  if (has("Posies and Pillows")) return { section: "sympathy", sub: "posies-pillows" };
  if (has("Wreath")) return { section: "sympathy", sub: "wreaths" };
  if (has("Specialist Tributes", "Service Arrangements"))
    return { section: "sympathy", sub: "tributes" };
  if (has("Funeral Finishing Touches", "Sympathy"))
    return { section: "sympathy", sub: "finishing" };

  // 2. Gifts, by category.
  if (has("Champagne")) return { section: "gifts", sub: "champagne" };
  if (has("Chocolates")) return { section: "gifts", sub: "chocolates" };
  if (has("Cards")) return { section: "gifts", sub: "cards" };

  // 3. Flowers, by category. Bouquets, Florist Choice and Romance are
  //    three names for the same shelf on the live site, so they are split
  //    by what the thing physically is instead.
  if (has("Corporate Flowers")) return { section: "flowers", sub: "corporate" };
  if (has("Subscription Flowers")) return { section: "flowers", sub: "subscription" };
  if (has("Hatboxes")) return { section: "flowers", sub: "hatboxes" };
  if (has("Rose Bouquets")) return { section: "flowers", sub: "roses" };
  if (has("Bouquets", "Florist Choice", "Romance", "Eco friendly")) {
    if (m(/hat ?box|gift box/)) return { section: "flowers", sub: "hatboxes" };
    if (m(/\bvase\b|arrangement|basket|aqua ?pack/))
      return { section: "flowers", sub: "vases" };
    if (m(/\bposy\b|posies/)) return { section: "flowers", sub: "posies" };
    return { section: "flowers", sub: "hand-tied" };
  }

  // 4. Never filed. Read the name first, and the copy only where the
  //    name alone is not enough.
  if (n(/workshop/)) return { section: "gifts", sub: "workshops" };
  if (n(/balloon/)) return { section: "gifts", sub: "balloons" };
  if (n(/\bteddy\b|teddies|\bbear\b|fairies|\bfairy\b/))
    return { section: "gifts", sub: "soft-toys" };
  if (n(/voucher|greetings card|\bcard\b/)) return { section: "gifts", sub: "cards" };
  if (n(/prosecco|champagne|\bwine\b/)) return { section: "gifts", sub: "champagne" };
  if (n(/chocolate/)) return { section: "gifts", sub: "chocolates" };
  if (n(/hamper|gift set|gorgeous gifts/))
    return { section: "gifts", sub: "hampers" };
  if (n(/hanging ivy|\blavender\b|rosemary|\bplanted\b|\bplant\b/))
    return { section: "gifts", sub: "plants" };

  // A baby spray is an infant's funeral tribute, not a bouquet. Worth a
  // line of its own: getting it wrong puts it on a birthday shelf. The
  // copy is read here as well as the name, because "for placing on the
  // coffin at the end of the service" is the only thing that marks a
  // product called "Single Red Rose" as a tribute.
  if (m(/casket|coffin|\btribute\b|baby spray|\bspray\b/))
    return { section: "sympathy", sub: "sprays" };

  if (m(/hat ?box|gift box/)) return { section: "flowers", sub: "hatboxes" };
  if (m(/\bvase\b|arrangement|basket|aqua ?pack/))
    return { section: "flowers", sub: "vases" };
  if (m(/\bposy\b|posies/)) return { section: "flowers", sub: "posies" };

  // Nothing above recognised it, and it costs less than a bunch of
  // tulips. There is no three pound bouquet in a florist's catalogue, so
  // this is a gift - which is where their one product called simply
  // "Christmas", a three pound gonk on a sledge, belongs.
  const low = Math.min(
    ...(p.tiers ?? []).map((x) => x.price).filter((x) => x > 0),
  );
  if (Number.isFinite(low) && low < 15) return { section: "gifts", sub: "hampers" };

  if (m(/bouquet|hand ?tied|hand ?tie|\bdozen\b|\brose\b|\bmum\b|mother|christmas/))
    return { section: "flowers", sub: "hand-tied" };

  return null;
}

export function place(p: Readable): Placed {
  return classify(p) ?? FALLBACK;
}

/** The collections a product appears in, on top of its one home. */
export function tagsFor(p: Readable): TagId[] {
  const cat = new Set(p.cats);
  const t = `${p.name} ${p.desc}`.toLowerCase();
  const out: TagId[] = [];

  if (/valentine/.test(t)) out.push("valentines");
  if (/mother|\bmum\b/.test(t)) out.push("mothers-day");
  if (/christmas|festive/.test(t)) out.push("christmas");
  if (cat.has("Romance") || /\bromance\b|romantic/.test(t)) out.push("romance");
  if (cat.has("Eco friendly")) out.push("eco");
  // Their own words, on their own products.
  if (/only available in our local delivery area/i.test(p.note ?? "")) out.push("local");

  return out;
}
