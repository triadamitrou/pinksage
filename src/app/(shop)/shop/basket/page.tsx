"use client";

import Image from "next/image";
import Link from "next/link";
import { money, useBasket } from "@/lib/basket";
import { delivery, shop } from "@/lib/shop";

/**
 * The basket.
 *
 * It goes as far as a basket honestly can in a mock up and then stops,
 * at the exact line where a real shop front hands over to a payment
 * provider. That line is the open question in this whole project - does
 * floristPro take product and availability data from outside, or does
 * the shop front move - so the page names it rather than papering over
 * it with a fake checkout.
 *
 * Delivery is deliberately not added up. The charge depends on the
 * distance and the day, both of which are chosen at a checkout that does
 * not exist here, and a total that quietly guessed one would be the one
 * number in this mock up a customer could be shown and misled by.
 */
export default function Basket() {
  const { ready, lines, count, total, setQty, clear } = useBasket();

  if (!ready) {
    return (
      <div className="s-wrap py-16">
        <h1 className="s-display">Basket</h1>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="s-wrap py-16 text-center">
        <h1 className="s-display">Nothing in the basket</h1>
        <p className="text-ink-2 mt-3">
          Flowers made this morning are still available for this afternoon.
        </p>
        <p className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/shop/flowers" className="s-btn s-btn--go">
            Send flowers
          </Link>
          <Link href="/shop/sympathy" className="s-btn">
            Funeral tributes
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="s-wrap pt-10 pb-4 lg:pt-14">
      <h1 className="s-display">Basket</h1>
      <p className="text-ink-2 mt-2">
        {count} {count === 1 ? "item" : "items"}
      </p>

      <div className="mt-8 grid gap-9 lg:grid-cols-[1fr_22rem]">
        <ul>
          {lines.map((l) => (
            <li
              key={l.key}
              className="border-line flex items-start gap-4 border-b py-4 first:border-t"
            >
              <Link
                href={`/shop/p/${l.slug}`}
                className="s-frame !aspect-square w-20 shrink-0"
              >
                {l.img && (
                  <Image src={l.img} alt={l.name} width={160} height={160} sizes="80px" />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/shop/p/${l.slug}`}
                  className="hover:text-sage-deep font-semibold"
                >
                  {l.name}
                </Link>
                <p className="text-ink-3 text-[0.85rem]">{l.tier}</p>
                <div className="mt-2 flex items-center gap-2">
                  <label className="u-label" htmlFor={`qty-${l.key}`}>
                    Qty
                  </label>
                  <input
                    id={`qty-${l.key}`}
                    type="number"
                    min={0}
                    value={l.qty}
                    onChange={(e) => setQty(l.key, Math.floor(Number(e.target.value) || 0))}
                    className="u-field u-num !h-9 !w-16 text-center"
                  />
                  <button
                    type="button"
                    className="u-btn u-btn--quiet !h-9"
                    onClick={() => setQty(l.key, 0)}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p className="u-num shrink-0 font-semibold">
                {money(l.price * l.qty)}
              </p>
            </li>
          ))}
        </ul>

        <aside className="border-line bg-panel h-fit rounded-lg border p-5 lg:sticky lg:top-28">
          <dl className="flex items-baseline justify-between gap-4">
            <dt className="s-h3">Flowers</dt>
            <dd className="u-num s-h3">{money(total)}</dd>
          </dl>
          <p className="text-ink-2 mt-2 text-[0.85rem] leading-relaxed">
            Delivery is added at checkout, from {delivery.bands[0].rows[0].price},
            and is free within {delivery.freeWithin} of the shop.
          </p>

          <div className="border-amber bg-amber-wash text-amber mt-5 rounded-md border-l-2 px-3.5 py-3 text-[0.85rem] leading-relaxed">
            <strong className="block font-bold">The checkout is not built</strong>
            This mock up stops here on purpose. Taking the payment, the
            delivery date and the card message is the one part that belongs to
            the shop front Pink Sage already pays for, and whether that stays
            floristPro or moves is the question still open.
          </div>

          <a
            href={`tel:${shop.phone.replace(/\s/g, "")}`}
            className="s-btn s-btn--go mt-4 w-full"
          >
            Order by telephone · {shop.phone}
          </a>
          <button type="button" className="s-btn mt-2 w-full" onClick={clear}>
            Empty the basket
          </button>
        </aside>
      </div>
    </div>
  );
}
