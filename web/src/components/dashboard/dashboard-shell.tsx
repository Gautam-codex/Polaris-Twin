"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AskPolaris } from "@/components/copilot/ask-polaris";
import { useSession } from "@/hooks/useSession";
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
    <StationProvider>
      <div className="flex min-h-screen">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 px-4 pt-6 pb-24 md:px-8 md:pt-8">{children}</main>
        </div>
      </div>
      <AskPolaris />
    </StationProvider>
  );
}
