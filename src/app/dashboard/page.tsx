"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  Music, 
  Clock, 
  Trophy, 
  Plus, 
  ArrowRight,
  Upload,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function DashboardPage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats = [
    {
      label: "Contributions",
      value: profile?.total_contributions || 0,
      icon: Music,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      label: "Points",
      value: profile?.points || 0,
      icon: Trophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      label: "Rang",
      value: profile?.rank || "-",
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  const quickActions = [
    {
      title: "Nouvelle synchronisation",
      description: "Synchroniser les paroles d'une chanson",
      icon: Plus,
      href: "/contribute",
      color: "from-purple-600 to-pink-600",
    },
    {
      title: "Uploader un fichier audio",
      description: "Ajouter une nouvelle chanson à la bibliothèque",
      icon: Upload,
      href: "/upload",
      color: "from-blue-600 to-cyan-600",
    },
    {
      title: "Voir le classement",
      description: "Découvrez les meilleurs contributeurs",
      icon: Trophy,
      href: "/leaderboard",
      color: "from-yellow-500 to-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bonjour, {profile?.username || user.email?.split("@")[0]} 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenue sur votre tableau de bord LyricSync
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Actions rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${action.color} mb-4`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {action.description}
                  </p>
                  <div className="flex items-center text-purple-600 text-sm font-medium">
                    Commencer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Contributions Placeholder */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Mes contributions récentes
            </h2>
            <Link href="/my-contributions" className="text-purple-600 text-sm font-medium hover:underline">
              Voir tout
            </Link>
          </div>
          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Aucune contribution pour le moment
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Commencez à synchroniser des paroles pour voir vos contributions ici
              </p>
              <Link href="/contribute">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer ma première synchronisation
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
