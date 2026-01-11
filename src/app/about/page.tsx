import { Music, Users, Target, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export const metadata = {
  title: 'À propos',
  description: 'Découvrez LyricSync, la plateforme collaborative de synchronisation paroles-audio pour la musique gospel francophone.',
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-600 to-pink-600 text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Notre Mission
          </h1>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto">
            Démocratiser l'accès aux paroles synchronisées pour la musique gospel 
            francophone en combinant la puissance de l'intelligence artificielle 
            et l'engagement communautaire.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                L'histoire de LyricSync
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Tout a commencé avec <strong>Gospel Lyrics</strong>, une plateforme 
                  dédiée aux paroles de chansons gospel francophones. En développant 
                  une fonctionnalité de synchronisation paroles-audio (style karaoké), 
                  nous avons réalisé un problème majeur.
                </p>
                <p>
                  <strong>La création manuelle des fichiers de synchronisation est 
                  extrêmement fastidieuse.</strong> Écouter un morceau et noter 
                  manuellement le temps de chaque ligne prend énormément de temps 
                  et est sujet aux erreurs.
                </p>
                <p>
                  C'est ainsi qu'est né <strong>LyricSync</strong> : une plateforme 
                  indépendante qui combine l'IA (Whisper d'OpenAI) et une communauté 
                  de contributeurs passionnés pour créer des paroles synchronisées 
                  de haute qualité.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Music, value: '500+', label: 'Chansons' },
                  { icon: Users, value: '100+', label: 'Contributeurs' },
                  { icon: Target, value: '95%', label: 'Précision' },
                  { icon: Heart, value: '50+', label: 'Artistes' },
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <stat.icon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Nos Valeurs
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Communauté',
                description: 'Nous croyons en la puissance de la collaboration. Chaque contribution, grande ou petite, fait avancer notre mission.',
                icon: '🤝',
              },
              {
                title: 'Qualité',
                description: 'Nous visons l\'excellence. Chaque parole synchronisée passe par un processus de validation rigoureux.',
                icon: '✨',
              },
              {
                title: 'Accessibilité',
                description: 'La musique gospel doit être accessible à tous. Notre plateforme est et restera gratuite pour les contributeurs.',
                icon: '🌍',
              },
            ].map((value, index) => (
              <Card key={index}>
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            L'équipe
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12">
            LyricSync est développé par une équipe passionnée par la musique gospel 
            et la technologie, avec le soutien d'une communauté grandissante de contributeurs.
          </p>
          
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-white max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-4">Rejoignez-nous !</h3>
            <p className="text-purple-100 mb-6">
              Nous recherchons des contributeurs passionnés pour nous aider à 
              synchroniser des paroles et améliorer la plateforme.
            </p>
            <Link href="/auth/register">
              <Button variant="secondary" size="lg">
                Devenir contributeur
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Intégration avec Gospel Lyrics
          </h2>
          <div className="bg-white rounded-2xl border p-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Deux projets, une mission
                </h3>
                <p className="text-gray-600 mb-4">
                  LyricSync est indépendant mais conçu pour s'intégrer parfaitement 
                  avec Gospel Lyrics et d'autres applications qui souhaitent utiliser 
                  nos paroles synchronisées.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    API REST publique et documentée
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Formats LRC, JSON et SRT supportés
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Intégration en temps réel
                  </li>
                </ul>
              </div>
              <div className="flex justify-center">
                <a 
                  href="https://gospel-lyrics.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 group-hover:shadow-lg transition-shadow">
                    <Music className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                    <div className="text-lg font-semibold text-gray-900">Gospel Lyrics</div>
                    <div className="text-sm text-gray-500">gospel-lyrics.vercel.app</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
