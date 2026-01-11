# LyricSync

> Plateforme collaborative de synchronisation paroles-audio pour la musique gospel francophone

## A propos

LyricSync combine l intelligence artificielle (Whisper) et la puissance de la communaute pour creer des paroles synchronisees de haute qualite pour la musique gospel francophone.

### Fonctionnalites principales

- Interface Tap-to-Sync : Synchronisez les paroles en temps reel
- IA Whisper : Generation automatique de brouillons LRC
- Communaute : Systeme de points, badges et classement
- API REST : Integration facile avec d autres applications
- Validation : Processus de qualite rigoureux

## Demarrage rapide

### Prerequis

- Node.js 18+
- npm ou yarn
- Compte Supabase (gratuit)

### Installation

```bash
# Cloner le depot
git clone https://github.com/kennykah/lyricsync.git
cd lyricsync

# Installer les dependances
npm install

# Copier le fichier d environnement
cp .env.example .env.local

# Lancer le serveur de developpement
npm run dev
```

Ouvrir http://localhost:3000 dans votre navigateur.

## Stack technique

- Frontend : Next.js 15, React, TypeScript, Tailwind CSS
- Backend : Next.js API Routes
- Base de donnees : Supabase (PostgreSQL)
- Auth : Supabase Auth
- IA : OpenAI Whisper (Phase 2)
- Deploiement : Vercel

## Integration avec Gospel Lyrics

LyricSync est concu pour s integrer avec Gospel Lyrics (https://gospel-lyrics.vercel.app) mais reste une plateforme independante.

## License

Ce projet est sous licence MIT.

---

Fait avec amour pour la musique gospel francophone
