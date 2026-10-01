"use client";

import { DoubleSide } from "three";
import type { Building } from "@/shared/types";
import { useScenePalette } from "./scene-palette";


/** Glazing band wrapped around the building at window height. */
function Windows({ w, h, d }: { w: number; h: number; d: number }) {
  const { glass: GLASS } = useScenePalette();
  const y = h * 0.08;
  const band = Math.min(1.2, h * 0.2);
  return (
    <>
      <mesh position={[0, y, 0]}>
        <boxGeometry args={[w * 0.84, band, d + 0.06]} />
        <meshStandardMaterial color={GLASS} roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, y, 0]}>
        <boxGeometry args={[w + 0.06, band, d * 0.8]} />
        <meshStandardMaterial color={GLASS} roughness={0.3} metalness={0.2} />
      </mesh>
    </>
  );
}

/** Vertical ribs on Bharati's container block. */
function ContainerRibs({ w, h, d }: { w: number; h: number; d: number }) {
  const { steel: STEEL } = useScenePalette();
  const count = Math.floor(w / 2.5);
  return (
    <>
      {Array.from({ length: count + 1 }, (_, i) => (
        <mesh key={i} position={[-w / 2 + (i * w) / count, 0, 0]}>
          <boxGeometry args={[0.18, h, d + 0.1]} />
          <meshStandardMaterial color={STEEL} roughness={0.6} />
        </mesh>
      ))}
    </>
  );
}

function Tank({ position, radius, height }: { position: [number, number, number]; radius: number; height: number }) {
  const { tank: WHITE, steel: STEEL } = useScenePalette();
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, height, 20]} />
        <meshStandardMaterial color={WHITE} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, height * 0.7, 0]}>
        <cylinderGeometry args={[radius + 0.03, radius + 0.03, 0.25, 20]} />
        <meshStandardMaterial color={STEEL} />
      </mesh>
    </group>
  );
}

/** Type-specific detail. Coordinates are relative to the building centre (y = 0 is mid-height). */
export function BuildingDetails({ building }: { building: Building }) {
  const { steel: STEEL, dark: DARK, tank: WHITE } = useScenePalette();
  const [w, h, d] = building.size;
  const top = h / 2;
  const ground = -h / 2;

  switch (building.type) {
    case "living":
      return (
        <>
          <Windows w={w} h={h} d={d} />
          {building.id === "bharati-main" && <ContainerRibs w={w} h={h} d={d} />}
          {[-w / 4, w / 4].map((x) => (
            <mesh key={x} position={[x, top + 0.45, -d / 5]} castShadow>
              <boxGeometry args={[1.6, 0.9, 1.2]} />
              <meshStandardMaterial color={STEEL} roughness={0.6} />
            </mesh>
          ))}
        </>
      );
    case "power":
      return (
        <>
          <Windows w={w} h={h} d={d} />
          {[-w / 4, w / 4].map((x) => (
            <mesh key={x} position={[x, top + 1.5, -d / 4]} castShadow>
              <cylinderGeometry args={[0.32, 0.38, 3, 12]} />
              <meshStandardMaterial color={DARK} roughness={0.5} metalness={0.3} />
            </mesh>
          ))}
        </>
      );
    case "lab":
      return (
        <>
          <Windows w={w} h={h} d={d} />
          <mesh position={[w / 4, top, 0]} castShadow>
            <sphereGeometry args={[1.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={WHITE} roughness={0.4} />
          </mesh>
        </>
      );
    case "medical":
      return <Windows w={w} h={h} d={d} />;
    case "water":
      return (
        <>
          <Windows w={w} h={h} d={d} />
          <Tank position={[-w / 2 - 1.7, ground, 0]} radius={1.3} height={3.4} />
        </>
      );
    case "storage":
      return (
        <>
          {[-3, 0, 3].map((x) => (
            <Tank key={x} position={[x, ground, d / 2 + 1.6]} radius={1.05} height={3} />
          ))}
        </>
      );
    case "comms":
      return (
        <>
          <mesh position={[0, top + 2, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 4, 6]} />
            <meshStandardMaterial color={DARK} />
          </mesh>
          <mesh position={[0, top + 4.1, 0]}>
            <sphereGeometry args={[0.22, 10, 8]} />
            <meshBasicMaterial color="#B42318" />
          </mesh>
          <mesh position={[0, top - 2.2, w / 2 + 0.5]} rotation={[-Math.PI / 2.6, 0, 0]} castShadow>
            <sphereGeometry args={[1.4, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3]} />
            <meshStandardMaterial color={WHITE} roughness={0.4} side={DoubleSide} />
          </mesh>
        </>
      );
    case "waste":
      return (
        <mesh position={[w / 4, top + 1, w / 4]} castShadow>
          <cylinderGeometry args={[0.25, 0.3, 2, 10]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
      );
  }
}
