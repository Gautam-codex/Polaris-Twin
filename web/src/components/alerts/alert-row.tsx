"use client";

import { Check, Radio } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/language";
import { SEVERITY_STYLE } from "@/lib/health";
import type { Alert } from "@/shared/types";

export function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

/**
 * One alert. `live` marks a sensor alert from the simulator (it clears by itself, so it
 * has no acknowledge button). Acknowledging is done only from the control room website.
 */
export function AlertRow({ alert, live, onAck }: { alert: Alert; live?: boolean; onAck?: () => void }) {
  const t = useT();
  return (
    <li className="rounded-md border border-border p-3 transition-colors hover:bg-muted/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded border px-2 py-0.5 text-[11px] font-medium capitalize", SEVERITY_STYLE[alert.severity])}>
              {alert.severity}
            </span>
            {live && (
              <span className="flex items-center gap-1 text-[11px] text-warning">
                <Radio className="size-3" /> live sensor
              </span>
            )}
            <span className="text-xs text-muted-foreground">{live ? "now" : timeAgo(alert.createdAt)}</span>
          </div>
          <p className="mt-1.5 text-sm font-medium text-foreground">{alert.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{alert.message}</p>
        </div>
        {alert.acknowledged ? (
          <span className="flex shrink-0 items-center gap-1 text-xs text-success">
            <Check className="size-3.5" /> Acknowledged
          </span>
        ) : (
          onAck && (
            <Button size="sm" variant="outline" className="shrink-0" onClick={onAck}>
              {t("Acknowledge")}
            </Button>
          )
        )}
      </div>
    </li>
  );
}
