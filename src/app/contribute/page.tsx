"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { 
  Music, 
  Play, 
  Clock, 
  User,
  Loader2,
  AlertCircle,
  Upload,
  ArrowRight,
  Sparkles,
  Target,
  Trophy
} from "lucide-react";
import type { Song } from "@/types";

export default function ContributePage() {
  const supabase = createClient();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/contribute");
    }
  }, [user, authLoading, router]);

  // Fetch songs that need synchronization
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("songs")
          .select("*")
          .in("status", ["draft", "pending_sync", "submitted"])
          .order("created_at", { ascending: false })
          .limit(12);

        if (fetchError) {
          console.error("Error fetching songs:", fetchError);
          setError("Erreur lors du chargement des chansons.");
          return;
        }

        setSongs(data || []);
      } catch (err) {
        console.error("Error:", err);
        setError("Une erreur est survenue.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchSongs();
    }
  }, [supabase, user]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Don't render if not logged in
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-8 w-8" />
            <h1 className="text-4xl font-bold">Contribuer</h1>
          </div>
          <p className="text-white/80 text-lg max-w-2xl mb-8">
            Aidez la communauté en synchronisant les paroles de vos chansons préférées.
            Gagnez des points et montez dans le classement !
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Target className="h-6 w-6 mb-2" />
              <div className="text-2xl font-bold">{songs.length}</div>
              <div className="text-sm text-white/70">Chansons à synchroniser</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Trophy className="h-6 w-6 mb-2" />
              <div className="text-2xl font-bold">10</div>
              <div className="text-sm text-white/70">Points par sync</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Music className="h-6 w-6 mb-2" />
              <div className="text-2xl font-bold">5</div>
              <div className="text-sm text-white/70">Bonus validation</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Ajouter une nouvelle chanson
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Uploadez un fichier audio avec ses paroles pour commencer.
                  </p>
                  <Link href="/upload">
                    <Button size="sm">
                      Uploader
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Music className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Parcourir toutes les chansons
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Découvrez l'ensemble de la bibliothèque musicale.
                  </p>
                  <Link href="/songs">
                    <Button size="sm" variant="outline">
                      Parcourir
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Songs to sync */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Chansons à synchroniser
            </h2>
            <Link href="/songs" className="text-purple-600 text-sm font-medium hover:underline">
              Voir tout
            </Link>
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
          {!isLoading && !error && songs.length === 0 && (
            <Card className="text-center py-16">
              <Music className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Toutes les chansons sont synchronisées !
              </h3>
              <p className="text-gray-500 mb-6">
                Soyez le premier à ajouter une nouvelle chanson.
              </p>
              <Link href="/upload">
                <Button>Uploader une chanson</Button>
              </Link>
            </Card>
          )}

          {/* Songs Grid */}
          {!isLoading && !error && songs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {songs.map((song) => (
                <Card key={song.id} className="hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardContent className="p-0">
                    {/* Song Header */}
                    <div className="h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-t-lg flex items-center justify-center relative">
                      <Music className="h-10 w-10 text-white/50" />
                      <div className="absolute top-2 right-2 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white">
                        +10 pts
                      </div>
                    </div>
                    
                    {/* Song Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 truncate mb-1">
                        {song.title}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                        <User className="h-3 w-3" />
                        {song.artist_name}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(song.duration_seconds)}
                        </span>
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          À synchroniser
                        </span>
                      </div>

                      <Link href={`/sync/${song.id}`}>
                        <Button className="w-full">
                          <Play className="h-4 w-4 mr-2" />
                          Synchroniser
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <Card className="mt-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Comment ça marche ?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-purple-600">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Choisissez une chanson</h3>
                <p className="text-sm text-gray-600">
                  Sélectionnez une chanson qui n'a pas encore été synchronisée.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-pink-600">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Synchronisez les paroles</h3>
                <p className="text-sm text-gray-600">
                  Appuyez sur Espace pour marquer le début de chaque ligne.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-orange-600">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Gagnez des points</h3>
                <p className="text-sm text-gray-600">
                  Recevez des points et montez dans le classement !
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
