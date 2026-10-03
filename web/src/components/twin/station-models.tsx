"use client";

import { useMemo, type ReactNode, type RefObject } from "react";
import { Edges } from "@react-three/drei";
import { Color, ExtrudeGeometry, Shape, type MeshStandardMaterial } from "three";
import { useScenePalette } from "./scene-palette";

export interface MainModelProps {
  w: number;
  h: number;
  d: number;
  /** Health colour; the cladding is tinted towards it when not OK. */
  tint: string;
  /** 0 = plain cladding, 1 = full health colour. */
  tintAmount: number;
  materialRef: RefObject<MeshStandardMaterial | null>;
  outlined: boolean;
}

/** Steel stilts in a grid under a raised building. Coordinates relative to the building centre. */
function Stilts({ w, d, ground, height, step = 4 }: { w: number; d: number; ground: number; height: number; step?: number }) {
  const { steel } = useScenePalette();
  const xs = Math.max(2, Math.round(w / step) + 1);
  const zs = Math.max(2, Math.round(d / step) + 1);
  const legs: ReactNode[] = [];
  for (let i = 0; i < xs; i++) {
    for (let j = 0; j < zs; j++) {
      const x = -w / 2 + 0.4 + (i * (w - 0.8)) / (xs - 1);
      const z = -d / 2 + 0.4 + (j * (d - 0.8)) / (zs - 1);
      legs.push(
        <mesh key={`${i}-${j}`} position={[x, ground + height / 2, z]} castShadow>
          <boxGeometry args={[0.28, height, 0.28]} />
          <meshStandardMaterial color={steel} roughness={0.6} metalness={0.3} />
        </mesh>,
      );
    }
  }
  return <>{legs}</>;
}

/**
 * Bharati: a three-storey block of shipping containers in an aluminium skin,
 * raised on stilts, with the upper floors cantilevered beyond the base and
 * continuous window bands on every floor.
 */
export function BharatiMain({ w, h, d, tint, tintAmount, materialRef, outlined }: MainModelProps) {
  const { aluminium, glass, steel, edge, dark } = useScenePalette();
  const stilt = 1.6;
  const ground = -h / 2;
  const base = ground + stilt;
  const top = h / 2;
  const floorH = (top - base) / 3;
  const color = useMemo(() => new Color(aluminium).lerp(new Color(tint), tintAmount), [aluminium, tint, tintAmount]);

  // Side profile: narrow at the base, ends leaning out towards the roof.
  const geometry = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-w / 2 + 2.2, base);
    shape.lineTo(w / 2 - 1.4, base);
    shape.lineTo(w / 2, top);
    shape.lineTo(-w / 2, top);
    shape.closePath();
    const g = new ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    return g;
  }, [w, d, base, top]);

  // Width of the facade at a height, following the leaning ends.
  const spanAt = (y: number) => {
    const k = (y - base) / (top - base);
    const left = -w / 2 + 2.2 * (1 - k);
    const right = w / 2 - 1.4 * (1 - k);
    return { left, right };
  };

  const bands = [0, 1, 2].map((floor) => {
    const y = base + floor * floorH + floorH * 0.55;
    const { left, right } = spanAt(y);
    return { y, left, right };
  });
  const seams = Array.from({ length: Math.floor((w - 4) / 6) }, (_, i) => -w / 2 + 4 + i * 6);

  return (
    <>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial ref={materialRef} color={color} emissive={tint} roughness={0.45} metalness={0.15} flatShading />
        {outlined && <Edges color={edge} lineWidth={1.5} />}
      </mesh>
      {/* Window bands on both long facades. */}
      {bands.map((b, i) =>
        [d / 2 + 0.03, -d / 2 - 0.03].map((z) => (
          <mesh key={`${i}-${z}`} position={[(b.left + b.right) / 2, b.y, z]}>
            <boxGeometry args={[b.right - b.left - 0.8, floorH * 0.38, 0.06]} />
            <meshStandardMaterial color={glass} roughness={0.15} metalness={0.4} />
          </mesh>
        )),
      )}
      {/* Container module seams across the facades. */}
      {seams.map((x) => (
        <mesh key={x} position={[x, (base + top) / 2, 0]}>
          <boxGeometry args={[0.07, top - base - 0.1, d + 0.08]} />
          <meshStandardMaterial color={dark} roughness={0.6} />
        </mesh>
      ))}
      <Stilts w={w - 4} d={d - 1} ground={ground} height={stilt} step={5} />
      {/* Rooftop plant and the entrance stair tower. */}
      <mesh position={[-w / 4, top + 0.6, 0]} castShadow>
        <boxGeometry args={[4, 1.2, 3]} />
        <meshStandardMaterial color={steel} roughness={0.6} />
      </mesh>
      <mesh position={[w / 2 - 4, ground + stilt / 2 + 0.6, d / 2 + 1.2]} castShadow>
        <boxGeometry args={[2.2, stilt + 1.2, 2]} />
        <meshStandardMaterial color={aluminium} roughness={0.4} metalness={0.5} />
      </mesh>
    </>
  );
}

