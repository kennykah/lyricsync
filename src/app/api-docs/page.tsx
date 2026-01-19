"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { 
  Code, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Globe,
  Key,
  Music,
  FileText
} from "lucide-react";

interface Endpoint {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  response: string;
  example?: string;
}

const endpoints: { category: string; items: Endpoint[] }[] = [
  {
    category: "Status",
    items: [
      {
        method: "GET",
        path: "/api/v1/status",
        description: "Vérifier le statut de l'API",
        response: `{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-01-19T10:00:00Z"
}`,
      },
    ],
  },
  {
    category: "Chansons",
    items: [
      {
        method: "GET",
        path: "/api/v1/songs",
        description: "Récupérer la liste des chansons",
        params: [
          { name: "limit", type: "number", required: false, description: "Nombre max de résultats (défaut: 50)" },
          { name: "offset", type: "number", required: false, description: "Décalage pour pagination" },
          { name: "status", type: "string", required: false, description: "Filtrer par statut" },
        ],
        response: `{
  "songs": [
    {
      "id": "uuid",
      "title": "Hosanna",
      "artist_name": "Ronn The Voice",
      "album": "D'abord Jésus",
      "status": "published",
      "duration_seconds": 240
    }
  ],
  "total": 100
}`,
      },
      {
        method: "POST",
        path: "/api/v1/songs",
        description: "Créer une nouvelle chanson",
        params: [
          { name: "title", type: "string", required: true, description: "Titre de la chanson" },
          { name: "artist_name", type: "string", required: true, description: "Nom de l'artiste" },
          { name: "lyrics_text", type: "string", required: true, description: "Paroles de la chanson" },
          { name: "audio_url", type: "string", required: false, description: "URL du fichier audio" },
        ],
        response: `{
  "id": "uuid",
  "title": "Nouvelle chanson",
  "status": "draft",
  "created_at": "2026-01-19T10:00:00Z"
}`,
      },
    ],
  },
  {
    category: "Paroles synchronisées (LRC)",
    items: [
      {
        method: "GET",
        path: "/api/v1/lrc/{songId}",
        description: "Récupérer les paroles synchronisées d'une chanson",
        params: [
          { name: "songId", type: "string", required: true, description: "ID de la chanson" },
          { name: "format", type: "string", required: false, description: "Format: lrc, json, ou srt (défaut: json)" },
        ],
        response: `{
  "song_id": "uuid",
  "synced_lyrics": [
    { "time": 0.5, "text": "Première ligne" },
    { "time": 3.2, "text": "Deuxième ligne" }
  ],
  "source": "manual",
  "version": 1
}`,
        example: `# Format LRC
[00:00.50]Première ligne
[00:03.20]Deuxième ligne`,
      },
      {
        method: "POST",
        path: "/api/v1/lrc/{songId}",
        description: "Sauvegarder les paroles synchronisées",
        params: [
          { name: "songId", type: "string", required: true, description: "ID de la chanson" },
          { name: "synced_lyrics", type: "array", required: true, description: "Tableau de {time, text}" },
          { name: "source", type: "string", required: false, description: "ai, manual, ou hybrid" },
        ],
        response: `{
  "id": "uuid",
  "song_id": "uuid",
  "version": 1,
  "created_at": "2026-01-19T10:00:00Z"
}`,
      },
      {
        method: "DELETE",
        path: "/api/v1/lrc/{songId}",
        description: "Supprimer les paroles synchronisées",
        params: [
          { name: "songId", type: "string", required: true, description: "ID de la chanson" },
        ],
        response: `{
  "success": true,
  "message": "LRC deleted successfully"
}`,
      },
    ],
  },
];

