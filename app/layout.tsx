import type { Metadata } from "next";
import { Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { Dock } from "@/components/ui/dock";
import { SoundProvider } from "@/components/ui/sound-controller";

const clashDisplay = Space_Grotesk({
  variable: "--font-clash",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mi IA Colombia | Arquitectando Inteligencia",
  description: "Agencia de IA Avanzada. Construimos el futuro de tu negocio con aplicaciones web personalizadas y agentes de ventas con IA.",
};

import { SystemStatus } from "@/components/ui/system-status";
import { CommandMenu } from "@/components/ui/command-menu";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CO" suppressHydrationWarning>
      <body
        className={`${clashDisplay.variable} ${geistMono.variable} antialiased bg-black text-white overflow-x-hidden`}
      >
        <Providers>
          <SoundProvider>
            <Dock />
            {children}
            <SystemStatus />
            <CommandMenu />
          </SoundProvider>
        </Providers>
      </body>
    </html>
  );
}
