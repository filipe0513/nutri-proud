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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, TrendingUp, ArrowDownRight, Activity } from 'lucide-react';
import type {
  RetentionCohort,
  AnonymousConversionRate,
  PillarDistributionItem,
  AvgLogsMetric,
  FunnelStep,
} from '@/services/adminPatientsService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatientsMetricsPayload {
  retention: RetentionCohort[];
  conversion: AnonymousConversionRate;
  pillarDist: PillarDistributionItem[];
  avgLogs: AvgLogsMetric;
  funnel: FunnelStep[];
}

// ─── Pillar colour map (design system tokens) ─────────────────────────────────

const PILLAR_COLORS: Record<string, string> = {
  water: 'var(--color-cat-water)',
  food: 'var(--color-cat-food)',
  sleep: 'var(--color-cat-sleep)',
  workout: 'var(--color-cat-workout)',
  poop: 'var(--color-cat-poop)',
};

const PILLAR_LABELS: Record<string, string> = {
  water: 'Água',
  food: 'Alimentação',
  sleep: 'Sono',
  workout: 'Exercício',
  poop: 'Intestino',
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

function PillarDistributionChart({ data }: { data: PillarDistributionItem[] }) {
  const chartData = data.map((d) => ({
    name: PILLAR_LABELS[d.pillar] ?? d.pillar,
    pillar: d.pillar,
    logs: d.count,
    pct: d.pct,
  }));

  return (
    <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm">
      <CardHeader>
        <CardTitle className="text-neutral-700 text-sm font-medium">
          Distribuição por Pilar (30 dias)
        </CardTitle>
        <CardDescription>Volume de registros por hábito</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={28}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, _name: any, props: any) => [
                `${Number(value)} logs (${(props.payload as { pct?: number })?.pct ?? 0}%)`,
                'Registros',
              ]}
            />
            <Bar dataKey="logs" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.pillar}
                  fill={PILLAR_COLORS[entry.pillar] ?? '#6366f1'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function FunnelChart({ data }: { data: FunnelStep[] }) {
  const max = data[0]?.count ?? 1;

  return (
    <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm">
      <CardHeader>
        <CardTitle className="text-neutral-700 text-sm font-medium">
          Funil de Onboarding
        </CardTitle>
        <CardDescription>/welcome → /onboarding → 1º hábito</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((step, i) => {
          const widthPct = max === 0 ? 0 : Math.round((step.count / max) * 100);
          return (
            <div key={step.step}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-caption-1 text-neutral-600">{step.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-caption-1 font-semibold text-neutral-800">
                    {step.count.toLocaleString('pt-BR')}
                  </span>
                  {i > 0 && step.dropOffPct !== null && (
                    <span className="text-caption-2 text-notify-error flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" />
                      {step.dropOffPct}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function RetentionTable({ data }: { data: RetentionCohort[] }) {
  if (data.length === 0) {
    return (
      <p className="text-caption-1 text-neutral-400 py-4">
        Sem dados de coorte para o período selecionado.
      </p>
    );
  }

  const maxOffset = Math.max(...data.flatMap((c) => c.weekRetention.map((w) => w.weekOffset)));

  function pctToColor(pct: number): string {
    if (pct >= 70) return 'bg-notify-success/20 text-notify-success';
    if (pct >= 40) return 'bg-notify-warning/20 text-notify-warning';
    return 'bg-notify-error/20 text-notify-error';
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-500 border-b border-neutral-200">
            <th className="pb-2 pr-4 font-medium text-caption-1">Coorte</th>
            <th className="pb-2 pr-4 font-medium text-caption-1">N</th>
            {Array.from({ length: maxOffset + 1 }, (_, i) => (
              <th key={i} className="pb-2 pr-3 font-medium text-caption-1">
                Sem. +{i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((cohort) => (
            <tr key={cohort.cohortWeek} className="border-b border-neutral-100">
              <td className="py-2 pr-4 text-caption-1 text-neutral-600 font-mono">
                {cohort.cohortWeek}
              </td>
              <td className="py-2 pr-4 text-caption-1 text-neutral-500">{cohort.cohortSize}</td>
              {Array.from({ length: maxOffset + 1 }, (_, i) => {
                const week = cohort.weekRetention.find((w) => w.weekOffset === i);
                const pct = week?.retainedPct ?? 0;
                return (
                  <td key={i} className="py-2 pr-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-caption-2 font-medium ${pctToColor(pct)}`}
                    >
                      {pct}%
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function AdminPatientsPanel() {
  const [data, setData] = useState<PatientsMetricsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/patients-metrics')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<PatientsMetricsPayload>;
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
          Falha ao carregar métricas de pacientes: {error ?? 'dados indisponíveis'}
        </CardContent>
      </Card>
    );
  }

  const { conversion, pillarDist, avgLogs, funnel, retention } = data;

  return (
    <div className="space-y-6">
      {/* Section heading */}
      <div className="flex flex-col gap-1">
        <h2 className="text-title-2 font-bold text-neutral-800">Saúde da Base de Pacientes</h2>
        <p className="text-body-2 text-neutral-500">
          Retenção, conversão de anônimos e engajamento por pilar — últimos 30 dias.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          icon={Users}
          title="Conversão Anônimo → Conta"
          value={`${conversion.conversionRatePct}%`}
          sub={`${conversion.realLogins} logins reais / ${conversion.anonSessions} sessões anônimas`}
        />
        <KpiCard
          icon={Activity}
          title="Média de Registros / Usuário Ativo"
          value={avgLogs.avg}
          sub={`${avgLogs.activeUsers} usuários ativos · ${avgLogs.totalLogs} registros totais`}
        />
        <KpiCard
          icon={TrendingUp}
          title="Coortes de Retenção"
          value={retention.length}
          sub="semanas com usuários cadastrados no período"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PillarDistributionChart data={pillarDist} />
        <FunnelChart data={funnel} />
      </div>

      {/* Retention heatmap table */}
      <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-neutral-700">Retenção por Coorte de Cadastro</CardTitle>
          <CardDescription>
            % de usuários que voltaram a registrar hábitos nas semanas seguintes ao cadastro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RetentionTable data={retention} />
        </CardContent>
      </Card>
    </div>
  );
}
