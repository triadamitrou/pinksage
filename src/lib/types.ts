/** The shapes the whole dashboard works in. */

export type Tier = { label: string; price: number };

/** One line of a recipe: so many stems of one variety. */
export type Ingredient = { variety: string; stems: number };

export type Status = "live" | "draft" | "off";

export type Product = {
  id: string;
  name: string;
  slug: string;
  desc: string;
  /** The shop's own substitution note, kept verbatim where they wrote one. */
  note: string;
  cats: string[];
  tiers: Tier[];
  img: string | null;
  /**
   * The varieties their own product copy names, with no stem counts:
   * the counts are the thing nobody has written down anywhere, which is
   * the whole reason this dashboard exists.
   */
  varieties: string[];
  /** Set by the florist. Empty until somebody fills it in. */
  recipe: Ingredient[];
  status: Status;
  /**
   * "stems" works availability out from the flower buckets. "manual" is
   * a number the florist types. "always" never runs out - a card, a box
   * of chocolates, a relay product made up in somebody else's shop.
   */
  stockMode: "stems" | "manual" | "always";
  manualStock: number;
  /** Below this, the shop front says limited rather than available. */
  lowAt: number;
};

export type Variety = {
  id: string;
  name: string;
  /** Stems in the bucket right now. */
  stems: number;
  /** What a stem costs in, for the margin column. Zero means not set. */
  cost: number;
  /**
   * Which weekdays this variety comes in on, 0 for Sunday through 6 for
   * Saturday. Structured rather than free text because the report has to
   * work out how many days a bucket has to last.
   */
  days: number[];
};

export type Availability = {
  /** How many of this product can be made. Null when it cannot be worked out. */
  count: number | null;
  state: "available" | "limited" | "out" | "unknown" | "always";
  /** The variety that runs out first, for the "short of" column. */
  limiting: string | null;
};
