"use client";

import { useMemo } from "react";
import {
  BellRing,
  Boxes,
  CloudSnow,
  FileCheck2,
  Fuel,
  History,
  MessageSquareText,
  Siren,
  Users,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/components/language";
import { NCPOR_GOA, distanceKm } from "@/lib/site";
import { polarPeriods } from "@/shared/daylight";
import { STATIONS } from "@/shared/stations";

function Heading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
    </div>
  );
}

function round100(km: number): string {
  return (Math.round(km / 100) * 100).toLocaleString("en-IN");
}

export function Problem() {
  const t = useT();
  const year = new Date().getUTCFullYear();
  const night = useMemo(() => polarPeriods(STATIONS.maitri.lat, year).night, [year]);
  const facts = [
    {
      figure: `${round100(distanceKm(NCPOR_GOA, STATIONS.maitri))} km`,
      title: "Isolation",
      body: `Maitri is that far from the NCPOR control room in Goa (Bharati: ${round100(distanceKm(NCPOR_GOA, STATIONS.bharati))} km). In ${year} the sun does not rise there for ${night?.days ?? "about 60"} days, and the only link is satellite.`,
    },
    {
      figure: "1 window a year",
      title: "Resupply",
      body: "Fuel, food and spares arrive once a year with the Indian Scientific Expedition to Antarctica ship in the austral summer (November to March). A late ship or a cold winter cannot be fixed by a delivery.",
    },
    {
      figure: "Diesel",
      title: "Energy dependence",
      body: "Both stations run mainly on diesel generators for power and heat. In our simulation Maitri burns about 1,200 litres a day, so a generator fault or a fuel shortfall affects the whole station.",
    },
  ];
  return (
    <section id="problem" className="mx-auto max-w-6xl px-4 py-14 md:px-6">
      <Heading eyebrow="01" title={t("The problem")} />
      <div className="grid gap-4 md:grid-cols-3">
        {facts.map((f) => (
          <article key={f.title} className="rounded-lg border border-border bg-card p-6 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_24px_-14px_rgba(15,31,51,0.3)]">
            <p className="text-2xl font-semibold text-primary">{f.figure}</p>
            <h3 className="mt-3 font-medium text-foreground">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Boxes, title: "3D digital twin", body: "Every building coloured by live health. Click one for its readings." },
  { icon: Fuel, title: "Fuel runway", body: "Days of diesel left, with ship-delay and cold-spell sliders." },
  { icon: BellRing, title: "Predictive maintenance", body: "Z-score anomaly detection on generator coolant and vibration, with time to the critical limit." },
  { icon: CloudSnow, title: "Weather and field safety", body: "Open-Meteo forecast, wind chill, a 0–100 safety index and go / no-go trip planning." },
  { icon: MessageSquareText, title: "AI copilot in English and Hindi", body: "Answers questions using live station data and the station SOPs." },
  { icon: Siren, title: "Emergency playbooks", body: "Fire, medical evacuation, power failure and blizzard checklists with a timer." },
  { icon: WifiOff, title: "Edge-first, low bandwidth", body: "Works during a link outage, queues changes, and syncs deltas of about 0.5 KB." },
  { icon: History, title: "72-hour replay", body: "Scrub back through station state and alerts to review an incident." },
  { icon: FileCheck2, title: "Environmental compliance", body: "CO₂, diesel, waste and spill register under the Madrid Protocol, with a printable report." },
  { icon: Users, title: "Anonymous crew wellbeing", body: "Mood, energy and sleep trends with no individual answers shown, plus a daylight tracker." },
];

export function Features() {
  const t = useT();
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-14 md:px-6">
      <Heading eyebrow="02" title={t("What it does")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <article key={f.title} className="group rounded-lg border border-border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_24px_-14px_rgba(15,31,51,0.3)]">
            <f.icon className="size-5 text-primary transition-transform duration-200 group-hover:scale-110" strokeWidth={1.75} />
            <h3 className="mt-3 font-medium text-foreground">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
