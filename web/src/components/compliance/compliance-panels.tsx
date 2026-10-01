"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { CHART, TOOLTIP_STYLE } from "@/lib/health";
import type { MonthlyCo2 } from "@/hooks/useCompliance";
import { formatNumber } from "@/shared/alerts";
import type { ComplianceLog, ComplianceSummary } from "@/shared/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `${MONTHS[Number(m) - 1]} ${y.slice(2)}`;
}

export function SummaryCards({
  last30,
  loggedWasteKg,
  spills,
}: {
  last30: ComplianceSummary | null;
  loggedWasteKg: number;
  spills: { count: number; litres: number };
}) {
  const cards = [
    { label: "CO₂ emitted", value: last30 ? `${last30.co2Tonnes.toFixed(1)} t` : "…", note: "Last 30 days · diesel × 2.68 kg/L" },
    { label: "Diesel burned", value: last30 ? `${formatNumber(last30.dieselLitres)} L` : "…", note: "Last 30 days · generators" },
    { label: "Waste logged", value: `${formatNumber(loggedWasteKg)} kg`, note: "Last 30 days · for return shipment or incineration" },
    {
      label: "Spills",
      value: String(spills.count),
      note: spills.count ? `${formatNumber(spills.litres)} L in the last 30 days` : "None in the last 30 days",
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <Panel key={c.label} title={c.label}>
          <p className="text-3xl font-medium tabular-nums">{c.value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{c.note}</p>
        </Panel>
      ))}
    </div>
  );
}

export function MonthlyCo2Chart({ data, height = 256, animate = true }: { data: MonthlyCo2[]; height?: number; animate?: boolean }) {
  return (
    <Panel title="CO₂ by month (estimated from diesel use)" icon={BarChart3}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="month" tickFormatter={monthLabel} stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} width={40} unit=" t" />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(m) => monthLabel(String(m))} formatter={(v) => [`${Number(v).toFixed(1)} t CO₂`, "Emitted"]} />
            <Bar dataKey="co2Tonnes" fill={CHART.primary} radius={[3, 3, 0, 0]} isAnimationActive={animate} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export function LogTable({ logs, limit = 12 }: { logs: ComplianceLog[]; limit?: number }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="py-2 pr-3 font-medium">Date (UTC)</th>
          <th className="py-2 pr-3 font-medium">Type</th>
          <th className="py-2 pr-3 text-right font-medium">Amount</th>
          <th className="py-2 font-medium">Note</th>
        </tr>
      </thead>
      <tbody>
        {logs.slice(0, limit).map((l) => (
          <tr key={l.id} className="border-b border-border/70 align-top">
            <td className="py-2 pr-3 font-mono text-xs whitespace-nowrap">{l.createdAt.slice(0, 10)}</td>
            <td className="py-2 pr-3 capitalize">{l.kind}</td>
            <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">
              {l.amount} {l.unit}
            </td>
            <td className="py-2 text-muted-foreground">{l.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
