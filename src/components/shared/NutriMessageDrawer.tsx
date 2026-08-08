'use client';

import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { sendNutriMessage, fetchAiSuggestion } from '@/store/api';
import type { PostAuthor } from '@/types/teamTypes';

interface NutriMessageDrawerProps {
  patient: PostAuthor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tone = 'encouragement' | 'congratulations' | 'concern' | 'general';

const TONE_CHIPS: { value: Tone; label: string }[] = [
  { value: 'encouragement', label: 'Encorajar' },
  { value: 'congratulations', label: 'Parabenizar' },
  { value: 'concern', label: 'Alertar' },
  { value: 'general', label: 'Geral' },
];

export function NutriMessageDrawer({ patient, open, onOpenChange }: NutriMessageDrawerProps) {
  const [tone, setTone] = useState<Tone>('encouragement');
  const [message, setMessage] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSuggest = async () => {
    if (!patient || suggesting) return;
    setSuggesting(true);
    try {
      const suggestion = await fetchAiSuggestion(patient.id, tone);
      setMessage(suggestion);
    } catch {
      toast.error('Erro ao gerar sugestao.', {
        className: 'bg-notify-error-glass backdrop-blur-md border border-notify-error text-notify-error',
      });
    } finally {
      setSuggesting(false);
    }
  };

  const handleSend = async () => {
    if (!patient || !message.trim() || sending) return;
    setSending(true);
    try {
      await sendNutriMessage(patient.id, message.trim());
      toast.success('Mensagem enviada!', {
        className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
      });
      setMessage('');
      onOpenChange(false);
    } catch {
      toast.error('Erro ao enviar mensagem.', {
        className: 'bg-notify-error-glass backdrop-blur-md border border-notify-error text-notify-error',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!bg-glass-light-3 backdrop-blur-lg border-t border-white/40 rounded-t-[32px] px-6 pb-8">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-title-3 text-neutral-500">
            Enviar mensagem
          </DrawerTitle>
        </DrawerHeader>

        {/* Patient info */}
        {patient && (
          <div className="flex items-center gap-3 mb-5">
            <Avatar className="h-10 w-10">
              {patient.image && (
                <AvatarImage src={patient.image} alt={patient.name ?? ''} referrerPolicy="no-referrer" />
              )}
              <AvatarFallback className="bg-brand-100 text-brand-500 font-bold">
                {(patient.name ?? '?').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-body-1 font-semibold text-neutral-500">
              {patient.name ?? 'Paciente'}
            </p>
          </div>
        )}

        {/* Tone chips */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {TONE_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setTone(chip.value)}
              className={`px-3 py-1.5 rounded-full text-caption-1 font-semibold transition-colors ${
                tone === chip.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/60 text-neutral-500 border border-neutral-200/60'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* AI Suggest button */}
        <button
          type="button"
          onClick={handleSuggest}
          disabled={suggesting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-insights text-white text-button-1 font-semibold mb-4 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {suggesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Sugerir com IA
        </button>

        {/* Message textarea */}
        <textarea
          className="w-full min-h-[100px] rounded-2xl border border-neutral-200/60 bg-white/80 px-4 py-3 text-input-1 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 mb-4"
          placeholder="Escreva sua mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {/* Send button */}
        <Button
          className="w-full h-14 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-button-1 font-semibold"
          onClick={handleSend}
          disabled={!message.trim() || sending}
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </>
          )}
        </Button>
      </DrawerContent>
    </Drawer>
  );
}
