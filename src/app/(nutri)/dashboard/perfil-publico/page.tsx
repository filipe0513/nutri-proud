'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Sparkles, Pencil, MapPin, Award, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { nutritionistProfileSchema, type NutritionistProfileInput } from '@/schemas/nutritionistSchema';

type SavedProfile = {
  id: string;
  userId: string;
  displayName?: string | null;
  crn?: string | null;
  bio?: string | null;
  city?: string | null;
  uf?: string | null;
  whatsapp?: string | null;
  publicEmail?: string | null;
  schedulingUrl?: string | null;
  plansInfo?: string | null;
  visibility: 'HIDDEN' | 'APP_ONLY' | 'PUBLIC';
};

type Mode = 'loading' | 'empty' | 'preview' | 'edit';

export default function PerfilPublicoPage() {
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState<SavedProfile | null>(null);
  const [mode, setMode] = useState<Mode>('loading');
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NutritionistProfileInput>({
    resolver: zodResolver(nutritionistProfileSchema),
    defaultValues: { visibility: 'HIDDEN' },
  });

  useEffect(() => {
    const fetchOwn = async () => {
      try {
        const res = await fetch('/api/nutritionists/me');
        const data: SavedProfile | null = res.ok ? await res.json() : null;
        setProfileData(data);
        setMode(!data || !data.displayName ? 'empty' : 'preview');
        if (data) reset(toFormValues(data));
      } catch {
        setMode('empty');
      }
    };
    fetchOwn();
  }, [reset]);

  const onSubmit = async (data: NutritionistProfileInput) => {
    setSaving(true);
    try {
      const res = await fetch('/api/nutritionists/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const saved: SavedProfile = await res.json();
      setProfileData(saved);
      reset(toFormValues(saved));
      setMode('preview');
      toast.success('Perfil atualizado!', {
        className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
      });
    } catch {
      toast.error('Erro ao salvar. Tente novamente.', {
        className: 'bg-notify-error-glass backdrop-blur-md border border-notify-error text-notify-error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (mode === 'loading') {
    return (
      <div className="pb-32 pt-8 px-4 max-w-lg mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-2xl bg-neutral-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (mode === 'empty') {
    return (
      <div className="pb-32 pt-8 px-4 max-w-lg mx-auto">
        <div className="flex flex-col items-center text-center gap-4 bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-2xl p-8">
          <div className="h-16 w-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-brand-500" />
          </div>
          <div>
            <p className="text-body-1 font-semibold text-neutral-500">
              Seu perfil público ainda não foi criado
            </p>
            <p className="text-body-2 text-neutral-400 mt-1">
              Pacientes em busca de acompanhamento poderão encontrar você pelo diretório.
            </p>
          </div>
          <button
            onClick={() => setMode('edit')}
            className="w-full h-14 rounded-2xl bg-brand-500 text-white text-button-1"
          >
            Criar perfil
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'preview' && profileData) {
    const name = profileData.displayName ?? session?.user?.name ?? 'Nutricionista';
    const image = session?.user?.image ?? null;

    return (
      <div className="pb-32 pt-8 px-4 max-w-lg mx-auto space-y-6">
        {/* Edit banner */}
        <div className="bg-brand-500 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-white flex-shrink-0" />
            <p className="text-body-2 font-medium text-white">Visualização do perfil público</p>
          </div>
          <button
            onClick={() => setMode('edit')}
            className="flex-shrink-0 text-button-1 text-white underline"
          >
            Editar informações
          </button>
        </div>

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
            {profileData.crn && (
              <p className="text-caption-1 text-neutral-400 flex items-center justify-center gap-1 mt-1">
                <Award className="h-3 w-3" />
                CRN {profileData.crn}
              </p>
            )}
            {(profileData.city || profileData.uf) && (
              <p className="text-caption-1 text-neutral-400 flex items-center justify-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {[profileData.city, profileData.uf].filter(Boolean).join(' — ')}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {profileData.bio && (
          <div className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-2xl p-4">
            <p className="text-body-2 font-semibold text-neutral-500 mb-2">Sobre</p>
            <p className="text-body-2 text-neutral-400 whitespace-pre-line">{profileData.bio}</p>
          </div>
        )}

        {/* Plans */}
        {profileData.plansInfo && (
          <div className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-2xl p-4">
            <p className="text-body-2 font-semibold text-neutral-500 mb-2">Planos e valores</p>
            <p className="text-body-2 text-neutral-400 whitespace-pre-line">{profileData.plansInfo}</p>
          </div>
        )}

        {/* Contact */}
        {(profileData.whatsapp || profileData.publicEmail || profileData.schedulingUrl) && (
          <div className="space-y-3">
            <p className="text-body-2 font-semibold text-neutral-500">Contato</p>

            {profileData.whatsapp && (
              <a
                href={`https://wa.me/${profileData.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 hover:bg-green-100 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-600 fill-current flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                <span className="text-body-2 font-medium text-green-700">Enviar mensagem no WhatsApp</span>
              </a>
            )}

            {profileData.publicEmail && (
              <a
                href={`mailto:${profileData.publicEmail}`}
                className="flex items-center gap-3 bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-2xl p-4 hover:bg-glass-light-2 transition-colors"
              >
                <Mail className="h-5 w-5 text-brand-500 flex-shrink-0" />
                <span className="text-body-2 font-medium text-neutral-500">{profileData.publicEmail}</span>
              </a>
            )}

            {profileData.schedulingUrl && (
              <a
                href={profileData.schedulingUrl}
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

  // mode === 'edit'
  return (
    <div className="pb-32 pt-8 px-4 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-title-2 font-bold text-neutral-500">Perfil público</h1>
        <p className="text-body-2 text-neutral-400 mt-1">
          Pacientes em busca de acompanhamento poderão encontrar você pelo diretório.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Visibilidade */}
        <div className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-2xl p-4 space-y-3">
          <p className="text-body-2 font-semibold text-neutral-500">Visibilidade no diretório</p>
          <div className="space-y-2">
            {[
              { value: 'HIDDEN', label: 'Oculto', desc: 'Não aparece no diretório' },
              { value: 'APP_ONLY', label: 'Só usuários do app', desc: 'Visível apenas para quem tem conta' },
              { value: 'PUBLIC', label: 'Público', desc: 'Qualquer pessoa pode encontrar, incluindo o Google' },
            ].map((opt) => (
              <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  value={opt.value}
                  {...register('visibility')}
                  className="mt-1 accent-brand-500"
                />
                <div>
                  <p className="text-body-2 font-medium text-neutral-500">{opt.label}</p>
                  <p className="text-caption-1 text-neutral-400">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Dados profissionais */}
        <div className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-2xl p-4 space-y-4">
          <p className="text-body-2 font-semibold text-neutral-500">Dados profissionais</p>

          <Field label="Nome profissional" error={errors.displayName?.message}>
            <input
              placeholder="Ex: Dra. Ana Lima"
              {...register('displayName')}
              className={inputCls}
            />
          </Field>

          <Field label="CRN" error={errors.crn?.message}>
            <input
              placeholder="Ex: 12345"
              {...register('crn')}
              className={inputCls}
            />
          </Field>

          <Field label="Bio" error={errors.bio?.message}>
            <textarea
              placeholder="Fale sobre sua atuação e especialidades (máx. 600 caracteres)"
              {...register('bio')}
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="flex gap-3">
            <Field label="Cidade" error={errors.city?.message} className="flex-1">
              <input
                placeholder="Ex: São Paulo"
                {...register('city')}
                className={inputCls}
              />
            </Field>
            <Field label="UF" error={errors.uf?.message} className="w-20">
              <input
                placeholder="SP"
                maxLength={2}
                {...register('uf')}
                className={`${inputCls} uppercase`}
              />
            </Field>
          </div>
        </div>

        {/* Contato */}
        <div className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-2xl p-4 space-y-4">
          <p className="text-body-2 font-semibold text-neutral-500">Contato (exibido no perfil)</p>

          <Field label="WhatsApp (só dígitos com DDI)" error={errors.whatsapp?.message}>
            <input
              placeholder="5511999990000"
              {...register('whatsapp')}
              className={inputCls}
              inputMode="numeric"
            />
          </Field>

          <Field label="E-mail público" error={errors.publicEmail?.message}>
            <input
              type="email"
              placeholder="contato@exemplo.com"
              {...register('publicEmail')}
              className={inputCls}
            />
          </Field>

          <Field label="Link de agendamento" error={errors.schedulingUrl?.message}>
            <input
              type="url"
              placeholder="https://..."
              {...register('schedulingUrl')}
              className={inputCls}
            />
          </Field>
        </div>

        {/* Planos */}
        <div className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-2xl p-4 space-y-3">
          <p className="text-body-2 font-semibold text-neutral-500">Planos e valores</p>
          <Field error={errors.plansInfo?.message}>
            <textarea
              placeholder="Descreva seus planos, frequência de consultas, valores (máx. 400 caracteres)"
              {...register('plansInfo')}
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="w-full h-14 rounded-2xl bg-brand-500 text-white text-button-1"
        >
          {saving ? 'Salvando...' : 'Salvar perfil'}
        </Button>

        {profileData?.displayName && (
          <button
            type="button"
            onClick={() => setMode('preview')}
            className="w-full text-body-2 text-neutral-400 underline"
          >
            Cancelar
          </button>
        )}
      </form>
    </div>
  );
}

function toFormValues(p: SavedProfile): NutritionistProfileInput {
  return {
    visibility: p.visibility,
    displayName: p.displayName ?? undefined,
    crn: p.crn ?? undefined,
    bio: p.bio ?? undefined,
    city: p.city ?? undefined,
    uf: p.uf ?? undefined,
    whatsapp: p.whatsapp ?? undefined,
    publicEmail: p.publicEmail ?? undefined,
    schedulingUrl: p.schedulingUrl ?? undefined,
    plansInfo: p.plansInfo ?? undefined,
  };
}

const inputCls =
  'w-full rounded-xl border border-neutral-200/60 bg-neutral-100 px-3 py-2.5 text-input-1 focus:outline-none focus:ring-2 focus:ring-brand-500';

function Field({
  label,
  error,
  children,
  className,
}: {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      {label && <p className="text-caption-1 font-medium text-neutral-400">{label}</p>}
      {children}
      {error && <p className="text-caption-2 text-notify-error">{error}</p>}
    </div>
  );
}
