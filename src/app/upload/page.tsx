// Page d'upload audio + paroles pour LyricSync
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Upload, Music, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/upload");
    }
  }, [user, authLoading, router]);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      if (!file.type.startsWith("audio/")) {
        setError("Veuillez sélectionner un fichier audio valide.");
        return;
      }
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError("Le fichier audio ne doit pas dépasser 50 Mo.");
        return;
      }
      setAudioFile(file);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    setUploadProgress(0);

    if (!audioFile) {
      setError("Veuillez sélectionner un fichier audio.");
      setIsLoading(false);
      return;
    }
    if (!title || !artist || !lyrics) {
      setError("Veuillez remplir tous les champs obligatoires.");
      setIsLoading(false);
      return;
    }

    try {
      setUploadProgress(10);

      // Create FormData
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('title', title);
      formData.append('artist', artist);
      formData.append('album', album || '');
      formData.append('lyrics', lyrics);

      setUploadProgress(20);

      console.log("Starting upload via API...", { 
        fileName: audioFile.name, 
        fileSize: audioFile.size,
        title,
        artist 
      });

      // Upload via API route
      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);

      const result = await response.json();

      console.log("Upload result:", result);

      if (!response.ok) {
        setError(result.error || "Erreur lors de l'upload");
        setIsLoading(false);
        return;
      }

      setUploadProgress(100);
      setSuccess("Chanson uploadée avec succès ! Redirection vers la synchronisation...");
      
      // Reset form
      setAudioFile(null);
      setLyrics("");
      setTitle("");
      setArtist("");
      setAlbum("");
      
      // Redirect to sync page
      setTimeout(() => {
        if (result.song?.id) {
          router.push(`/sync/${result.song.id}`);
        } else {
          router.push("/dashboard");
        }
      }, 1500);

    } catch (err) {
      console.error("Upload error:", err);
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  // Loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Don't render if not logged in
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au dashboard
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Uploader une chanson</h2>
          <p className="mt-2 text-gray-600">
            Ajoutez un fichier audio et ses paroles pour commencer la synchronisation
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              
              {/* Success message */}
              {success && (
                <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* Upload progress */}
              {isLoading && uploadProgress > 0 && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-purple-600 font-medium">
                      {uploadProgress < 80 ? "Envoi du fichier..." : "Traitement en cours..."}
                    </span>
                    <span className="text-sm text-purple-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Input
                type="text"
                label="Titre de la chanson *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Hosanna"
                required
                disabled={isLoading}
              />

              <Input
                type="text"
                label="Artiste *"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Ex: Ronn The Voice"
                required
                disabled={isLoading}
              />

              <Input
                type="text"
                label="Album (optionnel)"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="Ex: Adorons"
                disabled={isLoading}
              />

              {/* File input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fichier audio (mp3, wav...) *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioChange}
                    required
                    disabled={isLoading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100 cursor-pointer border border-gray-300 rounded-lg"
                  />
                </div>
                {audioFile && (
                  <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                    <Music className="h-4 w-4" />
                    {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} Mo)
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">Maximum 50 Mo</p>
              </div>

              {/* Lyrics textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paroles *
                </label>
                <textarea
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  rows={10}
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Collez ou saisissez les paroles ici...&#10;&#10;Chaque ligne sera synchronisée individuellement."
                />
                <p className="mt-1 text-xs text-gray-400">
                  {lyrics.split(/\r?\n/).filter(l => l.trim()).length} lignes détectées
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
                disabled={isLoading || !audioFile || !title || !artist || !lyrics}
              >
                {isLoading ? "Upload en cours..." : "Uploader et synchroniser"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help text */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Après l'upload, vous serez redirigé vers l'éditeur de synchronisation pour aligner les paroles avec l'audio.
        </p>
      </div>
    </div>
  );
}
