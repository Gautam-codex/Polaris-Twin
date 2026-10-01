"use client";

import { useT } from "@/components/language";

const NAVY = "#1D4F86";
const LINE = "#5B9BDC";

function Box({ x, y, w, h, title, lines, accent = false }: { x: number; y: number; w: number; h: number; title: string; lines: string[]; accent?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={accent ? "#E7F1FD" : "#FFFFFF"} stroke={accent ? NAVY : "#C6D7EA"} strokeWidth={accent ? 1.5 : 1} />
      <text x={x + 14} y={y + 26} fontSize={14} fontWeight={600} fill="#0F1F33">
        {title}
      </text>
      {lines.map((l, i) => (
        <text key={l} x={x + 14} y={y + 48 + i * 18} fontSize={12} fill="#5A6B80">
          {l}
        </text>
      ))}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={LINE} strokeWidth={1.5} markerEnd="url(#arrow)" />;
}

/** Station edge node → compressed sync over satellite → cloud → dashboard, app and copilot. */
export function Architecture() {
  const t = useT();
  return (
    <section id="architecture" className="mx-auto max-w-6xl px-4 py-14 md:px-6">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">03</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{t("How it works")}</h2>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card p-4">
        <svg viewBox="0 0 960 330" className="h-auto w-full min-w-[720px]" role="img" aria-label="System architecture">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={LINE} />
            </marker>
          </defs>

          <Box x={10} y={95} w={230} h={140} accent title="Station edge node" lines={["Maitri / Bharati", "Sensors + local twin", "Keeps running offline", "Queues writes in outages"]} />

          <Arrow x1={242} y1={165} x2={348} y2={165} />
          <text x={295} y={140} textAnchor="middle" fontSize={12} fontWeight={600} fill={NAVY}>
            Satellite link
          </text>
          <text x={295} y={196} textAnchor="middle" fontSize={11} fill="#5A6B80">
            deltas + alerts
          </text>
          <text x={295} y={212} textAnchor="middle" fontSize={11} fill="#5A6B80">
            ~0.5 KB per sync
          </text>

          <Box x={350} y={95} w={250} h={140} title="Cloud" lines={["Supabase: Postgres, auth,", "realtime alerts", "Vercel API: weather (Open-Meteo),", "copilot (Gemini)"]} />

          <Arrow x1={602} y1={140} x2={688} y2={60} />
          <Arrow x1={602} y1={165} x2={688} y2={165} />
          <Arrow x1={602} y1={190} x2={688} y2={270} />

          <Box x={690} y={15} w={260} h={90} title="Web dashboard" lines={["NCPOR control room, Goa", "Twin, energy, logistics, replay"]} />
          <Box x={690} y={120} w={260} h={90} title="Mobile app" lines={["Crew at the station", "Check-ins, alerts, field trips"]} />
          <Box x={690} y={225} w={260} h={90} title="AI copilot" lines={["Ask Polaris, English / Hindi", "Grounded in data and SOPs"]} />
        </svg>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Sensor values in this prototype come from a deterministic simulator, so every viewer sees the same readings at the same time.
      </p>
    </section>
  );
}
