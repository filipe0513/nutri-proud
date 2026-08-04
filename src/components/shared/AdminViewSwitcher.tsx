'use client';

import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from '@/types/roles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Smartphone, Salad, ShieldCheck, ChevronDown } from 'lucide-react';

interface AdminViewSwitcherProps {
  /** The role of the currently authenticated user (passed from a Server Component). */
  role: string;
}

const VIEWS = [
  {
    label: 'Visão Paciente',
    href: '/',
    icon: Smartphone,
    description: 'Dashboard gamificado',
  },
  {
    label: 'Visão Nutricionista',
    href: '/dashboard',
    icon: Salad,
    description: 'Painel de pacientes',
  },
  {
    label: 'Visão Admin',
    href: '/admin',
    icon: ShieldCheck,
    description: 'Gestão do sistema',
  },
] as const;

/**
 * AdminViewSwitcher
 *
 * Floating dropdown that lets an ADMIN user instantly switch between the three
 * contextual views of the app (Patient / Nutritionist / Admin).
 *
 * Renders nothing if the authenticated user is NOT an ADMIN — so it's safe to
 * include it unconditionally in layouts.
 */
export function AdminViewSwitcher({ role }: AdminViewSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Only render for ADMIN users
  if (role !== UserRole.ADMIN) return null;

  // Determine the currently active view label for display in the trigger
  const activeView =
    VIEWS.find((v) => v.href !== '/' && pathname.startsWith(v.href)) ??
    VIEWS.find((v) => v.href === '/');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id="admin-view-switcher-trigger"
          aria-label="Alternar visão (Admin)"
          className="
            flex items-center gap-1.5 px-3 h-8
            rounded-xl border border-brand-500/30
            bg-brand-50 hover:bg-brand-100
            text-brand-600 text-caption-1 font-semibold
            transition-all active:scale-95
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
          "
        >
          <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="hidden sm:inline truncate max-w-[100px]">
            {activeView?.label ?? 'God Mode'}
          </span>
          <ChevronDown className="h-3 w-3 flex-shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-52 bg-glass-light-3 backdrop-blur-lg border border-white/40 shadow-xl rounded-2xl p-1"
      >
        <DropdownMenuLabel className="text-caption-2 text-neutral-400 font-semibold px-2 py-1.5 flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-brand-500" />
          God Mode — ADMIN
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/30 my-1" />

        {VIEWS.map((view) => {
          const isActive =
            view.href === '/'
              ? pathname === '/'
              : pathname.startsWith(view.href);
          const Icon = view.icon;

          return (
            <DropdownMenuItem
              key={view.href}
              id={`admin-view-${view.href.replace('/', '') || 'patient'}`}
              onSelect={() => router.push(view.href)}
              className={`
                flex items-center gap-3 px-2 py-2.5 rounded-xl cursor-pointer
                transition-all
                ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-600'
                    : 'text-neutral-500 hover:bg-white/60 hover:text-neutral-600'
                }
              `}
            >
              <div
                className={`
                  h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isActive ? 'bg-brand-500 text-white' : 'bg-slate-100 text-neutral-400'}
                `}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-caption-1 font-semibold leading-tight">
                  {view.label}
                </span>
                <span className="text-[10px] text-neutral-400 leading-tight">
                  {view.description}
                </span>
              </div>
              {isActive && (
                <span className="ml-auto h-2 w-2 rounded-full bg-brand-500 flex-shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
