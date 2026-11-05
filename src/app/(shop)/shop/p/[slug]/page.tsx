import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Buy from "@/components/shop/Buy";
import ProductCard from "@/components/shop/ProductCard";
import Stock from "@/components/shop/Stock";
import { delivery, shop } from "@/lib/shop";
import { SECTIONS, tagOf, subOf } from "@/lib/shelf";
import { BY_SLUG, CATALOGUE, alongside } from "@/lib/shopdata";

/**
 * One product.
 *
 * The copy, the price and the photograph are prerendered from the
 * catalogue, so the page is whole before any JavaScript runs. Two things
 * are not: what the florist's stock count makes of it, and the basket,
 * both of which belong to the browser.
 *
 * The section headed "What goes into it" is the part the live site
 * cannot do at all. Pink Sage names the flowers in their own prose -
 * "roses, lisianthus, spray carnations" - but nothing anywhere records
 * it as data, so nothing can count it. Here it is listed properly, and
 * once the florist has written the stem counts in the dashboard the same
 * list is what decides whether this page says "only two left".
 */

export function generateStaticParams() {
  return CATALOGUE.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = BY_SLUG.get(slug);
  if (!p) return {};
  return {
    title: p.name,
    description:
      p.desc.slice(0, 155) ||
      `${p.name}, ${p.price}, from Pink Sage Flowers in ${shop.town}.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = BY_SLUG.get(slug);
  if (!p) notFound();

  const section = SECTIONS.find((s) => s.id === p.section)!;
  const sub = subOf(p.section, p.sub);
  const more = alongside(p);
  const funeral = p.section === "sympathy";

  return (
    <article className="s-wrap pt-6 pb-4">
      <nav aria-label="Breadcrumb" className="text-ink-3 text-[0.82rem]">
        <Link href="/shop" className="hover:text-sage-deep">
          Shop
        </Link>
        <span className="px-1.5">/</span>
        <Link href={`/shop/${section.id}`} className="hover:text-sage-deep">
          {section.name}
        </Link>
        {sub && (
          <>
            <span className="px-1.5">/</span>
            <Link
              href={`/shop/${section.id}?sub=${sub.id}`}
              className="hover:text-sage-deep"
            >
              {sub.name}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_26rem] lg:gap-14">
        {/* The photograph ------------------------------------------- */}
        <div>
          <div className="s-frame !aspect-[4/4.6] lg:sticky lg:top-28">
            {p.img ? (
              <Image
                src={p.img}
                alt={p.name}
                width={640}
                height={800}
                sizes="(max-width: 1024px) 100vw, 46rem"
                priority
              />
            ) : (
              <span className="border-sage-pale text-sage-mid flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed p-8 text-center">
                <span className="s-h3">{p.name}</span>
                <span className="text-ink-3 text-[0.85rem]">
                  No photograph on file for this one yet
                </span>
              </span>
            )}
          </div>
        </div>

        {/* The decision --------------------------------------------- */}
        <div>
          {p.tags.length > 0 && (
            <ul className="mb-3 flex flex-wrap gap-1.5">
              {p.tags.map((t) => (
                <li key={t}>
                  <Link
                    href={`/shop/occasions/${t}`}
                    className="bg-sage-wash text-sage-deep hover:bg-sage-pale rounded-full px-2.5 py-1 text-[0.72rem] font-bold tracking-wide uppercase"
                  >
                    {tagOf(t)?.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <h1 className="s-display !text-[clamp(1.8rem,3.6vw,2.6rem)]">
            {p.name}
          </h1>

          <p className="mt-2 flex flex-wrap items-center gap-3">
            <span className="u-num text-[1.4rem] font-semibold">{p.price}</span>
            <Stock id={p.id} big />
          </p>

          {p.desc ? (
            <p className="text-ink-2 mt-4 leading-relaxed">{p.desc}</p>
          ) : (
            <p className="text-ink-3 mt-4 text-[0.95rem] leading-relaxed">
              There is no description on file for this one. Telephone the shop
              on {shop.phone} and they will describe it.
            </p>
          )}

          <Buy
            id={p.id}
            slug={p.slug}
            name={p.name}
            img={p.img}
            tiers={p.tiers}
            funeral={funeral}
          />

          {/* What goes into it ------------------------------------- */}
          {p.varieties.length > 0 && (
            <section className="border-line mt-8 border-t pt-6">
              <h2 className="s-h3">What goes into it</h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {p.varieties.map((v) => (
                  <li
                    key={v}
                    className="border-line bg-panel rounded-full border px-3 py-1 text-[0.85rem] capitalize"
                  >
                    {v === "foliage" ? "mixed foliage" : v}
                  </li>
                ))}
              </ul>
              <p className="text-ink-3 mt-2.5 text-[0.8rem] leading-relaxed">
                Read from Pink Sage&rsquo;s own description of this
                arrangement. Stem counts are not published anywhere, which is
                why nothing can yet say how many of these can be made from
                what is in the shop.
              </p>
            </section>
          )}

          {/* Their own substitution note, word for word ------------- */}
          {p.note && (
            <p className="border-sage-pale bg-sage-wash mt-6 rounded-md border-l-2 px-3.5 py-2.5 text-[0.85rem] leading-relaxed">
              {p.note}
            </p>
          )}

          {p.allergy && (
            <p className="text-ink-2 mt-3 text-[0.8rem] leading-relaxed">
              {p.allergy}
            </p>
          )}

          {/* Delivery, on the page rather than four clicks away ----- */}
          <section className="border-line mt-6 border-t pt-6">
            <h2 className="s-h3">Getting it there</h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[0.9rem]">
              <dt className="text-ink-3">Same day</dt>
              <dd>Ordered before {delivery.cutoff}, Monday to Saturday</dd>
              <dt className="text-ink-3">Delivered</dt>
              <dd>{delivery.window}</dd>
              <dt className="text-ink-3">Free</dt>
              <dd>Within {delivery.freeWithin} of the shop</dd>
              <dt className="text-ink-3">Collection</dt>
              <dd>From the shop, {delivery.collectFrom}</dd>
            </dl>
            <Link
              href="/shop/delivery"
              className="text-sage-deep mt-3 inline-block text-[0.88rem] font-semibold hover:underline"
            >
              Areas and charges &rarr;
            </Link>
          </section>
        </div>
      </div>

      {more.length > 0 && (
        <section className="border-line mt-16 border-t pt-9">
          <h2 className="s-h2">
            {funeral ? "Other tributes of this kind" : "Alongside this"}
          </h2>
          <p className="text-ink-2 mt-1 text-[0.92rem]">
            On the same shelf, nearest in price.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
            {more.map((x) => (
              <ProductCard key={x.id} p={x} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
