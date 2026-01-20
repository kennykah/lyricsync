# LyricSync

Synchronisation intelligente de paroles musicales avec interface moderne et fonctionnalités avancées.

## 🚀 Fonctionnalités

- 🎵 **Synchronisation manuelle** : Interface tap-to-sync précise avec contrôles avancés
- 🎨 **Interface Apple Music** : Affichage élégant des paroles avec transitions fluides
- 📺 **Import YouTube** : Extraction automatique d'audio depuis vidéos YouTube
- 👑 **Gestion utilisateurs** : Système de rôles (contributeur, validateur, admin)
- ✅ **Validation communautaire** : Système de validation des synchronisations
- 🎯 **Points & Badges** : Système de gamification
- 📊 **Tableaux de bord** : Statistiques et progression utilisateur

## 🛠️ Installation

### Prérequis

- Node.js 18+
- PostgreSQL (via Supabase)
- yt-dlp (pour l'import YouTube)

### Installation de yt-dlp

**Sur Ubuntu/Debian :**
```bash
sudo apt update && sudo apt install python3 python3-pip
pip3 install yt-dlp
```

**Sur macOS :**
```bash
brew install yt-dlp
```

**Sur Windows :**
```bash
# Via Chocolatey
choco install yt-dlp

# Ou via pip
pip install yt-dlp
```

### Configuration

1. **Cloner le repository :**
   ```bash
   git clone https://github.com/kennykah/lyricsync.git
   cd lyricsync
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement :**
   ```bash
   cp .env.example .env.local
   # Éditer .env.local avec vos clés Supabase
   ```

4. **Configurer Supabase :**
   - Créer un projet sur [Supabase](https://supabase.com)
   - Exécuter le script `supabase/schema.sql`
   - Créer le bucket `audio` avec les politiques RLS

5. **Démarrer le serveur :**
   ```bash
   npm run dev
   ```

## 📖 Utilisation

### Upload de fichiers audio
1. Aller sur `/upload`
2. Sélectionner "Fichier audio"
3. Uploader un fichier MP3/WAV
4. Ajouter les métadonnées et paroles
5. Cliquer "Uploader et synchroniser"

### Import YouTube
1. Aller sur `/upload`
2. Sélectionner "YouTube"
3. Coller l'URL YouTube
4. Ajouter les métadonnées et paroles
5. Cliquer "Importer et synchroniser"

**Note :** L'import YouTube utilise l'API ytmp3.cc et fonctionne automatiquement sans installation supplémentaire.

### Synchronisation des paroles
1. Après upload, accéder à `/sync/[id]`
2. Utiliser les contrôles avancés :
   - **Délai de sync** : Ajuster la précision (0-500ms)
   - **Contrôles lecture** : Skip ±5s, play/pause
   - **Ajustement fin** : Boutons ±0.05s et ±0.1s
3. Appuyer sur **Espace** ou **Bouton Tap** au bon moment
4. Sauvegarder la synchronisation

### Validation (pour validateurs/admins)
1. Se connecter avec un compte validateur/admin
2. Aller sur `/validate`
3. Approuver ou rejeter les synchronisations en attente
4. Gagner des points pour chaque validation

## 🔧 API Routes

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/v1/upload` | POST | Upload fichier audio |
| `/api/v1/youtube` | POST | Import depuis YouTube |
| `/api/v1/songs` | GET/POST | Gestion des chansons |
| `/api/v1/lrc/[id]` | GET/POST | Gestion des paroles |

## 🗄️ Schéma Base de Données

### Tables principales
- `profiles` : Utilisateurs avec rôles
- `songs` : Chansons avec métadonnées
- `lrc_files` : Paroles synchronisées
- `contributions` : Historique des contributions
- `badges` & `user_badges` : Système de récompenses

### Statuts des chansons
- `draft` : Brouillon
- `pending_sync` : En attente de synchronisation
- `synced` : Synchronisée (ancien système)
- `pending_validation` : En attente de validation
- `approved` : Approuvée (ancien système)
- `published` : Publiée et visible
- `rejected` : Rejetée

## 🎮 Rôles Utilisateur

| Rôle | Permissions |
|------|-------------|
| **Contributeur** | Upload, synchronisation |
| **Validateur** | + Validation des sync |
| **Admin** | + Gestion utilisateurs, modération |

## 🐛 Dépannage

### Import YouTube ne fonctionne pas
- Vérifier que `yt-dlp` est installé : `yt-dlp --version`
- Vérifier les permissions d'écriture dans `/tmp`
- Consulter les logs du serveur pour les erreurs yt-dlp

### Waveform ne s'affiche pas
- Ouvrir la console du navigateur (F12)
- Vérifier les erreurs de chargement audio
- Vérifier les politiques CORS de Supabase Storage

### Synchronisation bloquée
- Ouvrir la console du navigateur
- Voir les logs détaillés de sauvegarde
- Vérifier la connectivité Supabase

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [WaveSurfer.js](https://wavesurfer-js.org/) pour la visualisation audio
- [Howler.js](https://howlerjs.com/) pour la lecture audio
- [Supabase](https://supabase.com/) pour le backend
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) pour l'extraction YouTube
