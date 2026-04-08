import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TennisApp",
  description: "Tennis platform to track rankings, players, and matches.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
