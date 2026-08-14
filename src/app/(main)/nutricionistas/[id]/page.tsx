import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Award, Mail, Calendar } from 'lucide-react';
import { auth } from '@/auth';
import { nutritionistService } from '@/services/nutritionistService';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  const profile = await nutritionistService.getPublic(id, !!session?.user?.id);

  if (!profile) {
    return { title: 'Nutricionista não encontrada' };
  }

  const name = profile.displayName ?? profile.user.name ?? 'Nutricionista';
  const description = profile.bio ?? `Conheça ${name} e agende sua consulta.`;

  return {
    title: `${name} — Nutricionista`,
    description,
    openGraph: {
      title: `${name} — Nutricionista`,
      description,
      ...(profile.user.image ? { images: [profile.user.image] } : {}),
    },
  };
}

export default async function NutricionistaProfilePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const profile = await nutritionistService.getPublic(id, !!session?.user?.id);

  if (!profile) notFound();

  const name = profile.displayName ?? profile.user.name ?? 'Nutricionista';
  const image = profile.user.image;

  return (
    <div className="pb-32 pt-8 px-4 max-w-lg mx-auto space-y-6">
      <Link href="/nutricionistas" className="text-caption-1 text-brand-500 hover:underline">
        ← Voltar ao diretório
      </Link>

      {/* Header */}
      <div className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
        {image ? (
          <Image
            src={image}
            alt={name}
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover ring-4 ring-brand-500/20"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-brand-500/10 flex items-center justify-center ring-4 ring-brand-500/20">
            <span className="text-title-1 font-bold text-brand-500">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h1 className="text-title-2 font-bold text-neutral-500">{name}</h1>
          {profile.crn && (
            <p className="text-caption-1 text-neutral-400 flex items-center justify-center gap-1 mt-1">
              <Award className="h-3 w-3" />
              CRN {profile.crn}
            </p>
          )}
          {(profile.city || profile.uf) && (
            <p className="text-caption-1 text-neutral-400 flex items-center justify-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {[profile.city, profile.uf].filter(Boolean).join(' — ')}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-2xl p-4">
          <p className="text-body-2 font-semibold text-neutral-500 mb-2">Sobre</p>
          <p className="text-body-2 text-neutral-400 whitespace-pre-line">{profile.bio}</p>
        </div>
      )}

      {/* Plans */}
      {profile.plansInfo && (
        <div className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-2xl p-4">
          <p className="text-body-2 font-semibold text-neutral-500 mb-2">Planos e valores</p>
          <p className="text-body-2 text-neutral-400 whitespace-pre-line">{profile.plansInfo}</p>
        </div>
      )}

      {/* Contact */}
      {(profile.whatsapp || profile.publicEmail || profile.schedulingUrl) && (
        <div className="space-y-3">
          <p className="text-body-2 font-semibold text-neutral-500">Contato</p>

          {profile.whatsapp && (
            <a
              href={`https://wa.me/${profile.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 hover:bg-green-100 transition-colors"
            >
              {/* WhatsApp icon via SVG */}
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-600 fill-current flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              <span className="text-body-2 font-medium text-green-700">Enviar mensagem no WhatsApp</span>
            </a>
          )}

          {profile.publicEmail && (
            <a
              href={`mailto:${profile.publicEmail}`}
              className="flex items-center gap-3 bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-2xl p-4 hover:bg-glass-light-2 transition-colors"
            >
              <Mail className="h-5 w-5 text-brand-500 flex-shrink-0" />
              <span className="text-body-2 font-medium text-neutral-500">{profile.publicEmail}</span>
            </a>
          )}

          {profile.schedulingUrl && (
            <a
              href={profile.schedulingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-brand-500 rounded-2xl p-4 hover:bg-brand-500/90 transition-colors"
            >
              <Calendar className="h-5 w-5 text-white flex-shrink-0" />
              <span className="text-body-2 font-medium text-white">Agendar consulta</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
