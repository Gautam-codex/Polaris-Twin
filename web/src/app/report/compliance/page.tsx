import { Suspense } from "react";
import type { Metadata } from "next";
import { ReportView } from "./report-view";

export const metadata: Metadata = { title: "Compliance report · Polaris Twin" };

export default function ComplianceReportPage() {
  return (
    <Suspense fallback={null}>
      <ReportView />
    </Suspense>
  );
}
