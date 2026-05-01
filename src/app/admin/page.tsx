/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();

  // Proteção Server-Side RBAC
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  // Estatísticas para o Dashboard
  const totalUsers = await prisma.user.count({
    where: { is_anonymous: false },
  });
  const totalAnon = await prisma.user.count({ where: { is_anonymous: true } });
  const totalLogs = await prisma.dailyLog.count();

  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800">
              Admin Dashboard
            </h1>
            <p className="text-neutral-500">
              Métricas e conversões do Orgulho da Nutri
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h3 className="text-neutral-500 font-medium">
              Usuários Registrados
            </h3>
            <p className="text-4xl font-bold text-neutral-800 mt-2">
              {totalUsers}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h3 className="text-neutral-500 font-medium">
              Visitantes (Anônimos)
            </h3>
            <p className="text-4xl font-bold text-neutral-800 mt-2">
              {totalAnon}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h3 className="text-neutral-500 font-medium">Total de Registros</h3>
            <p className="text-4xl font-bold text-neutral-800 mt-2">
              {totalLogs}
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-800 mb-4">
            Em breve: Gráficos de Conversão
          </h2>
          <div className="h-64 bg-neutral-50 rounded-xl flex items-center justify-center border border-dashed border-neutral-300">
            <p className="text-neutral-400">Integração com Recharts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
