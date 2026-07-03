import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BizLedger",
  description: "Daily finance tracking for wholesale and retail businesses",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[var(--bg)] text-[var(--fg)] antialiased">{children}</body>
    </html>
  );
}
