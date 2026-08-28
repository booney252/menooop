import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Source_Serif_4 } from "next/font/google";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-dmserif",
});

const source = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-source",
});

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
    <html lang="en" className={`${dmSerif.variable} ${source.variable}`}>
      <body className="grain antialiased">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
