"use client";

import { useCallback } from "react";

/**
 * Arrow keys across a table of cells.
 *
 * Every editable cell renders a button carrying data-cell, so the only
 * thing this has to do is work out which one is next and move focus. It
 * counts the cells in the focused row to find the stride, so a table can
 * add or drop a column without this knowing anything about it.
 *
 * Put the returned handler on the tbody: keystrokes from any cell inside
 * bubble up to it.
 */
export function useGridKeys() {
  return useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (!keys.includes(e.key)) return;

    const body = e.currentTarget;
    const active = document.activeElement as HTMLElement | null;
    if (!active?.hasAttribute("data-cell")) return;

    const cells = Array.from(body.querySelectorAll<HTMLElement>("[data-cell]"));
    const here = cells.indexOf(active);
    if (here < 0) return;

    const row = active.closest("tr");
    const stride = row ? row.querySelectorAll("[data-cell]").length : 1;

    const next =
      e.key === "ArrowLeft"
        ? here - 1
        : e.key === "ArrowRight"
          ? here + 1
          : e.key === "ArrowUp"
            ? here - stride
            : here + stride;

    const target = cells[next];
    if (!target) return;
    e.preventDefault();
    target.focus();
    target.scrollIntoView({ block: "nearest" });
  }, []);
}
