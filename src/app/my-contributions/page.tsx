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
  Clock, 
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Trophy,
  Edit,
  Eye,
  Filter
} from "lucide-react";

interface Contribution {
  id: string;
  song_id: string;
  type: string;
  points_earned: number;
  created_at: string;
  song?: {
    title: string;
    artist_name: string;
    status: string;
  };
}

type FilterType = 'all' | 'sync' | 'correction' | 'validation';

export default function MyContributionsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>('all');

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/my-contributions");
    }
  }, [user, authLoading, router]);

  // Fetch user contributions
  useEffect(() => {
    const fetchContributions = async () => {
      if (!user) return;
      
      try {
        // First try to get contributions
        const { data: contribData, error: contribError } = await supabase
          .from("contributions")
          .select(`
            id,
            song_id,
            type,
            points_earned,
            created_at
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (contribError) {
          console.error("Error fetching contributions:", contribError);
          // If contributions table doesn't exist, show empty state
          setContributions([]);
          setIsLoading(false);
          return;
        }

        // Get song details for each contribution
        if (contribData && contribData.length > 0) {
          const songIds = [...new Set(contribData.map(c => c.song_id))];
          const { data: songsData } = await supabase
            .from("songs")
            .select("id, title, artist_name, status")
            .in("id", songIds);

          const songsMap = new Map(songsData?.map(s => [s.id, s]) || []);
          
          const enrichedContributions = contribData.map(contrib => ({
            ...contrib,
            song: songsMap.get(contrib.song_id),
          }));

          setContributions(enrichedContributions);
        } else {
          setContributions([]);
        }
      } catch (err) {
        console.error("Error:", err);
        setError("Une erreur est survenue.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchContributions();
    }
  }, [supabase, user]);

  const filteredContributions = contributions.filter(c => 
    filter === 'all' || c.type === filter
  );

  const stats = {
    total: contributions.length,
    syncs: contributions.filter(c => c.type === 'sync').length,
    corrections: contributions.filter(c => c.type === 'correction').length,
    validations: contributions.filter(c => c.type === 'validation').length,
    totalPoints: contributions.reduce((sum, c) => sum + (c.points_earned || 0), 0),
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sync':
        return <Music className="h-4 w-4 text-purple-600" />;
      case 'correction':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'validation':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Music className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      sync: { text: "Synchronisation", className: "bg-purple-100 text-purple-700" },
      correction: { text: "Correction", className: "bg-blue-100 text-blue-700" },
      validation: { text: "Validation", className: "bg-green-100 text-green-700" },
    };
    const badge = badges[type] || { text: type, className: "bg-gray-100 text-gray-700" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Mes contributions</h1>
          <p className="text-gray-600 mt-1">
            Historique de toutes vos contributions à LyricSync
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.syncs}</div>
              <div className="text-sm text-gray-500">Syncs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.corrections}</div>
              <div className="text-sm text-gray-500">Corrections</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.validations}</div>
              <div className="text-sm text-gray-500">Validations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.totalPoints}</div>
              <div className="text-sm text-gray-500">Points gagnés</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Tout' },
              { value: 'sync', label: 'Synchronisations' },
              { value: 'correction', label: 'Corrections' },
              { value: 'validation', label: 'Validations' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value as FilterType)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filter === option.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
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
        {!isLoading && !error && filteredContributions.length === 0 && (
          <Card className="text-center py-16">
            <Music className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {contributions.length === 0 
                ? "Aucune contribution pour le moment"
                : "Aucune contribution de ce type"
              }
            </h3>
            <p className="text-gray-500 mb-6">
              {contributions.length === 0 
                ? "Commencez à synchroniser des paroles pour voir vos contributions ici."
                : "Essayez de modifier le filtre."
              }
            </p>
            {contributions.length === 0 && (
              <Link href="/contribute">
                <Button>
                  <Music className="h-4 w-4 mr-2" />
                  Commencer à contribuer
                </Button>
              </Link>
            )}
          </Card>
        )}

        {/* Contributions list */}
        {!isLoading && !error && filteredContributions.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredContributions.map((contribution) => (
                  <div
                    key={contribution.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        {getTypeIcon(contribution.type)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {contribution.song?.title || "Chanson supprimée"}
                          </h4>
                          {getTypeBadge(contribution.type)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {contribution.song && (
                            <span>{contribution.song.artist_name}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(contribution.created_at)}
                          </span>
                          {contribution.song && (
                            <span className="flex items-center gap-1">
                              {getStatusIcon(contribution.song.status)}
                              {contribution.song.status === 'published' ? 'Publié' : 
                               contribution.song.status === 'rejected' ? 'Rejeté' : 'En attente'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Trophy className="h-4 w-4" />
                          <span className="font-bold">+{contribution.points_earned || 0}</span>
                        </div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>

                      {/* Action */}
                      {contribution.song && (
                        <Link href={`/sync/${contribution.song_id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to action */}
        <div className="mt-12 text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8">
          <Trophy className="h-12 w-12 mx-auto text-purple-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Continuez à contribuer !
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Chaque synchronisation vous rapporte des points et aide la communauté.
          </p>
          <Link href="/contribute">
            <Button size="lg">
              <Music className="h-5 w-5 mr-2" />
              Nouvelle contribution
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
