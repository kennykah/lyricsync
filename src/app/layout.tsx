import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "LyricSync - Synchronisation de paroles gospel",
    template: "%s | LyricSync",
  },
  description: "Plateforme collaborative de synchronisation paroles-audio pour la musique gospel francophone. Propulse par l IA et la communaute.",
  keywords: ["gospel", "paroles", "lyrics", "synchronisation", "lrc", "karaoke", "musique", "francophone"],
  authors: [{ name: "LyricSync Team" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://lyricsync.vercel.app",
    siteName: "LyricSync",
    title: "LyricSync - Synchronisation de paroles gospel",
    description: "Plateforme collaborative de synchronisation paroles-audio pour la musique gospel francophone.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LyricSync - Synchronisation de paroles gospel",
    description: "Plateforme collaborative de synchronisation paroles-audio pour la musique gospel francophone.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
