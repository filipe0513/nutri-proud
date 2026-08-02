'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TeamFeedHeaderProps {
  title: string;
  onSettingsClick?: () => void;
}

export function TeamFeedHeader({ title, onSettingsClick }: TeamFeedHeaderProps) {
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

        {onSettingsClick ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="text-neutral-500 hover:bg-black/5 rounded-full"
            aria-label="Configurações do Time"
            data-testid="btn-team-settings"
          >
            <Settings className="h-6 w-6" />
          </Button>
        ) : (
          <div className="w-10 h-10" />
        )}
      </div>
    </header>
  );
}
