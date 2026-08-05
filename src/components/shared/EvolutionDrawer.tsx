'use client';

import { useState } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

interface EvolutionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWeight: number;
}

export function EvolutionDrawer({ open, onOpenChange, initialWeight }: EvolutionDrawerProps) {
  const router = useRouter();
  const [weight, setWeight] = useState<number>(initialWeight || 70);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUploadSuccess = (result: any) => {
    if (result.info?.secure_url) {
      setPhotoUrl(result.info.secure_url);
    }
  };

  const handleSubmit = async () => {
    if (!photoUrl) {
      toast.error('Por favor, tire ou envie uma foto.');
      return;
    }
    if (!weight || weight < 20 || weight > 300) {
      toast.error('Por favor, insira um peso válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'evolution',
          primary_value: 100,
          details: {
            photo_url: photoUrl,
            weight_kg: weight,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar check-in de evolução');
      }

      toast.success('Check-in salvo com sucesso!', {
        className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
      });
      onOpenChange(false);
      setPhotoUrl(null);
      router.refresh(); // Refresh the page to show the new log
    } catch (error) {
      console.error(error);
      toast.error('Ocorreu um erro ao salvar seu check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-glass-light-3 backdrop-blur-lg border-t border-white/40 max-w-lg mx-auto">
        <DrawerHeader>
          <DrawerTitle className="text-title-2 font-bold text-neutral-600 text-center">
            Check-in de Evolução
          </DrawerTitle>
          <DrawerDescription className="text-center text-body-2 text-neutral-500">
            Registre seu peso atual e uma foto para acompanhar seu progresso.
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-6">
          {/* Photo Upload Area */}
          <div className="space-y-2">
            <label className="text-body-2 font-semibold text-neutral-600 px-1">
              Foto do Corpo
            </label>
            
            {!photoUrl ? (
              <CldUploadWidget 
                uploadPreset="nutri_proud_profiles_dev"
                onSuccess={handleUploadSuccess}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className="w-full h-40 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-100/50 hover:bg-neutral-100 flex flex-col items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                  >
                    <Upload className="h-8 w-8 text-brand-400" />
                    <span className="text-body-2 font-medium text-brand-500">
                      Tirar ou Escolher Foto
                    </span>
                  </button>
                )}
              </CldUploadWidget>
            ) : (
              <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-white/40 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={photoUrl} 
                  alt="Evolução preview" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 backdrop-blur-md"
                  aria-label="Remover foto"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Weight Input */}
          <div className="space-y-2">
            <label htmlFor="evolution-weight" className="text-body-2 font-semibold text-neutral-600 px-1">
              Peso Atual (kg)
            </label>
            <input
              id="evolution-weight"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              className="w-full rounded-2xl border border-white/40 bg-glass-light-1 backdrop-blur-sm px-4 py-3 text-title-3 font-semibold text-neutral-600 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all shadow-inner"
              placeholder="Ex: 75.5"
            />
          </div>
        </div>

        <DrawerFooter className="pt-2">
          <Button 
            className="w-full h-14 rounded-2xl bg-brand-500 hover:bg-brand-600 text-button-1 font-bold text-white shadow-md active:scale-[0.98] transition-all"
            onClick={handleSubmit}
            disabled={isSubmitting || !photoUrl}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Check-in'
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full h-12 rounded-2xl text-button-1 font-semibold text-neutral-500 hover:bg-neutral-200/50">
              Cancelar
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
