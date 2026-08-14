import { withSentryConfig } from '@sentry/nextjs';
import withPWA from '@ducanh2912/next-pwa';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '0' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

// ─── PWA (Service Worker) ──────────────────────────────────────────────────────
// O SW gerado (`public/sw.js`) é separado do `OneSignalSDKWorker.js` — sem conflito.
// Desativado em dev para evitar ruído de cache durante o desenvolvimento.
const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  // Não pré-cachear o OneSignal worker — ele tem própria vida útil
  publicExcludes: ['!OneSignalSDKWorker.js'],
  workboxOptions: {
    // Exclui o OneSignal worker do precache manifest
    exclude: [/OneSignalSDKWorker\.js$/],
    runtimeCaching: [
      // ── API routes da Home — NetworkFirst: sempre tenta rede, cai no cache ──
      {
        urlPattern: /^https:\/\/.*\/api\/(logs|streaks|progress|insights|notifications|plans)(\/?.*)?$/,
        handler: 'NetworkFirst' as const,
        options: {
          cacheName: 'api-home',
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 5 * 60, // 5 minutos
          },
        },
      },
      // ── Assets estáticos do Next.js — CacheFirst (content-hashed, imutáveis) ──
      {
        urlPattern: /^\/_next\/static\/.*/,
        handler: 'CacheFirst' as const,
        options: {
          cacheName: 'next-static',
          expiration: {
            maxEntries: 256,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 ano
          },
        },
      },
      // ── Imagens do Cloudinary — CacheFirst (imagens de usuário não mudam) ──
      {
        urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/,
        handler: 'CacheFirst' as const,
        options: {
          cacheName: 'cloudinary-images',
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
          },
        },
      },
      // ── Assets estáticos do /public (logos, ícones, share images) — CacheFirst ──
      {
        urlPattern: /\.(?:png|jpg|jpeg|webp|svg|gif|ico)$/,
        handler: 'CacheFirst' as const,
        options: {
          cacheName: 'static-images',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
          },
        },
      },
    ],
  },
})(nextConfig);

export default withSentryConfig(pwaConfig, {
  org: 'filipe-magalhaes',
  project: 'nutriproud',
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
