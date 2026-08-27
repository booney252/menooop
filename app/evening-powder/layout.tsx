import type { Metadata } from "next";
import { Bodoni_Moda } from "next/font/google";
import "../site.css";

// The wordmark on the jar is a high-contrast modern serif — hairline
// serifs, a straight-legged R. Bodoni Moda is the honest match, and its
// optical-size axis keeps the thins hairline at 56px and readable at 22px.
const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bodoni",
});

export const metadata: Metadata = {
  title: "Marlow Evening Powder",
  description:
    "Six ingredients, every one at the dose that worked in the research. Join the waitlist.",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* The app paints the document ink. Repaint it cream while the
          site is mounted, so overscroll and the browser chrome match. */}
      <style>{`html,body{background:#f2e4cc}`}</style>
      <div className={`daylight ${bodoni.variable} min-h-dvh`}>{children}</div>
    </>
  );
}
