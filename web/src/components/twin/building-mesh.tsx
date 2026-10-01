"use client";

import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Edges, Html } from "@react-three/drei";
import { Color, type MeshStandardMaterial } from "three";
import { HEALTH_HEX } from "@/lib/health";
import type { Building } from "@/shared/types";

const STEEL = new Color("#CBD5E1");

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
  const body = useMemo(() => new Color(tint).lerp(STEEL, 0.45), [tint]);

  useFrame(({ clock }) => {
    const m = material.current;
    if (!m) return;
    if (building.health === "critical") {
      m.emissiveIntensity = 0.25 + ((Math.sin(clock.elapsedTime * 5) + 1) / 2) * 0.9;
    } else {
      m.emissiveIntensity = selected || hovered ? 0.4 : 0.12;
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

  return (
    <group position={[x, h / 2, z]}>
      <mesh castShadow receiveShadow {...events}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial ref={material} color={body} emissive={tint} roughness={0.75} metalness={0.1} flatShading />
        {(selected || hovered) && <Edges color="#E2E8F0" lineWidth={1.5} />}
      </mesh>
      {/* Roof strip in the pure health colour so status reads from above. */}
      <mesh position={[0, h / 2 + 0.06, 0]}>
        <boxGeometry args={[w * 0.92, 0.12, d * 0.92]} />
        <meshBasicMaterial color={tint} />
      </mesh>
      {hovered && (
        <Html center position={[0, h / 2 + 2, 0]} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-lg border border-border bg-card/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-lg">
            {building.name}
          </div>
        </Html>
      )}
    </group>
  );
}
