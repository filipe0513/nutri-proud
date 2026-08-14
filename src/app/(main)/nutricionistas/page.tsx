'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, MapPin, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NutritionistProfile {
  id: string;
  displayName: string | null;
  crn: string | null;
  city: string | null;
  uf: string | null;
  bio: string | null;
  user: { name: string | null; image: string | null };
}

export default function NutricionistasPage() {
  const [profiles, setProfiles] = useState<NutritionistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');

  const fetchProfiles = async (c?: string, u?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (c) params.set('city', c);
      if (u) params.set('uf', u);
      const res = await fetch(`/api/nutritionists?${params.toString()}`);
      if (!res.ok) return;
      const data: NutritionistProfile[] = await res.json();
      setProfiles(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfiles();
  }, []);

  const handleSearch = () => fetchProfiles(city || undefined, uf || undefined);

  return (
    <div className="pb-32 pt-8 px-4 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-title-2 font-bold text-neutral-500">Encontre uma nutricionista</h1>
        <p className="text-body-2 text-neutral-400 mt-1">
          Profissionais disponíveis para acompanhamento.
        </p>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Cidade"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="flex-1 rounded-xl border border-neutral-200/60 bg-neutral-100 px-3 py-2.5 text-input-1 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <input
          type="text"
          placeholder="UF"
          maxLength={2}
          value={uf}
          onChange={(e) => setUf(e.target.value.toUpperCase())}
          className="w-16 rounded-xl border border-neutral-200/60 bg-neutral-100 px-3 py-2.5 text-input-1 focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
        />
        <Button
          onClick={handleSearch}
          className="rounded-xl bg-brand-500 text-white px-3"
          aria-label="Buscar"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-body-2 text-neutral-400">
            Nenhuma nutricionista encontrada{city || uf ? ' com esse filtro' : ''}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => {
            const name = profile.displayName ?? profile.user.name ?? 'Nutricionista';
            const image = profile.user.image;
            return (
              <div
                key={profile.id}
                className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-2xl p-4 flex items-start gap-4"
              >
                {image ? (
                  <Image
                    src={image}
                    alt={name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-title-3 font-bold text-brand-500">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-body-1 font-semibold text-neutral-500 truncate">{name}</p>
                  {(profile.city || profile.uf) && (
                    <p className="text-caption-1 text-neutral-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {[profile.city, profile.uf].filter(Boolean).join(' — ')}
                    </p>
                  )}
                  {profile.crn && (
                    <p className="text-caption-2 text-neutral-400 flex items-center gap-1 mt-0.5">
                      <Award className="h-3 w-3" />
                      CRN {profile.crn}
                    </p>
                  )}
                  {profile.bio && (
                    <p className="text-caption-1 text-neutral-400 mt-1 line-clamp-2">{profile.bio}</p>
                  )}
                </div>
                <Link
                  href={`/nutricionistas/${profile.id}`}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-brand-500 text-white text-caption-1 font-medium hover:bg-brand-500/90 transition-colors"
                >
                  Ver perfil
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
