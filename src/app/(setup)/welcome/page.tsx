/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { z } from 'zod';
import { toast } from 'sonner';

const emailSchema = z.string().email('Por favor, insira um e-mail válido.');

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceLogin = searchParams.get('forceLogin') === 'true';

  const [email, setEmail] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingAnon, setLoadingAnon] = useState(false);

  const handleMagicLink = async () => {
    try {
      emailSchema.parse(email);
      setLoadingEmail(true);
      await signIn('resend', { email, redirect: false });
      toast.success('Link enviado!', {
        description: 'Verifique sua caixa de entrada para fazer login.',
      });
      setEmail('');
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        toast.error(e.issues[0].message);
      } else {
        toast.error('Falha ao enviar e-mail. Tente novamente.');
      }
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  const handleAnonymousSignIn = async () => {
    setLoadingAnon(true);
    try {
      const res = await fetch('/api/auth/anonymous', { method: 'POST' });
      if (!res.ok) throw new Error('Falha');
      
      // Quando cria o anônimo, enviamos pro onboarding
      router.push('/onboarding');
    } catch {
      toast.error('Falha ao iniciar. Tente novamente.');
      setLoadingAnon(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-6 text-neutral-500 bg-mesh-sunset relative">
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-sm w-full text-center mt-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-32 h-32"
        >
          <Image
            src="/hero.png"
            alt="Nutri Proud Logo"
            fill
            className="object-contain"
            priority
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="space-y-3"
        >
          <h1 className="text-title-1 font-bold text-neutral-600">
            Nutri Proud
          </h1>
          <p className="text-body-1 text-neutral-500/80 font-medium px-4">
            Sua jornada para uma vida extraordinária começa aqui.
          </p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="w-full max-w-sm space-y-6 pb-12"
      >
        {/* Email Magic Link */}
        <div className="space-y-3 bg-white/40 p-4 rounded-3xl border border-white/60 shadow-sm backdrop-blur-md">
          <input 
            type="email" 
            placeholder="seu@email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-14 bg-white/70 border-transparent rounded-2xl px-4 text-input-1 text-neutral-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <Button 
            onClick={handleMagicLink}
            disabled={loadingEmail || !email}
            className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold text-button-1 rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {loadingEmail ? 'Enviando...' : 'Receber Link Mágico'}
          </Button>
        </div>

        <div className="flex items-center justify-center space-x-2">
            <div className="h-px bg-neutral-300 flex-1"></div>
            <span className="text-caption-1 font-medium text-neutral-400 uppercase tracking-widest">OU</span>
            <div className="h-px bg-neutral-300 flex-1"></div>
        </div>

        {/* Google Auth */}
        <Button 
          onClick={handleGoogleSignIn}
          variant="outline"
          className="w-full h-14 bg-white hover:bg-neutral-50 border-white/60 text-neutral-600 font-bold text-button-1 rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-3"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
            <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
            <path d="M5.26498 14.2949C5.02498 13.5699 4.875 12.8 4.875 12C4.875 11.2 5.01498 10.43 5.26498 9.70498L1.275 6.60998C0.46 8.27998 0 10.08 0 12C0 13.92 0.46 15.72 1.275 17.39L5.26498 14.2949Z" fill="#FBBC05" />
            <path d="M12.0004 24C15.2404 24 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24 12.0004 24Z" fill="#34A853" />
          </svg>
          <span>Continuar com Google</span>
        </Button>

        {/* Anonymous Auth */}
        {!forceLogin && (
          <Button 
            onClick={handleAnonymousSignIn}
            disabled={loadingAnon}
            variant="ghost"
            className="w-full h-14 hover:bg-white/30 text-neutral-500 font-medium text-button-1 rounded-2xl transition-all"
          >
            {loadingAnon ? 'Criando sessão...' : 'Explorar sem conta'}
          </Button>
        )}
      </motion.div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-mesh-sunset flex items-center justify-center text-white">Carregando...</div>}>
      <WelcomeContent />
    </Suspense>
  );
}
