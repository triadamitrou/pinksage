import type { Metadata } from "next";
import Shell from "@/components/Shell";

/**
 * The back office. Everything in this group wears the dashboard's rail,
 * and the shop front in the sibling group does not - which is the whole
 * reason for the split. The paths are unchanged: a route group in
 * brackets never appears in a URL.
 */
export const metadata: Metadata = {
  title: {
    default: "Pink Sage Studio",
    template: "%s | Pink Sage Studio",
  },
  description:
    "The back office for pinksage.co.uk: products, prices, recipes, flower stock and what the shop front says is available.",
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
