import Chrome from "@/components/shop/Chrome";

/**
 * The shop front. Everything in this group wears the customer-facing
 * chrome and none of the dashboard's rail. The paths are unchanged: a
 * route group in brackets never appears in a URL.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <Chrome>{children}</Chrome>;
}
