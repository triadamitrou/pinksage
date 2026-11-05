import { shop } from "@/lib/shop";
import { inSub } from "@/lib/shopdata";
import ProductCard from "@/components/shop/ProductCard";

/**
 * Weddings, events and corporate work.
 *
 * No prices, because the shop publishes none for any of it, and a
 * made-up "from" figure would be the worst kind of invention: the number
 * a customer remembers. It is an enquiry page, which is what the live
 * site has too, and the three corporate products that DO carry a price
 * are shown underneath rather than hidden behind a different menu item.
 */
export default function Weddings() {
  const corporate = inSub("flowers", "corporate");

  return (
    <div className="s-wrap pb-6">
      <div className="grid gap-9 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 className="s-h2">How it works</h2>
          <ol className="mt-4 space-y-4">
            {[
              {
                t: "Tell us the date",
                d: "The venue, the date and roughly what you have in mind. A photograph of something you like is worth more than a paragraph.",
              },
              {
                t: "Come in, or meet on video",
                d: "Consultations are by appointment, in the shop on Rother Street or over video if that is easier.",
              },
              {
                t: "A quotation",
                d: "Written, itemised, and costed against what is actually in season on your date.",
              },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-4">
                <span className="bg-sage-wash text-sage-deep u-num flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.9rem] font-bold">
                  {i + 1}
                </span>
                <span>
                  <strong className="block">{s.t}</strong>
                  <span className="text-ink-2 text-[0.95rem] leading-relaxed">
                    {s.d}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={`mailto:${shop.email}?subject=Wedding%20and%20event%20enquiry`}
              className="s-btn s-btn--go"
            >
              Send an enquiry
            </a>
            <a
              href={`tel:${shop.phone.replace(/\s/g, "")}`}
              className="s-btn"
            >
              {shop.phone}
            </a>
          </div>
        </div>

        <aside className="border-line bg-panel rounded-lg border p-6">
          <h2 className="s-h3">What is covered</h2>
          <p className="text-ink-2 mt-2 text-[0.95rem] leading-relaxed">
            Floristry, event styling and event management together, from a
            single buttonhole through to a full-scale party. Consultations
            are by appointment, in person or over video.
          </p>
          <p className="text-ink-3 mt-4 text-[0.82rem] leading-relaxed">
            Pink Sage publishes no price list for wedding or event work, so
            none is shown here. Every quotation is written against the date
            and the flowers in season on it.
          </p>
        </aside>
      </div>

      {corporate.length > 0 && (
        <section className="border-line mt-12 border-t pt-9">
          <h2 className="s-h2">Corporate and venues</h2>
          <p className="text-ink-2 mt-1.5 max-w-[56ch] text-[0.95rem]">
            Contract work for offices, hotels and restaurants. These three
            carry a published price; everything else is quoted.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {corporate.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
