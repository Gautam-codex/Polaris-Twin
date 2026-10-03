"use client";

import type { Building, StationId } from "@/shared/types";
import { useScenePalette } from "./scene-palette";
import { StationSite } from "./station-site";

/** Raised walkways from every building to the main block. */
function Walkways({ buildings }: { buildings: Building[] }) {
  const { walkway } = useScenePalette();
  const main = buildings.find((b) => b.type === "living");
  if (!main) return null;
  const [mx, , mz] = main.position;
  return (
    <>
      {buildings
        .filter((b) => b.id !== main.id)
        .map((b) => {
          const [x, , z] = b.position;
          const dx = mx - x;
          const dz = mz - z;
          const length = Math.hypot(dx, dz);
          return (
            <mesh key={b.id} position={[(x + mx) / 2, 0.12, (z + mz) / 2]} rotation={[0, Math.atan2(dx, dz), 0]} receiveShadow>
              <boxGeometry args={[1.1, 0.18, length]} />
              <meshStandardMaterial color={walkway} roughness={0.9} />
            </mesh>
          );
        })}
    </>
  );
}

export function SiteProps({ stationId, buildings, windKph }: { stationId: StationId; buildings: Building[]; windKph: number }) {
  return (
    <>
      <Walkways buildings={buildings} />
      <StationSite stationId={stationId} windKph={windKph} />
    </>
  );
}
