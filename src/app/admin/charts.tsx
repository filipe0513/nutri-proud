"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, CheckCircle2 } from "lucide-react";

const chartConfig = {
  logs: {
    label: "Registros",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface WeeklyLogData {
  name: string;
  logs: number;
}

export function WeeklyVolumeChart({ data }: { data: WeeklyLogData[] }) {
  return (
    <Card className="lg:col-span-2 bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-neutral-700">
          <TrendingUp className="w-5 h-5 text-notify-success" />
          Volume de Hábitos Registrados (Últimos 7 dias)
        </CardTitle>
        <CardDescription>
          Acompanhe a retenção diária através da entrada de logs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLogs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#737373', fontSize: 12 }} 
                dy={10}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="logs" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorLogs)" 
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface SourceData {
  name: string;
  value: number;
  fill: string;
}

export function SourceDistributionChart({ data }: { data: SourceData[] }) {
  return (
    <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-neutral-700">
          <CheckCircle2 className="w-5 h-5 text-notify-info" />
          Origem dos Registros
        </CardTitle>
        <CardDescription>
          Por onde os usuários interagem mais?
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center items-center h-[300px]">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
