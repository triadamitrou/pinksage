"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import EditorPanel from "@/components/EditorPanel";
import Sheet from "@/components/Sheet";
import { useStudio } from "@/lib/store";

/**
 * The sheet and, when a row is opened, the editor beside it.
 *
 * Both the view filter and the open row can arrive in the URL, so a line
 * on the morning list is one click from the exact row that fixes it.
 */
function Products() {
  const params = useSearchParams();
  const { products } = useStudio();

  const view = (params.get("view") ?? "all") as
    | "all"
    | "out"
    | "limited"
    | "unknown"
    | "changed";
  const [openId, setOpenId] = useState<string | null>(params.get("open"));
  const open = products.find((p) => p.id === openId) ?? null;

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div className="min-w-0 flex-1">
        <Sheet initialView={view} openId={openId} onOpen={setOpenId} />
      </div>
      {open && (
        <EditorPanel product={open} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="u-wrap py-10">Loading the sheet</p>}>
      <Products />
    </Suspense>
  );
}
