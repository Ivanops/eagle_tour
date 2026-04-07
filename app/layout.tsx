import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TennisApp",
  description: "Plataforma de tenis para seguir rankings, jugadores y partidos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
