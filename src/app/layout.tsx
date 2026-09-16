import type { Metadata } from "next";
import { Fraunces, Figtree } from "next/font/google";
import RisoDefs from "@/components/RisoDefs";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Clique Studios",
    template: "%s — Clique Studios",
  },
  description:
    "Clique Studios — a people-first creative software studio in San Francisco, building for communities.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#f7f4ec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${figtree.variable}`}
    >
      <body className="antialiased">
        <RisoDefs />
        {children}
      </body>
    </html>
  );
}
