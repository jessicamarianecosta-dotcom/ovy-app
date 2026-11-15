import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ovy-app.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Ovy — Sua voz em texto",
    template: "%s | Ovy",
  },
  description:
    "Ovy transforma áudios em textos organizados, editáveis e prontos para usar. Grave ou envie um áudio e receba a transcrição fiel ou organizada em poucos instantes.",
  openGraph: {
    title: "Ovy — Sua voz em texto",
    description:
      "Transforme áudios em textos organizados, editáveis e prontos para usar. Menos digitação, mais produtividade.",
    url: APP_URL,
    siteName: "Ovy",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/brand/ovy-logo.png", width: 1181, height: 1181, alt: "Ovy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ovy — Sua voz em texto",
    description:
      "Transforme áudios em textos organizados, editáveis e prontos para usar.",
    images: ["/brand/ovy-logo.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Ovy",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#111B36",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
