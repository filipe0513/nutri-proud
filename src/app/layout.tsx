import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RootProvider } from "@/components/shared/RootProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Nutri Proud | Seu Diário de Saúde Gamificado",
  description: "Registre sua água, alimentação, sono e treinos com zero atrito. Transforme sua saúde em um jogo.",
  icons: {
    icon: "/hero.png",
    apple: "/hero.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nutri Proud",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc", // Tailwind cor: slate-50
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
