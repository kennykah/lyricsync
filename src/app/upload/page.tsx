// Page d'upload audio + paroles pour LyricSync
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export default function UploadPage() {
  const router = useRouter();
  const supabase = createClient();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!audioFile) {
      setError("Veuillez sélectionner un fichier audio.");
      setIsLoading(false);
      return;
    }
    if (!title || !artist || !lyrics) {
      setError("Veuillez remplir tous les champs.");
      setIsLoading(false);
      return;
    }

    // Upload audio to Supabase Storage
    const fileExt = audioFile.name.split(".").pop();
    const fileName = `${Date.now()}-${title.replace(/\s+/g, "-")}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("audio")
      .upload(fileName, audioFile);

    if (uploadError) {
      setError("Erreur lors de l'upload audio : " + uploadError.message);
      setIsLoading(false);
      return;
    }

    const audioUrl = supabase.storage.from("audio").getPublicUrl(fileName).data.publicUrl;

    // Insert song metadata and lyrics in Supabase DB
    const { error: dbError } = await supabase.from("songs").insert([
      {
        title,
        artist_name: artist,
        audio_url: audioUrl,
        lyrics_text: lyrics,
        status: "draft",
      },
    ]);

    if (dbError) {
      setError("Erreur lors de l'enregistrement de la chanson : " + dbError.message);
      setIsLoading(false);
      return;
    }

    setSuccess("Chanson uploadée avec succès !");
    setIsLoading(false);
    setAudioFile(null);
    setLyrics("");
    setTitle("");
    setArtist("");
    // Rediriger vers dashboard ou page de synchronisation
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Uploader une chanson</h2>
          <p className="mt-2 text-gray-600">Ajoutez un fichier audio et ses paroles pour commencer la synchronisation</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
              {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">{success}</div>}
              <Input
                type="text"
                label="Titre de la chanson"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
              <Input
                type="text"
                label="Artiste"
                value={artist}
                onChange={e => setArtist(e.target.value)}
                required
              />
              <Input
                type="file"
                label="Fichier audio (mp3, wav...)"
                accept="audio/*"
                onChange={handleAudioChange}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paroles</label>
                <textarea
                  className="block w-full rounded-lg border px-4 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={8}
                  value={lyrics}
                  onChange={e => setLyrics(e.target.value)}
                  required
                  placeholder="Collez ou saisissez les paroles ici..."
                />
              </div>
              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Uploader
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
