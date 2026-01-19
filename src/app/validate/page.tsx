// Page de validation des synchronisations LyricSync
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  CheckCircle,
  XCircle,
  Clock,
  Music,
  User,
  AlertCircle,
  ArrowLeft
} from "lucide-react";

interface PendingValidation {
  id: string;
  title: string;
  artist_name: string;
  submitted_by: {
    username: string;
    display_name: string;
  } | null;
  created_at: string;
  lrc_file: {
    synced_lyrics: any[];
    source: string;
  } | null;
}

export default function ValidatePage() {
  const supabase = createClient();
  const { user } = useAuth();

  const [pendingValidations, setPendingValidations] = useState<PendingValidation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check user role
  useEffect(() => {
    if (!user) return;

    const checkRole = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setUserRole(profile?.role || null);
    };

    checkRole();
  }, [user, supabase]);

  // Fetch pending validations
  useEffect(() => {
    if (!userRole || !["validator", "admin"].includes(userRole)) {
      setIsLoading(false);
      return;
    }

    const fetchPendingValidations = async () => {
      setIsLoading(true);
      setError("");

      try {
        const { data, error: fetchError } = await supabase
          .from("songs")
          .select(`
            id,
            title,
            artist_name,
            created_at,
            submitted_by (
              username,
              display_name
            ),
            lrc_files (
              synced_lyrics,
              source
            )
          `)
          .eq("status", "pending_validation")
          .order("created_at", { ascending: false });

        if (fetchError) {
          setError("Erreur lors du chargement: " + fetchError.message);
          setIsLoading(false);
          return;
        }

        // Transform data
        const transformedData = data.map((song: any) => ({
          id: song.id,
          title: song.title,
          artist_name: song.artist_name,
          submitted_by: song.submitted_by,
          created_at: song.created_at,
          lrc_file: song.lrc_files?.[0] || null
        }));

        setPendingValidations(transformedData);
        setIsLoading(false);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Une erreur inattendue s'est produite");
        setIsLoading(false);
      }
    };

    fetchPendingValidations();
  }, [supabase, userRole]);

  // Handle validation actions
  const handleValidation = async (songId: string, action: "approve" | "reject") => {
    if (!user) return;

    try {
      const newStatus = action === "approve" ? "approved" : "rejected";

      // Update song status
      const { error: songError } = await supabase
        .from("songs")
        .update({ status: newStatus })
        .eq("id", songId);

      if (songError) {
        setError("Erreur lors de la validation: " + songError.message);
        return;
      }

      // Update LRC file with validator info
      const { error: lrcError } = await supabase
        .from("lrc_files")
        .update({
          validated_by: user.id,
          validated_at: new Date().toISOString()
        })
        .eq("song_id", songId);

      if (lrcError) {
        console.error("Error updating LRC file:", lrcError);
      }

      // Create contribution record
      await supabase
        .from("contributions")
        .insert({
          user_id: user.id,
          song_id: songId,
          type: "validation",
          points_earned: action === "approve" ? 10 : 5
        });

      // Remove from pending list
      setPendingValidations(prev => prev.filter(song => song.id !== songId));

      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Validation error:", err);
      setError("Erreur inattendue lors de la validation");
    }
  };

  // Check if user can validate
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès refusé</h2>
            <p className="text-gray-600 mb-6">Vous devez être connecté pour accéder à cette page.</p>
            <Link href="/auth/login">
              <Button>Se connecter</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userRole || !["validator", "admin"].includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès restreint</h2>
            <p className="text-gray-600 mb-6">Vous n'avez pas les permissions pour valider les synchronisations.</p>
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des validations en attente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Validation des synchronisations</h1>
              <p className="text-gray-600">Vérifiez et validez les paroles synchronisées</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600">{pendingValidations.length}</p>
            <p className="text-sm text-gray-600">en attente</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Pending validations */}
        {pendingValidations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune validation en attente</h3>
              <p className="text-gray-600">Toutes les synchronisations ont été validées !</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {pendingValidations.map((song) => (
              <Card key={song.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Music className="h-6 w-6 text-purple-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{song.title}</h3>
                        <p className="text-sm text-gray-600">{song.artist_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {new Date(song.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Par: {song.submitted_by?.display_name || song.submitted_by?.username || "Anonyme"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Source: {song.lrc_file?.source === "ai" ? "🤖 IA" : "👤 Manuel"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Lignes: {song.lrc_file?.synced_lyrics?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Preview of synced lyrics */}
                  {song.lrc_file?.synced_lyrics && song.lrc_file.synced_lyrics.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-gray-900 mb-3">Aperçu des paroles synchronisées</h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {song.lrc_file.synced_lyrics.slice(0, 5).map((line: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            <span className="text-purple-600 font-mono min-w-[60px]">
                              [{formatTime(line.time)}]
                            </span>
                            <span className="text-gray-700 truncate">{line.text}</span>
                          </div>
                        ))}
                        {song.lrc_file.synced_lyrics.length > 5 && (
                          <p className="text-xs text-gray-500 mt-2">
                            ... et {song.lrc_file.synced_lyrics.length - 5} autres lignes
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <Link href={`/sync/${song.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        👁️ Examiner
                      </Button>
                    </Link>
                    <Button
                      onClick={() => handleValidation(song.id, "reject")}
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                    <Button
                      onClick={() => handleValidation(song.id, "approve")}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}
