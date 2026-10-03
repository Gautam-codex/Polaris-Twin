"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AskPolaris } from "@/components/copilot/ask-polaris";
import { useSession } from "@/hooks/useSession";
import { EmergencyBanner } from "@/components/emergency/emergency-banner";
import { OpsProvider, useOps } from "./ops-context";
import { SyncStrip } from "./sync-strip";
import { StationProvider } from "./station-context";
import { TopBar } from "./top-bar";

export function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

/** Top bar with module tabs, then the content; a red top border marks emergency mode. */
function Frame({ children }: { children: ReactNode }) {
  const { emergency } = useOps();
  return (
    <div className={emergency ? "flex min-h-screen flex-col border-t-4 border-destructive" : "flex min-h-screen flex-col"}>
      <TopBar />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pt-6 pb-24 md:px-8 md:pt-8">
        <EmergencyBanner />
        <SyncStrip />
        {children}
      </main>
    </div>
  );
}

/** Signed-in dashboard frame: top bar, module tabs and station context. Signed-out users go to /login. */
export function DashboardShell({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, session, pathname, router]);

  if (loading || !session) return <FullScreenLoader label="Checking your session…" />;

  return (
    <OpsProvider>
      <StationProvider>
        <Frame>{children}</Frame>
        <AskPolaris />
      </StationProvider>
    </OpsProvider>
  );
}
