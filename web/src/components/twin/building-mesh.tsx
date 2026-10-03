"use client";

import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Edges, Html } from "@react-three/drei";
import { Color, type MeshStandardMaterial } from "three";
import { HEALTH_HEX, ROOF_HEX } from "@/lib/health";
import type { Building } from "@/shared/types";
import { BuildingDetails } from "./building-details";
import { BharatiMain, MaitriMain } from "./station-models";
import { useScenePalette } from "./scene-palette";


interface Props {
  building: Building;
  selected: boolean;
  hovered: boolean;
  interactive: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

/** One building as a low-poly box tinted by live health; critical ones pulse red. */
export function BuildingMesh({ building, selected, hovered, interactive, onHover, onSelect }: Props) {
  const material = useRef<MeshStandardMaterial>(null);
  const [w, h, d] = building.size;
  const [x, , z] = building.position;
  const tint = HEALTH_HEX[building.health];
  const palette = useScenePalette();
  // Neutral cladding with a light health tint; the roof strip carries the full colour.
  const body = useMemo(
    () => new Color(tint).lerp(new Color(palette.cladding), building.health === "ok" ? 0.92 : 0.55),
    [tint, building.health, palette.cladding],
  );

  useFrame(({ clock }) => {
    const m = material.current;
    if (!m) return;
    if (building.health === "critical") {
      m.emissiveIntensity = 0.15 + ((Math.sin(clock.elapsedTime * 4) + 1) / 2) * 0.6;
    } else {
      m.emissiveIntensity = selected || hovered ? 0.18 : 0;
    }
  });

  const events = interactive
    ? {
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover(building.id);
          document.body.style.cursor = "pointer";
        },
        onPointerOut: () => {
          onHover(null);
          document.body.style.cursor = "auto";
        },
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(building.id);
        },
      }
    : {};

  const MainModel = building.id === "bharati-main" ? BharatiMain : building.id === "maitri-main" ? MaitriMain : null;

  return (
    <group position={[x, h / 2, z]} {...events}>
      {MainModel ? (
        <MainModel
          w={w}
          h={h}
          d={d}
          tint={tint}
          tintAmount={building.health === "ok" ? 0.12 : 0.5}
          materialRef={material}
          outlined={selected || hovered}
        />
      ) : (
        <>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial ref={material} color={body} emissive={tint} roughness={0.85} metalness={0} flatShading />
            {(selected || hovered) && <Edges color={palette.edge} lineWidth={1.5} />}
          </mesh>
          <BuildingDetails building={building} />
        </>
      )}
      {/* Roof strip in the pure health colour so status reads from above (the main buildings tint their cladding instead). */}
      {!MainModel && (
        <mesh position={[0, h / 2 + 0.06, 0]}>
          <boxGeometry args={[w * 0.92, 0.12, d * 0.92]} />
          <meshBasicMaterial color={ROOF_HEX[building.health]} />
        </mesh>
      )}
      {hovered && (
        <Html center position={[0, h / 2 + 2, 0]} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground shadow-sm">
            {building.name}
          </div>
        </Html>
      )}
    </group>
  );
}
