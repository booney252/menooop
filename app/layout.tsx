import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  DM_Serif_Display,
  Literata,
  Spectral,
} from "next/font/google";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-dmserif",
});
const literata = Literata({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-literata",
});

// Candidates for the body face, loaded so the preview can compare them.
// The two that lose come out of here and out of globals.css.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", variable: "--font-bricolage" });
const spectral = Spectral({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"], display: "swap", variable: "--font-spectral" });

export const metadata: Metadata = {
  title: "Marlow",
  description: "A quiet record of how you've actually been.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Marlow" },
};

export const viewport: Viewport = {
  themeColor: "#2a1524",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${literata.variable} ${bricolage.variable} ${spectral.variable}`}>
      <body className="grain antialiased">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
