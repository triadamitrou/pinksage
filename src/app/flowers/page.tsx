"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Cell } from "@/components/Cell";
import { availabilityOf } from "@/lib/availability";
import { useStudio } from "@/lib/store";
import { useGridKeys } from "@/lib/useGridKeys";

/**
 * What is in the buckets.
 *
 * Short, because it has to be done standing up with a clipboard on a
 * Tuesday morning. Every row carries the thing that makes the counting
 * worth doing: how many products that one variety is currently holding
 * back, and what stops when it runs out.
 */
export default function Flowers() {
  const { varieties, products, stock, updateVariety, addVariety, exampleLoaded } =
    useStudio();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const onGridKey = useGridKeys();

  /** For each variety: who uses it, and who it is currently limiting. */
  const usage = useMemo(() => {
    const out = new Map<string, { used: number; blocking: string[] }>();
    for (const v of varieties) out.set(v.id, { used: 0, blocking: [] });
    for (const p of products) {
      const a = availabilityOf(p, stock);
      for (const line of p.recipe) {
        const u = out.get(line.variety);
        if (!u) continue;
        u.used++;
        if (a.limiting === line.variety && (a.count ?? 1) <= p.lowAt) {
          u.blocking.push(p.name);
        }
      }
    }
    return out;
  }, [varieties, products, stock]);

  const totalStems = varieties.reduce((n, v) => n + v.stems, 0);

  return (
    <div className="u-wrap max-w-5xl py-7 lg:py-10">
      <header className="border-line flex flex-wrap items-end justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="u-serif text-[1.75rem] leading-tight lg:text-[2.1rem]">
            Flower stock
          </h1>
          <p className="text-ink-2 mt-1 max-w-[56ch] text-[0.9rem] leading-relaxed">
            Count the buckets, type the numbers. Everything on the sheet
            that uses a variety recalculates as the number changes.
          </p>
        </div>
        <p className="u-num text-ink-3 text-[0.78rem]">
          {totalStems.toLocaleString("en-GB")} stems in all
        </p>
      </header>

      {exampleLoaded && (
        <p className="border-blush bg-blush-wash text-blush mt-5 rounded-md border-l-2 px-3 py-2 text-[0.8rem]">
          These stem counts are example figures, not a real count. The
          variety names are real: each one is read out of Pink Sage&rsquo;s own
          product descriptions.
        </p>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="u-sheet">
          <thead>
            <tr>
              <th scope="col" className="min-w-40">
                Variety
              </th>
              <th scope="col" className="text-right">
                Stems
              </th>
              <th scope="col" className="text-right">
                Cost a stem
              </th>
              <th scope="col">Comes in</th>
              <th scope="col" className="text-right">
                In recipes
              </th>
              <th scope="col">Holding back</th>
            </tr>
          </thead>
          <tbody onKeyDown={onGridKey}>
            {varieties.map((v) => {
              const u = usage.get(v.id) ?? { used: 0, blocking: [] };
              const open = expanded === v.id;
              return (
                <tr key={v.id} className={open ? "bg-sage-wash" : ""}>
                  <td>
                    <Cell
                      value={v.name}
                      onCommit={(next) =>
                        updateVariety(v.id, { name: next.trim() || v.name })
                      }
                      display={<span className="font-medium">{v.name}</span>}
                    />
                  </td>
                  <td>
                    <Cell
                      value={String(v.stems)}
                      type="number"
                      align="right"
                      onCommit={(next) =>
                        updateVariety(v.id, {
                          stems: Math.max(0, Math.floor(Number(next) || 0)),
                        })
                      }
                      display={
                        <span
                          className={
                            v.stems === 0 ? "text-ink-3" : "font-semibold"
                          }
                        >
                          {v.stems}
                        </span>
                      }
                    />
                  </td>
                  <td>
                    <Cell
                      value={v.cost ? String(v.cost) : ""}
                      type="number"
                      align="right"
                      placeholder="not set"
                      onCommit={(next) =>
                        updateVariety(v.id, {
                          cost: Math.max(0, Number(next) || 0),
                        })
                      }
                      display={
                        v.cost ? (
                          <span className="u-num">£{v.cost.toFixed(2)}</span>
                        ) : undefined
                      }
                    />
                  </td>
                  <td>
                    <Cell
                      value={v.delivery}
                      placeholder="which days"
                      onCommit={(next) =>
                        updateVariety(v.id, { delivery: next })
                      }
                    />
                  </td>
                  <td className="u-num text-ink-2 px-2.5 text-right">
                    {u.used || <span className="text-ink-3">0</span>}
                  </td>
                  <td className="px-2.5">
                    {u.blocking.length ? (
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : v.id)}
                        aria-expanded={open}
                        className="text-blush text-left text-[0.8rem] font-semibold"
                      >
                        {u.blocking.length} product
                        {u.blocking.length === 1 ? "" : "s"}
                      </button>
                    ) : (
                      <span className="text-ink-3 text-[0.8rem]">-</span>
                    )}
                    {open && (
                      <ul className="text-ink-2 mt-1 mb-2 text-[0.78rem]">
                        {u.blocking.slice(0, 10).map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                        {u.blocking.length > 10 && (
                          <li className="text-ink-3">
                            and {u.blocking.length - 10} more
                          </li>
                        )}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form
        className="mt-5 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const name = newName.trim();
          if (!name) return;
          addVariety(name);
          setNewName("");
        }}
      >
        <input
          className="u-field w-56"
          placeholder="Another variety"
          aria-label="Name of a new variety"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="u-btn">
          Add it
        </button>
        <p className="text-ink-3 ml-2 text-[0.78rem]">
          The list started from the flowers named in their own product
          descriptions.{" "}
          <Link href="/sheet" className="text-sage-deep underline">
            Counting is quicker in Excel
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
