import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Shell from "@/components/Shell";
import { StudioProvider } from "@/lib/store";

/**
 * Libre Baskerville and Open Sans are the two faces pinksage.co.uk
 * already loads, so the back office reads in the same voice as the shop
 * front it publishes to. Both are self-hosted: next/font/google is
 * unreliable offline, and this has to open on a shop laptop.
 */
const baskerville = localFont({
  variable: "--font-baskerville",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
  src: [{ path: "./fonts/LibreBaskerville-latin.woff2", weight: "400", style: "normal" }],
});

const opensans = localFont({
  variable: "--font-opensans",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
  src: [{ path: "./fonts/OpenSans-latin.woff2", weight: "300 700", style: "normal" }],
});

export const metadata: Metadata = {
  title: {
    default: "Pink Sage Studio",
    template: "%s | Pink Sage Studio",
  },
  description:
    "The back office for pinksage.co.uk: products, prices, recipes, flower stock and what the shop front says is available.",
  // A private tool, and a mock up besides. It has no business in search.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${baskerville.variable} ${opensans.variable}`}>
      <body>
        <StudioProvider>
          <Shell>{children}</Shell>
        </StudioProvider>
      </body>
    </html>
  );
}
