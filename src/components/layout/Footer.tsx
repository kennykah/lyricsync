import Link from 'next/link';
import { Music, Github, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
                <Music className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">LyricSync</span>
            </div>
            <p className="text-sm text-gray-400 max-w-md">
              Plateforme collaborative de synchronisation paroles-audio pour la 
              musique gospel francophone. Propulsé par l&apos;IA et la communauté.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Navigation
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/songs" className="text-sm hover:text-white transition-colors">
                  Parcourir
                </Link>
              </li>
              <li>
                <Link href="/contribute" className="text-sm hover:text-white transition-colors">
                  Contribuer
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-sm hover:text-white transition-colors">
                  Classement
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
            </ul>
          </div>

          {/* API & Dev */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Développeurs
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/api-docs" className="text-sm hover:text-white transition-colors">
                  Documentation API
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/kennykah/lyricsync" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:text-white transition-colors flex items-center gap-1"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </li>
              <li>
                <Link href="/api/v1/status" className="text-sm hover:text-white transition-colors">
                  Status API
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} LyricSync. Fait avec ❤️ pour la musique gospel.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://gospel-lyrics.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Gospel Lyrics
            </a>
            <a
              href="https://github.com/kennykah/lyricsync"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
