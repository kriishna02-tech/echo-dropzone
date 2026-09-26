import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Echo Dropzone — 3D Co-op Arena",
  description: "Team up, clear three evolving 3D arenas, unlock new blasters and build your squad advantage.",
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
