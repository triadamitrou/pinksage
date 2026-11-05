"use client";

import Link from "next/link";
import { useState } from "react";
import { availabilityOf } from "@/lib/availability";
import { money, useBasket } from "@/lib/basket";
import { shop } from "@/lib/shop";
import { useStudio } from "@/lib/store";
import type { Tier } from "@/lib/types";

/**
 * Picking a size and adding it.
 *
 * 86 of the 198 products come in more than one size and the live site
 * puts them in a dropdown, which hides the prices until you open it and
 * forgets which one you were looking at. They are buttons here, with the
 * price on the face of each, because choosing between £45 and £69 IS the
 * decision and it should not need a click to see it.
 *
 * A funeral tribute offers the telephone first and the basket second. A
 * tribute has a service time, a name to be spelt and often a funeral
 * director to deliver to, none of which fits in a basket, and the shop
 * would rather take that call.
 */
export default function Buy({
  id,
  slug,
  name,
  img,
  tiers,
  funeral,
}: {
  id: string;
  slug: string;
  name: string;
  img: string | null;
  tiers: Tier[];
  funeral?: boolean;
}) {
  const priced = tiers.filter((t) => t.price > 0);
  const [pick, setPick] = useState(0);
  const [added, setAdded] = useState(false);
  const { add } = useBasket();
  const { products, stock, ready } = useStudio();

  const tier = priced[pick] ?? priced[0];
  const soldOut =
    ready &&
    (() => {
      const p = products.find((x) => x.id === id);
      return p ? availabilityOf(p, stock).state === "out" : false;
    })();

  /**
   * The telephone. It leads on a funeral tribute and follows everywhere
   * else, and it only spells out the word when it is the main thing on
   * offer - as a second button the number alone fits on one line, and a
   * button that wraps reads as broken.
   */
  const phone = (lead: boolean) => (
    <a
      href={`tel:${shop.phone.replace(/\s/g, "")}`}
      className={`s-btn ${lead ? "s-btn--go flex-1" : ""}`}
    >
      {lead ? `Telephone ${shop.phone}` : shop.phone}
    </a>
  );

  if (!tier) {
    return (
      <div className="mt-6">
        <p className="text-ink-2 text-[0.95rem] leading-relaxed">
          This one is quoted rather than priced on the website.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">{phone(true)}</div>
      </div>
    );
  }

  return (
    <div className="mt-7">
      {priced.length > 1 && (
        <fieldset>
          <legend className="u-label">Size</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {priced.map((t, i) => (
              <button
                key={t.label + i}
                type="button"
                aria-pressed={i === pick}
                onClick={() => {
                  setPick(i);
                  setAdded(false);
                }}
                className={`flex min-w-28 flex-col items-start rounded-lg border px-3.5 py-2 text-left transition-colors ${
                  i === pick
                    ? "border-sage-deep bg-sage-wash"
                    : "border-line bg-panel hover:border-sage-pale"
                }`}
              >
                <span className="text-[0.85rem] font-semibold">{t.label}</span>
                <span className="u-num text-ink-2 text-[0.95rem]">
                  {money(t.price)}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {soldOut && (
        <p className="border-blush bg-blush-wash text-blush mt-4 rounded-md border-l-2 px-3.5 py-2.5 text-[0.88rem] leading-relaxed">
          Sold out for today, going by what is in the shop this morning. The
          shop can often still make something close to it, so it is worth a
          telephone call.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {funeral && phone(true)}
        <button
          type="button"
          disabled={soldOut}
          className={`s-btn flex-1 ${funeral ? "" : "s-btn--go"}`}
          onClick={() => {
            add({ id, slug, name, img, tier: tier.label, price: tier.price });
            setAdded(true);
          }}
        >
          {added ? "Added" : `Add to basket · ${money(tier.price)}`}
        </button>
        {!funeral && phone(false)}
      </div>

      {added && (
        <p className="mt-2.5 text-[0.88rem]">
          <Link href="/shop/basket" className="text-sage-deep font-semibold underline">
            Go to the basket &rarr;
          </Link>
        </p>
      )}
    </div>
  );
}
