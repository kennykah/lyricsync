import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "LyricSync - Synchronisation de paroles gospel",
    template: "%s | LyricSync",
  },
  description: "Plateforme collaborative de synchronisation paroles-audio pour la musique gospel francophone.",
  keywords: ["gospel", "paroles", "lyrics", "synchronisation", "lrc", "karaoke", "musique", "francophone"],
  authors: [{ name: "LyricSync Team" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://lyricsync-three.vercel.app",
    siteName: "LyricSync",
    title: "LyricSync - Synchronisation de paroles gospel",
    description: "Plateforme collaborative de synchronisation paroles-audio pour la musique gospel francophone.",
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
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
