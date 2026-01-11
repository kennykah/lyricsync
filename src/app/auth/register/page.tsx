"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Music, Mail, Lock, User, Eye, EyeOff, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "contributor",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres");
      setIsLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setError("Le nom d utilisateur doit contenir au moins 3 caracteres");
      setIsLoading(false);
      return;
    }

    const { error: signUpError } = await signUp(
      formData.email,
      formData.password,
      formData.username,
      formData.role
    );

    if (signUpError) {
      if (signUpError.includes("email")) {
        setSuccess(signUpError);
      } else {
        setError(signUpError);
      }
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-xl">
              <Music className="h-8 w-8 text-white" />
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Creer un compte</h2>
          <p className="mt-2 text-gray-600">Rejoignez la communaute LyricSync</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Je suis...</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: "contributor" }))}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.role === "contributor"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Contributeur</span>
                  </div>
                  <p className="text-xs text-gray-500">Je veux aider a synchroniser des paroles</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: "artist" }))}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.role === "artist"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Music className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Artiste</span>
                  </div>
                  <p className="text-xs text-gray-500">Je veux soumettre ma musique</p>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}
              {success && (
                <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">{success}</div>
              )}

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  name="username"
                  placeholder="Nom d utilisateur"
                  value={formData.username}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Mot de passe (min. 8 caracteres)"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirmer le mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  J accepte les conditions d utilisation et la politique de confidentialite
                </label>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Creer mon compte
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium text-gray-700 mb-3">En vous inscrivant, vous pourrez :</p>
              <ul className="space-y-2">
                {[
                  "Synchroniser des paroles et gagner des points",
                  "Monter dans le classement des contributeurs",
                  "Debloquer des badges exclusifs",
                  formData.role === "artist" ? "Soumettre votre musique gratuitement" : "Acceder a des fonctionnalites avancees",
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-gray-600">
          Deja inscrit?{" "}
          <Link href="/auth/login" className="font-medium text-purple-600 hover:text-purple-700">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}
