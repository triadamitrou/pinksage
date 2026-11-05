import Image from "next/image";
import Link from "next/link";
import type { ShopProduct } from "@/lib/shopdata";
import { tagOf } from "@/lib/shelf";
import Stock from "./Stock";

/**
 * One product, on a shelf.
 *
 * Deliberately four things and no more: a photograph that is allowed to
 * be the largest item on the card, the name, the price, and - only when
 * there is something to say - what the florist's own stock count makes
 * of it. No star ratings, no "best seller" flashes, no countdown: the
 * shop has never published any of that and inventing it in a mock up
 * would be the one thing in here they could not show a customer.
 */
export default function ProductCard({
  p,
  priority,
}: {
  p: ShopProduct;
  priority?: boolean;
}) {
  const local = p.tags.includes("local");

  return (
    <article className="s-card group">
      <Link href={`/shop/p/${p.slug}`} className="s-frame">
        {p.img ? (
          <Image
            src={p.img}
            alt={p.name}
            width={320}
            height={400}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
            priority={priority}
          />
        ) : (
          <NoPhoto name={p.name} />
        )}
        <span className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {p.tags
            .filter((t) => t !== "local" && t !== "romance")
            .slice(0, 1)
            .map((t) => (
              <span
                key={t}
                className="bg-panel/92 text-ink rounded-full px-2 py-0.5 text-[0.66rem] font-bold tracking-wide uppercase backdrop-blur-sm"
              >
                {tagOf(t)?.name}
              </span>
            ))}
        </span>
      </Link>

      <div className="mt-2.5">
        <h3 className="leading-snug">
          <Link
            href={`/shop/p/${p.slug}`}
            className="group-hover:text-sage-deep text-[0.95rem] font-semibold transition-colors"
          >
            {p.name}
          </Link>
        </h3>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="u-num text-[0.95rem] font-semibold">{p.price}</span>
          <Stock id={p.id} />
        </p>
        {local && (
          <p className="text-ink-3 mt-0.5 text-[0.72rem]">
            Local delivery only
          </p>
        )}
      </div>
    </article>
  );
}

/**
 * 17 of the 198 have no photograph on the live site. A grey box would
 * read as broken, so the card keeps its shape and says plainly that the
 * picture is the thing missing - which is also how it reaches the
 * florist's attention in the dashboard.
 */
function NoPhoto({ name }: { name: string }) {
  return (
    <span className="border-sage-pale flex h-full w-full flex-col items-center justify-center gap-1.5 border border-dashed p-4 text-center">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        <circle cx="13" cy="9" r="3.4" fill="var(--color-blush)" opacity="0.55" />
        <path
          d="M13 22v-9"
          stroke="var(--color-sage-mid)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M13 17c-2.6 0-4.6-1.6-4.6-1.6S10 13.6 13 15.4Z"
          fill="var(--color-sage-pale)"
        />
      </svg>
      <span className="text-sage-mid text-[0.7rem] leading-tight font-semibold">
        {name}
      </span>
      <span className="text-ink-3 text-[0.64rem]">Photograph to follow</span>
    </span>
  );
}
