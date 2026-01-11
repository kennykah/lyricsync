import Link from "next/link";
import { Music, Zap, Users, Trophy, ArrowRight, Play, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              Synchronisez vos paroles{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                en quelques clics
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              LyricSync combine l&apos;intelligence artificielle et la puissance de la communaute 
              pour creer des paroles synchronisees de haute qualite pour la musique gospel francophone.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/songs">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Play className="mr-2 h-5 w-5" />
                  Voir les chansons
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "500+", label: "Chansons synchronisees" },
              { value: "100+", label: "Contributeurs actifs" },
              { value: "50+", label: "Artistes partenaires" },
              { value: "99.9%", label: "Uptime API" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Comment ca fonctionne
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Un processus simple en trois etapes pour des paroles parfaitement synchronisees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Music,
                title: "1. Soumettez",
                description: "Uploadez votre audio et collez les paroles. Notre systeme les prepare automatiquement.",
              },
              {
                icon: Zap,
                title: "2. IA + Humain",
                description: "Whisper genere un brouillon, puis la communaute affine la synchronisation avec precision.",
              },
              {
                icon: CheckCircle,
                title: "3. Publiez",
                description: "Apres validation, vos paroles synchronisees sont disponibles via notre API.",
              },
            ].map((feature, index) => (
              <Card key={index} hover className="text-center">
                <CardContent className="pt-8 pb-8">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Who Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Pour les artistes et les contributeurs
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Artistes & Labels",
                    description: "Valorisez votre musique avec des paroles synchronisees professionnelles, sans effort technique.",
                  },
                  {
                    title: "Contributeurs benevoles",
                    description: "Aidez la communaute gospel, gagnez des points et montez dans le classement.",
                  },
                  {
                    title: "Developpeurs",
                    description: "Integrez facilement nos paroles synchronisees via notre API RESTful.",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600 mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Systeme de recompenses</h3>
              <p className="mb-6 text-purple-100">
                Contribuez et gagnez des points, badges et une place dans le classement !
              </p>
              <div className="space-y-4">
                {[
                  { action: "Synchroniser une chanson", points: "+10 pts" },
                  { action: "Correction approuvee", points: "+5 pts" },
                  { action: "Validation effectuee", points: "+3 pts" },
                  { action: "Streak 7 jours", points: "+20 pts bonus" },
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-white/10 rounded-lg px-4 py-3">
                    <span>{item.action}</span>
                    <span className="font-bold">{item.points}</span>
                  </div>
                ))}
              </div>
              <Link href="/leaderboard" className="block mt-6">
                <Button variant="secondary" className="w-full">
                  <Trophy className="mr-2 h-5 w-5" />
                  Voir le classement
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Pret a synchroniser vos paroles ?
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
            Rejoignez notre communaute grandissante d&apos;artistes et de contributeurs. 
            C&apos;est gratuit et ca le restera toujours pour les contributeurs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto">
                Creer un compte
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-800">
                En savoir plus
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-16 bg-white border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">Propulse par et integre avec</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <span className="text-xl font-semibold text-gray-700">Gospel Lyrics</span>
              <span className="text-xl font-semibold text-gray-700">Supabase</span>
              <span className="text-xl font-semibold text-gray-700">OpenAI Whisper</span>
              <span className="text-xl font-semibold text-gray-700">Vercel</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
