"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AskPolaris } from "@/components/copilot/ask-polaris";
import { SosToast } from "@/components/alerts/sos-toast";
import { useSession } from "@/hooks/useSession";
import { EmergencyBanner } from "@/components/emergency/emergency-banner";
import { OpsProvider, useOps } from "./ops-context";
import { SyncStrip } from "./sync-strip";
import { Sidebar } from "./sidebar";
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

/** Sidebar, top bar and content; a red top border marks emergency mode. */
function Frame({ collapsed, onToggle, children }: { collapsed: boolean; onToggle: () => void; children: ReactNode }) {
  const { emergency } = useOps();
  return (
    <div className={emergency ? "flex min-h-screen border-t-4 border-destructive" : "flex min-h-screen"}>
      <Sidebar collapsed={collapsed} onToggle={onToggle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 pt-6 pb-24 md:px-8 md:pt-8">
          <EmergencyBanner />
          <SyncStrip />
          {children}
        </main>
      </div>
    </div>
  );
}

/** Signed-in dashboard frame: sidebar, top bar and station context. Signed-out users go to /login. */
export function DashboardShell({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, session, pathname, router]);

  if (loading || !session) return <FullScreenLoader label="Checking your session…" />;

  return (
    <OpsProvider>
      <StationProvider>
        <Frame collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)}>
          {children}
        </Frame>
        <AskPolaris />
        <SosToast />
      </StationProvider>
    </OpsProvider>
  );
}
