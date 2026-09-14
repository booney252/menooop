import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Shortcuts } from "@/components/Shortcuts";

export const metadata: Metadata = {
  title: "Sandbox",
  description: "Inspo, scripts, and the log.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Nav />
        <Shortcuts />
        <main className="mx-auto max-w-[1400px] px-5 py-5">{children}</main>
      </body>
    </html>
  );
}
