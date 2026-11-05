import Link from "next/link";
import { notFound } from "next/navigation";
import SectionBrowser from "@/components/shop/SectionBrowser";
import { shop } from "@/lib/shop";
import { SECTIONS, shelvesOf, type SectionId } from "@/lib/shopdata";
import Weddings from "./Weddings";

/**
 * One section, whole, on one page.
 *
 * Every shelf in it is visible at once with a count beside it, which is
 * the thing the live site's menu cannot do: there, a customer picks a
 * word out of a list of 22 and finds out afterwards whether anything is
 * behind it.
 */

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ section: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const s = SECTIONS.find((x) => x.id === section);
  if (!s) return {};
  return { title: s.name, description: s.blurb };
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const s = SECTIONS.find((x) => x.id === section);
  if (!s) notFound();

  const shelves = shelvesOf(s.id as SectionId);
  const total = shelves.reduce((n, x) => n + x.items.length, 0);

  return (
    <>
      <header className="s-wrap pt-10 pb-7 lg:pt-14">
        <p className="s-eyebrow">
          {total > 0 ? `${total} to choose from` : "By appointment"}
        </p>
        <h1 className="s-display mt-2">{s.name}</h1>
        <p className="text-ink-2 mt-3 max-w-[54ch] text-[1.05rem] leading-relaxed">
          {s.blurb}
        </p>

        {s.id === "sympathy" && (
          <div className="border-sage-pale bg-sage-wash mt-6 max-w-[62ch] rounded-lg border p-4">
            <h2 className="s-h3">Ordering a tribute</h2>
            <p className="text-ink-2 mt-1.5 text-[0.92rem] leading-relaxed">
              Tributes are made for a date and a time, so the funeral
              director&rsquo;s details and the service time matter more than
              anything on this page. Telephoning is usually quicker than
              ordering online, and lettering, ribbon colours and a card
              message can all be settled in the same call.
            </p>
            <a
              href={`tel:${shop.phone.replace(/\s/g, "")}`}
              className="s-btn s-btn--go mt-3"
            >
              Telephone {shop.phone}
            </a>
          </div>
        )}
      </header>

      {s.id === "weddings" ? (
        <Weddings />
      ) : shelves.length === 0 ? (
        <p className="s-wrap text-ink-2 py-16 text-center">
          Nothing is listed here at the moment.{" "}
          <Link href="/shop/flowers" className="text-sage-deep font-semibold underline">
            Browse the flowers instead
          </Link>
        </p>
      ) : (
        <SectionBrowser shelves={shelves} />
      )}
    </>
  );
}
