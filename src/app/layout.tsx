import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-espresso text-cream">
        {children}
      </body>
    </html>
  );
}
