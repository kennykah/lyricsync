// Page d'édition Tap-to-Sync pour LyricSync
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import AudioPlayer from "@/components/ui/AudioPlayer";
import Waveform from "@/components/ui/Waveform";
import { createClient } from "@/lib/supabase/client";

export default function SyncEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const songId = searchParams.get("id");
  const supabase = createClient();

  const [song, setSong] = useState<any>(null);
  const [currentLine, setCurrentLine] = useState(0);
  const [syncedLyrics, setSyncedLyrics] = useState<{ time: number; text: string }[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!songId) return;
    const fetchSong = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .eq("id", songId)
        .single();
      if (error) setError(error.message);
      setSong(data);
      setIsLoading(false);
    };
    fetchSong();
  }, [songId, supabase]);

  const handleSync = () => {
    if (!song || !song.lyrics_text) return;
    setIsSyncing(true);
    setSyncedLyrics([]);
    setCurrentLine(0);
  };

  const handleTap = () => {
    if (!song || !song.lyrics_text) return;
    const lines = song.lyrics_text.split(/\r?\n/);
    if (currentLine >= lines.length) return;
    setSyncedLyrics((prev) => [...prev, { time: audioTime, text: lines[currentLine] }]);
    setCurrentLine((prev) => prev + 1);
  };

  const handleSave = async () => {
    if (!songId || syncedLyrics.length === 0) return;
    setIsLoading(true);
    const { error: lrcError } = await supabase.from("lrc_files").insert([
      {
        song_id: songId,
        synced_lyrics: syncedLyrics,
        source: "manual",
      },
    ]);
    setIsLoading(false);
    if (lrcError) {
      setError("Erreur lors de la sauvegarde : " + lrcError.message);
      return;
    }
    setSuccess("Synchronisation enregistrée !");
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }
  if (!song) {
    return <div className="min-h-screen flex items-center justify-center">Chanson introuvable.</div>;
  }

  const lines = song.lyrics_text ? song.lyrics_text.split(/\r?\n/) : [];

  return (
    <div className="min-h-[80vh] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Synchronisation des paroles</h2>
        <p className="mb-6 text-gray-600">Appuyez sur "Tap" au bon moment pour synchroniser chaque ligne de parole avec l'audio.</p>
        <AudioPlayer src={song.audio_url} />
        <Waveform src={song.audio_url} />
        <div className="mt-8">
          {!isSyncing ? (
            <Button onClick={handleSync} className="w-full" size="lg">Commencer la synchronisation</Button>
          ) : (
            <>
              <div className="mb-4">
                <div className="text-lg font-semibold text-purple-600">Ligne actuelle :</div>
                <div className="text-xl font-bold text-gray-900 mb-2">{lines[currentLine] || "Terminé !"}</div>
              </div>
              {currentLine < lines.length ? (
                <Button onClick={handleTap} className="w-full" size="lg">Tap (Synchroniser cette ligne)</Button>
              ) : (
                <Button onClick={handleSave} className="w-full" size="lg">Sauvegarder la synchronisation</Button>
              )}
              <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Aperçu des lignes synchronisées :</h3>
                <ul className="space-y-1">
                  {syncedLyrics.map((line, idx) => (
                    <li key={idx} className="text-sm text-gray-600">
                      [{formatTime(line.time)}] {line.text}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm mt-4">{success}</div>}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
