"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Gate() {
  const { ready, profile } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(profile.onboarded ? "/today" : "/onboarding");
  }, [ready, profile.onboarded, router]);

  return <div className="min-h-dvh bg-[#151210]" />;
}
