'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SquadFeedHeaderProps {
  title: string;
}

export function SquadFeedHeader({ title }: SquadFeedHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full bg-glass-light-2 backdrop-blur-md border-b border-white/40 shadow-sm">
      <div className="flex items-center justify-between px-4 h-16">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-neutral-500 hover:bg-black/5 rounded-full"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <h1 className="text-title-3 font-semibold text-neutral-500 truncate max-w-[200px]">
          {title}
        </h1>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => console.log('Open Settings')} // Placeholder for future
          className="text-neutral-500 hover:bg-black/5 rounded-full"
          aria-label="Configurações do Squad"
        >
          <Settings className="h-6 w-6" />
        </Button>
      </div>
    </header>
  );
}
