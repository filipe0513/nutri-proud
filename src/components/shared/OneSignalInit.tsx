'use client';

import { useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { useAppStore } from '@/store/store';

export function OneSignalInit() {
  const isInitStarted = useRef(false);
  const isInitDone = useRef(false);
  const userProfile = useAppStore((state) => state.user_profile);
  const userId = userProfile?.id;

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId || isInitStarted.current) return;

    const initOneSignal = async () => {
      try {
        isInitStarted.current = true;
        await OneSignal.init({
          appId,
          allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
        });
        isInitDone.current = true;
        
        // Se já tiver userId quando inicializou, loga agora
        if (useAppStore.getState().user_profile?.id) {
          OneSignal.login(useAppStore.getState().user_profile!.id!).catch((err) => {
             console.error('Erro ao vincular usuário (pós-init):', err);
          });
        }
      } catch (error) {
        isInitStarted.current = false;
        console.error('Erro ao inicializar OneSignal:', error);
      }
    };

    initOneSignal();
  }, []);

  useEffect(() => {
    if (!isInitDone.current) return;

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