export default function ApiDocsPage() {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(endpoints.map(e => e.category));

  const baseUrl = "https://lyricsync-three.vercel.app";

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-green-100 text-green-700",
      POST: "bg-blue-100 text-blue-700",
      PUT: "bg-yellow-100 text-yellow-700",
      DELETE: "bg-red-100 text-red-700",
    };
    return colors[method] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Code className="h-10 w-10" />
            <h1 className="text-4xl font-bold">Documentation API</h1>
          </div>
          <p className="text-white/80 text-lg max-w-2xl mb-8">
            Intégrez LyricSync dans vos applications avec notre API REST simple et puissante.
          </p>
          
          {/* Quick info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Globe className="h-6 w-6 mb-2" />
              <div className="text-sm font-medium">Base URL</div>
              <div className="text-xs text-white/70 truncate">{baseUrl}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Key className="h-6 w-6 mb-2" />
              <div className="text-sm font-medium">Authentification</div>
              <div className="text-xs text-white/70">Bearer Token (optionnel)</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <FileText className="h-6 w-6 mb-2" />
              <div className="text-sm font-medium">Format</div>
              <div className="text-xs text-white/70">JSON, LRC, SRT</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Start */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Démarrage rapide</h2>
            <p className="text-gray-600 mb-4">
              Récupérez les paroles synchronisées d'une chanson en une seule requête :
            </p>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100 overflow-x-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400"># Exemple avec curl</span>
                <button
                  onClick={() => copyToClipboard(`curl "${baseUrl}/api/v1/lrc/YOUR_SONG_ID?format=lrc"`, 'quickstart')}
                  className="text-gray-400 hover:text-white"
                >
                  {copiedEndpoint === 'quickstart' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <code>curl "{baseUrl}/api/v1/lrc/YOUR_SONG_ID?format=lrc"</code>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <div className="space-y-6">
          {endpoints.map((category) => (
            <Card key={category.category}>
              <button
                onClick={() => toggleCategory(category.category)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 rounded-t-lg"
              >
                <div className="flex items-center gap-3">
                  <Music className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">{category.category}</h2>
                  <span className="text-sm text-gray-500">({category.items.length} endpoint{category.items.length > 1 ? 's' : ''})</span>
                </div>
                {expandedCategories.includes(category.category) ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {expandedCategories.includes(category.category) && (
                <CardContent className="pt-0">
                  <div className="divide-y">
                    {category.items.map((endpoint, idx) => (
                      <div key={idx} className="py-4">
                        {/* Endpoint header */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getMethodColor(endpoint.method)}`}>
                            {endpoint.method}
                          </span>
                          <code className="text-sm font-mono text-gray-800">{endpoint.path}</code>
                          <button
                            onClick={() => copyToClipboard(`${baseUrl}${endpoint.path}`, `${category.category}-${idx}`)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {copiedEndpoint === `${category.category}-${idx}` ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        <p className="text-gray-600 text-sm mb-4">{endpoint.description}</p>

                        {/* Parameters */}
                        {endpoint.params && endpoint.params.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Paramètres</h4>
                            <div className="bg-gray-50 rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600">Nom</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600">Type</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600">Requis</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600">Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {endpoint.params.map((param, pIdx) => (
                                    <tr key={pIdx} className="border-t border-gray-200">
                                      <td className="px-3 py-2 font-mono text-purple-600">{param.name}</td>
                                      <td className="px-3 py-2 text-gray-600">{param.type}</td>
                                      <td className="px-3 py-2">
                                        {param.required ? (
                                          <span className="text-red-500">Oui</span>
                                        ) : (
                                          <span className="text-gray-400">Non</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">{param.description}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Response */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Réponse</h4>
                          <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-100 overflow-x-auto">
                            <pre>{endpoint.response}</pre>
                          </div>
                        </div>

                        {/* Example */}
                        {endpoint.example && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Exemple format alternatif</h4>
                            <div className="bg-gray-100 rounded-lg p-4 font-mono text-xs text-gray-700 overflow-x-auto">
                              <pre>{endpoint.example}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Integration example */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Exemple d'intégration</h2>
            <p className="text-gray-600 mb-4">
              Voici un exemple d'intégration avec JavaScript/TypeScript :
            </p>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100 overflow-x-auto">
              <pre>{`// Récupérer les paroles synchronisées
const response = await fetch(
  'https://lyricsync-three.vercel.app/api/v1/lrc/SONG_ID'
);
const data = await response.json();

// Afficher les paroles au bon moment
data.synced_lyrics.forEach(line => {
  setTimeout(() => {
    console.log(line.text);
  }, line.time * 1000);
});`}</pre>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="mt-12 text-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
          <Code className="h-12 w-12 mx-auto text-purple-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Besoin d'aide ?
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Consultez notre dépôt GitHub ou ouvrez une issue pour toute question.
          </p>
          <a
            href="https://github.com/kennykah/lyricsync"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button>
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir sur GitHub
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
