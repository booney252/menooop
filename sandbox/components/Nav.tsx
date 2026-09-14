"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/inspo", label: "Inspo" },
  { href: "/ideas", label: "Ideas" },
  { href: "/videos", label: "Videos" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="border-b border-line bg-panel">
      <nav className="mx-auto flex max-w-[1400px] items-center gap-1 px-5 h-11">
        <span className="mr-4 text-[13px] font-semibold tracking-tight">sandbox</span>
        {links.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-2.5 py-1 text-[13px] ${
                active ? "bg-panel2 text-fg" : "text-mute hover:text-fg"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
        <span className="ml-auto text-xs text-mute">
          <kbd>n</kbd> new idea
        </span>
      </nav>
    </header>
  );
}
