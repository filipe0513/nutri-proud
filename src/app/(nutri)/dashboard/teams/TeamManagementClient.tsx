'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Share2, UserMinus, Users } from 'lucide-react';
import type { TeamWithMembers } from '@/types/teamTypes';

interface TeamManagementClientProps {
  team: TeamWithMembers;
}

export function TeamManagementClient({ team: initialTeam }: TeamManagementClientProps) {
  const [team, setTeam] = useState(initialTeam);
  const [removing, setRemoving] = useState<string | null>(null);

  const getInviteUrl = () => `${window.location.origin}/join/${team.inviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getInviteUrl());
      toast.success('Link copiado!', {
        className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
      });
    } catch {
      toast.error('Não foi possível copiar.', {
        className: 'bg-notify-error-glass backdrop-blur-md border border-notify-error text-notify-error',
      });
    }
  };

  const handleShare = async () => {
    if (typeof navigator.share !== 'undefined') {
      try {
        await navigator.share({
          title: `Entre no time ${team.name}`,
          text: `Sua nutricionista te convidou para o time "${team.name}" no Orgulho da Nutri.`,
          url: getInviteUrl(),
        });
      } catch {
        // user cancelled share — no toast needed
      }
    } else {
      handleCopy();
    }
  };

  const handleRemove = async (memberUserId: string) => {
    setRemoving(memberUserId);
    try {
      const res = await fetch(`/api/teams/${team.id}/members/${memberUserId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao remover membro.');
      }

      setTeam((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.userId !== memberUserId),
        memberCount: prev.memberCount - 1,
      }));

      toast.success('Membro removido.', {
        className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover membro.';
      toast.error(message, {
        className: 'bg-notify-error-glass backdrop-blur-md border border-notify-error text-notify-error',
      });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-3xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
          <Users className="h-5 w-5 text-brand-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body-1 font-semibold text-neutral-500 truncate">{team.name}</p>
          {team.description && (
            <p className="text-caption-1 text-neutral-400 mt-0.5 line-clamp-2">{team.description}</p>
          )}
          <p className="text-caption-2 text-neutral-400 mt-1">
            {team.memberCount} {team.memberCount === 1 ? 'membro' : 'membros'}
          </p>
        </div>
      </div>

      {/* Invite section */}
      <div className="bg-glass-light-4 backdrop-blur-md border border-white/30 rounded-2xl p-4 space-y-3">
        <p className="text-caption-1 font-semibold text-neutral-400 uppercase tracking-wide">
          Link de convite
        </p>
        <div className="flex items-center gap-2 bg-neutral-100/60 rounded-xl px-3 py-2">
          <span className="text-caption-1 text-neutral-500 font-mono flex-1 truncate">
            /join/{team.inviteCode}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-brand-500 text-white text-button-1 font-semibold transition-transform active:scale-[0.97]"
          >
            <Copy className="h-4 w-4" />
            Copiar link
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-glass-light-1 border border-white/40 text-neutral-500 transition-transform active:scale-[0.97]"
            aria-label="Compartilhar"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        <p className="text-caption-1 font-semibold text-neutral-400 uppercase tracking-wide">
          Membros
        </p>
        {team.members.length === 0 && (
          <p className="text-body-2 text-neutral-400 text-center py-4">
            Nenhum membro ainda.
          </p>
        )}
        {team.members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center gap-3 bg-neutral-100/40 rounded-2xl px-3 py-3"
          >
            {/* Avatar */}
            {member.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.user.image}
                alt={member.user.name ?? 'Membro'}
                className="h-9 w-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                <span className="text-caption-1 font-bold text-neutral-400">
                  {(member.user.name ?? '?')[0].toUpperCase()}
                </span>
              </div>
            )}

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <p className="text-body-2 font-semibold text-neutral-500 truncate">
                {member.user.name ?? 'Sem nome'}
              </p>
              <span
                className={`text-caption-2 font-semibold ${
                  member.role === 'ADMIN'
                    ? 'text-brand-500'
                    : 'text-neutral-400'
                }`}
              >
                {member.role === 'ADMIN' ? 'Administrador' : 'Paciente'}
              </span>
            </div>

            {/* Remove button — MEMBER only */}
            {member.role === 'MEMBER' && (
              <button
                type="button"
                onClick={() => handleRemove(member.userId)}
                disabled={removing === member.userId}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-notify-error bg-notify-error/10 transition-opacity disabled:opacity-50 active:scale-[0.97]"
                aria-label="Remover membro"
              >
                <UserMinus className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
