# LyricSync - Plateforme de Base de Données LRC Avancée

## 📋 Vue d'ensemble du projet

LyricSync est une plateforme web moderne spécialisée dans la gestion, synchronisation et partage de fichiers LRC (Lyrics Resource Container) - le format standard pour les paroles synchronisées avec la musique. Le projet se positionne comme **la plus grande base de données de fichiers LRC** avec une spécialisation dans la musique chrétienne (gospel) tout en supportant la musique mondaine.

## 🎯 Objectif principal

Créer une **base de données collaborative de fichiers LRC** où les utilisateurs peuvent :
- **Importer** des fichiers LRC existants
- **Créer** de nouveaux fichiers LRC via synchronisation manuelle
- **Convertir** des fichiers texte en LRC synchronisés
- **Télécharger** des fichiers LRC de qualité
- **Explorer** une bibliothèque organisée par catégories

## 🏗️ Architecture technique

### **Stack technologique**
- **Frontend :** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend :** API Routes Next.js, Supabase (PostgreSQL)
- **Authentification :** Supabase Auth
- **Stockage :** Supabase Storage (fichiers audio + LRC)
- **UI/UX :** Composants custom, design Apple Music-like
- **Audio :** Howler.js, WaveSurfer.js

### **Déploiement**
- **Platform :** Vercel
- **Database :** Supabase
- **CDN :** Vercel Edge Network

## 📊 Structure de base de données

### **Tables principales**

#### **Utilisateurs (profiles)**
```sql
- id: UUID (clé étrangère vers auth.users)
- username: TEXT UNIQUE
- display_name: TEXT
- role: ENUM ('artist', 'contributor', 'validator', 'admin')
- points: INTEGER (système de gamification)
- level: INTEGER
- bio: TEXT
```

#### **Chansons (songs)**
```sql
- id: UUID PRIMARY KEY
- title: TEXT NOT NULL
- artist_name: TEXT NOT NULL
- album: TEXT
- release_year: INTEGER
- duration_seconds: INTEGER
- audio_url: TEXT
- lyrics_text: TEXT (paroles brutes)
- status: ENUM ('draft', 'published', 'archived')
- category: ENUM ('gospel', 'world') -- Musique chrétienne vs mondaine
- genre: TEXT -- Sous-catégorisation
- language: TEXT -- Langue principale
- created_by: UUID
- created_at: TIMESTAMP
```

#### **Fichiers LRC (lrc_files)**
```sql
- id: UUID PRIMARY KEY
- song_id: UUID UNIQUE (une chanson = un fichier LRC)
- synced_lyrics: JSONB (timestamps + texte synchronisé)
- lrc_raw: TEXT (format LRC brut)
- source: ENUM ('manual_sync', 'lrc_import', 'txt_conversion')
- quality_score: INTEGER (0-100, évaluation qualité)
- validated_by: UUID
- validated_at: TIMESTAMP
```

#### **Catégories et Genres**
```sql
-- Table des genres musicaux
CREATE TABLE music_genres (
  id: UUID PRIMARY KEY,
  name: TEXT UNIQUE,
  category: ENUM ('gospel', 'world'),
  description: TEXT,
  is_active: BOOLEAN DEFAULT TRUE
);

-- Insertion des genres par défaut
INSERT INTO music_genres (name, category, description) VALUES
  -- Gospel/Christian
  ('Gospel traditionnel', 'gospel', 'Gospel classique afro-américain'),
  ('Gospel moderne', 'gospel', 'Gospel contemporain'),
  ('Louange & Adoration', 'gospel', 'Musique de louange chrétienne'),
  ('Gospel africain', 'gospel', 'Gospel africain et caribéen'),
  ('Hymnes chrétiennes', 'gospel', 'Hymnes traditionnelles'),

  -- World Music
  ('Pop', 'world', 'Musique pop internationale'),
  ('Rock', 'world', 'Rock et variantes'),
  ('Hip-Hop/Rap', 'world', 'Hip-hop et rap'),
  ('R&B/Soul', 'world', 'R&B et soul music'),
  ('Jazz', 'world', 'Jazz traditionnel et moderne'),
  ('Reggae', 'world', 'Reggae et musique caribéenne'),
  ('Afrobeat', 'world', 'Musique africaine moderne'),
  ('K-pop', 'world', 'Musique pop coréenne'),
  ('Latin', 'world', 'Musique latine'),
  ('Electro/Dance', 'world', 'Musique électronique');
```

## 🎵 Fonctionnalités principales

