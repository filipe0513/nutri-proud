import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Orgulho da Nutri',
    short_name: 'NutriProud',
    description: 'Seu acompanhamento gamificado de hábitos saudáveis',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F5F5F7',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/icon-192.webp',
        sizes: '192x192',
        type: 'image/webp',
        purpose: 'any',
      },
      {
        src: '/icon-192.webp',
        sizes: '192x192',
        type: 'image/webp',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.webp',
        sizes: '512x512',
        type: 'image/webp',
        purpose: 'any',
      },
      {
        src: '/icon-512.webp',
        sizes: '512x512',
        type: 'image/webp',
        purpose: 'maskable',
      },
    ],
  };
}
