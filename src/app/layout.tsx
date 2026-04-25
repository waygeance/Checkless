import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const round8Four = localFont({
  src: [
    {
      path: "./fonts/round8-four-webfont.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/round8-four-webfont.woff",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-round8-four",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Checkless | Simultaneous Chess",
  description:
    "A fast espresso-and-lime interface for real-time simultaneous chess with independent timers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${round8Four.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-espresso text-cream">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
