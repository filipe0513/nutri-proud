'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CldUploadWidget } from 'next-cloudinary';
import { toast } from 'sonner';
import { Trophy, ImagePlus, Loader2, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

// Form-level schema — dates as date-only strings; converted to ISO before API call.
const formSchema = z.object({
  goalDescription: z.string().min(1, 'Campo obrigatório'),
  startDate: z.string().min(1, 'Campo obrigatório'),
  endDate: z.string().min(1, 'Campo obrigatório'),
  shareWorkouts: z.boolean(),
  shareMeals: z.boolean(),
  shareWater: z.boolean(),
  weeklyEvolution: z.boolean(),
  dailySummary: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_FLAGS = {
  shareWorkouts: false,
  shareMeals: false,
  shareWater: false,
  weeklyEvolution: false,
  dailySummary: false,
};

const TOGGLES: { field: keyof typeof DEFAULT_FLAGS; label: string }[] = [
  { field: 'shareWorkouts', label: 'Compartilhar treinos' },
  { field: 'shareMeals', label: 'Compartilhar refeições' },
  { field: 'shareWater', label: 'Compartilhar água' },
  { field: 'weeklyEvolution', label: 'Fotos de evolução semanal' },
  { field: 'dailySummary', label: 'Resumo diário no feed' },
];

interface CreateChallengeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

type CloudinaryResult = { secure_url: string };

export function CreateChallengeDrawer({
  open,
  onOpenChange,
  onCreated,
}: CreateChallengeDrawerProps) {
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Toggle flags managed with local state to avoid react-hook-form watch() incompatibility
  const [flags, setFlags] = useState(DEFAULT_FLAGS);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_FLAGS,
  });

  const toggleFlag = (field: keyof typeof flags) => {
    setFlags((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleClose = () => {
    reset();
    setFlags(DEFAULT_FLAGS);
    setCoverImageUrl(null);
    onOpenChange(false);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        goalDescription: data.goalDescription,
        coverImageUrl: coverImageUrl ?? undefined,
        startDate: new Date(data.startDate + 'T00:00:00.000Z').toISOString(),
        endDate: new Date(data.endDate + 'T23:59:59.999Z').toISOString(),
        ...flags,
      };

      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? 'Erro ao criar desafio.');
      }

      handleClose();
      onCreated?.();
      toast.success('Desafio criado com sucesso!', {
        className:
          'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar desafio.', {
        className:
          'bg-notify-error-glass backdrop-blur-md border border-notify-error text-notify-error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="!bg-white/95 backdrop-blur-2xl px-6 pb-10 max-h-[92dvh] overflow-y-auto">
        <DrawerHeader className="px-0 pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-title-3 text-neutral-500 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-brand-500" />
              Novo Desafio
            </DrawerTitle>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar"
              className="h-8 w-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DrawerHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Cover image */}
          <div>
            <label className="text-caption-1 text-neutral-500 font-medium mb-2 block">
              Capa do Desafio
            </label>
            <CldUploadWidget
              uploadPreset={uploadPreset}
              options={{
                maxFiles: 1,
                resourceType: 'image',
                cropping: true,
                croppingAspectRatio: 16 / 9,
                folder: 'nutri_proud/challenges',
                clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                maxFileSize: 5000000,
              }}
              onSuccess={(result) => {
                const info = (result as { info?: CloudinaryResult | string }).info;
                if (typeof info === 'object' && info?.secure_url) {
                  setCoverImageUrl(info.secure_url);
                }
              }}
            >
              {({ open: openWidget }) => (
                <button
                  type="button"
                  onClick={() => openWidget()}
                  className="w-full h-28 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-brand-500/50 hover:text-brand-500 transition-colors overflow-hidden"
                >
                  {coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverImageUrl}
                      alt="Capa"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-caption-1">Adicionar capa</span>
                    </>
                  )}
                </button>
              )}
            </CldUploadWidget>
          </div>

          {/* Goal description */}
          <div>
            <label className="text-caption-1 text-neutral-500 font-medium mb-1.5 block">
              Objetivo do Desafio
            </label>
            <textarea
              {...register('goalDescription')}
              rows={3}
              placeholder="Ex: Perder 3kg em 30 dias com foco em alimentação e hidratação"
              className="w-full rounded-2xl border border-neutral-200/60 bg-neutral-50 px-4 py-3 text-input-1 text-neutral-500 placeholder:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 resize-none"
            />
            {errors.goalDescription && (
              <p className="text-caption-2 text-notify-error mt-1">
                {errors.goalDescription.message}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-caption-1 text-neutral-500 font-medium mb-1.5 block">
                Início
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full h-12 rounded-2xl border border-neutral-200/60 bg-neutral-50 px-4 text-input-1 text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              />
              {errors.startDate && (
                <p className="text-caption-2 text-notify-error mt-1">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-caption-1 text-neutral-500 font-medium mb-1.5 block">
                Fim
              </label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full h-12 rounded-2xl border border-neutral-200/60 bg-neutral-50 px-4 text-input-1 text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              />
              {errors.endDate && (
                <p className="text-caption-2 text-notify-error mt-1">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Toggles */}
          <div className="bg-neutral-50 rounded-2xl border border-neutral-200/60 divide-y divide-neutral-200/60">
            {TOGGLES.map(({ field, label }) => {
              const value = flags[field];
              return (
                <label
                  key={field}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer"
                >
                  <span className="text-body-2 text-neutral-500">{label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={value}
                    onClick={() => toggleFlag(field)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      value ? 'bg-brand-500' : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              );
            })}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 text-button-1 rounded-2xl bg-brand-500 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Desafio'
            )}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
