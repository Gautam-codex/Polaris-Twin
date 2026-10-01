import { PageHeader } from "@/components/dashboard/page-header";
import { TwinView } from "@/components/twin/twin-view";

export default function TwinPage() {
  return (
    <>
      <PageHeader
        title="Digital Twin"
        description="Live 3D model of the station. Building colours follow system health from the simulated sensor feed."
      />
      <TwinView />
    </>
  );
}
