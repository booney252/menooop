"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createVideo, newIdeaAndOpen } from "@/lib/actions";

export function QuickAdd() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <button className="btn" onClick={() => router.push("/inspo?add=1")}>+ Inspo</button>
      <form action={newIdeaAndOpen}>
        <button className="btn">+ Idea</button>
      </form>
      <button
        className="btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const id = await createVideo();
          router.push(`/videos?highlight=${id}`);
        }}
      >
        + Video
      </button>
    </div>
  );
}
