'use client';

import { useAppStore } from '@/store/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'size-8 text-caption-2',
  md: 'size-10 text-caption-1',
  lg: 'size-14 text-body-1',
};

function getInitials(name: string | undefined | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function UserAvatar({ size = 'md', className }: UserAvatarProps) {
  const userProfile = useAppStore((state) => state.user_profile);

  const initials = getInitials(userProfile?.name);

  return (
    <Avatar className={cn(SIZE_CLASSES[size], className)}>
      {userProfile?.image && (
        <AvatarImage
          src={userProfile.image}
          alt={userProfile.name || 'Avatar'}
          referrerPolicy="no-referrer"
        />
      )}
      <AvatarFallback className="bg-gradient-to-br from-brand-500 to-brand-400 text-white font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
