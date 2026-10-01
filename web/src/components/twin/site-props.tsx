"use client";

import { useMemo } from "react";
import { randomFor } from "@/shared/random";
import type { Building, StationId } from "@/shared/types";
import { useScenePalette } from "./scene-palette";

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

/** Exposed rock around the station (both stations sit on ice-free ground) and snowy hills on the horizon. */
function Terrain({ stationId }: { stationId: StationId }) {
  const { rock: rockColor, hill: hillColor } = useScenePalette();
  const rocks = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const r = (k: string) => randomFor(`${stationId}:rock:${i}:${k}`);
        const angle = r("a") * Math.PI * 2;
        const dist = 27 + r("d") * 20;
        return {
          position: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist] as [number, number, number],
          scale: 0.6 + r("s") * 1.6,
          rotation: r("r") * Math.PI,
        };
      }),
    [stationId],
  );
  const hills = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const r = (k: string) => randomFor(`${stationId}:hill:${i}:${k}`);
        const angle = (i / 9) * Math.PI * 2 + r("a") * 0.4;
        const dist = 62 + r("d") * 14;
        return {
          scale: 7 + r("s") * 8,
          angle,
          dist,
        };
      }),
    [stationId],
  );

  return (
    <>
      {rocks.map((rock, i) => (
        <mesh key={`rock-${i}`} position={rock.position} rotation={[rock.rotation, rock.rotation * 2, 0]} scale={[rock.scale, rock.scale * 0.55, rock.scale]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={rockColor} roughness={1} flatShading />
        </mesh>
      ))}
      {hills.map((hill, i) => (
        <mesh key={`hill-${i}`} position={[Math.cos(hill.angle) * hill.dist, -hill.scale * 0.3, Math.sin(hill.angle) * hill.dist]} scale={[hill.scale * 1.8, hill.scale * 0.6, hill.scale]}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={hillColor} roughness={1} flatShading />
        </mesh>
      ))}
    </>
  );
}

export function SiteProps({ stationId, buildings }: { stationId: StationId; buildings: Building[] }) {
  return (
    <>
      <Walkways buildings={buildings} />
      <Terrain stationId={stationId} />
    </>
  );
}
