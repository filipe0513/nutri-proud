import { prisma } from '@/lib/prisma';
import { JoinTeamClient } from './JoinTeamClient';
import { Users } from 'lucide-react';

interface JoinTeamPageProps {
  params: {
    code: string;
  };
}

export default async function JoinTeamPage({ params }: JoinTeamPageProps) {
  const { code } = params;

  // Busca as informações do time para mostrar ao usuário
  const team = await prisma.team.findUnique({
    where: { inviteCode: code },
  });

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-4">
        <h1 className="text-title-1 font-bold text-neutral-600">Convite Inválido 😔</h1>
        <p className="text-body-1 text-neutral-500 max-w-sm">
          Este link de convite não é válido ou o time não existe mais. Solicite um novo link à sua nutricionista.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 py-8 space-y-8">
      {/* Ícone */}
      <div className="h-24 w-24 rounded-full bg-brand-100/50 flex items-center justify-center ring-4 ring-brand-500/10 relative">
        <Users className="h-10 w-10 text-brand-500" />
      </div>

      <div className="space-y-3 max-w-sm mx-auto">
        <p className="text-body-2 font-medium text-brand-500 tracking-wide uppercase">
          Convite Especial
        </p>
        <h1 className="text-title-1 font-bold text-neutral-600 leading-tight">
          Você foi convidado(a) para participar do <span className="text-brand-500">{team.name}</span>!
        </h1>
        <p className="text-body-1 text-neutral-500 px-4">
          {team.description || 'Sua nutricionista enviou este convite para acompanhar o seu progresso no Orgulho da Nutri.'}
        </p>
      </div>

      <div className="w-full max-w-xs pt-4">
        <JoinTeamClient inviteCode={code} />
      </div>
    </div>
  );
}
