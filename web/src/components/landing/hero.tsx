"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Smartphone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useT } from "@/components/language";
import { SceneLoading } from "@/components/twin/twin-view";
import { SITE } from "@/lib/site";
import { getSnapshot } from "@/shared/simulator";
import type { StationSnapshot } from "@/shared/types";

const TwinScene = dynamic(() => import("@/components/twin/twin-scene"), { ssr: false, loading: SceneLoading });

/** Live simulated Maitri snapshot, refreshed every 5 s (client only). */
function useLandingSnapshot(): StationSnapshot | null {
  const [snapshot, setSnapshot] = useState<StationSnapshot | null>(null);
  useEffect(() => {
    const tick = () => setSnapshot(getSnapshot("maitri", Date.now()));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 5_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return snapshot;
}

export function Hero() {
  const t = useT();
  const snapshot = useLandingSnapshot();

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-20">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">Polaris Twin</h1>
        <p className="mt-3 text-xl text-foreground">{t("A digital twin for India's Antarctic stations")}</p>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          One live model of Maitri and Bharati covering buildings, generators, fuel, stores, weather and crew. Each station
          keeps working when the satellite link drops and sends only small changes and alerts to the NCPOR control room in Goa.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className={buttonVariants({ size: "lg", className: "h-10 px-4" })}>
            {t("Open live dashboard")} <ArrowRight />
          </Link>
          {SITE.androidApkUrl ? (
            <a href={SITE.androidApkUrl} className={buttonVariants({ variant: "outline", size: "lg", className: "h-10 px-4" })}>
              <Smartphone /> {t("Download Android app")}
            </a>
          ) : (
            <span className={buttonVariants({ variant: "outline", size: "lg", className: "pointer-events-none h-10 px-4 opacity-60" })} aria-disabled>
              <Smartphone /> {t("Android app coming soon")}
            </span>
          )}
        </div>
      </div>
      <div className="relative h-[320px] overflow-hidden rounded-lg border border-border bg-card sm:h-[400px]">
        {snapshot ? <TwinScene snapshot={snapshot} mode="preview" /> : <SceneLoading />}
        <span className="absolute bottom-3 left-3 rounded border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
          Maitri · {t("Simulated sensor feed")}
        </span>
      </div>
    </section>
  );
}
