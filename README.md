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
