"use client";

import { useState, useSyncExternalStore } from "react";
import EditorPanel from "@/components/EditorPanel";
import Sheet, { type View, isView } from "@/components/Sheet";
import { useStudio } from "@/lib/store";

/**
 * The sheet and, when a row is opened, the editor beside it.
 *
 * Both the view filter and the open row can arrive in the query string,
 * so a line on the morning list is one click from the row that fixes it.
 *
 * It reads the query off window.location rather than through
 * useSearchParams: that hook has to be wrapped in Suspense, and the
 * boundary never resolves in the plain-HTML export, which left the whole
 * sheet stuck behind "Loading". This is one line and works everywhere,
 * including from a folder opened by double-click.
 */
export default function Products() {
  const { products } = useStudio();
  const query = useSyncExternalStore(noUrlUpdates, readQuery, () => "");

  const [view, setView] = useState<View>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [tookFromUrl, setTookFromUrl] = useState(false);

  // The query is empty on the server and arrives with the browser, so
  // this reads it once, on the render after hydration. From then on the
  // view and the open row belong to the page.
  if (!tookFromUrl && query) {
    const params = new URLSearchParams(query);
    const wanted = params.get("view");
    setTookFromUrl(true);
    if (isView(wanted)) setView(wanted);
    setOpenId(params.get("open"));
  }

  const open = products.find((p) => p.id === openId) ?? null;

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div className="min-w-0 flex-1">
        <Sheet view={view} onView={setView} openId={openId} onOpen={setOpenId} />
      </div>
      {open && <EditorPanel product={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

const noUrlUpdates = () => () => {};
const readQuery = () => window.location.search;
