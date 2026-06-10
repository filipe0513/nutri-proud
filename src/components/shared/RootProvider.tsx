/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/store';
import { Toaster } from '@/components/ui/sonner';

/**
 * RootProvider — responsável apenas por inicializar os dados do Zustand e
 * renderizar o Toaster global.
 *
 * IMPORTANTE: Este componente NÃO deve conter nenhuma lógica de redirect ou
 * guarda de rotas. Isso é responsabilidade exclusiva do Server Component
 * (main)/layout.tsx, que verifica sessão e onboarding via Prisma no servidor.
 * Manter redirect aqui causaria conflito com o server layout e loops infinitos.
 */
export function RootProvider({ children }: { children: React.ReactNode }) {
  const initializeData = useAppStore((state) => state.initializeData);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeData();
  }, [initializeData]);

  if (!mounted) return null;

  return (
    <>
      {children}
      <Toaster position="top-center" richColors />
    </>
  );
}
