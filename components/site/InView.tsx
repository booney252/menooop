"use client";

import { useEffect, useRef, useState } from "react";

/* One slow rise as a section arrives, and only once. Rendered visible on
   the server, so with JavaScript off the page is simply a static page —
   the hiding is done by JS, so it can always be undone by JS. */
export function InView({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // If she has asked for reduced motion, never hide anything pending a
    // scroll — the page is simply there.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setArmed(true);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`${className} ${armed && shown ? "rise" : ""}`}
      style={{
        animationDelay: `${delay}ms`,
        opacity: armed && !shown ? 0 : undefined,
      }}
    >
      {children}
    </Tag>
  );
}