### **1. Système de catégorisation**

#### **Séparation Gospel vs World**
- **Gospel :** Musique chrétienne, louange, gospel traditionnel/moderne
- **World :** Musique mondaine de tous genres

#### **Genres structurés**
- Hiérarchie : Catégorie → Genre → Sous-genre
- Tags personnalisables par les utilisateurs
- Recherche avancée par filtres

### **2. Import et gestion des fichiers LRC**

#### **Import direct de fichiers LRC**
- Upload de fichiers `.lrc` déjà synchronisés
- Parsing automatique des timestamps `[MM:SS.ms]`
- Validation du format et extraction des métadonnées
- Publication immédiate (qualité garantie)

#### **Création de fichiers LRC**
- **Mode texte :** Saisie manuelle des paroles
- **Mode tap-to-sync :** Synchronisation audio/visuelle
- **Mode conversion :** Import TXT → Conversion LRC

#### **Export de fichiers LRC**
- Téléchargement au format `.lrc` standard
- Métadonnées incluses ([ti:], [ar:], [al:], etc.)
- Compatible avec tous les lecteurs audio

### **3. Fonctionnalités de création LRC**

#### **Éditeur tap-to-sync avancé**
```
Interface professionnelle :
- Waveform interactif
- Contrôles de lecture (skip ±5s)
- Ajustements fins (±0.05s, ±0.1s)
- Aperçu ligne actuelle/prochaine
- Barre de progression en temps réel
- Raccourcis clavier (Espace, Ctrl+Z, etc.)
```

#### **Conversion TXT vers LRC**
- Upload de fichiers `.txt` avec paroles
- Interface de synchronisation simplifiée
- Export automatique au format LRC
- Sauvegarde des deux formats (TXT + LRC)

### **4. Interface utilisateur**

#### **Page d'accueil catégorisée**
```
- Section Gospel (musique chrétienne)
  - Louange & Adoration
  - Gospel traditionnel
  - Gospel moderne
  - Hymnes

- Section World (musique mondaine)
  - Pop, Rock, Hip-Hop
  - R&B, Jazz, Reggae
  - Electro, Latin, etc.
```

#### **Page de chanson**
- Lecteur audio intégré
- Paroles synchronisées Apple Music-style
- Téléchargement LRC en un clic
- Partage sur réseaux sociaux
- Métadonnées complètes

#### **Système de recherche avancé**
- Recherche par titre/artiste/album
- Filtres par catégorie/genre/langue
- Tri par popularité/date/qualité
- Recherche plein texte dans les paroles

### **5. Système communautaire**

#### **Rôles utilisateurs**
- **Utilisateur :** Import LRC, création basique
- **Contributeur :** + Création LRC avancée
- **Validateur :** + Validation qualité LRC
- **Admin :** + Gestion globale

#### **Système de qualité**
- Notation qualité des LRC (1-5 étoiles)
- Validation par communauté
- Signalement de contenus inappropriés
- Modération automatisée

#### **Gamification**
- Points pour contributions
- Badges d'accomplissement
- Classements contributeurs
- Récompenses spéciales

## 🔧 Fonctionnalités techniques avancées

### **API REST complète**
```typescript
// Endpoints principaux
GET    /api/v1/songs           // Liste des chansons (avec filtres)
GET    /api/v1/songs/:id       // Détails chanson + LRC
POST   /api/v1/songs           // Créer chanson
PUT    /api/v1/songs/:id       // Modifier chanson

GET    /api/v1/lrc/:songId     // Télécharger LRC
POST   /api/v1/lrc/import      // Importer fichier LRC
POST   /api/v1/lrc/convert     // Convertir TXT → LRC

GET    /api/v1/genres          // Liste des genres
GET    /api/v1/search          // Recherche avancée
```

### **Optimisations performance**
- **Cache intelligent :** LRC fréquemment consultés
- **Lazy loading :** Images et audio à la demande
- **Pagination :** Grandes listes de résultats
- **CDN :** Distribution globale des fichiers

### **Sécurité et modération**
- **Validation fichiers :** Taille, type, contenu
- **Anti-spam :** Limites de taux d'upload
- **Modération :** Signalement et suppression
- **Droits d'auteur :** Marquage explicite

### **Analytics et métriques**
- Statistiques d'usage par chanson
- Taux de conversion (TXT → LRC)
- Popularité des genres
- Activité communautaire

## 📱 Interface utilisateur détaillée

