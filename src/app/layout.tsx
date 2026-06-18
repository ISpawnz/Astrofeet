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
  title: "Astrofeet — Sneakers de outro planeta",
  description:
    "Sneakers premium com visual de outro planeta. Explore os drops da Astrofeet e encontre seu próximo par para orbitar o estilo.",
  keywords: [
    "Astrofeet",
    "tênis",
    "sneakers",
    "drop limitado",
    "tênis premium",
  ],
  openGraph: {
    title: "Astrofeet — Sneakers de outro planeta",
    description:
      "Explore os drops da Astrofeet e encontre seu próximo par para orbitar o estilo.",
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
