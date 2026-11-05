"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useBasket } from "@/lib/basket";
import { DAY_LONG, atMinute, useClock } from "@/lib/days";
import { delivery, hours, shop } from "@/lib/shop";
import { SECTIONS, SECTION_COUNTS } from "@/lib/shopdata";
import Mark from "./Mark";

/**
 * The frame around the shop front.
 *
 * The live site's header is a dark bar carrying six menu items and two
 * telephone numbers, and nothing at all about delivery. The one fact
 * that decides most orders - flowers ordered before 3pm arrive today -
 * sits four clicks away at the bottom of a table. So it goes at the very
 * top here, next to whether the shop is open at this moment, which is
 * worked out in the browser from the hours they publish.
 */

const LINKS = [
  ...SECTIONS.map((s) => ({
    href: `/shop/${s.id}`,
    label: s.short,
    count: SECTION_COUNTS[s.id],
  })),
  { href: "/shop/delivery", label: "Delivery", count: 0 },
  { href: "/shop/contact", label: "Visit us", count: 0 },
];

export default function Chrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="shopfront flex min-h-dvh flex-col">
      <a
        href="#main"
        className="s-btn sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to the flowers
      </a>

      <p className="s-mock px-4 py-1.5 text-center">
        A mock up of pinksage.co.uk, built from their own 198 products. Nothing
        here takes an order or a payment.{" "}
        <Link href="/" className="font-semibold underline underline-offset-2">
          The florist&rsquo;s dashboard
        </Link>
      </p>

      <OpenNow />

      <header className="border-line bg-panel sticky top-0 z-30 border-b">
        <div className="s-wrap s-bar flex items-center gap-3">
          <Link href="/shop" className="mr-auto flex items-center gap-2.5">
            <Mark size={34} />
            <span className="leading-none">
              <span className="s-h3 block">Pink Sage</span>
              {/* Hidden on a narrow screen: wrapped onto two lines it
                  pushes the header past the fixed height the filter bar
                  below sticks to. */}
              <span className="text-ink-3 hidden text-[0.66rem] tracking-[0.18em] whitespace-nowrap uppercase sm:block">
                Stratford-upon-Avon
              </span>
            </span>
          </Link>

          <nav aria-label="Shop" className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => {
              const on = path === l.href || path.startsWith(`${l.href}/`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={on ? "page" : undefined}
                  className={`rounded-full px-3.5 py-2 text-[0.9rem] font-semibold transition-colors ${
                    on
                      ? "bg-sage-wash text-sage-deep"
                      : "text-ink-2 hover:bg-sage-wash hover:text-sage-deep"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <a
            href={`tel:${shop.phone.replace(/\s/g, "")}`}
            className="s-btn hidden !min-h-10 sm:inline-flex"
          >
            {shop.phone}
          </a>

          <BasketButton />

          <button
            type="button"
            className="s-btn !min-h-10 !px-3.5 lg:hidden"
            aria-expanded={open}
            aria-controls="shop-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>

        {open && (
          <nav
            id="shop-nav"
            aria-label="Shop"
            className="border-line s-wrap border-t py-3 lg:hidden"
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-line-2 flex items-baseline justify-between gap-3 border-b py-3 text-[1.05rem] font-semibold last:border-0"
              >
                {l.label}
                {l.count > 0 && (
                  <span className="u-num text-ink-3 text-[0.8rem] font-normal">
                    {l.count}
                  </span>
                )}
              </Link>
            ))}
            <a
              href={`tel:${shop.phone.replace(/\s/g, "")}`}
              className="s-btn s-btn--go mt-3 w-full"
            >
              Telephone {shop.phone}
            </a>
          </nav>
        )}
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
}

/**
 * Open or closed, right now, from the hours the shop publishes.
 *
 * Read in the browser and never on the server: these pages are
 * prerendered, so a day baked into the HTML would be whichever day the
 * build ran, and a shop front confidently announcing the wrong opening
 * time is worse than one that says nothing. It renders the delivery line
 * alone until the browser has told it the time.
 */
function OpenNow() {
  const clock = useClock();

  let state: string | null = null;
  if (clock) {
    const h = hours[clock.day];
    if (!h) state = "Closed today";
    else
      state =
        clock.minutes < atMinute(h.open)
          ? `Opens at ${h.open}`
          : clock.minutes < atMinute(h.close)
            ? `Open until ${h.close}`
            : "Closed now";
  }

  return (
    <div className="bg-sage-deep text-[0.78rem] text-white/90">
      <div className="s-wrap flex flex-wrap items-center justify-center gap-x-5 gap-y-1 py-1.5 text-center">
        <span>
          <strong className="font-semibold text-white">Same day delivery</strong>{" "}
          on orders placed before {delivery.cutoff}
        </span>
        <span className="hidden sm:inline" aria-hidden>
          ·
        </span>
        <span>Free within {delivery.freeWithin} of the shop</span>
        {clock && state && (
          <>
            <span className="hidden sm:inline" aria-hidden>
              ·
            </span>
            <span>
              {DAY_LONG[clock.day]}: {state}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function BasketButton() {
  const { count, ready } = useBasket();
  return (
    <Link href="/shop/basket" className="s-btn !min-h-10 !px-3.5">
      Basket
      {ready && count > 0 && (
        <span className="bg-blush u-num inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.72rem] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="border-line bg-sage-wash mt-20 border-t">
      <div className="s-wrap grid gap-9 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Mark size={34} />
          <p className="s-h3 mt-3">{shop.legal}</p>
          <p className="text-ink-2 mt-1.5 text-[0.88rem] leading-relaxed">
            {shop.address}
            <br />
            {shop.town}
            <br />
            {shop.county} {shop.postcode}
          </p>
          <p className="mt-3 text-[0.88rem]">
            <a className="hover:text-sage-deep block font-semibold" href={`tel:${shop.phone.replace(/\s/g, "")}`}>
              {shop.phone}
            </a>
            <a className="hover:text-sage-deep block" href={`mailto:${shop.email}`}>
              {shop.email}
            </a>
          </p>
        </div>

        <div>
          <h2 className="u-label">Shop</h2>
          <ul className="mt-3 space-y-2 text-[0.88rem]">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <Link href={`/shop/${s.id}`} className="hover:text-sage-deep">
                  {s.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/shop/flowers?sub=corporate" className="hover:text-sage-deep">
                Corporate and venues
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="u-label">Opening hours</h2>
          <ul className="u-num mt-3 space-y-1 text-[0.85rem]">
            {hours.map((h, d) => (
              <li key={d} className="flex justify-between gap-3">
                <span className="text-ink-2">{DAY_LONG[d].slice(0, 3)}</span>
                <span>{h ? `${h.open} – ${h.close}` : "Closed"}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="u-label">Delivery</h2>
          <p className="text-ink-2 mt-3 text-[0.88rem] leading-relaxed">
            {delivery.window}. Same day on orders before {delivery.cutoff}.
            Across {shop.town} and {delivery.radius} around it.
          </p>
          <Link href="/shop/delivery" className="s-btn mt-3 !min-h-10">
            Areas and charges
          </Link>
        </div>
      </div>

      <div className="border-line border-t">
        <p className="s-wrap text-ink-3 py-4 text-[0.76rem]">
          VAT {shop.vat}. A mock up built for Pink Sage from their own
          published catalogue, read on 3 November 2026. Not a live shop.
        </p>
      </div>
    </footer>
  );
}
