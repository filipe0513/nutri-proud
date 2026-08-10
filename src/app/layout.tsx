import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RootProvider } from "@/components/shared/RootProvider";
import { SplashScreen } from "@/components/shared/SplashScreen";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PostHogProvider } from "@/providers/PostHogProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL("https://orgulhodanutri.com"),
  title: {
    template: "%s | Orgulho da Nutri",
    default: "Orgulho da Nutri - Gamifique seus Hábitos e Conecte-se com sua Nutricionista",
  },
  description:
    "O Orgulho da Nutri é o seu diário de saúde gamificado e inteligente. Monitore água, sono, alimentação, intestino e treinos com zero atrito. Nutricionistas podem acompanhar seus pacientes em tempo real.",
  keywords: [
    "rastreador de hábitos",
    "saúde",
    "fitness",
    "gamificação",
    "nutrição",
    "diário de saúde",
    "acompanhamento nutricional",
    "software para nutricionistas",
  ],
  openGraph: {
    title: "Orgulho da Nutri - Gamifique seus Hábitos Saudáveis",
    description:
      "Diário de saúde gamificado para pacientes e plataforma inteligente de acompanhamento para nutricionistas.",
    url: "https://orgulhodanutri.com",
    siteName: "Orgulho da Nutri",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Orgulho da Nutri" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Orgulho da Nutri - Gamifique seus Hábitos Saudáveis",
    description:
      "Diário de saúde gamificado para pacientes e plataforma inteligente para nutricionistas.",
    images: ["/og-image.png"],
  },
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
        <PostHogProvider>
          <SplashScreen />
          <RootProvider>{children}</RootProvider>
          <SpeedInsights />
        </PostHogProvider>
      </body>
    </html>
  );
}

