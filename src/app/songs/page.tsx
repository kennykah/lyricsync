"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { 
  Music, 
  Search, 
  Clock, 
  User, 
  Play, 
  Filter,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  Download,
  Eye
} from "lucide-react";
import type { Song } from "@/types";

type SongStatus = 'all' | 'draft' | 'pending_sync' | 'syncing' | 'synced' | 'published';

export default function SongsPage() {
  const supabase = createClient();
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SongStatus>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch songs from Supabase
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("songs")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) {
          console.error("Error fetching songs:", fetchError);
          setError("Erreur lors du chargement des chansons.");
          return;
        }

        setSongs(data || []);
        setFilteredSongs(data || []);
      } catch (err) {
        console.error("Error:", err);
        setError("Une erreur est survenue.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, [supabase]);

  // Filter songs based on search and status
  useEffect(() => {
    let result = songs;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (song) =>
          song.title.toLowerCase().includes(query) ||
          song.artist_name.toLowerCase().includes(query) ||
          (song.album && song.album.toLowerCase().includes(query))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((song) => song.status === statusFilter);
    }

    setFilteredSongs(result);
  }, [searchQuery, statusFilter, songs]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string; icon?: React.ReactNode }> = {
      draft: { text: "Brouillon", className: "bg-gray-100 text-gray-700" },
      pending_sync: { text: "À synchroniser", className: "bg-yellow-100 text-yellow-700" },
      syncing: { text: "En cours", className: "bg-blue-100 text-blue-700" },
      synced: { text: "Synchronisé", className: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      pending_validation: { text: "En validation", className: "bg-orange-100 text-orange-700" },
      published: { text: "Publié", className: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      rejected: { text: "Rejeté", className: "bg-red-100 text-red-700" },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${badge.className}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const handleDownloadLRC = async (songId: string, songTitle: string) => {
    try {
      const response = await fetch(`/api/v1/lrc/${songId}?format=lrc`);
      if (!response.ok) {
        console.error("Error downloading LRC");
        return;
      }
      const lrcContent = await response.text();
      const blob = new Blob([lrcContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${songTitle}.lrc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading LRC:", err);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Parcourir les chansons</h1>
          <p className="text-purple-100 text-lg max-w-2xl">
            Découvrez les chansons disponibles et contribuez à la synchronisation des paroles.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par titre, artiste ou album..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtres
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {showFilters && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 mr-2">Statut:</span>
                  {[
                    { value: 'all', label: 'Tous' },
                    { value: 'draft', label: 'Brouillons' },
                    { value: 'synced', label: '✅ Synchronisés' },
                    { value: 'published', label: 'Publiés' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStatusFilter(option.value as SongStatus)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        statusFilter === option.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-gray-600">
          {filteredSongs.length} chanson{filteredSongs.length !== 1 ? 's' : ''} trouvée{filteredSongs.length !== 1 ? 's' : ''}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredSongs.length === 0 && (
          <Card className="text-center py-16">
            <Music className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune chanson trouvée
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? "Essayez de modifier votre recherche."
                : "Soyez le premier à ajouter une chanson !"}
            </p>
            <Link href="/upload">
              <Button>Uploader une chanson</Button>
            </Link>
          </Card>
        )}

        {/* Songs Grid */}
        {!isLoading && !error && filteredSongs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSongs.map((song) => (
              <Card key={song.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Song Header with gradient */}
                  <div className="h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-t-lg flex items-center justify-center">
                    <Music className="h-12 w-12 text-white/50" />
                  </div>
                  
                  {/* Song Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {song.title}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {song.artist_name}
                        </p>
                      </div>
                      {getStatusBadge(song.status)}
                    </div>

                    {song.album && (
                      <p className="text-xs text-gray-400 mb-2 truncate">
                        Album: {song.album}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(song.duration_seconds)}
                      </span>
                      {song.release_year && (
                        <span>{song.release_year}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {['synced', 'published'].includes(song.status) ? (
                        <>
                          <Link href={`/sync/${song.id}`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full">
                              <Eye className="h-4 w-4 mr-1" />
                              Voir
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            onClick={() => handleDownloadLRC(song.id, song.title)}
                            title="Télécharger le fichier LRC"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Link href={`/sync/${song.id}`} className="flex-1">
                          <Button size="sm" className="w-full">
                            <Play className="h-4 w-4 mr-1" />
                            Synchroniser
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to action */}
        <div className="mt-12 text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Vous ne trouvez pas votre chanson ?
          </h2>
          <p className="text-gray-600 mb-6">
            Ajoutez-la à notre bibliothèque et commencez à synchroniser les paroles.
          </p>
          <Link href="/upload">
            <Button size="lg">
              <Music className="h-5 w-5 mr-2" />
              Uploader une chanson
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
