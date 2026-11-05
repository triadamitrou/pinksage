import Link from "next/link";
import { delivery, shop } from "@/lib/shop";

/**
 * Delivery.
 *
 * Every figure, place name and sentence here is lifted from
 * pinksage.co.uk/delivery-info.htm as it stood on 5 November 2026. The
 * only change is the order: the cut off and the charge come first,
 * because those are the two things somebody actually came for, and on
 * the live page they sit below a paragraph of introduction.
 */
export const metadata = {
  title: "Delivery",
  description:
    "Same day flower delivery across Stratford-upon-Avon and 12 miles around it, on orders placed before 3pm.",
};

export default function Delivery() {
  return (
    <div className="s-wrap pt-10 pb-4 lg:pt-14">
      <h1 className="s-display">Delivery</h1>
      <p className="text-ink-2 mt-3 max-w-[56ch] text-[1.05rem] leading-relaxed">
        Every bouquet is made in the shop on {shop.address} and delivered by
        us across {shop.town} and the area within {delivery.radius}.
      </p>

      {/* The three facts that decide an order --------------------- */}
      <dl className="mt-8 grid gap-px sm:grid-cols-3">
        {[
          { t: "Same day", d: `Order before ${delivery.cutoff}, Monday to Saturday` },
          { t: "Delivered", d: delivery.window },
          { t: "Free", d: `Within ${delivery.freeWithin} of the shop` },
        ].map((x) => (
          <div key={x.t} className="border-sage-pale bg-sage-wash border p-5">
            <dt className="u-label">{x.t}</dt>
            <dd className="s-h3 mt-1.5">{x.d}</dd>
          </div>
        ))}
      </dl>

      <p className="text-ink-2 mt-4 max-w-[62ch] text-[0.92rem] leading-relaxed">
        Sunday: {delivery.sunday.toLowerCase()}. Collection from the shop,{" "}
        {delivery.collectFrom}. We aim to deliver as close as possible to a
        preferred time, though times cannot be guaranteed in a busy week.
      </p>

      {/* Charges ---------------------------------------------------- */}
      <section className="mt-12">
        <h2 className="s-h2">Charges</h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          {delivery.bands.map((b) => (
            <div key={b.band} className="border-line bg-panel rounded-lg border">
              <h3 className="border-line border-b px-4 py-3 text-[0.95rem] font-semibold">
                {b.band}
              </h3>
              <table className="w-full text-[0.92rem]">
                <tbody>
                  {b.rows.map((r) => (
                    <tr key={r.when} className="border-line-2 border-b last:border-0">
                      <td className="text-ink-2 px-4 py-2.5">{r.when}</td>
                      <td className="u-num px-4 py-2.5 text-right font-semibold">
                        {r.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      {/* Where ------------------------------------------------------ */}
      <section className="mt-12">
        <h2 className="s-h2">Where we deliver</h2>
        <p className="text-ink-2 mt-1.5 max-w-[56ch] text-[0.95rem]">
          {delivery.places.length} villages and towns around {shop.town}.
        </p>
        <ul className="text-ink-2 mt-5 columns-2 gap-x-8 text-[0.9rem] sm:columns-3 lg:columns-4">
          {delivery.places.map((place) => (
            <li key={place} className="break-inside-avoid py-0.5">
              {place}
            </li>
          ))}
        </ul>
        <p className="border-sage-pale bg-sage-wash mt-6 max-w-[62ch] rounded-md border-l-2 px-3.5 py-2.5 text-[0.9rem] leading-relaxed">
          {delivery.beyond} If you are not sure whether a postcode is covered,
          telephone the shop on {shop.phone} and we will confirm it.
        </p>
      </section>

      <p className="mt-10">
        <Link href="/shop/flowers" className="s-btn s-btn--go">
          Choose some flowers
        </Link>
      </p>
    </div>
  );
}
