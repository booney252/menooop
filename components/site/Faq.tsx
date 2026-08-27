import { FAQS } from "@/lib/powder";

/* Native <details>, so it opens without JavaScript and reads correctly
   to a screen reader. The marker is two hairlines rather than an icon. */
export function Faq() {
  return (
    <ul>
      {FAQS.map((f) => (
        <li key={f.q} className="rule border-t">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-start gap-5 py-6 [&::-webkit-details-marker]:hidden">
              <h3 className="d-sm flex-1 text-[20px] sm:text-[24px]">{f.q}</h3>
              <span
                aria-hidden
                className="relative mt-2 h-[13px] w-[13px] shrink-0"
              >
                <span
                  className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2"
                  style={{ background: "var(--plum-lift)" }}
                />
                <span
                  className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 transition-transform duration-500 group-open:scale-y-0"
                  style={{ background: "var(--plum-lift)" }}
                />
              </span>
            </summary>
            <p className="max-w-2xl pb-7 text-[16.5px] leading-[1.68]">{f.a}</p>
          </details>
        </li>
      ))}
    </ul>
  );
}
