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

/**
 * Opening hours, exactly as pinksage.co.uk/contact-us.htm publishes them,
 * read on 5 November 2026. Indexed 0 for Sunday, to match Date.getDay.
 */
export type Hours = { open: string; close: string } | null;
export const hours: Hours[] = [
  null,
  { open: "09:00", close: "17:00" },
  { open: "09:00", close: "17:00" },
  { open: "09:00", close: "17:00" },
  { open: "09:00", close: "17:00" },
  { open: "09:00", close: "17:30" },
  { open: "09:00", close: "17:30" },
];

/**
 * Delivery, from pinksage.co.uk/delivery-info.htm, read 5 November 2026.
 *
 * The same-day cut off is the single most useful thing on that page and
 * on the live site it is four clicks from the home page, below a table.
 * Here it goes in the header.
 */
export const delivery = {
  cutoff: "3pm",
  window: "10am to 6pm, Monday to Saturday",
  radius: "12 miles",
  freeWithin: "1 mile",
  sunday: "By arrangement, ordered in advance",
  collectFrom: "10am to 5pm",
  bands: [
    {
      band: "Within 5 miles of CV37 6LP",
      rows: [
        { when: "Next or future day", price: "£7.50" },
        { when: "Same day, before noon", price: "£10" },
        { when: "Same day, any time", price: "£7.50" },
        { when: "Sunday, by arrangement", price: "£10" },
      ],
    },
    {
      band: "Between 5 and 10 miles of CV37 6LP",
      rows: [
        { when: "Next or future day", price: "£10" },
        { when: "Same day, before noon", price: "£15" },
        { when: "Same day, any time", price: "£10" },
        { when: "Sunday, by arrangement", price: "£10" },
      ],
    },
  ],
  /** Their own list, in their own order. */
  places: `Admington; Alcester; Alderminster; Alveston; Armscote; Arrow; Aston Cantlow; Atherstone on Stour; Bearley; Bidford on Avon; Billesley; Binton; Bishopton; Black Hill; Braggington; Bridgetown; Broom; Charlecote; Claverdon; Cleeve Prior; Clifford Chambers; Compton Verney; Coughton; Dodwell; Dorsington; Ettington; Great Alne; Halford; Hampton Lucy; Henley in Arden; Ilmington; Langley; Long Marston; Loxley; Luddington; Mickleton; Milcote; Newbold on Stour; Norton Lindsey; Old Town; Pathlow; Pebworth; Preston Bagot; Preston on Stour; Quinton; Salford Priors; Shottery; Snitterfield; Stratford upon Avon; Temple Grafton; Tiddington; Upper Billesley; Ullenhall; Walton; Wasperton; Welford on Avon; Wellesbourne; Weston on Avon; Wilmcote; Wixford; Wolverton; Wootton Wawen`
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean),
  beyond:
    "Deliveries outside these areas are sent through one of our partner networks, Interflora or D2Florist.",
} as const;
