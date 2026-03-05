import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Actores Electorales",
  description: "Sistema de Monitoreo de Indicadores - Consejo Nacional Electoral",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geist.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
