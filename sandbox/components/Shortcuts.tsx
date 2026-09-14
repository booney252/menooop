"use client";

import { useEffect } from "react";
import { newIdeaAndOpen } from "@/lib/actions";

function isTyping(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

// `n` anywhere (outside a field) creates a new idea and opens it.
export function Shortcuts() {
  useEffect(() => {
    let busy = false;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "n" || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (busy) return;
      busy = true;
      e.preventDefault();
      newIdeaAndOpen().finally(() => (busy = false));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
