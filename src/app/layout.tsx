import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import localFont from "next/font/local";
import RisoDefs from "@/components/RisoDefs";
import "./globals.css";

// Fraunces sets only the wordmark, so this is a glyph subset ("Clique Studios")
// of the variable font with its optical-size axis: 4 KB instead of 67 KB.
// Regenerate from the Google Fonts CSS API with text=Clique%20Studios if the
// wordmark ever changes letters.
const fraunces = localFont({
  src: "./fonts/fraunces-wordmark.woff2",
  variable: "--font-fraunces",
  weight: "400",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+20, U+43, U+53, U+64-65, U+69, U+6C, U+6F, U+71, U+73-75" }],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cliquestudios.org"),
  title: {
    default: "Clique Studios",
    template: "%s — Clique Studios",
  },
  description:
    "Clique Studios is a creative software studio in San Francisco. We take everyday things and sprinkle in a little bit of joy.",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Clique Studios",
    title: "Clique Studios",
    description:
      "A creative software studio in San Francisco. We take everyday things and sprinkle in a little bit of joy.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clique Studios",
    description:
      "A creative software studio in San Francisco. We take everyday things and sprinkle in a little bit of joy.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#f8f5ee",
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
