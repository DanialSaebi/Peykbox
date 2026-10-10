import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peykbox — Open Source Mail",
  description: "Self-hosted email workspace with a web-based installer",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
