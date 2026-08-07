'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { toBlob } from 'html-to-image';
import { uploadImage } from '@/app/actions/uploadImage';


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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
    }
  };

  const captureAndUpload = async (): Promise<string | null> => {
    if (!nodeRef.current) return null;
    
    // Configs otimizadas para mobile e canvas
    const options = { cacheBust: true, pixelRatio: 2 };
    const blob = await toBlob(nodeRef.current, options);
    
    if (!blob) throw new Error('Falha ao capturar imagem.');
    
    const formData = new FormData();
    formData.append('file', blob, 'evolution-checkin.png');
    formData.append('folder', 'evolution');
    
    const result = await uploadImage(formData);
    if (!result.success || !result.imageUrl) {
      throw new Error(result.error || 'Falha no upload da imagem.');
    }
    
    return result.imageUrl;
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
      // 1. Gera imagem com overlay (Canvas) e sobe pro Cloudinary
      const finalImageUrl = await captureAndUpload();
      if (!finalImageUrl) throw new Error('Falha ao gerar imagem.');

      // 2. Salva o Log de Evolução
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'evolution',
          primary_value: 100,
          details: {
            photo_url: finalImageUrl,
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
      router.refresh(); 
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : 'Ocorreu um erro ao salvar seu check-in.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v && !isSubmitting) {
      setTimeout(() => setPhotoUrl(null), 300);
    }
    onOpenChange(v);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
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
          {/* Weight Input (Colocado primeiro para refletir no overlay) */}
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

          {/* Photo Upload Area */}
          <div className="space-y-2">
            <label className="text-body-2 font-semibold text-neutral-600 px-1">
              Foto do Corpo
            </label>
            
            {/* Input nativo oculto */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            {!photoUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-100/50 hover:bg-neutral-100 flex flex-col items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <Camera className="h-8 w-8 text-brand-400" />
                <span className="text-body-2 font-medium text-brand-500">
                  Tirar Foto (Câmera)
                </span>
              </button>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                {/* Node to capture with html-to-image */}
                <div 
                  ref={nodeRef}
                  className="relative w-[300px] h-[400px] rounded-3xl overflow-hidden shadow-md flex-shrink-0"
                  style={{
                    backgroundColor: '#1E1E2E'
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={photoUrl} 
                    alt="Evolução preview" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  
                  {/* Glassmorphism Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg">
                    <Sparkles className="h-5 w-5 text-white mb-1 drop-shadow-md" />
                    <p className="text-white text-caption-1 font-bold uppercase tracking-wider drop-shadow-md">
                      Check-in da Semana
                    </p>
                    <p className="text-white text-title-1 font-black drop-shadow-md">
                      {weight} <span className="text-body-1 font-medium">kg</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full max-w-[300px]">
                   <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 h-12 rounded-xl border border-neutral-300 bg-white/60 text-neutral-700 hover:bg-neutral-100 flex items-center justify-center gap-2"
                   >
                     <Camera className="h-4 w-4" />
                     Repetir
                   </Button>
                </div>
              </div>
            )}
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
                Processando...
              </>
            ) : (
              'Salvar Check-in'
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full h-12 rounded-2xl text-button-1 font-semibold text-neutral-500 hover:bg-neutral-200/50" disabled={isSubmitting}>
              Cancelar
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
