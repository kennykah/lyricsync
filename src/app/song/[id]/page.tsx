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
  Pause
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
        // Fetch song
        const { data: songData, error: songError } = await supabase
          .from("songs")
          .select("*")
          .eq("id", songId)
          .eq("status", "published")
          .single();

        if (songError || !songData) {
          setError("Chanson introuvable ou non publiée");
          setIsLoading(false);
          return;
        }

        setSong(songData);

        // Fetch synced lyrics
        const { data: lyricsData, error: lyricsError } = await supabase
          .from("lrc_files")
          .select("synced_lyrics, source, validated_by, validated_at")
          .eq("song_id", songId)
          .single();

        if (lyricsError) {
          console.warn("No synced lyrics found:", lyricsError);
          setLyrics(null);
        } else {
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

          {/* Right: Lyrics */}
          <div>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
                  <span>Paroles synchronisées</span>
                  <span className="text-sm text-gray-500">
                    {formatTime(currentTime)}
                  </span>
                </h3>

                {!lyrics?.synced_lyrics ? (
                  <div className="text-center py-12">
                    <Music className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Les paroles ne sont pas encore synchronisées pour cette chanson.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
                    {lyrics.synced_lyrics.map((line, index) => (
                      <div
                        key={index}
                        id={`line-${index}`}
                        className={`p-3 rounded-lg transition-all duration-300 ${
                          index === currentLineIndex
                            ? "bg-purple-100 text-purple-900 font-semibold border-l-4 border-purple-500 scale-[1.02]"
                            : index < currentLineIndex
                            ? "bg-green-50 text-green-700 border-l-4 border-green-500"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 font-mono min-w-[50px]">
                            {formatTime(line.time)}
                          </span>
                          <span className="flex-1">{line.text}</span>
                          {index === currentLineIndex && (
                            <Play className="h-4 w-4 text-purple-600 animate-pulse" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
