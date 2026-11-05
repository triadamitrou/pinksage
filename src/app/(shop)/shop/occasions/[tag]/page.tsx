import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/shop/ProductCard";
import { TAGS, SECTIONS } from "@/lib/shelf";
import { LIVE_TAGS, withTag, type TagId } from "@/lib/shopdata";

/**
 * A collection.
 *
 * The one thing a single shelf per product cannot do. A Mother's Day
 * hatbox belongs with the other hatboxes, where somebody looking for a
 * hatbox will find it - and also here, where somebody looking for their
 * mother will. Filing it under one or the other is what produced 22 flat
 * categories in the first place.
 *
 * Collections are read off the shop's own words: a product is in the
 * Valentine's collection because Pink Sage wrote Valentine's in its name
 * or its description, not because anybody decided it was romantic.
 */

export function generateStaticParams() {
  return TAGS.map((t) => ({ tag: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const t = TAGS.find((x) => x.id === tag);
  return t ? { title: t.name, description: t.note || undefined } : {};
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const t = TAGS.find((x) => x.id === tag);
  if (!t) notFound();

  const items = withTag(t.id as TagId);

  /** Grouped by where each one actually lives, so the shelf is never lost. */
  const groups = SECTIONS.map((s) => ({
    section: s,
    items: items.filter((p) => p.section === s.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="s-wrap pt-10 pb-4 lg:pt-14">
      <p className="s-eyebrow">
        {items.length} {items.length === 1 ? "product" : "products"}
      </p>
      <h1 className="s-display mt-2">{t.name}</h1>
      {t.note && (
        <p className="text-ink-2 mt-3 max-w-[54ch] text-[1.05rem]">{t.note}</p>
      )}

      {items.length === 0 ? (
        <p className="text-ink-2 py-16">
          Nothing is in this collection at the moment.{" "}
          <Link href="/shop/flowers" className="text-sage-deep font-semibold underline">
            Browse the flowers
          </Link>
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.section.id} className="mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="s-h2">{g.section.name}</h2>
              <Link
                href={`/shop/${g.section.id}`}
                className="text-sage-deep text-[0.88rem] font-semibold hover:underline"
              >
                All {g.section.name.toLowerCase()} &rarr;
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {g.items.map((p, i) => (
                <ProductCard key={p.id} p={p} priority={i < 5} />
              ))}
            </div>
          </section>
        ))
      )}

      <nav className="border-line mt-14 border-t pt-7">
        <h2 className="u-label">Other occasions</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {LIVE_TAGS.filter((x) => x.id !== t.id).map((x) => (
            <li key={x.id}>
              <Link href={`/shop/occasions/${x.id}`} className="s-chip">
                {x.name}
                <span className="s-chip__n">{x.items.length}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
