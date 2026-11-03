/**
 * Pink Sage Flowers Ltd, 39-40 Rother Street, Stratford-upon-Avon.
 *
 * Everything here was read off what the business already publishes, on
 * 3 November 2026:
 *
 *   pinksage.co.uk - the Florist schema block in the page head gives the
 *     legal name, address, phone and email; the footer gives the second
 *     number and the VAT number; the page source names floristPro as
 *     the platform and "pink921" as their account on it.
 *   pinksage.co.uk/sitemap.xml - 198 live product pages and the
 *     category tree, scraped for the catalogue in catalogue.json.
 *
 * Nothing here is guessed. Anything the shop has not published is left
 * out rather than filled in.
 */
export const shop = {
  name: "Pink Sage",
  legal: "Pink Sage Flowers Ltd",
  address: "39-40 Rother Street",
  town: "Stratford-upon-Avon",
  county: "Warwickshire",
  postcode: "CV37 6LP",
  phone: "01789 292811",
  mobile: "07708 404150",
  email: "orders@pinksage.co.uk",
  vat: "505 0638 20",
  site: "https://www.pinksage.co.uk",
} as const;

/**
 * The systems this sits between. The brief is explicit that none of them
 * are being replaced: Strelitzia stays the order book, Interflora stays
 * the relay network, and the shop front stays where it is unless it
 * cannot carry what is needed.
 *
 * Every one of these is shown as "not connected" throughout. This is a
 * mock up of the back office, not a live integration, and a green light
 * next to a system nobody has wired up would be a lie.
 */
export const systems = [
  {
    id: "strelitzia",
    name: "Strelitzia",
    role: "Orders, deliveries, the shop floor",
    note: "Stays the order book. This dashboard reads stock out and writes nothing back.",
  },
  {
    id: "interflora",
    name: "Interflora",
    role: "Relay orders in and out",
    note: "Unchanged. Relay products are marked so they are never stock-counted.",
  },
  {
    id: "floristpro",
    name: "floristPro",
    role: "The shop front at pinksage.co.uk",
    note: "Publishing target. Prices, copy, photographs and availability go out to it.",
  },
] as const;

/** Where the catalogue in this mock up came from, shown on the page. */
export const provenance = {
  read: "3 November 2026",
  source: "pinksage.co.uk",
  products: 198,
};
