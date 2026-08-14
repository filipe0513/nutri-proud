'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { nutritionistProfileSchema, type NutritionistProfileInput } from '@/schemas/nutritionistSchema';

export default function PerfilPublicoPage() {
  const [loading, setLoading] = useState(true);
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
        if (!res.ok) return;
        const data: NutritionistProfileInput | null = await res.json();
        if (data) reset(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
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

  if (loading) {
    return (
      <div className="pb-32 pt-8 px-4 max-w-lg mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-2xl bg-neutral-100 animate-pulse" />
        ))}
      </div>
    );
  }

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

          <Field
            label="WhatsApp (só dígitos com DDI)"
            error={errors.whatsapp?.message}
          >
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
      </form>
    </div>
  );
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
