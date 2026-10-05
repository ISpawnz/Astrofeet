import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Astrofeet — Tênis de corrida, casual e skate",
  description:
    "Tênis premium de corrida, casual e skate com design próprio. Frete grátis acima de R$300 e troca em 30 dias.",
  keywords: [
    "Astrofeet",
    "tênis",
    "sneakers",
    "drop limitado",
    "tênis premium",
  ],
  openGraph: {
    title: "Astrofeet — Tênis de corrida, casual e skate",
    description:
      "Tênis premium com design próprio. Frete grátis acima de R$300 e troca em 30 dias.",
    siteName: "Astrofeet",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
