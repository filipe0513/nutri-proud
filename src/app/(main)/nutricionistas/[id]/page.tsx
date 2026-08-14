import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { nutritionistService } from '@/services/nutritionistService';
import { NutritionistPublicProfile } from '@/components/shared/NutritionistPublicProfile';
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

  return (
    <div>
      <div className="px-4 pt-6 pb-2 max-w-lg mx-auto">
        <Link href="/nutricionistas" className="text-caption-1 text-brand-500 hover:underline">
          ← Voltar ao diretório
        </Link>
      </div>
      <NutritionistPublicProfile
        profile={profile}
        userImage={profile.user.image}
        userName={profile.user.name}
      />
    </div>
  );
}
