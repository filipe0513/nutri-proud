'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Trophy, UserCheck, BarChart2 } from 'lucide-react';
import type {
  NutriActivationRow,
  NutriRetentionRow,
  PlanDistributionResult,
  NutriEngagementRow,
} from '@/services/adminNutriService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NutriMetricsPayload {
  activation: NutriActivationRow[];
  retention: NutriRetentionRow[];
  planDist: PlanDistributionResult;
  ranking: NutriEngagementRow[];
}

// ─── Plan colour map ──────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  FREE: 'var(--color-neutral-300)',
  START: 'var(--color-notify-info)',
  PRO: 'var(--color-brand-500)',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  title,
  value,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  sub: string;
}) {
  return (
    <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-neutral-500">{title}</CardTitle>
        <Icon className="w-4 h-4 text-neutral-400" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-neutral-800">{value}</div>
        <p className="text-xs text-neutral-500 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function ActivationChart({ data }: { data: NutriActivationRow[] }) {
  const top10 = data
    .filter((r) => r.invited > 0)
    .slice(0, 10)
    .map((r) => ({
      name: r.nutriName.split(' ')[0],
      taxa: r.activationRatePct,
      invited: r.invited,
      activated: r.activated,
    }));

  if (top10.length === 0) {
    return (
      <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-neutral-700 text-sm font-medium">
            Taxa de Ativação por Nutricionista (Top 10)
          </CardTitle>
          <CardDescription>% de pacientes que logaram na 1ª semana</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-caption-1 text-neutral-400 py-4">
            Sem dados de ativação no período.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm">
      <CardHeader>
        <CardTitle className="text-neutral-700 text-sm font-medium">
          Taxa de Ativação por Nutricionista (Top 10)
        </CardTitle>
        <CardDescription>% de pacientes que logaram na 1ª semana após entrar na equipe</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={top10} barSize={28}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, _name: any, props: any) => {
                const payload = props.payload as {
                  invited?: number;
                  activated?: number;
                };
                return [
                  `${Number(value)}% (${payload?.activated ?? 0}/${payload?.invited ?? 0})`,
                  'Ativação',
                ];
              }}
            />
            <Bar dataKey="taxa" radius={[4, 4, 0, 0]}>
              {top10.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.taxa >= 60
                      ? 'var(--color-notify-success)'
                      : entry.taxa >= 30
                        ? 'var(--color-notify-warning)'
                        : 'var(--color-notify-error)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function PlanDistributionChart({ data }: { data: PlanDistributionResult }) {
  const chartData = data.distribution.map((d) => ({
    name: d.plan,
    count: d.count,
  }));

  if (chartData.length === 0) {
    return (
      <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-neutral-700 text-sm font-medium">
            Distribuição de Planos (Nutricionistas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-caption-1 text-neutral-400 py-4">
            Sem nutricionistas cadastrados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm">
      <CardHeader>
        <CardTitle className="text-neutral-700 text-sm font-medium">
          Distribuição de Planos (Nutricionistas)
        </CardTitle>
        <CardDescription>
          Snapshot atual · histórico de upgrade não rastreado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} barSize={40}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Tooltip formatter={(v: any) => [Number(v), 'Nutricionistas']} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={PLAN_COLORS[entry.name] ?? 'var(--color-neutral-400)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function EngagementRankingTable({ data }: { data: NutriEngagementRow[] }) {
  if (data.length === 0) {
    return (
      <p className="text-caption-1 text-neutral-400 py-4">
        Sem nutricionistas com pacientes ativos.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-500 border-b border-neutral-200">
            <th className="pb-2 pr-4 font-medium text-caption-1">#</th>
            <th className="pb-2 pr-4 font-medium text-caption-1">Nutricionista</th>
            <th className="pb-2 pr-4 font-medium text-caption-1 text-right">Pacientes</th>
            <th className="pb-2 font-medium text-caption-1 text-right">
              Média Logs/Paciente (30d)
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.nutriId} className="border-b border-neutral-100">
              <td className="py-2 pr-4 text-caption-1 text-neutral-400 font-mono">
                {i + 1}
              </td>
              <td className="py-2 pr-4 text-caption-1 text-neutral-700 font-medium">
                {row.nutriName}
              </td>
              <td className="py-2 pr-4 text-caption-1 text-neutral-500 text-right">
                {row.totalPatients}
              </td>
              <td className="py-2 text-right">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-caption-1 font-semibold ${
                    row.avgLogsPerPatient >= 10
                      ? 'bg-notify-success/20 text-notify-success'
                      : row.avgLogsPerPatient >= 4
                        ? 'bg-notify-warning/20 text-notify-warning'
                        : 'bg-notify-error/20 text-notify-error'
                  }`}
                >
                  {row.avgLogsPerPatient}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RetentionChart({ data }: { data: NutriRetentionRow[] }) {
  const chartData = data
    .filter((r) => r.totalPatients > 0)
    .map((r) => ({
      name: r.nutriName.split(' ')[0],
      retencao: r.retentionPct,
      total: r.totalPatients,
      retidos: r.retainedPatients,
    }));

  if (chartData.length === 0) return null;

  return (
    <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm">
      <CardHeader>
        <CardTitle className="text-neutral-700 text-sm font-medium">
          Retenção de Pacientes (30 dias)
        </CardTitle>
        <CardDescription>% de pacientes com ao menos 1 log nos últimos 30 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={28}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, _name: any, props: any) => {
                const payload = props.payload as {
                  retidos?: number;
                  total?: number;
                };
                return [
                  `${Number(value)}% (${payload?.retidos ?? 0}/${payload?.total ?? 0})`,
                  'Retenção',
                ];
              }}
            />
            <Bar dataKey="retencao" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.retencao >= 60
                      ? 'var(--color-notify-success)'
                      : entry.retencao >= 30
                        ? 'var(--color-notify-warning)'
                        : 'var(--color-notify-error)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function AdminNutriPanel() {
  const [data, setData] = useState<NutriMetricsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/nutritionists-metrics')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<NutriMetricsPayload>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-neutral-200" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40">
        <CardContent className="py-6 text-center text-caption-1 text-notify-error">
          Falha ao carregar métricas de nutricionistas: {error ?? 'dados indisponíveis'}
        </CardContent>
      </Card>
    );
  }

  const { activation, retention, planDist, ranking } = data;

  const totalNutris = ranking.length;
  const avgActivation =
    activation.filter((r) => r.invited > 0).length === 0
      ? 0
      : Math.round(
          activation
            .filter((r) => r.invited > 0)
            .reduce((sum, r) => sum + r.activationRatePct, 0) /
            activation.filter((r) => r.invited > 0).length,
        );
  const avgRetention =
    retention.filter((r) => r.totalPatients > 0).length === 0
      ? 0
      : Math.round(
          retention
            .filter((r) => r.totalPatients > 0)
            .reduce((sum, r) => sum + r.retentionPct, 0) /
            retention.filter((r) => r.totalPatients > 0).length,
        );

  return (
    <div className="space-y-6">
      {/* Section heading */}
      <div className="flex flex-col gap-1">
        <h2 className="text-title-2 font-bold text-neutral-800">
          Saúde do Negócio por Nutricionista
        </h2>
        <p className="text-body-2 text-neutral-500">
          Ativação de pacientes, retenção, planos e ranking de engajamento.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          icon={BarChart2}
          title="Nutricionistas Ativos"
          value={totalNutris}
          sub="com ao menos 1 equipe criada"
        />
        <KpiCard
          icon={UserCheck}
          title="Ativação Média"
          value={`${avgActivation}%`}
          sub="pacientes que logaram na 1ª semana"
        />
        <KpiCard
          icon={Trophy}
          title="Retenção Média (30d)"
          value={`${avgRetention}%`}
          sub="pacientes com logs nos últimos 30 dias"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivationChart data={activation} />
        <PlanDistributionChart data={planDist} />
      </div>

      {/* Retention chart */}
      <RetentionChart data={retention} />

      {/* Engagement ranking table */}
      <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-neutral-700">
            Ranking de Engajamento de Pacientes
          </CardTitle>
          <CardDescription>
            Nutricionistas ordenados por média de logs por paciente nos últimos 30 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EngagementRankingTable data={ranking} />
        </CardContent>
      </Card>
    </div>
  );
}
