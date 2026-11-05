# Pink Sage Studio

A back office for [pinksage.co.uk](https://www.pinksage.co.uk): products,
prices, recipes, flower stock, and what the shop front says is available.

Built as a mock up. Nothing in it reaches a live system.

## The problem it answers

The current shop front has nowhere to record two things:

- **how many of a product exist**, and
- **which flowers, and how many stems, go into one.**

Without the second there is no way to work out the first, so every
product on the website is permanently "available" whatever is in the
buckets. This dashboard holds both, divides one into the other, and says
available, limited or sold out on its own.

## What is in it

| Page | What it is for |
| --- | --- |
| Today | The morning list: what cannot be made, what is nearly gone, what has never been measured, what is unpublished |
| Products | A spreadsheet of all 198 products. Arrow keys move, Enter edits, typing replaces. Ticking rows turns the toolbar into a bulk editor |
| Flower stock | Stems in each bucket, cost a stem, delivery days, and which products each variety is holding back |
| Spreadsheet | Download to Excel, edit, upload back. Matches on id, reports what it could not do |
| Publish | Field by field, old value beside new, before anything goes out |

## Where the data came from

`src/lib/catalogue.json` holds 198 products scraped from their own
sitemap and product pages on **3 November 2026**: real names, real
descriptions, real prices and real size tiers, with the product
photographs at 320px in `public/img/products`.

The flower varieties in `src/lib/catalogue.json` were read out of Pink
Sage's own product copy, so "Lisianthus" and "Germini" are in the list
because their descriptions say so.

**Nothing is invented.** Recipes and stem counts start empty, because the
shop has never published either. "Load example stock" on Today fills them
with made up numbers so the arithmetic can be seen working; every screen
that shows those numbers says they are examples, and Reset removes them.

## How the availability maths works

```
a product can be made  =  min over its recipe of  floor(stems in bucket / stems needed)
```

with three cases around it:

- `always` - cards, chocolates, champagne, relay orders. Never counted.
- `manual` - a number the florist types, for anything made to order.
- `stems` - worked out, and only when a recipe has actually been written.

An empty recipe returns **unknown**, never nought. A product with no
recipe is not sold out, it is unmeasured, and showing it as sold out
would cost the shop the order.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # Vercel
npm run build:static # plain HTML in ./out
npm run lint
```

State lives in `localStorage` under `pinksage:studio:v1`. There is no
server and no account. Reset is on the Publish page.

## What is not wired up

| System | Stays as it is | What this would need |
| --- | --- | --- |
| Strelitzia | The order book: orders, deliveries, the shop floor | Read orders out, so stems are decremented as bouquets are sold |
| Interflora | The relay network | Mark relay products so they are never stock counted |
| floristPro | The shop front | Write prices, copy, photographs and availability out to it |

Whether floristPro can accept any of that from outside is the first thing
to find out. If it cannot, only the customer-facing website is replaced,
and its connection into Strelitzia is kept.

## Still to come back from the shop

1. Recipes for the products that are made in house: which flowers, how
   many stems. Starting with the twenty that sell most would be enough to
   prove it.
2. Stem costs, if margin per bouquet is wanted. Everything else works
   without them.
3. Which products are made in house and which come down the relay, so the
   relay ones are never counted.
4. Whether a bouquet ordered for Friday should take its stems out of
   today's buckets or Friday's delivery. The maths above is today's
   buckets.
5. Thirty-five products are uncategorised, because they sit in categories
   that are not in the public sitemap.

## The shop front

`/shop` is the customer-facing website, built from the same
`catalogue.json` the dashboard reads, so the two halves cannot drift
apart. It is a route group, so the dashboard's own paths are unchanged.

### What was wrong with the catalogue

The live site has **22 flat categories, 35 products in none of them, and
no level above any of it**. Funeral work is 108 of the 198, split across
eleven separate top-level categories - Casket Sprays, Sheaves, Hearts,
Crosses, Wreath, Spray, Posies and Pillows, Specialist Tributes, Service
Arrangements, Funeral Finishing Touches, Sympathy - each sitting in the
menu at the same level as Chocolates.

`src/lib/shelf.ts` gives every product **exactly one home** in four
sections, so there is always a single answer to "where does this live":

| Section | Products | Shelves |
|---|---|---|
| Flowers | 62 | Hand tied, roses, vases, hatboxes, posies, subscriptions, corporate |
| Funeral tributes | 105 | Sprays, sheaves, wreaths, hearts, crosses, posies and pillows, lettering, finishing touches |
| Gifts | 31 | Champagne, chocolates, small gifts, balloons, teddies, plants, cards, workshops |
| Weddings and events | 0 | Enquiry only; the shop publishes no prices for it |

Collections sit on top of that, not instead of it: a Mother's Day hatbox
is filed with the other hatboxes **and** appears on the Mother's Day
page. Filing it under one or the other is what produced the mess.

The shop's own categories are trusted first; the name and copy are read
only for the 35 that were never filed. Nothing falls through silently -
`classify()` returns null when no rule matches, and all 198 match.

### The copy

47 of the 198 descriptions arrived from the scrape with the page
furniture glued to them - an upsell panel, the product's own name
repeated, the colour dropdown, an internal code like `MDHBOXP1`.
`src/lib/clean.ts` strips those at render. It only ever **removes**:
what shows on the shop front is a subset of what Pink Sage already
wrote, and the scraped original stays verbatim in `catalogue.json` so
anybody can check it.

### What the shop front can do that the live one cannot

- **"Only 2 left" and "Sold out today"**, read from the florist's own
  stem counts rather than from somebody remembering to edit the website.
  Four of the five availability states show nothing at all: a product
  with no recipe is unmeasured, not sold out.
- **Sizes as buttons with prices on their faces.** 86 of the 198 come in
  more than one size, and the live site hides the prices in a dropdown.
- **What goes into it**, listed from their own copy.
- **The same-day cut off in the header**, which on the live site is four
  clicks away at the bottom of a table.

### Where it stops

The basket is real and works. The checkout is not built, deliberately -
taking payment, the delivery date and the card message is the part that
belongs to the shop front Pink Sage already pays for, and whether that
stays floristPro or moves is the question still open.
