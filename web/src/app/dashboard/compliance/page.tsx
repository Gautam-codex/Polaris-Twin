"use client";

import { FileText, Printer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LogForm } from "@/components/compliance/log-form";
import { LogTable, MonthlyCo2Chart, SummaryCards } from "@/components/compliance/compliance-panels";
import { useOps } from "@/components/dashboard/ops-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { useStation } from "@/components/dashboard/station-context";
import { useT } from "@/components/language";
import { useCompliance } from "@/hooks/useCompliance";

export default function CompliancePage() {
  const { stationId, station, snapshot } = useStation();
  const { runOrQueue } = useOps();
  const t = useT();
  const data = useCompliance(stationId, snapshot?.timestamp ?? null, runOrQueue);

  return (
    <>
      <PageHeader
        title="Environmental compliance"
        description={`${station.name} · Madrid Protocol / Indian Antarctic Act 2022`}
        actions={
          <a
            href={`/report/compliance?station=${stationId}`}
            target="_blank"
            rel="noopener"
            className={buttonVariants({ variant: "outline" })}
          >
            <Printer /> {t("Export report")}
          </a>
        }
      />
      <div className="flex flex-col gap-4">
        <SummaryCards last30={data.last30} loggedWasteKg={data.loggedWasteKg} spills={data.spills} />
        <MonthlyCo2Chart data={data.monthly} />
        <div className="grid gap-4 xl:grid-cols-3">
          <LogForm stationId={stationId} onSubmit={data.addLog} />
          <Panel title="Compliance register" icon={FileText} className="xl:col-span-2">
            {data.error && <p className="mb-3 text-sm text-destructive">{data.error}</p>}
            {data.loading ? (
              <p className="text-sm text-muted-foreground">Loading register…</p>
            ) : (
              <div className="overflow-x-auto">
                <LogTable logs={data.logs} />
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
