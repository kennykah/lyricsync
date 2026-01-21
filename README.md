# LyricSync

Synchronisation intelligente de paroles musicales avec interface moderne et fonctionnalités avancées.

## 🚀 Fonctionnalités

- 🎵 **Synchronisation manuelle** : Interface tap-to-sync précise avec contrôles avancés
- 🎨 **Interface Apple Music** : Affichage élégant des paroles avec transitions fluides
- 🎼 **Upload audio** : Téléchargement de fichiers audio (MP3, WAV) avec paroles
- 👑 **Gestion utilisateurs** : Système de rôles (contributeur, validateur, admin)
- ✅ **Validation communautaire** : Système de validation des synchronisations
- 🎯 **Points & Badges** : Système de gamification
- 📊 **Tableaux de bord** : Statistiques et progression utilisateur

## 🛠️ Installation

### Prérequis

- Node.js 18+
- PostgreSQL (via Supabase)

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
2. **Option 1 - Saisir paroles manuellement :**
   - Sélectionner "Saisir paroles"
   - Uploader un fichier MP3/WAV
   - Ajouter les métadonnées et paroles
   - Cliquer "Uploader et synchroniser"
3. **Option 2 - Importer fichier LRC synchronisé :**
   - Sélectionner "Fichier LRC"
   - Uploader un fichier MP3/WAV
   - Sélectionner un fichier .lrc synchronisé
   - Ajouter les métadonnées
   - Cliquer "Importer et synchroniser"
   - La chanson sera automatiquement publiée après validation



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

### Upload de fichier échoue
- Vérifier que le fichier fait moins de 10 Mo
- Vérifier que c'est un fichier audio (MP3, WAV, etc.)
- Ouvrir la console pour voir les erreurs détaillées

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
