"use client";

import { useRef, useState } from "react";
import {
  applyProductCsv,
  applyVarietyCsv,
  download,
  productsToCsv,
  varietiesToCsv,
} from "@/lib/csv";
import { useStudio } from "@/lib/store";

/**
 * Excel in, Excel out.
 *
 * The point of this page is that nobody has to live in the dashboard.
 * Download the sheet, work through it on a train, send it back. The id
 * column is the key, so rows can be sorted or deleted and still land on
 * the right products, and a column that is not in the file is left alone
 * rather than wiped.
 */
export default function SheetPage() {
  const { products, varieties, replaceAll } = useStudio();
  const [report, setReport] = useState<null | {
    heading: string;
    lines: string[];
    problems: string[];
  }>(null);
  const productFile = useRef<HTMLInputElement>(null);
  const varietyFile = useRef<HTMLInputElement>(null);

  const names = new Map(varieties.map((v) => [v.id, v.name]));
  const byName = new Map<string, string>();
  for (const v of varieties) {
    byName.set(v.name.toLowerCase(), v.id);
    byName.set(v.id, v.id);
  }

  async function readProducts(file: File) {
    const text = await file.text();
    const res = applyProductCsv(text, products, byName);
    replaceAll({ products: res.products });
    setReport({
      heading: `${res.changed.length} product${
        res.changed.length === 1 ? "" : "s"
      } changed`,
      lines: [
        `${res.changed.length} row${res.changed.length === 1 ? "" : "s"} applied.`,
        res.skipped
          ? `${res.skipped} row${res.skipped === 1 ? "" : "s"} skipped: no product with that id.`
          : "Every row matched a product.",
        "Nothing has gone to the website yet. The Publish page has the list.",
      ],
      problems: res.problems.slice(0, 12),
    });
  }

  async function readVarieties(file: File) {
    const text = await file.text();
    const res = applyVarietyCsv(text, varieties);
    replaceAll({ varieties: res.varieties });
    setReport({
      heading: `${res.changed} flower${res.changed === 1 ? "" : "s"} updated`,
      lines: [
        "Every product that uses them has been recounted.",
        "Nothing has gone to the website yet.",
      ],
      problems: res.problems.slice(0, 12),
    });
  }

  return (
    <div className="u-wrap max-w-3xl py-7 lg:py-10">
      <header className="border-line border-b pb-5">
        <h1 className="u-serif text-[1.75rem] leading-tight lg:text-[2.1rem]">
          Bulk edit in a spreadsheet
        </h1>
        <p className="text-ink-2 mt-1.5 max-w-[60ch] leading-relaxed">
          Download, change what needs changing, upload it back. Opens in
          Excel, Numbers or Google Sheets.
        </p>
      </header>

      <section className="mt-7">
        <h2 className="u-serif text-[1.2rem]">Products</h2>
        <p className="text-ink-2 mt-1 max-w-[60ch] text-[0.88rem] leading-relaxed">
          One row a product: name, prices, description, recipe, how it is
          counted. Recipes read as{" "}
          <code className="bg-line-2 rounded px-1 py-0.5 text-[0.82rem]">
            Rose x7; Lisianthus x5
          </code>{" "}
          and prices as{" "}
          <code className="bg-line-2 rounded px-1 py-0.5 text-[0.82rem]">
            Standard £50; Grand £60
          </code>
          .
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="u-btn u-btn--go"
            onClick={() =>
              download(
                `pinksage-products-${stamp()}.csv`,
                productsToCsv(products, names),
              )
            }
          >
            Download {products.length} products
          </button>
          <button
            type="button"
            className="u-btn"
            onClick={() => productFile.current?.click()}
          >
            Upload a product sheet
          </button>
          <input
            ref={productFile}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void readProducts(f);
              e.target.value = "";
            }}
          />
        </div>
      </section>

      <section className="border-line mt-8 border-t pt-6">
        <h2 className="u-serif text-[1.2rem]">Flower stock</h2>
        <p className="text-ink-2 mt-1 max-w-[60ch] text-[0.88rem] leading-relaxed">
          Five columns. The quickest Tuesday morning count is this sheet
          on a phone, with the stems column filled in beside the buckets.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="u-btn u-btn--go"
            onClick={() =>
              download(`pinksage-flowers-${stamp()}.csv`, varietiesToCsv(varieties))
            }
          >
            Download {varieties.length} varieties
          </button>
          <button
            type="button"
            className="u-btn"
            onClick={() => varietyFile.current?.click()}
          >
            Upload a stock sheet
          </button>
          <input
            ref={varietyFile}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void readVarieties(f);
              e.target.value = "";
            }}
          />
        </div>
      </section>

      {report && (
        <section
          role="status"
          className="border-sage-pale bg-sage-wash mt-8 rounded-lg border p-4"
        >
          <h2 className="text-sage-deep font-semibold">{report.heading}</h2>
          <ul className="text-ink-2 mt-2 space-y-1 text-[0.85rem]">
            {report.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          {report.problems.length > 0 && (
            <>
              <p className="text-blush mt-3 text-[0.8rem] font-semibold">
                Lines that could not be done
              </p>
              <ul className="text-ink-2 mt-1 space-y-0.5 text-[0.8rem]">
                {report.problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section className="border-line mt-8 border-t pt-6">
        <h2 className="u-label">How the upload behaves</h2>
        <dl className="mt-3 text-[0.85rem] leading-relaxed">
          {[
            [
              "It matches on id",
              "Sort the sheet, filter it, delete the rows that are fine. Only the rows that are there get touched.",
            ],
            [
              "A missing or empty cell changes nothing",
              "A sheet of nothing but id and stems is a perfectly good upload. Anything left blank stays as it is; to empty a recipe on purpose, write none.",
            ],
            [
              "A bad cell is reported, not guessed",
              "A price that does not read as a number, or a flower that is not in the stock list, is listed back rather than quietly dropped.",
            ],
            [
              "Nothing goes live",
              "An upload lands in the dashboard. It reaches the website when Publish is pressed, and the list of what changed is there first.",
            ],
          ].map(([t, d]) => (
            <div key={t} className="border-line-2 grid gap-x-5 border-t py-2.5 sm:grid-cols-[13rem_1fr]">
              <dt className="font-semibold">{t}</dt>
              <dd className="text-ink-2">{d}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}
