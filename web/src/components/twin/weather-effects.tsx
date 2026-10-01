"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { BufferGeometry } from "three";
import { useScenePalette } from "./scene-palette";

const COUNT = 1800;
const SPREAD = 90;
const HEIGHT = 40;

/** Prevailing (simulated) wind direction per station, degrees the wind blows FROM. */
export const WIND_FROM_DEG = { maitri: 135, bharati: 60 } as const;

/** Unit vector (x = east, z = south) the wind blows towards. */
export function windVector(fromDeg: number): [number, number] {
  const to = ((fromDeg + 180) * Math.PI) / 180;
  return [Math.sin(to), -Math.cos(to)];
}

/** Falling snow; horizontal drift and fall speed follow the live wind. */
export function Snow({ windKph, fromDeg }: { windKph: number; fromDeg: number }) {
  const geometry = useRef<BufferGeometry>(null);
  const { snow } = useScenePalette();
  const wind = useRef({ kph: windKph, dir: windVector(fromDeg) });

  useEffect(() => {
    wind.current = { kph: windKph, dir: windVector(fromDeg) };
  }, [windKph, fromDeg]);

  const positions = useMemo(() => {
    const array = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Deterministic spread so renders are stable.
      array[i * 3] = ((Math.sin(i * 12.9898) * 43758.5453) % 1) * (SPREAD / 2);
      array[i * 3 + 1] = (((Math.sin(i * 78.233) * 12345.678) % 1) + 1) * (HEIGHT / 2);
      array[i * 3 + 2] = ((Math.sin(i * 39.425) * 24634.634) % 1) * (SPREAD / 2);
    }
    return array;
  }, []);

  useFrame((_, delta) => {
    const attr = geometry.current?.getAttribute("position");
    if (!attr) return;
    const dt = Math.min(delta, 0.05);
    const drift = (wind.current.kph / 3.6) * 0.6;
    const fall = 2 + wind.current.kph * 0.03;
    const [dx, dz] = wind.current.dir;
    const half = SPREAD / 2;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const j = i * 3;
      arr[j] += dx * drift * dt;
      arr[j + 1] -= fall * dt;
      arr[j + 2] += dz * drift * dt;
      if (arr[j + 1] < 0) arr[j + 1] += HEIGHT;
      if (arr[j] > half) arr[j] -= SPREAD;
      else if (arr[j] < -half) arr[j] += SPREAD;
      if (arr[j + 2] > half) arr[j + 2] -= SPREAD;
      else if (arr[j + 2] < -half) arr[j + 2] += SPREAD;
    }
    attr.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometry}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={snow} size={0.12} sizeAttenuation transparent opacity={0.7} depthWrite={false} />
    </points>
  );
}

/** Ground arrow showing where the wind blows; length grows with speed. */
export function WindArrow({ windKph, fromDeg }: { windKph: number; fromDeg: number }) {
  const [dx, dz] = windVector(fromDeg);
  const length = 4 + Math.min(windKph, 90) / 9;
  const rotation = Math.atan2(-dz, dx);
  const color = windKph > 60 ? "#B42318" : windKph > 40 ? "#C27A12" : "#1D4F86";
  return (
    <group position={[-26, 0.3, 26]} rotation={[0, rotation, 0]}>
      <mesh position={[length / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, length, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0} />
      </mesh>
      <mesh position={[length + 0.8, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.8, 1.8, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0} />
      </mesh>
    </group>
  );
}
