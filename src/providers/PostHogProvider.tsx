'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { useAppStore } from '@/store/store';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const user_profile = useAppStore((state) => state.user_profile);

  // Inicializa PostHog após o primeiro paint para não bloquear a avaliação
  // do módulo durante o carregamento inicial da página.
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        person_profiles: 'identified_only',
      });
    }
  }, []);

  useEffect(() => {
    if (user_profile && user_profile.id) {
      posthog.identify(user_profile.id, {
        email: user_profile.email,
        role: user_profile.role,
      });
    }
  }, [user_profile]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
