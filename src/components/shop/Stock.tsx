"use client";

import { availabilityOf } from "@/lib/availability";
import { useStudio } from "@/lib/store";

/**
 * What the florist's own flower counts make of this product.
 *
 * This is the join between the two halves of the project, and the whole
 * reason the dashboard is worth building: the shop front says "two left"
 * because somebody counted the roses, not because somebody remembered to
 * edit the website.
 *
 * It is quiet by design. A product that is simply available says nothing
 * at all - a row of green ticks is noise, and it is the exceptions that
 * change what a customer does. Four of the five states render nothing:
 *
 *   available  nothing. The normal case.
 *   always     nothing. Cards and chocolates never run out.
 *   unknown    nothing. No recipe has been written, so there is no
 *              number to show, and "sold out" would be a lie that costs
 *              them the order.
 *   limited    a count, in amber.
 *   out        sold out, and the product page offers the telephone.
 *
 * It reads the live stock rather than the last published catalogue,
 * because stock is not something anybody should have to remember to
 * publish.
 */
export default function Stock({ id, big }: { id: string; big?: boolean }) {
  const { products, stock, ready } = useStudio();
  if (!ready) return null;

  const p = products.find((x) => x.id === id);
  if (!p) return null;

  const a = availabilityOf(p, stock);
  if (a.state === "available" || a.state === "always" || a.state === "unknown") {
    return null;
  }

  const size = big ? "text-[0.85rem] px-2.5 py-1" : "text-[0.72rem] px-2 py-0.5";

  if (a.state === "out") {
    return (
      <span
        className={`bg-blush-wash text-blush rounded-full font-bold ${size}`}
      >
        Sold out today
      </span>
    );
  }

  return (
    <span className={`bg-amber-wash text-amber rounded-full font-bold ${size}`}>
      {a.count === 1 ? "Last one" : `Only ${a.count} left`}
    </span>
  );
}
