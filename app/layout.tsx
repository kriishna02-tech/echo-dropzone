import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal Saboteurs — Multiplayer Mystery",
  description: "A live social-deduction game for 4–8 players. Repair the station, uncover the hidden Glitch, and survive the vote.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
