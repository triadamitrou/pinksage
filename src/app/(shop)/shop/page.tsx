import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";
import { delivery, shop } from "@/lib/shop";
import {
  CATALOGUE,
  LIVE_TAGS,
  SECTIONS,
  SECTION_COUNTS,
  inSub,
  spread,
} from "@/lib/shopdata";

/**
 * The home page.
 *
 * The live one opens with 38 products in a single unbroken grid, from a
 * £29.99 hamper to a £500 bouquet, with no heading between any of them.
 * It asks a visitor to scan a wall and work out for themselves what kind
 * of shop this is.
 *
 * This one answers three questions first - what kind of thing are you
 * here for, can it get there in time, and how much - and only then shows
 * flowers. The four doors are the four sections; underneath, one row per
 * shelf, each row a handful spread across its own price range rather
 * than taken off the top, so no row opens with the cheapest thing on it.
 */

export const metadata = {
  title: "Pink Sage Flowers, Stratford-upon-Avon",
  description:
    "Florist on Rother Street. Hand tied bouquets, funeral tributes and gifts, delivered across Stratford-upon-Avon and 12 miles around it.",
};

/** The rows under the doors, in the order the shop sells them. */
const ROWS: { section: (typeof SECTIONS)[number]["id"]; sub: string }[] = [
  { section: "flowers", sub: "hand-tied" },
  { section: "sympathy", sub: "sprays" },
  { section: "flowers", sub: "roses" },
  { section: "flowers", sub: "vases" },
  { section: "sympathy", sub: "wreaths" },
  { section: "gifts", sub: "champagne" },
];

export default function ShopHome() {
  const hero = CATALOGUE.find((p) => p.slug === "red-rose-hand-tied-bouquet") ??
    CATALOGUE.find((p) => p.img && p.from >= 60) ??
    CATALOGUE[0];

  return (
    <>
      {/* The window ------------------------------------------------- */}
      <section className="s-wrap grid items-center gap-9 pt-10 pb-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-16">
        <div>
          <p className="s-eyebrow">Florist · {shop.address}, {shop.town}</p>
          <h1 className="s-display mt-3">
            Flowers made this morning,
            <br />
            at your door this afternoon.
          </h1>
          <p className="text-ink-2 mt-4 max-w-[48ch] text-[1.08rem] leading-relaxed">
            Everything is hand tied in the shop on Rother Street. Order before{" "}
            {delivery.cutoff} and it goes out today, free within{" "}
            {delivery.freeWithin}, and anywhere within {delivery.radius} of
            Stratford-upon-Avon.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/shop/flowers" className="s-btn s-btn--go">
              Send flowers
            </Link>
            <Link href="/shop/sympathy" className="s-btn">
              Funeral tributes
            </Link>
          </div>

          <p className="text-ink-3 mt-5 text-[0.85rem]">
            Prefer to talk it through?{" "}
            <a
              href={`tel:${shop.phone.replace(/\s/g, "")}`}
              className="text-sage-deep font-semibold hover:underline"
            >
              {shop.phone}
            </a>
          </p>
        </div>

        {hero?.img && (
          <Link href={`/shop/p/${hero.slug}`} className="s-frame !aspect-[5/4.4]">
            <Image
              src={hero.img}
              alt={hero.name}
              width={760}
              height={670}
              sizes="(max-width: 1024px) 100vw, 38rem"
              priority
            />
          </Link>
        )}
      </section>

      {/* The four doors --------------------------------------------- */}
      <section className="border-line bg-sage-wash border-y">
        <div className="s-wrap grid gap-px py-0 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((s) => (
            <Link
              key={s.id}
              href={`/shop/${s.id}`}
              className="hover:bg-panel group px-1 py-7 transition-colors sm:px-5"
            >
              <p className="flex items-baseline gap-2">
                <span className="s-h3 group-hover:text-sage-deep">
                  {s.name}
                </span>
                {SECTION_COUNTS[s.id] > 0 && (
                  <span className="u-num text-ink-3 text-[0.78rem]">
                    {SECTION_COUNTS[s.id]}
                  </span>
                )}
              </p>
              <p className="text-ink-2 mt-1.5 text-[0.88rem] leading-relaxed">
                {s.blurb}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Occasions on at the moment ---------------------------------- */}
      {LIVE_TAGS.length > 0 && (
        <section className="s-wrap pt-12">
          <h2 className="u-label">Occasions</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {LIVE_TAGS.map((t) => (
              <li key={t.id}>
                <Link href={`/shop/occasions/${t.id}`} className="s-chip">
                  {t.name}
                  <span className="s-chip__n">{t.items.length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* A row per shelf -------------------------------------------- */}
      {ROWS.map(({ section, sub }) => {
        const items = inSub(section, sub);
        if (items.length === 0) return null;
        const show = spread(items, 5);
        const s = SECTIONS.find((x) => x.id === section)!;
        const shelf = s.subs.find((x) => x.id === sub)!;
        return (
          <section key={`${section}-${sub}`} className="s-wrap pt-12">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="s-h2">{shelf.name}</h2>
              <Link
                href={`/shop/${section}?sub=${sub}`}
                className="text-sage-deep text-[0.88rem] font-semibold hover:underline"
              >
                All {items.length} &rarr;
              </Link>
            </div>
            {shelf.note && (
              <p className="text-ink-2 mt-1 text-[0.95rem]">{shelf.note}</p>
            )}
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
              {show.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        );
      })}

      {/* The shop itself -------------------------------------------- */}
      <section className="s-wrap border-line mt-16 grid gap-8 border-t pt-10 sm:grid-cols-3">
        {[
          {
            h: "Made here",
            p: `Everything is made in the shop at ${shop.address}. Nothing is boxed up elsewhere and passed on.`,
          },
          {
            h: "Weddings and events",
            p: "Floristry, styling and event management, from one buttonhole to a full party. By appointment.",
            href: "/shop/weddings",
            link: "Enquire",
          },
          {
            h: "Come and see us",
            p: `Open ${delivery.window.replace("10am to 6pm, ", "")} on Rother Street. Video consultations if that is easier.`,
            href: "/shop/contact",
            link: "Find the shop",
          },
        ].map((c) => (
          <div key={c.h}>
            <h2 className="s-h3">{c.h}</h2>
            <p className="text-ink-2 mt-1.5 text-[0.95rem] leading-relaxed">
              {c.p}
            </p>
            {c.href && (
              <Link
                href={c.href}
                className="text-sage-deep mt-2 inline-block text-[0.88rem] font-semibold hover:underline"
              >
                {c.link} &rarr;
              </Link>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