### **Page de création LRC**
```
1. Sélection du mode :
   - 📝 Saisir paroles (texte)
   - 🎵 Synchroniser avec audio (tap-to-sync)
   - 📄 Convertir fichier TXT
   - 📁 Importer fichier LRC

2. Métadonnées :
   - Titre, Artiste, Album
   - Catégorie (Gospel/World)
   - Genre, Langue
   - Année de sortie

3. Upload audio :
   - MP3, WAV, M4A (max 10MB)
   - Validation durée/format

4. Éditeur selon mode :
   - Mode texte : Textarea simple
   - Mode sync : Interface professionnelle tap-to-sync
   - Mode conversion : Upload TXT + sync simplifié
   - Mode import : Upload LRC + parsing instantané
```

### **Page de visualisation**
```
- Lecteur Apple Music-like
- Paroles synchronisées avec animations fluides
- Contrôles lecture intégrés
- Téléchargement LRC en un clic
- Partage sur réseaux sociaux
- Métadonnées complètes
```

## 🚀 Plan de développement

### **Phase 1 : Noyau fonctionnel**
1. Structure base de données complète
2. Authentification et profils utilisateurs
3. Upload et stockage fichiers
4. Interface de base (upload, visualisation)

### **Phase 2 : Fonctionnalités LRC**
1. Parser LRC (import/export)
2. Éditeur tap-to-sync
3. Conversion TXT → LRC
4. Interface Apple Music

### **Phase 3 : Catégorisation avancée**
1. Système Gospel vs World
2. Genres structurés
3. Recherche et filtres avancés
4. Page d'accueil catégorisée

### **Phase 4 : Communauté**
1. Système de validation
2. Gamification et points
3. Commentaires et notation
4. Modération et administration

### **Phase 5 : Optimisations**
1. Performance et cache
2. Analytics détaillés
3. API publique
4. Applications mobiles

## 🎯 Exigences techniques

### **Contraintes techniques**
- **Limite upload :** 10MB par fichier (Vercel)
- **Formats supportés :** MP3, WAV, M4A, LRC, TXT
- **Temps de réponse :** <2s pour les requêtes standard
- **Disponibilité :** 99.9% uptime

### **Standards de qualité**
- **Format LRC :** Standard officiel avec métadonnées
- **Synchronisation :** Précision à 0.1 seconde
- **Accessibilité :** Conformité WCAG 2.1
- **Responsive :** Support mobile complet

### **Sécurité**
- **Authentification :** JWT via Supabase
- **Autorisation :** RLS sur toutes les tables
- **Validation :** Sanitisation de toutes les entrées
- **Logs :** Audit trail complet

## 📋 Fonctionnalités actuellement implémentées

### ✅ **Core fonctionnel**
- Authentification Supabase
- Upload fichiers audio (max 10MB)
- Stockage Supabase Storage
- Interface responsive Tailwind CSS

### ✅ **Système LRC**
- Import fichiers LRC synchronisés
- Parsing automatique timestamps [MM:SS.ms]
- Stockage JSONB pour paroles synchronisées
- Export format LRC standard

### ✅ **Interface Apple Music**
- Lecteur audio intégré
- Paroles synchronisées avec animations
- Design translucide et moderne
- Transitions fluides entre lignes

### ✅ **Éditeur tap-to-sync**
- Synchronisation manuelle précise
- Contrôles de lecture avancés
- Ajustements fins (±0.05s, ±0.1s)
- Aperçu en temps réel

### ✅ **Gestion utilisateurs**
- Rôles (admin, validator, contributor)
- Permissions différenciées
- Interface adaptée selon rôle

## 🔄 État actuel du projet

**URL de production :** https://lyricsync-three.vercel.app/

**Base de données :** Supabase (PostgreSQL)

**Fonctionnalités opérationnelles :**
- ✅ Upload audio + paroles synchronisées
- ✅ Import fichiers LRC (publication immédiate)
- ✅ Synchronisation manuelle tap-to-sync
- ✅ Lecture avec interface Apple Music
- ✅ Export fichiers LRC
- ✅ Gestion rôles utilisateurs

**À implémenter pour la vision complète :**
- 🔄 Séparation Gospel vs World
- 🔄 Système de genres structuré
- 🔄 Conversion TXT → LRC
- 🔄 Recherche avancée par catégories
- 🔄 Système de validation communautaire
- 🔄 Gamification et points

Ce projet représente une **base de données LRC collaborative de référence** avec une spécialisation dans la musique chrétienne, offrant des outils professionnels de création et synchronisation de paroles musicales.
