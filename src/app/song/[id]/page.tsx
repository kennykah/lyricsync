// Page de lecture publique des chansons synchronisées LyricSync
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import AudioPlayer, { AudioPlayerRef } from "@/components/ui/AudioPlayer";
import Waveform, { WaveformRef } from "@/components/ui/Waveform";
import { Card, CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  ArrowLeft,
  Music,
  User,
  Clock,
  Download,
  Share2,
  Heart,
  AlertCircle,
  Play,
  Pause,
  Edit
} from "lucide-react";

interface Song {
  id: string;
  title: string;
  artist_name: string;
  album?: string;
  audio_url: string;
  lyrics_text: string;
  duration_seconds?: number;
  release_year?: number;
  status: string;
}

interface SyncedLyrics {
  synced_lyrics: Array<{ time: number; text: string }>;
  source: string;
  validated_by?: string;
  validated_at?: string;
}

export default function SongPlayerPage() {
  const router = useRouter();
  const params = useParams();
  const songId = params.id as string;
  const supabase = createClient();
  const { user, profile } = useAuth();

  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const waveformRef = useRef<WaveformRef>(null);

  const [song, setSong] = useState<Song | null>(null);
  const [lyrics, setLyrics] = useState<SyncedLyrics | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch song and lyrics
  useEffect(() => {
    if (!songId) {
      setError("ID de chanson manquant");
      setIsLoading(false);
      return;
    }

    const fetchSongData = async () => {
      setIsLoading(true);
      setError("");

      try {
        // Check if user is admin/validator to allow viewing pending songs
        const isAdminOrValidator = profile?.role === 'admin' || profile?.role === 'validator';

        // Fetch song
        let query = supabase
          .from("songs")
          .select("*")
          .eq("id", songId);

        // If not admin/validator, only show published songs
        if (!isAdminOrValidator) {
          query = query.eq("status", "published");
        }

        const { data: songData, error: songError } = await query.single();

        if (songError || !songData) {
          if (!isAdminOrValidator && songError?.code === 'PGRST116') {
            setError("Chanson en attente de validation par les modérateurs");
          } else {
            setError("Chanson introuvable");
          }
          setIsLoading(false);
          return;
        }

        // If song is pending validation and user is not admin/validator, show message
        if (songData.status === 'pending_validation' && !isAdminOrValidator) {
          setError("Cette chanson est en attente de validation par les modérateurs");
          setIsLoading(false);
          return;
        }

        setSong(songData);

        // Fetch synced lyrics - try multiple queries in case of RLS issues
        console.log("Fetching synced lyrics for song:", songId);

        // First try the normal query
        let { data: lyricsData, error: lyricsError } = await supabase
          .from("lrc_files")
          .select("synced_lyrics, source, validated_by, validated_at")
          .eq("song_id", songId)
          .single();

        console.log("Lyrics fetch result:", { data: lyricsData, error: lyricsError });

        // If no data found, try without .single() to see if there are multiple rows or RLS issues
        if (lyricsError && lyricsError.code === 'PGRST116') {
          console.log("Trying alternative query without .single()...");
          const { data: lyricsArray, error: arrayError } = await supabase
            .from("lrc_files")
            .select("synced_lyrics, source, validated_by, validated_at")
            .eq("song_id", songId);

          console.log("Alternative query result:", { data: lyricsArray, error: arrayError });

          if (!arrayError && lyricsArray && lyricsArray.length > 0) {
            lyricsData = lyricsArray[0]; // Take the first one
            lyricsError = null;
            console.log("Using first LRC entry found");
          }
        }

        if (lyricsError || !lyricsData) {
          console.warn("No synced lyrics found:", lyricsError);
          setLyrics(null);
        } else {
          console.log("Synced lyrics loaded:", lyricsData);
          console.log("Number of synced lines:", lyricsData?.synced_lyrics?.length);
          console.log("Sample synced lines:", lyricsData?.synced_lyrics?.slice(0, 3));
          setLyrics(lyricsData);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Une erreur inattendue s'est produite");
        setIsLoading(false);
      }
    };

    fetchSongData();
  }, [songId, supabase]);

  // Update current line based on playback time
  useEffect(() => {
    if (!lyrics?.synced_lyrics) return;

    const currentIndex = lyrics.synced_lyrics.findIndex((line, index) => {
      const nextLine = lyrics.synced_lyrics[index + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
    });

    setCurrentLineIndex(currentIndex);
  }, [currentTime, lyrics]);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleWaveformSeek = (time: number) => {
    setCurrentTime(time);
    audioPlayerRef.current?.seek(time);
  };

  const handleDownloadLRC = () => {
    if (!lyrics?.synced_lyrics || !song) return;

    const lrcContent = [
      `[ti:${song.title}]`,
      `[ar:${song.artist_name}]`,
      `[by:LyricSync]`,
      "",
      ...lyrics.synced_lyrics.map((line) => {
        const mins = Math.floor(line.time / 60);
        const secs = (line.time % 60).toFixed(2).padStart(5, "0");
        return `[${mins.toString().padStart(2, "0")}:${secs}]${line.text}`;
      }),
    ].join("\n");

    const blob = new Blob([lrcContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${song.title}.lrc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const scrollToCurrentLine = () => {
    if (currentLineIndex >= 0) {
      const element = document.getElementById(`line-${currentLineIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  useEffect(() => {
    scrollToCurrentLine();
  }, [currentLineIndex]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la chanson...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !song) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-6">{error || "Chanson introuvable"}</p>
            <Link href="/songs">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux chansons
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/songs">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{song.title}</h1>
              <p className="text-gray-600 text-lg">{song.artist_name}</p>
              {song.album && (
                <p className="text-gray-500">{song.album}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile?.role === "admin" && (
              <Link href={`/sync/${songId}`}>
                <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={handleDownloadLRC}>
              <Download className="h-4 w-4 mr-2" />
              LRC
            </Button>
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Audio Player & Waveform */}
          <div className="space-y-6">
            {/* Audio Player */}
            <Card>
              <CardContent className="pt-6">
                <AudioPlayer
                  ref={audioPlayerRef}
                  src={song.audio_url}
                  onTimeUpdate={handleTimeUpdate}
                />
              </CardContent>
            </Card>

            {/* Waveform */}
            <Card>
              <CardContent className="pt-6">
                <Waveform
                  ref={waveformRef}
                  src={song.audio_url}
                  currentTime={currentTime}
                  onSeek={handleWaveformSeek}
                />
              </CardContent>
            </Card>

            {/* Song Info */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Informations</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Titre: {song.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Artiste: {song.artist_name}</span>
                  </div>
                  {song.album && (
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Album: {song.album}</span>
                    </div>
                  )}
                  {song.duration_seconds && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Durée: {Math.floor(song.duration_seconds / 60)}:
                        {(song.duration_seconds % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                  )}
                  {song.release_year && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Année: {song.release_year}</span>
                    </div>
                  )}
                  {lyrics && (
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-400" />
                      <span className="text-gray-600">
                        Synchronisation: {lyrics.source === "ai" ? "IA" : "Manuelle"}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Lyrics - Apple Music Style */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-lg">
              {/* Background with blur effect like Apple Music */}
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}
              >
                {/* Lyrics Display - Centered like Apple Music */}
                <div className="relative min-h-[500px] flex flex-col items-center justify-center p-8">
                  {!lyrics?.synced_lyrics ? (
                    <div className="text-center">
                      <Music className="h-20 w-20 text-white/50 mx-auto mb-6" />
                      <p className="text-white/80 text-lg">
                        Paroles non disponibles
                      </p>
                    </div>
                  ) : (
                    <div className="relative w-full">
                      {/* Previous lines - blurred and smaller with smooth transitions */}
                      {lyrics.synced_lyrics
                        .slice(Math.max(0, currentLineIndex - 2), currentLineIndex)
                        .map((line, index) => {
                          const actualIndex = Math.max(0, currentLineIndex - 2) + index;
                          const distance = currentLineIndex - actualIndex;
                          return (
                            <div
                              key={`prev-${actualIndex}`}
                              className="text-center mb-6 transition-all duration-1000 ease-out"
                              style={{
                                opacity: Math.max(0.1, 0.4 - (distance * 0.1)),
                                transform: `scale(${Math.max(0.75, 0.85 - (distance * 0.05))}) translateY(${-20 - (distance * 5)}px)`,
                                filter: `blur(${distance * 0.8}px)`,
                                transitionDelay: `${index * 50}ms`
                              }}
                            >
                              <p className="text-white/50 text-base font-light tracking-wide leading-relaxed">
                                {line.text}
                              </p>
                            </div>
                          );
                        })}

                      {/* Current line - highlighted and large with smooth entrance */}
                      {currentLineIndex >= 0 && currentLineIndex < lyrics.synced_lyrics.length && (
                        <div
                          className="text-center mb-12 transition-all duration-700 ease-out"
                          style={{
                            opacity: 1,
                            transform: 'scale(1.15) translateY(0px)',
                            filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))'
                          }}
                        >
                          <p className="text-white text-4xl font-medium leading-relaxed mb-6 tracking-wide">
                            {lyrics.synced_lyrics[currentLineIndex].text}
                          </p>
                          {/* Progress indicator - elegant and smooth */}
                          <div className="w-full max-w-sm mx-auto bg-white/5 rounded-full h-1 overflow-hidden backdrop-blur-sm">
                            <div
                              className="bg-gradient-to-r from-white/80 to-white rounded-full h-full transition-all duration-150 ease-linear shadow-lg"
                              style={{
                                width: currentLineIndex < lyrics.synced_lyrics.length - 1
                                  ? `${((currentTime - lyrics.synced_lyrics[currentLineIndex].time) /
                                      (lyrics.synced_lyrics[currentLineIndex + 1].time - lyrics.synced_lyrics[currentLineIndex].time)) * 100}%`
                                  : '100%',
                                boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Next lines - cascading visibility with smooth transitions */}
                      {lyrics.synced_lyrics
                        .slice(currentLineIndex + 1, currentLineIndex + 5)
                        .map((line, index) => {
                          const actualIndex = currentLineIndex + 1 + index;
                          const distance = index + 1;
                          return (
                            <div
                              key={`next-${actualIndex}`}
                              className="text-center mb-5 transition-all duration-1200 ease-out"
                              style={{
                                opacity: Math.max(0.08, 0.45 - (distance * 0.08)),
                                transform: `scale(${Math.max(0.6, 0.8 - (distance * 0.06))}) translateY(${15 + (distance * 10)}px)`,
                                filter: `blur(${distance * 0.6}px)`,
                                transitionDelay: `${(index + 1) * 100}ms`
                              }}
                            >
                              <p className="text-white/40 text-lg font-light tracking-wide leading-relaxed">
                                {line.text}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Time indicator - more elegant */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <span className="text-white/70 text-sm font-mono bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                    {formatTime(currentTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
