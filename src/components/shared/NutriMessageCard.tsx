'use client';

import { useState } from 'react';
import { MessageSquare, Check } from 'lucide-react';

interface NutriMessageCardProps {
  notification: {
    id: string;
    title: string;
    message: string;
  };
  onDismiss: (notificationId: string) => void;
}

export function NutriMessageCard({ notification, onDismiss }: NutriMessageCardProps) {
  const [dismissing, setDismissing] = useState(false);

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notification.id }),
      });
      onDismiss(notification.id);
    } catch {
      setDismissing(false);
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-insights p-[1px]">
      <div className="rounded-3xl bg-glass-light-1 backdrop-blur-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-brand-500" />
          <p className="text-body-2 font-semibold text-neutral-500">
            {notification.title}
          </p>
        </div>
        <p className="text-body-1 text-neutral-500">
          {notification.message}
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={dismissing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-brand-500 text-white text-button-1 font-semibold hover:bg-brand-600 active:scale-[0.97] transition-all disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
          Entendi
        </button>
      </div>
    </div>
  );
}