/**
 * Maitri: a long, low main building raised on steel stilts (wood-and-panel
 * construction from 1989), with a short wing towards the lake, punched windows
 * and a shallow pitched roof.
 */
export function MaitriMain({ w, h, d, tint, tintAmount, materialRef, outlined }: MainModelProps) {
  const { panel, glass, steel, edge } = useScenePalette();
  const stilt = 1.8;
  const ground = -h / 2;
  const base = ground + stilt;
  const bodyH = h - stilt - 1.2;
  const color = useMemo(() => new Color(panel).lerp(new Color(tint), tintAmount), [panel, tint, tintAmount]);
  const wingW = 7;
  const wingD = 6;
  const windows = Array.from({ length: Math.floor(w / 2.4) }, (_, i) => -w / 2 + 1.4 + i * 2.4);

  return (
    <>
      {/* Main wing */}
      <mesh position={[0, base + bodyH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, bodyH, d]} />
        <meshStandardMaterial ref={materialRef} color={color} emissive={tint} roughness={0.8} flatShading />
        {outlined && <Edges color={edge} lineWidth={1.5} />}
      </mesh>
      {/* Shallow pitched roof */}
      <mesh position={[0, base + bodyH + 0.5, 0]} scale={[w / d, 1, 1]} castShadow>
        <cylinderGeometry args={[0.01, d * 0.72, 1.1, 4, 1, false, Math.PI / 4]} />
        <meshStandardMaterial color={steel} roughness={0.7} flatShading />
      </mesh>
      {/* Lake-side wing */}
      <mesh position={[-w / 2 + wingW / 2 + 1, base + (bodyH - 0.6) / 2, d / 2 + wingD / 2]} castShadow receiveShadow>
        <boxGeometry args={[wingW, bodyH - 0.6, wingD]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
      {/* Punched windows on both long sides */}
      {windows.map((x) =>
        [d / 2 + 0.04, -d / 2 - 0.04].map((z) =>
          z > 0 && x < -w / 2 + wingW + 1.5 ? null : (
            <mesh key={`${x}-${z}`} position={[x, base + bodyH * 0.55, z]}>
              <boxGeometry args={[1.1, 0.9, 0.06]} />
              <meshStandardMaterial color={glass} roughness={0.2} metalness={0.3} />
            </mesh>
          ),
        ),
      )}
      <Stilts w={w} d={d} ground={ground} height={stilt} />
      <Stilts w={wingW} d={wingD} ground={ground} height={stilt} />
      {/* Entrance stair */}
      <mesh position={[w / 2 + 0.9, ground + stilt / 2, 0]} rotation={[0, 0, Math.PI / 5]} castShadow>
        <boxGeometry args={[2.6, 0.25, 1.4]} />
        <meshStandardMaterial color={steel} roughness={0.6} />
      </mesh>
    </>
  );
}
