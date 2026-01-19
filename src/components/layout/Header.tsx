"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music, Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import Button from "@/components/ui/Button";

const navigation = [
  { name: "Accueil", href: "/" },
  { name: "Parcourir", href: "/songs" },
  { name: "Contribuer", href: "/contribute" },
  { name: "Classement", href: "/leaderboard" },
];

export default function Header() {

  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, isLoading, signOut } = useAuth();
  const [forceShowAuth, setForceShowAuth] = useState(false);

  // Fallback si le chargement dure trop longtemps
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) setForceShowAuth(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
                <Music className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                LyricSync
              </span>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:gap-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname === item.href ? "text-purple-600" : "text-gray-700 hover:text-purple-600"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex md:items-center md:gap-x-4">
            {isLoading && !forceShowAuth ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-lg"></div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-purple-600"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                {(profile?.role === "validator" || profile?.role === "admin") && (
                  <Link
                    href="/validate"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-purple-600"
                  >
                    ✅ Valider
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-medium">
                    {profile?.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {profile?.username || user.email?.split("@")[0]}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-gray-500 hover:text-gray-700"
                  title="Deconnexion"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Connexion</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">S inscrire</Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Ouvrir le menu</span>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn("text-base font-medium", pathname === item.href ? "text-purple-600" : "text-gray-700")}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <hr className="my-2" />
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-base font-medium text-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {(profile?.role === "validator" || profile?.role === "admin") && (
                    <Link
                      href="/validate"
                      className="text-base font-medium text-gray-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      ✅ Valider
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 text-base text-gray-500"
                  >
                    <LogOut className="h-5 w-5" />
                    Deconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-base font-medium text-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-base font-medium text-purple-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    S inscrire
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
