import type { Metadata, Viewport } from "next";
import {
  Archivo,
  Bodoni_Moda,
  EB_Garamond,
  Instrument_Sans,
  Karla,
  Newsreader,
  Public_Sans,
} from "next/font/google";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-newsreader",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument",
});

// Loaded only so the design preview can show alternate directions. When one is
// chosen, the losers come out of here and out of globals.css.
const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], display: "swap", variable: "--font-bodoni" });
const garamond = EB_Garamond({ subsets: ["latin"], style: ["normal", "italic"], display: "swap", variable: "--font-garamond" });
const archivo = Archivo({ subsets: ["latin"], display: "swap", variable: "--font-archivo" });
const publicSans = Public_Sans({ subsets: ["latin"], display: "swap", variable: "--font-public" });
const karla = Karla({ subsets: ["latin"], display: "swap", variable: "--font-karla" });

export const metadata: Metadata = {
  title: "Marlow",
  description: "A quiet record of how you've actually been.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Marlow" },
};

export const viewport: Viewport = {
  themeColor: "#201c1a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${instrument.variable} ${bodoni.variable} ${garamond.variable} ${archivo.variable} ${publicSans.variable} ${karla.variable}`}>
      <body className="grain antialiased">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
