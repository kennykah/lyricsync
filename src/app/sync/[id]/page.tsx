// Page d'édition Tap-to-Sync pour LyricSync
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import AudioPlayer, { AudioPlayerRef } from "@/components/ui/AudioPlayer";
import Waveform, { WaveformRef } from "@/components/ui/Waveform";
import { Card, CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  ArrowLeft,
  Download,
  Undo2,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Keyboard,
  Settings,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Edit3
} from "lucide-react";
import Link from "next/link";

interface SyncedLine {
  time: number;
  text: string;
}

interface Song {
  id: string;
  title: string;
  artist_name: string;
  audio_url: string;
  lyrics_text: string;
}

export default function SyncEditorPage() {
  const router = useRouter();
  const params = useParams();
  const songId = params.id as string;
  const supabase = createClient();
  const { user } = useAuth();

  // Refs
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const waveformRef = useRef<WaveformRef>(null);

  // State
  const [song, setSong] = useState<Song | null>(null);
  const [currentLine, setCurrentLine] = useState(0);
  const [syncedLyrics, setSyncedLyrics] = useState<SyncedLine[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [syncDelay, setSyncDelay] = useState(0); // Délai en ms avant enregistrement
  const [lastTapTime, setLastTapTime] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Fetch song data
  useEffect(() => {
    if (!songId) {
      setError("ID de chanson manquant");
      setIsLoading(false);
      return;
    }

    const fetchSong = async () => {
      setIsLoading(true);
      setError("");

      console.log("Fetching song with ID:", songId);

      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<{ data: null; error: { message: string; code: string } }>((_, resolve) => {
          setTimeout(() => resolve({ data: null, error: { message: "timeout", code: "TIMEOUT" } }), 10000);
        });

        const fetchPromise = supabase
          .from("songs")
          .select("*")
          .eq("id", songId)
          .single();

        const { data, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]);

        console.log("Fetch result:", { data, error: fetchError });

        if (fetchError) {
          console.error("Fetch error:", fetchError);
          if (fetchError.code === "PGRST116") {
            setError("Chanson introuvable (ID: " + songId + ")");
          } else if (fetchError.code === "TIMEOUT") {
            setError("Le chargement a pris trop de temps. Veuillez réessayer.");
          } else {
            setError("Erreur lors du chargement: " + fetchError.message);
          }
          setIsLoading(false);
          return;
        }

        if (!data) {
          setError("Chanson introuvable");
          setIsLoading(false);
          return;
        }

        console.log("Song loaded:", data.title);
        setSong(data);
        setIsLoading(false);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Une erreur inattendue s'est produite");
        setIsLoading(false);
      }
    };

    fetchSong();
  }, [songId, supabase]);

  // Get lyrics lines
  const lines = song?.lyrics_text?.split(/\r?\n/).filter((line) => line.trim() !== "") || [];

  // Handle time update from AudioPlayer
  const handleTimeUpdate = useCallback((time: number) => {
    setAudioTime(time);
  }, []);

  // Handle seek from Waveform
  const handleWaveformSeek = useCallback((time: number) => {
    setAudioTime(time);
    audioPlayerRef.current?.seek(time);
  }, []);

  // Start syncing
  const handleStartSync = useCallback(() => {
    if (!song || lines.length === 0) return;
    setIsSyncing(true);
    setSyncedLyrics([]);
    setCurrentLine(0);
    setSuccess("");
    setError("");
    // Start playing
    audioPlayerRef.current?.play();
  }, [song, lines.length]);

  // Auto-scroll to current line
  useEffect(() => {
    if (isSyncing && currentLine > 0) {
      const lineElement = document.getElementById(`line-${currentLine}`);
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLine, isSyncing]);

  // Adjust last timestamp
  const adjustLastTimestamp = useCallback((adjustment: number) => {
    if (syncedLyrics.length === 0) return;

    setSyncedLyrics(prev => {
      const newLyrics = [...prev];
      const lastIndex = newLyrics.length - 1;
      const currentTime = newLyrics[lastIndex].time;
      const newTime = Math.max(0, currentTime + adjustment);

      newLyrics[lastIndex] = {
        ...newLyrics[lastIndex],
        time: newTime
      };

      return newLyrics;
    });
  }, [syncedLyrics]);

  // Tap to sync current line
  const handleTap = useCallback(() => {
    if (!isSyncing || currentLine >= lines.length) return;
    
    setSyncedLyrics((prev) => [...prev, { time: audioTime, text: lines[currentLine] }]);
    setCurrentLine((prev) => prev + 1);
  }, [isSyncing, currentLine, lines, audioTime]);

  // Undo last sync
  const handleUndo = useCallback(() => {
    if (syncedLyrics.length === 0) return;
    
    setSyncedLyrics((prev) => prev.slice(0, -1));
    setCurrentLine((prev) => Math.max(0, prev - 1));
  }, [syncedLyrics.length]);

  // Reset sync
  const handleReset = useCallback(() => {
    setSyncedLyrics([]);
    setCurrentLine(0);
    audioPlayerRef.current?.seek(0);
    audioPlayerRef.current?.pause();
  }, []);

  // Save synchronization
  const handleSave = useCallback(async () => {
    if (!songId || syncedLyrics.length === 0) {
      setError("Aucune synchronisation à sauvegarder");
      return;
    }

    console.log("Starting save process...");
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      // Generate LRC raw format
      console.log("Generating LRC content...");
      const lrcRaw = syncedLyrics
        .map((line) => {
          const mins = Math.floor(line.time / 60);
          const secs = (line.time % 60).toFixed(2).padStart(5, "0");
          return `[${mins.toString().padStart(2, "0")}:${secs}]${line.text}`;
        })
        .join("\n");

      console.log("LRC generated, length:", lrcRaw.length);
      console.log("Saving LRC to database...", { songId, linesCount: syncedLyrics.length, userId: user?.id });

      // Save LRC file with timeout
      const lrcPromise = supabase.from("lrc_files").upsert(
        {
          song_id: songId,
          synced_lyrics: syncedLyrics,
          lrc_raw: lrcRaw,
          source: "manual",
          created_by: user?.id,
        },
        { onConflict: "song_id" }
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database timeout")), 10000)
      );

      const { data: lrcData, error: lrcError } = await Promise.race([lrcPromise, timeoutPromise]) as any;

      console.log("LRC save result:", { data: lrcData, error: lrcError });

      if (lrcError) {
        console.error("LRC save error:", lrcError);
        setError("Erreur lors de la sauvegarde LRC : " + lrcError.message);
        setIsSaving(false);
        return;
      }

      // Update song status to "pending_validation" (or keep published if admin editing)
      console.log("Updating song status...");
      const { data: statusData, error: statusError } = await supabase
        .from("songs")
        .update({ status: "pending_validation" })
        .eq("id", songId)
        .select();

      console.log("Status update result:", { data: statusData, error: statusError });

      if (statusError) {
        console.error("Status update error:", statusError);
        // Don't fail the whole save for status update error
        console.warn("Continuing despite status update error");
      }

      console.log("Save completed successfully!");
      setSuccess("Synchronisation enregistrée avec succès !");
      setIsSyncing(false);
      setIsSaving(false);
    } catch (err: any) {
      console.error("Save error caught:", err);
      setError("Erreur inattendue lors de la sauvegarde: " + (err.message || "Erreur inconnue"));
      setIsSaving(false);
    }
  }, [songId, syncedLyrics, supabase, user?.id]);

  // Export LRC file
  const handleExportLRC = useCallback(() => {
    if (syncedLyrics.length === 0) return;

    const lrcContent = [
      `[ti:${song?.title || "Unknown"}]`,
      `[ar:${song?.artist_name || "Unknown"}]`,
      `[by:LyricSync]`,
      "",
      ...syncedLyrics.map((line) => {
        const mins = Math.floor(line.time / 60);
        const secs = (line.time % 60).toFixed(2).padStart(5, "0");
        return `[${mins.toString().padStart(2, "0")}:${secs}]${line.text}`;
      }),
    ].join("\n");

    const blob = new Blob([lrcContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${song?.title || "lyrics"}.lrc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [syncedLyrics, song]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (isSyncing) {
            handleTap();
          }
          break;
        case "KeyZ":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleUndo();
          }
          break;
        case "Escape":
          e.preventDefault();
          if (isSyncing) {
            audioPlayerRef.current?.pause();
          }
          break;
        case "Enter":
          e.preventDefault();
          if (!isSyncing && lines.length > 0) {
            handleStartSync();
          } else if (isSyncing && currentLine >= lines.length) {
            handleSave();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSyncing, handleTap, handleUndo, handleStartSync, handleSave, currentLine, lines.length]);

  // Loading state
  if (isLoading && !song) {
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
  if (error && !song) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-6">{error}</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{song?.title}</h1>
              <p className="text-gray-600">{song?.artist_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Raccourcis clavier"
            >
              <Keyboard className="h-5 w-5" />
            </button>
            {syncedLyrics.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExportLRC}>
                <Download className="h-4 w-4 mr-2" />
                Export LRC
              </Button>
            )}
          </div>
        </div>

        {/* Keyboard shortcuts help */}
        {showKeyboardHelp && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <h3 className="font-semibold text-gray-900 mb-3">Raccourcis clavier</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-700">Espace</kbd>
                  <span className="text-gray-600">Synchroniser la ligne</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-700">Ctrl+Z</kbd>
                  <span className="text-gray-600">Annuler</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-700">Échap</kbd>
                  <span className="text-gray-600">Pause</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-700">Entrée</kbd>
                  <span className="text-gray-600">Commencer / Sauvegarder</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* Audio Player */}
        {song?.audio_url && (
          <div className="mb-6">
            <AudioPlayer
              ref={audioPlayerRef}
              src={song.audio_url}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
        )}

        {/* Waveform */}
        {song?.audio_url && (
          <div className="mb-6">
            <Waveform
              ref={waveformRef}
              src={song.audio_url}
              currentTime={audioTime}
              onSeek={handleWaveformSeek}
            />
          </div>
        )}

        {/* Main Sync Area - Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left: All lyrics */}
          <Card>
            <CardContent className="py-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
                <span>Paroles ({lines.length} lignes)</span>
                {isSyncing && (
                  <span className="text-sm font-normal text-purple-600">
                    {formatTime(audioTime)}
                  </span>
                )}
              </h3>
              <div className="max-h-[400px] overflow-y-auto space-y-1 pr-2" id="lyrics-container">
                {lines.map((line, idx) => (
                  <div
                    key={idx}
                    id={`line-${idx}`}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      idx < currentLine
                        ? "bg-green-50 text-green-700 border-l-4 border-green-500"
                        : idx === currentLine
                        ? "bg-purple-100 text-purple-900 font-semibold border-l-4 border-purple-600 scale-[1.02]"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 min-w-[24px]">{idx + 1}</span>
                      {idx < currentLine && syncedLyrics[idx] && (
                        <span className="text-xs text-green-600 font-mono">
                          [{formatTime(syncedLyrics[idx].time)}]
                        </span>
                      )}
                      <span className="flex-1">{line}</span>
                      {idx === currentLine && isSyncing && (
                        <span className="text-purple-600 animate-pulse">◀</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right: Sync controls */}
          <Card>
            <CardContent className="py-6">
              {!isSyncing ? (
                <div className="space-y-6">
                  {/* Advanced Settings */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Paramètres avancés
                    </h3>

                    {/* Sync Delay */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Délai de synchronisation: {syncDelay}ms
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="50"
                        value={syncDelay}
                        onChange={(e) => setSyncDelay(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Instantané</span>
                        <span>500ms</span>
                      </div>
                    </div>

                    {/* Preview Mode */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="previewMode"
                        checked={previewMode}
                        onChange={(e) => setPreviewMode(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="previewMode" className="text-sm text-gray-700">
                        Mode prévisualisation (pas de sauvegarde)
                      </label>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 mb-2">Comment synchroniser ?</h3>
                    <ol className="text-left text-sm text-gray-600 mb-6 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="bg-purple-100 text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                        <span>Cliquez sur "Commencer" pour lancer la musique</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-purple-100 text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                        <span>Appuyez sur <kbd className="px-1 bg-gray-100 rounded">Espace</kbd> ou le bouton "Tap" quand la ligne est chantée</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-purple-100 text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                        <span>Continuez jusqu'à la fin de la chanson</span>
                      </li>
                    </ol>
                    <Button onClick={handleStartSync} size="lg" className="w-full">
                      Commencer la synchronisation
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Progress indicator */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">
                        Ligne {currentLine + 1} / {lines.length}
                      </span>
                      <span className="text-sm text-purple-600 font-medium">
                        {Math.round((currentLine / lines.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all"
                        style={{ width: `${(currentLine / lines.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Current line highlight */}
                  <div className="bg-purple-50 rounded-lg p-4 mb-6 text-center border-2 border-purple-200">
                    <p className="text-xs text-purple-600 font-medium mb-1">LIGNE ACTUELLE</p>
                    <p className="text-xl font-bold text-gray-900">
                      {currentLine < lines.length ? lines[currentLine] : "✅ Terminé !"}
                    </p>
                  </div>

                  {/* Next line preview */}
                  {currentLine < lines.length - 1 && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-6 text-center">
                      <p className="text-xs text-gray-500 mb-1">PROCHAINE LIGNE</p>
                      <p className="text-sm text-gray-600">{lines[currentLine + 1]}</p>
                    </div>
                  )}

                  {/* Advanced Controls */}
                  <div className="space-y-4">
                    {/* Playback Controls */}
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => audioPlayerRef.current?.seek(Math.max(0, audioTime - 5))}
                        title="Reculer de 5 secondes"
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (audioPlayerRef.current?.isPlaying()) {
                            audioPlayerRef.current.pause();
                          } else {
                            audioPlayerRef.current?.play();
                          }
                        }}
                        title="Play/Pause"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => audioPlayerRef.current?.seek(audioTime + 5)}
                        title="Avancer de 5 secondes"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Last timestamp adjustment */}
                    {syncedLyrics.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Dernière synchronisation:</span>
                          <span className="text-sm text-purple-600 font-mono">
                            {formatTime(syncedLyrics[syncedLyrics.length - 1].time)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adjustLastTimestamp(-0.1)}
                            title="Ajuster -100ms"
                          >
                            -0.1s
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adjustLastTimestamp(-0.05)}
                            title="Ajuster -50ms"
                          >
                            -0.05s
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adjustLastTimestamp(0.05)}
                            title="Ajuster +50ms"
                          >
                            +0.05s
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adjustLastTimestamp(0.1)}
                            title="Ajuster +100ms"
                          >
                            +0.1s
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="space-y-3">
                      {currentLine < lines.length ? (
                        <>
                          <Button onClick={handleTap} size="lg" className="w-full text-lg py-6">
                            🎵 Tap (Espace) {syncDelay > 0 && `+${syncDelay}ms`}
                          </Button>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={handleUndo} disabled={syncedLyrics.length === 0}>
                              <Undo2 className="h-4 w-4 mr-2" />
                              Annuler
                            </Button>
                            <Button variant="outline" onClick={handleReset}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reset
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <Button onClick={handleSave} size="lg" isLoading={isSaving} disabled={isSaving} className="w-full">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {isSaving ? "Sauvegarde..." : "Sauvegarder la synchronisation"}
                          </Button>
                          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Recommencer
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Synced lyrics preview */}
        {syncedLyrics.length > 0 && (
          <Card>
            <CardContent className="py-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Aperçu des paroles synchronisées ({syncedLyrics.length} lignes)
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {syncedLyrics.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 text-sm hover:bg-gray-50 p-2 rounded-lg"
                  >
                    <span className="text-purple-600 font-mono min-w-[60px]">
                      [{formatTime(line.time)}]
                    </span>
                    <span className="text-gray-700">{line.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
