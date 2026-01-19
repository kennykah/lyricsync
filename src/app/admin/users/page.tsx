// Page d'administration des utilisateurs - LyricSync
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  ArrowLeft,
  User,
  Shield,
  Crown,
  Music,
  AlertCircle,
  CheckCircle,
  Users
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  email: string;
  role: string;
  points: number;
  level: number;
  created_at: string;
  contributions_count?: number;
}

const ROLE_CONFIG = {
  contributor: { label: "Contributeur", color: "bg-gray-100 text-gray-700", icon: User },
  validator: { label: "Validateur", color: "bg-blue-100 text-blue-700", icon: Shield },
  admin: { label: "Administrateur", color: "bg-purple-100 text-purple-700", icon: Crown }
};

export default function AdminUsersPage() {
  const supabase = createClient();
  const { user, profile } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  // Check if current user is admin
  useEffect(() => {
    if (!profile || profile.role !== "admin") {
      setIsLoading(false);
      return;
    }

    fetchUsers();
  }, [profile]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, display_name, role, points, level, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) {
        setError("Erreur lors du chargement: " + profilesError.message);
        setIsLoading(false);
        return;
      }

      // Get contribution counts for each user
      const userIds = profilesData.map((p: any) => p.id);
      const { data: contributionsData } = await supabase
        .from("contributions")
        .select("user_id")
        .in("user_id", userIds);

      // Count contributions per user
      const contributionCounts: { [key: string]: number } = {};
      contributionsData?.forEach((contrib: any) => {
        contributionCounts[contrib.user_id] = (contributionCounts[contrib.user_id] || 0) + 1;
      });

      // Transform data (without emails for security)
      const transformedUsers = profilesData.map((profileData: any) => ({
        id: profileData.id,
        username: profileData.username,
        display_name: profileData.display_name,
        email: "", // Not accessible client-side for security
        role: profileData.role,
        points: profileData.points,
        level: profileData.level,
        created_at: profileData.created_at,
        contributions_count: contributionCounts[profileData.id] || 0
      }));

      setUsers(transformedUsers);
      setIsLoading(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Une erreur inattendue s'est produite");
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!user) return;

    setUpdatingUser(userId);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (updateError) {
        setError("Erreur lors de la mise à jour: " + updateError.message);
        setUpdatingUser(null);
        return;
      }

      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));

      setError(""); // Clear any previous errors
      setUpdatingUser(null);
    } catch (err) {
      console.error("Update error:", err);
      setError("Erreur inattendue lors de la mise à jour");
      setUpdatingUser(null);
    }
  };

  // Check if user is admin
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès refusé</h2>
            <p className="text-gray-600 mb-6">Vous devez être connecté pour accéder à cette page.</p>
            <Link href="/auth/login">
              <Button>Se connecter</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Crown className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès administrateur requis</h2>
            <p className="text-gray-600 mb-6">Vous n'avez pas les permissions d'administrateur.</p>
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administration Utilisateurs</h1>
              <p className="text-gray-600">Gérer les rôles et permissions des utilisateurs</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600">{users.length}</p>
            <p className="text-sm text-gray-600">utilisateurs</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Users grid */}
        <div className="grid gap-4">
          {users.map((userProfile) => {
            const roleConfig = ROLE_CONFIG[userProfile.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.contributor;
            const RoleIcon = roleConfig.icon;

            return (
              <Card key={userProfile.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-medium">
                        {userProfile.display_name?.charAt(0) || userProfile.username?.charAt(0) || "?"}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {userProfile.display_name || userProfile.username}
                        </h3>
                        <p className="text-sm text-gray-600">{userProfile.email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-500">
                            {userProfile.contributions_count} contributions
                          </span>
                          <span className="text-xs text-gray-500">
                            {userProfile.points} points
                          </span>
                          <span className="text-xs text-gray-500">
                            Niveau {userProfile.level}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Current role badge */}
                      <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${roleConfig.color}`}>
                        <RoleIcon className="h-3 w-3" />
                        {roleConfig.label}
                      </div>

                      {/* Role change buttons */}
                      <div className="flex gap-2">
                        {Object.entries(ROLE_CONFIG).map(([roleKey, roleInfo]) => {
                          if (roleKey === userProfile.role) return null;

                          return (
                            <Button
                              key={roleKey}
                              size="sm"
                              variant="outline"
                              onClick={() => updateUserRole(userProfile.id, roleKey)}
                              isLoading={updatingUser === userProfile.id}
                              disabled={updatingUser !== null}
                              className="text-xs"
                            >
                              {roleKey === "contributor" && "→ Contributeur"}
                              {roleKey === "validator" && "→ Validateur"}
                              {roleKey === "admin" && "→ Admin"}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {users.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun utilisateur</h3>
              <p className="text-gray-600">Aucun utilisateur n'est enregistré pour le moment.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
