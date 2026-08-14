'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/store';
import { Toaster } from '@/components/ui/sonner';
import { SuccessOverlay } from './SuccessOverlay';
import { OneSignalInit } from './OneSignalInit';
import { PushPermissionModal } from './PushPermissionModal';

/**
 * RootProvider — responsável apenas por inicializar os dados do Zustand e
 * renderizar o Toaster global.
 *
 * IMPORTANTE: Este componente NÃO deve conter nenhuma lógica de redirect ou
 * guarda de rotas. Isso é responsabilidade exclusiva do Server Component
 * (main)/layout.tsx, que verifica sessão e onboarding via Prisma no servidor.
 * Manter redirect aqui causaria conflito com o server layout e loops infinitos.
 *
 * Nota: o gate `if (!mounted) return null` foi removido intencionalmente.
 * Ele bloqueava o render de todos os children até a hidratação completar,
 * aumentando o Speed Index. Como `RootProvider` é 'use client', não há
 * risco de hydration mismatch nos filhos.
 */
export function RootProvider({ children }: { children: React.ReactNode }) {
  const initializeData = useAppStore((state) => state.initializeData);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return (
    <>
      <OneSignalInit />
      <PushPermissionModal />
      {children}
      <Toaster position="top-center" richColors />
      <SuccessOverlay />
    </>
  );
}
