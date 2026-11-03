"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * One editable cell.
 *
 * Closed, it is a button, so the browser's own focus order walks the
 * grid and a screen reader announces it. Open, the input sits in exactly
 * the same box, so nothing shifts under the cursor when typing starts -
 * the thing that makes most web tables feel unlike a spreadsheet.
 *
 * Enter and Escape both hand focus back to the button, which is what
 * keeps arrow-key navigation working after an edit.
 */
export function Cell({
  value,
  onCommit,
  display,
  align = "left",
  type = "text",
  placeholder,
  title,
}: {
  value: string;
  onCommit: (next: string) => void;
  display?: React.ReactNode;
  align?: "left" | "right";
  type?: "text" | "number";
  placeholder?: string;
  title?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const btn = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const openedByTyping = useRef(false);
  const returning = useRef(false);

  // Layout, not passive: focus has to move in the same commit that swaps
  // the button for the input and back. On a frame's delay the next
  // keystroke lands on an element that is no longer there, and either a
  // character or an arrow key is lost.
  useLayoutEffect(() => {
    if (!editing) {
      if (returning.current) {
        returning.current = false;
        btn.current?.focus();
      }
      return;
    }
    const el = input.current;
    if (!el) return;
    el.focus();
    // Opened by typing: keep the caret after the character, as a
    // spreadsheet does. Opened by click or Enter: select the lot.
    try {
      // A number input refuses both of these in Chrome, and focus alone
      // is the right behaviour there anyway.
      if (openedByTyping.current) {
        const n = el.value.length;
        el.setSelectionRange(n, n);
      } else {
        el.select();
      }
    } catch {
      // type="number": nothing to place, the caret is already at the end.
    }
    openedByTyping.current = false;
  }, [editing]);

  function open() {
    setDraft(value);
    setEditing(true);
  }

  /**
   * `refocus` is false when the cell is closing because focus has already
   * gone somewhere else - a click on another cell. Pulling it back would
   * take the user where they did not ask to go.
   */
  function close(commit: boolean, refocus: boolean) {
    if (commit && draft !== value) onCommit(draft);
    returning.current = refocus;
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={input}
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => close(true, false)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            close(true, true);
          } else if (e.key === "Escape") {
            e.preventDefault();
            close(false, true);
          }
        }}
        className={`u-cell-input ${align === "right" ? "text-right u-num" : ""}`}
      />
    );
  }

  return (
    <button
      ref={btn}
      type="button"
      title={title}
      data-cell
      onClick={open}
      onKeyDown={(e) => {
        // Typing straight into a closed cell replaces it, as a sheet does.
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          openedByTyping.current = true;
          setDraft(e.key);
          setEditing(true);
        }
      }}
      className={`u-cell ${align === "right" ? "u-cell--num" : ""} ${
        value ? "" : "text-ink-3"
      }`}
    >
      {display ?? (value || placeholder || "-")}
    </button>
  );
}
