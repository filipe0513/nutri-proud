'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface JoinTeamClientProps {
  inviteCode: string;
  isMember?: boolean;
  teamId?: string;
}

export function JoinTeamClient({ inviteCode, isMember, teamId }: JoinTeamClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  if (isMember && teamId) {
    return (
      <button
        type="button"
        onClick={() => router.push(`/teams/${teamId}`)}
        className="w-full h-14 rounded-2xl bg-brand-500 text-white font-bold text-button-1 shadow-brand flex items-center justify-center transition-transform active:scale-[0.98]"
      >
        Ver Grupo
      </button>
    );
  }

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Você precisa fazer login para aceitar o convite.', {
            className: 'bg-notify-error-glass backdrop-blur-md border border-notify-error text-notify-error',
          });
          router.push('/welcome');
          return;
        }

        const data = await res.json();
        throw new Error(data.error || 'Erro ao entrar no time.');
      }

      toast.success('Convite aceito com sucesso!', {
        className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
      });

      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar convite';
      toast.error(message, {
        className: 'bg-notify-error-glass backdrop-blur-md border border-notify-error text-notify-error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleJoin}
      disabled={isLoading}
      className="w-full h-14 rounded-2xl bg-brand-500 text-white font-bold text-button-1 shadow-brand disabled:opacity-70 flex items-center justify-center transition-transform active:scale-[0.98]"
    >
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-white/80" />
      ) : (
        'Aceitar Convite'
      )}
    </button>
  );
}
