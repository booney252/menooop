import type { Metadata, Viewport } from "next";
import {
  Bodoni_Moda,
  DM_Serif_Display,
  Epilogue,
  Instrument_Sans,
  Karla,
  Newsreader,
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

// Candidates for the type pairing, loaded so the preview can compare them.
// The two that lose come out of here and out of globals.css.
const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], display: "swap", variable: "--font-bodoni" });
const karla = Karla({ subsets: ["latin"], display: "swap", variable: "--font-karla" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], display: "swap", variable: "--font-dmserif" });
const epilogue = Epilogue({ subsets: ["latin"], display: "swap", variable: "--font-epilogue" });

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
    <html lang="en" className={`${newsreader.variable} ${instrument.variable} ${bodoni.variable} ${karla.variable} ${dmSerif.variable} ${epilogue.variable}`}>
      <body className="grain antialiased">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
