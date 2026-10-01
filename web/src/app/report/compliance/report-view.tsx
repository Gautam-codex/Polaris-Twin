"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogTable, MonthlyCo2Chart, monthLabel } from "@/components/compliance/compliance-panels";
import { parseStation } from "@/components/dashboard/station-context";
import { useCompliance } from "@/hooks/useCompliance";
import { formatNumber } from "@/shared/alerts";
import { STATIONS } from "@/shared/stations";

/** Clean, printable compliance report; opens the print dialog once the data has loaded. */
export function ReportView() {
  const stationId = parseStation(useSearchParams().get("station"));
  const station = STATIONS[stationId];
  // Set after mount so the server and browser render the same first frame.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(id);
  }, []);
  const data = useCompliance(stationId, now);
  const printed = useRef(false);

  useEffect(() => {
    if (now === null || data.loading || printed.current) return;
    printed.current = true;
    const id = setTimeout(() => window.print(), 800);
    return () => clearTimeout(id);
  }, [now, data.loading]);

  const generated = now === null ? "…" : new Date(now).toISOString().slice(0, 16).replace("T", " ");
  const total12 = data.monthly.reduce((s, m) => s + m.co2Tonnes, 0);
  const rows: [string, string][] = [
    ["CO₂ emitted, last 30 days (estimated)", data.last30 ? `${data.last30.co2Tonnes.toFixed(2)} t` : "…"],
    ["Diesel burned, last 30 days (generators)", data.last30 ? `${formatNumber(data.last30.dieselLitres)} L` : "…"],
    ["CO₂ emitted, last 12 months (estimated)", `${total12.toFixed(1)} t (${data.monthly[0] ? monthLabel(data.monthly[0].month) : ""} – now)`],
    ["Waste logged, last 30 days", `${formatNumber(data.loggedWasteKg)} kg`],
    ["Spills, last 30 days", data.spills.count ? `${data.spills.count} (${formatNumber(data.spills.litres)} L)` : "None"],
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 text-foreground print:max-w-none print:px-0 print:py-0">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Polaris Twin · Environmental compliance report</p>
          <h1 className="mt-2 text-2xl font-semibold">{station.name} station</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {station.region} · Generated {generated} UTC
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="print:hidden">
          <Printer /> Print
        </Button>
      </div>

      <p className="mb-6 rounded-md border border-border bg-secondary px-4 py-3 text-sm">
        Prepared under the Protocol on Environmental Protection to the Antarctic Treaty (Madrid Protocol) and the Indian
        Antarctic Act 2022. Diesel and CO₂ figures are estimated from a simulated sensor feed for a hackathon demo; they are
        not NCPOR data.
      </p>

      <h2 className="mb-2 text-base font-semibold">Summary</h2>
      <table className="mb-8 w-full text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-border">
              <td className="py-2 pr-4 text-muted-foreground">{k}</td>
              <td className="py-2 text-right font-medium tabular-nums">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-8 break-inside-avoid">
        <MonthlyCo2Chart data={data.monthly} height={220} animate={false} />
      </div>

      <h2 className="mb-2 text-base font-semibold">Compliance register (latest entries)</h2>
      {data.loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <LogTable logs={data.logs} limit={40} />}

      <p className="mt-10 text-xs text-muted-foreground">
        CO₂ = diesel litres × 2.68 kg. Waste is sorted at source; burnables go to the approved incinerator and the rest is
        returned on the ISEA ship.
      </p>
    </main>
  );
}
