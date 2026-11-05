/**
 * The basket page is a client component, so it cannot export metadata
 * of its own. This gives it a title.
 */
export const metadata = { title: "Basket" };

export default function BasketLayout({ children }: { children: React.ReactNode }) {
  return children;
}
