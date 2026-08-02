import type { Metadata } from 'next';
import { NutriDashboard } from '@/components/shared/NutriDashboard';

export const metadata: Metadata = {
  title: 'Painel da Nutricionista',
  description: 'Gerencie seus pacientes, times e acompanhe a adesão aos hábitos de saúde.',
};

/**
 * /dashboard — Página exclusiva da Nutricionista.
 *
 * O guarda de RBAC está no layout pai (nutri)/layout.tsx.
 * Aqui apenas renderizamos o componente de dashboard.
 */
export default function NutriDashboardPage() {
  return <NutriDashboard />;
}
