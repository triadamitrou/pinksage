"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useStudio } from "@/lib/store";
import { shop } from "@/lib/shop";

const NAV = [
  { href: "/", label: "Today", hint: "What needs doing" },
  { href: "/products", label: "Products", hint: "The sheet" },
  { href: "/new", label: "Set up a product", hint: "Name it, price it, write its recipe" },
  { href: "/flowers", label: "Flower stock", hint: "What is in the buckets" },
  { href: "/report", label: "The fortnight", hint: "Deliveries, and what is at risk" },
  { href: "/sheet", label: "Spreadsheet", hint: "Excel in and out" },
  { href: "/publish", label: "Publish", hint: "Send it to the website" },
];

/**
 * The frame: a rail on the left, the work on the right, and a count of
 * unpublished changes that follows the florist around so the one thing
 * that must not be forgotten cannot be.
 */
export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { dirty, ready } = useStudio();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <a
        href="#work"
        className="u-btn sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to the work
      </a>

      {/* Phone: a bar. Desktop: a rail. */}
      <header className="border-line bg-panel sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-2.5 lg:hidden">
        <Wordmark />
        <div className="flex items-center gap-2">
          <DirtyBadge count={dirty.size} ready={ready} />
          <button
            type="button"
            className="u-btn"
            aria-expanded={open}
            aria-controls="rail-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      <nav
        id="rail-nav"
        aria-label="Sections"
        className={`border-line bg-panel shrink-0 border-b lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:border-r lg:border-b-0 ${
          open ? "block" : "hidden lg:block"
        }`}
      >
        <div className="hidden px-5 pt-5 pb-4 lg:block">
          <Wordmark />
        </div>

        <ul className="p-3 lg:px-3 lg:py-0">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? path === "/" : path.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`mb-0.5 flex items-baseline justify-between gap-2 rounded-md px-3 py-2 transition-colors ${
                    active
                      ? "bg-sage-wash text-sage-deep font-semibold"
                      : "text-ink-2 hover:bg-line-2"
                  }`}
                >
                  <span className="text-[0.88rem]">{item.label}</span>
                  {item.href === "/publish" && (
                    <DirtyBadge count={dirty.size} ready={ready} small />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="text-ink-3 mt-auto hidden px-6 pt-6 text-[0.7rem] leading-relaxed lg:block">
          <p>{shop.legal}</p>
          <p>
            {shop.address}, {shop.town}
          </p>
          <p className="mt-3">
            Mock up. Nothing here reaches the live site.
          </p>
        </div>
      </nav>

      <main id="work" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      {/* A sage leaf with a blush bud: the two halves of the shop's own
          name, drawn once and used as the mark, since the live site
          carries the platform's stock logo rather than one of theirs. */}
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        <path
          d="M13 24C13 24 4 20.5 4 13.2 4 7.6 8.2 3 13 3s9 4.6 9 10.2C22 20.5 13 24 13 24Z"
          fill="var(--color-sage-wash)"
          stroke="var(--color-sage-mid)"
          strokeWidth="1.3"
        />
        <path
          d="M13 21V8"
          stroke="var(--color-sage-mid)"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <circle cx="13" cy="8" r="3.1" fill="var(--color-blush)" />
      </svg>
      <span className="u-serif text-[1.05rem] leading-none">
        Pink Sage <span className="text-ink-3">Studio</span>
      </span>
    </Link>
  );
}

function DirtyBadge({
  count,
  ready,
  small,
}: {
  count: number;
  ready: boolean;
  small?: boolean;
}) {
  if (!ready || count === 0) return null;
  return (
    <span
      className={`u-pill u-pill--out u-num ${small ? "" : "px-2.5"}`}
      title={`${count} products changed since the last publish`}
    >
      {count}
      {small ? "" : " to publish"}
    </span>
  );
}
