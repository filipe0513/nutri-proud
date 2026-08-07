'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/store';
import { Bell, X } from 'lucide-react';

/**
 * PushPermissionModal — Soft Prompt para notificações push.
 *
 * Regras:
 * - Só renderiza se Notification.permission === 'default' (nunca perguntado).
 * - Se usuário clicar "Agora não", salva flag no Zustand (UI state da sessão).
 * - Se aceitar, chama OneSignal.Notifications.requestPermission(), captura o Player ID
 *   e salva via PATCH /api/users/me/push-token.
 * - Graceful degradation total: não quebra em ambientes sem suporte a Notification/OneSignal.
 */
export function PushPermissionModal() {
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pushPromptDismissed = useAppStore((s) => s.pushPromptDismissed);
  const setPushPromptDismissed = useAppStore((s) => s.setPushPromptDismissed);

  useEffect(() => {
    // Graceful degradation: ambientes sem Notification API (iOS safari antigo, SSR, etc.)
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Se já foi respondido (granted/denied) ou dispensado na sessão, não mostra
    if (
      window.Notification.permission !== 'default' ||
      pushPromptDismissed
    ) return;

    // Pequeno delay para não assustar o usuário assim que abre o app
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [pushPromptDismissed]);

  const handleDismiss = () => {
    setPushPromptDismissed(true);
    setVisible(false);
  };

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      // Graceful degradation: verifica se o SDK está disponível
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const OneSignal = (window as any).OneSignal;

      if (OneSignal?.Notifications?.requestPermission) {
        await OneSignal.Notifications.requestPermission();

        // Aguarda um momento para o SDK registrar a subscription
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const playerId: string | undefined =
          OneSignal?.User?.PushSubscription?.id;

        if (playerId) {
          await fetch('/api/users/me/push-token', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ onesignal_id: playerId }),
          });
        }
      } else {
        // Fallback: pedir permissão nativa do browser diretamente
        await Notification.requestPermission();
      }
    } catch (error) {
      console.error('[PushPermissionModal] Erro ao solicitar permissão:', error);
    } finally {
      setIsLoading(false);
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay semitransparente */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Modal centralizado */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-modal-title"
        className="
          fixed bottom-6 left-4 right-4 z-50
          sm:bottom-auto sm:top-1/2 sm:left-1/2
          sm:-translate-x-1/2 sm:-translate-y-1/2
          sm:max-w-sm sm:w-full
          rounded-2xl
          bg-glass-light-3 backdrop-blur-lg
          border border-white/40
          shadow-2xl
          p-6
          animate-in slide-in-from-bottom-4 fade-in duration-300
        "
      >
        {/* Botão fechar */}
        <button
          onClick={handleDismiss}
          className="
            absolute top-3 right-3
            p-1.5 rounded-full
            text-neutral-400 hover:text-neutral-600
            hover:bg-black/10
            transition-colors
          "
          aria-label="Fechar"
        >
          <X size={16} />
        </button>

        {/* Ícone */}
        <div className="flex justify-center mb-4">
          <div
            className="
              w-14 h-14 rounded-2xl
              flex items-center justify-center
              bg-gradient-to-br from-violet-500 to-purple-600
              shadow-lg shadow-purple-500/30
            "
          >
            <Bell size={26} className="text-white" />
          </div>
        </div>

        {/* Texto */}
        <h2
          id="push-modal-title"
          className="text-title-3 text-neutral-500 text-center mb-2"
        >
          Não perca seu foco! 🎯
        </h2>
        <p className="text-body-2 text-neutral-400 text-center mb-6">
          Posso te enviar lembretes sobre água, refeições e mensagens da sua
          nutri?
        </p>

        {/* Botões */}
        <div className="flex flex-col gap-2.5">
          <button
            id="push-modal-accept-btn"
            onClick={handleAccept}
            disabled={isLoading}
            className="
              w-full py-3 rounded-xl
              bg-gradient-to-r from-violet-500 to-purple-600
              text-white text-button-1
              shadow-md shadow-purple-500/25
              hover:opacity-90 active:scale-95
              transition-all duration-150
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {isLoading ? 'Aguardando...' : 'Sim, me lembre ✨'}
          </button>

          <button
            id="push-modal-dismiss-btn"
            onClick={handleDismiss}
            disabled={isLoading}
            className="
              w-full py-3 rounded-xl
              text-neutral-400 text-button-1
              hover:bg-black/5 active:bg-black/10
              transition-all duration-150
              disabled:opacity-60
            "
          >
            Agora não
          </button>
        </div>
      </div>
    </>
  );
}
