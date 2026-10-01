import { Suspense } from "react";
import { DashboardShell, FullScreenLoader } from "@/components/dashboard/dashboard-shell";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<FullScreenLoader label="Loading dashboard…" />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
