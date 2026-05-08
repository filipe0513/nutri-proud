import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RootProvider } from "@/components/shared/RootProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title:
    "Orgulho da Nutri | Cumprir as metas da nutri agora ficou fácil e divertido!",
  description:
    "Registre sua água, alimentação, sono e treinos com zero atrito. Transforme sua saúde em um jogo.",
  icons: {
    icon: "/icon-192.webp",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Orgulho da Nutri",
    startupImage: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F5F7",
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
      <body
        className={`${inter.variable} font-sans antialiased bg-bg-surface text-neutral-500`}
      >
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
