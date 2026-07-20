import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Activity, BrainCircuit } from "lucide-react";
import { WeeklyVolumeChart, SourceDistributionChart, LoginAttemptsChart } from "./charts";
import { HeavyUsersTable } from "./heavy-users-table";
export default async function AdminPage() {
  const session = await auth();

  // Proteção Server-Side RBAC
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/");
  }

  // 1. Overview KPIs
  const totalUsers = await prisma.user.count({ where: { is_anonymous: false } });
  const totalAnon = await prisma.user.count({ where: { is_anonymous: true } });
  
  // eslint-disable-next-line react-hooks/purity
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const logsLast24h = await prisma.dailyLog.count({
    where: { createdAt: { gte: oneDayAgo } }
  });

  const aiInsightsCount = await prisma.aiInsight.count();
  const aiCostEstimate = (aiInsightsCount * 0.015).toFixed(2); // Simulação: $0.015 por insight
  
  // 2. Volume Semanal
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyLogs = await prisma.dailyLog.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true }
  });

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const logsByDay = weeklyLogs.reduce((acc, log) => {
    const dayName = daysOfWeek[log.createdAt.getDay()];
    acc[dayName] = (acc[dayName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const areaChartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = daysOfWeek[d.getDay()];
    areaChartData.push({
      name: dayName,
      logs: logsByDay[dayName] || 0
    });
  }

  // 3. Distribuição Source
  const sourceGroups = await prisma.dailyLog.groupBy({
    by: ['source'],
    _count: { source: true }
  });
  
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const donutData = sourceGroups.map((item, index) => ({
    name: item.source || 'UNKNOWN',
    value: item._count.source,
    fill: COLORS[index % COLORS.length]
  }));

  // 4. Heavy Users Table (Top 10)
  const topUsers = await prisma.user.findMany({
    take: 10,
    orderBy: {
      logs: {
        _count: 'desc'
      }
    },
    include: {
      _count: {
        select: { logs: true }
      },
      logs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true }
      }
    }
  });

  // 5. Autenticação & Funil de Login
  const systemEvents = await prisma.systemEvent.findMany({
    where: {
      eventName: {
        in: [
          'AUTH_ANONYMOUS_STARTED', 'AUTH_ANONYMOUS_SUCCESS',
          'AUTH_GOOGLE_CLICKED', 'AUTH_EMAIL_STARTED',
          'AUTH_LOGIN_SUCCESS'
        ]
      }
    }
  });

  let anonStarted = 0, anonSuccess = 0;
  let googleStarted = 0, googleSuccess = 0;
  let resendStarted = 0, resendSuccess = 0;

  for (const event of systemEvents) {
    if (event.eventName === 'AUTH_ANONYMOUS_STARTED') anonStarted++;
    if (event.eventName === 'AUTH_ANONYMOUS_SUCCESS') anonSuccess++;
    if (event.eventName === 'AUTH_GOOGLE_CLICKED') googleStarted++;
    if (event.eventName === 'AUTH_EMAIL_STARTED') resendStarted++;
    if (event.eventName === 'AUTH_LOGIN_SUCCESS') {
      const provider = (event.metadata as Record<string, unknown>)?.provider;
      if (provider === 'google') googleSuccess++;
      if (provider === 'resend') resendSuccess++;
    }
  }

  const loginAttemptsData = [
    { name: "Google", tentativas: googleStarted, sucessos: googleSuccess },
    { name: "Email (Resend)", tentativas: resendStarted, sucessos: resendSuccess },
    { name: "Anônimo", tentativas: anonStarted, sucessos: anonSuccess },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-title-1 font-bold text-neutral-800">
            Centro de Comando Premium
          </h1>
          <p className="text-body-1 text-neutral-500">
            Análise comportamental avançada e métricas de sistema do Orgulho da Nutri.
          </p>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">Base Ativa (Registrados)</CardTitle>
              <Users className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-neutral-800">{totalUsers}</div>
              <p className="text-xs text-neutral-500 mt-1">+{totalAnon} usuários no modo anônimo</p>
            </CardContent>
          </Card>
          
          <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">Engajamento (24h)</CardTitle>
              <Activity className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-neutral-800">{logsLast24h}</div>
              <p className="text-xs text-neutral-500 mt-1">Registros de hábitos adicionados hoje</p>
            </CardContent>
          </Card>

          <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">Custo Est. de IA</CardTitle>
              <BrainCircuit className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-neutral-800">${aiCostEstimate}</div>
              <p className="text-xs text-neutral-500 mt-1">{aiInsightsCount} insights gerados até agora</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <WeeklyVolumeChart data={areaChartData} />
          <SourceDistributionChart data={donutData} />
          <LoginAttemptsChart data={loginAttemptsData} />
        </div>

        {/* Top Heavy Users */}
        <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-neutral-700">Heavy Users (Top 10)</CardTitle>
            <CardDescription>Usuários mais engajados com base no volume total de hábitos registrados.</CardDescription>
          </CardHeader>
          <HeavyUsersTable initialData={topUsers} />
        </Card>

      </div>
    </div>
  );
}
