"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Boxes } from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { useStation } from "@/components/dashboard/station-context";
import { useOps } from "@/components/dashboard/ops-context";
import { StationMap2D } from "@/components/twin/station-map-2d";
import { SceneLoading } from "@/components/twin/twin-view";

const TwinScene = dynamic(() => import("@/components/twin/twin-scene"), { ssr: false, loading: SceneLoading });

export function TwinPreview() {
  const { snapshot, withStation } = useStation();
  const { lowBandwidth } = useOps();
  return (
    <Panel
      title={lowBandwidth ? "Site plan (2D)" : "3D twin"}
      icon={Boxes}
      action={
        <Link href={withStation("/dashboard/twin")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Open twin <ArrowRight className="size-3.5" />
        </Link>
      }
    >
      <Link href={withStation("/dashboard/twin")} className="block h-72 overflow-hidden rounded-md border border-border" aria-label="Open the 3D twin">
        {snapshot && lowBandwidth ? (
          <StationMap2D snapshot={snapshot} />
        ) : snapshot ? (
          <TwinScene snapshot={snapshot} mode="preview" />
        ) : (
          <SceneLoading />
        )}
      </Link>
    </Panel>
  );
}
