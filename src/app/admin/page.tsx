import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, BarChart3, Mail, TrendingUp, Cpu } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();

  // Proteção Server-Side RBAC
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/");
  }

  // Estatísticas para o Dashboard
  const totalUsers = await prisma.user.count({ where: { is_anonymous: false } });
  const totalAnon = await prisma.user.count({ where: { is_anonymous: true } });
  
  // Proxy DAU (24h)
  // eslint-disable-next-line react-hooks/purity
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const logsLast24h = await prisma.dailyLog.count({
    where: { createdAt: { gte: oneDayAgo } }
  });

  // Agrupamento por source (Caminhos de Uso)
  const logsBySource = await prisma.dailyLog.groupBy({
    by: ['source'],
    _count: { source: true }
  });
  const totalSourcedLogs = logsBySource.reduce((acc, curr) => acc + curr._count.source, 0);

  // IA - Sucesso vs Desistência
  const aiConverted = await prisma.systemEvent.count({
    where: { eventName: 'AI_DRAWER_CONVERTED' }
  });
  const aiDismissed = await prisma.systemEvent.count({
    where: { eventName: 'AI_DRAWER_DISMISSED' }
  });
  const aiTotal = aiConverted + aiDismissed;
  const aiSuccessRate = aiTotal > 0 ? Math.round((aiConverted / aiTotal) * 100) : 0;

  // Funil de E-mail
  const emailStarted = await prisma.systemEvent.count({
    where: { eventName: 'AUTH_EMAIL_STARTED' }
  });
  const emailValidated = await prisma.user.count({
    where: { emailVerified: { not: null } }
  });
  const emailDropOff = emailStarted > 0 ? Math.round(((emailStarted - emailValidated) / emailStarted) * 100) : 0;

  // Últimos 10 usuários
  const lastUsers = await prisma.user.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, createdAt: true, is_anonymous: true }
  });

  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">Usuários Registrados</CardTitle>
              <Users className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neutral-800">{totalUsers}</div>
              <p className="text-xs text-neutral-500">+{totalAnon} anônimos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">DAU (Logs 24h)</CardTitle>
              <Activity className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neutral-800">{logsLast24h}</div>
              <p className="text-xs text-neutral-500">Registros no último dia</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">Sucesso da IA</CardTitle>
              <Cpu className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neutral-800">{aiSuccessRate}%</div>
              <p className="text-xs text-neutral-500">{aiConverted} usos / {aiDismissed} pulos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">Drop-off de E-mail</CardTitle>
              <Mail className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neutral-800">{emailDropOff}%</div>
              <p className="text-xs text-neutral-500">{emailStarted} iniciados / {emailValidated} ativos</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-700">
                <BarChart3 className="w-5 h-5" /> Caminhos de Uso (Logs)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logsBySource.map(sourceData => {
                  const percentage = totalSourcedLogs > 0 ? Math.round((sourceData._count.source / totalSourcedLogs) * 100) : 0;
                  return (
                    <div key={sourceData.source} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-600">{sourceData.source || 'UNKNOWN'}</span>
                      <span className="text-sm text-neutral-500">{percentage}% ({sourceData._count.source})</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-700">
                <TrendingUp className="w-5 h-5" /> Saúde da Comunidade (Últimos 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lastUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between pb-2 border-b border-neutral-100 last:border-0">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-neutral-700">{u.email || (u.is_anonymous ? 'Usuário Anônimo' : 'Sem E-mail')}</span>
                      <span className="text-xs text-neutral-400">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="text-xs bg-neutral-100 px-2 py-1 rounded-md text-neutral-500">
                      {u.is_anonymous ? 'Anônimo' : 'Registrado'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
