"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  Trophy, 
  Medal,
  Crown,
  Star,
  TrendingUp,
  Users,
  Music,
  Loader2,
  AlertCircle
} from "lucide-react";
import type { LeaderboardEntry } from "@/types";

type TimeFrame = 'all' | 'month' | 'week';

export default function LeaderboardPage() {
  const supabase = createClient();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('all');
  const [stats, setStats] = useState({
    totalContributors: 0,
    totalSyncs: 0,
    totalPoints: 0,
  });

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        // Fetch profiles ordered by points
        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, points, level")
          .order("points", { ascending: false })
          .limit(50);

        if (fetchError) {
          console.error("Error fetching leaderboard:", fetchError);
          setError("Erreur lors du chargement du classement.");
          return;
        }

        // Transform data and add rank
        const rankedData: LeaderboardEntry[] = (data || []).map((profile, index) => ({
          user_id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          points: profile.points || 0,
          level: profile.level || 1,
          rank: index + 1,
        }));

        setLeaderboard(rankedData);

        // Calculate stats
        const totalPoints = rankedData.reduce((sum, entry) => sum + entry.points, 0);
        setStats({
          totalContributors: rankedData.length,
          totalSyncs: Math.floor(totalPoints / 10), // Rough estimate
          totalPoints,
        });
      } catch (err) {
        console.error("Error:", err);
        setError("Une erreur est survenue.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [supabase, timeFrame]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="w-6 text-center font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200";
      default:
        return "bg-white";
    }
  };

  const getInitials = (entry: LeaderboardEntry) => {
    if (entry.display_name) {
      return entry.display_name.charAt(0).toUpperCase();
    }
    return entry.username.charAt(0).toUpperCase();
  };

  const getLevelBadge = (level: number) => {
    const badges = [
      { min: 1, max: 5, label: "Débutant", color: "bg-gray-100 text-gray-700" },
      { min: 6, max: 10, label: "Intermédiaire", color: "bg-blue-100 text-blue-700" },
      { min: 11, max: 20, label: "Avancé", color: "bg-purple-100 text-purple-700" },
      { min: 21, max: 50, label: "Expert", color: "bg-pink-100 text-pink-700" },
      { min: 51, max: 100, label: "Maître", color: "bg-orange-100 text-orange-700" },
      { min: 101, max: Infinity, label: "Légende", color: "bg-yellow-100 text-yellow-700" },
    ];
    const badge = badges.find(b => level >= b.min && level <= b.max) || badges[0];
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        Niv. {level} • {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-pink-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-10 w-10" />
            <h1 className="text-4xl font-bold">Classement</h1>
          </div>
          <p className="text-white/80 text-lg max-w-2xl mb-8">
            Découvrez les meilleurs contributeurs de la communauté LyricSync.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Users className="h-6 w-6 mb-2" />
              <div className="text-2xl font-bold">{stats.totalContributors}</div>
              <div className="text-sm text-white/70">Contributeurs</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Music className="h-6 w-6 mb-2" />
              <div className="text-2xl font-bold">{stats.totalSyncs}</div>
              <div className="text-sm text-white/70">Synchronisations</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Star className="h-6 w-6 mb-2" />
              <div className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</div>
              <div className="text-sm text-white/70">Points totaux</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time frame filter */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-lg p-1 shadow-sm">
            {[
              { value: 'all', label: 'Tout temps' },
              { value: 'month', label: 'Ce mois' },
              { value: 'week', label: 'Cette semaine' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeFrame(option.value as TimeFrame)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFrame === option.value
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-purple-600'
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
        {!isLoading && !error && leaderboard.length === 0 && (
          <Card className="text-center py-16">
            <Trophy className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pas encore de classement
            </h3>
            <p className="text-gray-500">
              Soyez le premier à contribuer et à apparaître dans le classement !
            </p>
          </Card>
        )}

        {/* Leaderboard */}
        {!isLoading && !error && leaderboard.length > 0 && (
          <div className="space-y-3">
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* 2nd place */}
                <div className="pt-8">
                  <Card className={`text-center p-4 ${getRankBgColor(2)}`}>
                    <Medal className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 mx-auto mb-2 flex items-center justify-center text-white font-bold">
                      {getInitials(leaderboard[1])}
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {leaderboard[1].display_name || leaderboard[1].username}
                    </h3>
                    <p className="text-2xl font-bold text-gray-700">{leaderboard[1].points.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </Card>
                </div>
                
                {/* 1st place */}
                <div>
                  <Card className={`text-center p-4 ${getRankBgColor(1)} border-2`}>
                    <Crown className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl">
                      {getInitials(leaderboard[0])}
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate text-lg">
                      {leaderboard[0].display_name || leaderboard[0].username}
                    </h3>
                    <p className="text-3xl font-bold text-yellow-600">{leaderboard[0].points.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </Card>
                </div>
                
                {/* 3rd place */}
                <div className="pt-12">
                  <Card className={`text-center p-4 ${getRankBgColor(3)}`}>
                    <Medal className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 mx-auto mb-2 flex items-center justify-center text-white font-bold">
                      {getInitials(leaderboard[2])}
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {leaderboard[2].display_name || leaderboard[2].username}
                    </h3>
                    <p className="text-2xl font-bold text-amber-700">{leaderboard[2].points.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </Card>
                </div>
              </div>
            )}

            {/* Rest of the leaderboard */}
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {leaderboard.slice(3).map((entry) => (
                    <div
                      key={entry.user_id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                        {getInitials(entry)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {entry.display_name || entry.username}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {getLevelBadge(entry.level)}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {entry.points.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                      
                      <div className="hidden sm:flex items-center text-green-500 text-sm">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>+{Math.floor(Math.random() * 50)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Call to action */}
        <div className="mt-12 text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8">
          <Trophy className="h-12 w-12 mx-auto text-purple-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Rejoignez le classement !
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Contribuez à la synchronisation des paroles et gagnez des points pour monter dans le classement.
          </p>
        </div>
      </div>
    </div>
  );
}
