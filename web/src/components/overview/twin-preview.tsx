"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Boxes } from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { useStation } from "@/components/dashboard/station-context";
import { SceneLoading } from "@/components/twin/twin-view";

const TwinScene = dynamic(() => import("@/components/twin/twin-scene"), { ssr: false, loading: SceneLoading });

export function TwinPreview() {
  const { snapshot, withStation } = useStation();
  return (
    <Panel
      title="3D twin"
      icon={Boxes}
      action={
        <Link href={withStation("/dashboard/twin")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Open twin <ArrowRight className="size-3.5" />
        </Link>
      }
    >
      <Link href={withStation("/dashboard/twin")} className="block h-72 overflow-hidden rounded-xl border border-border" aria-label="Open the 3D twin">
        {snapshot ? <TwinScene snapshot={snapshot} mode="preview" /> : <SceneLoading />}
      </Link>
    </Panel>
  );
}
