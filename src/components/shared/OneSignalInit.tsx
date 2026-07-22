'use client';

import { useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { useAppStore } from '@/store/store';

export function OneSignalInit() {
  const isInitialized = useRef(false);
  const userProfile = useAppStore((state) => state.user_profile);
  const userId = userProfile?.id;

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId || isInitialized.current) return;

    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId,
          allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
        });
        isInitialized.current = true;
      } catch (error) {
        console.error('Erro ao inicializar OneSignal:', error);
      }
    };

    initOneSignal();
  }, []);

  useEffect(() => {
    if (!isInitialized.current) return;

    if (userId) {
      OneSignal.login(userId).catch((err) => {
        console.error('Erro ao vincular usuário no OneSignal:', err);
      });
    } else {
      OneSignal.logout().catch((err) => {
        console.error('Erro ao deslogar usuário no OneSignal:', err);
      });
    }
  }, [userId]);

  return null;
}
