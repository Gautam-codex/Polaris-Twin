"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Shape, type Group } from "three";
import { randomFor } from "@/shared/random";
import type { StationId } from "@/shared/types";
import { useScenePalette } from "./scene-palette";

const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0];
const HUT_COLOURS = ["#B8432F", "#D9A13B", "#2F6DB0", "#C8662B", "#3C8D6B"];

/** Polygon on the ground, given as [x, z] points (rotated flat, so shape y = -z). */
function GroundShape({ points, color, y }: { points: [number, number][]; color: string; y: number }) {
  const shape = useMemo(() => {
    const s = new Shape();
    points.forEach(([x, z], i) => (i === 0 ? s.moveTo(x, -z) : s.lineTo(x, -z)));
    s.closePath();
    return s;
  }, [points]);
  return (
    <mesh rotation={FLAT} position={[0, y, 0]}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

/** Irregular blob outline around a centre, stable per key. */
function blob(key: string, cx: number, cz: number, rx: number, rz: number, n = 22): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 0.82 + randomFor(`${key}:${i}`) * 0.3;
    return [cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k];
  });
}

/** Wind turbine whose rotor turns with the live wind speed. */
function WindTurbine({ position, windKph }: { position: [number, number, number]; windKph: number }) {
  const rotor = useRef<Group>(null);
  const { tank, steel } = useScenePalette();
  useFrame((_, dt) => {
    if (rotor.current) rotor.current.rotation.z += dt * Math.min(6, windKph / 12);
  });
  return (
    <group position={position}>
      <mesh position={[0, 7, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.35, 14, 10]} />
        <meshStandardMaterial color={tank} roughness={0.5} />
      </mesh>
      <mesh position={[0, 14, 0.2]}>
        <boxGeometry args={[0.6, 0.6, 1.4]} />
        <meshStandardMaterial color={steel} />
      </mesh>
      <group ref={rotor} position={[0, 14, 0.95]}>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <mesh position={[0, 2.3, 0]}>
              <boxGeometry args={[0.32, 4.6, 0.08]} />
              <meshStandardMaterial color={tank} roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function SolarArray({ position, rows = 2, cols = 5 }: { position: [number, number, number]; rows?: number; cols?: number }) {
  const { solar, steel } = useScenePalette();
  return (
    <group position={position}>
      {Array.from({ length: rows * cols }, (_, i) => {
        const x = (i % cols) * 2.2 - (cols - 1) * 1.1;
        const z = Math.floor(i / cols) * 2.6;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 1.1, 0]} rotation={[-Math.PI / 4, 0, 0]} castShadow>
              <boxGeometry args={[2, 1.6, 0.08]} />
              <meshStandardMaterial color={solar} roughness={0.25} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0.5, 0.3]}>
              <boxGeometry args={[0.1, 1, 0.1]} />
              <meshStandardMaterial color={steel} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Small containerised huts and modules (labs, summer camp, recreation hut). */
function Huts({ items }: { items: { p: [number, number]; r: number; long?: boolean }[] }) {
  return (
    <>
      {items.map(({ p, r, long }, i) => (
        <mesh key={i} position={[p[0], 1.3, p[1]]} rotation={[0, r, 0]} castShadow receiveShadow>
          <boxGeometry args={[long ? 6 : 3.4, 2.6, 2.5]} />
          <meshStandardMaterial color={HUT_COLOURS[i % HUT_COLOURS.length]} roughness={0.7} flatShading />
        </mesh>
      ))}
    </>
  );
}

function Rocks({ stationId, count, minR, maxR, zMax = Infinity }: { stationId: StationId; count: number; minR: number; maxR: number; zMax?: number }) {
  const { rock } = useScenePalette();
  const rocks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = (k: string) => randomFor(`${stationId}:rock:${i}:${k}`);
        const a = r("a") * Math.PI * 2;
        const dist = minR + r("d") * (maxR - minR);
        return { x: Math.cos(a) * dist, z: Math.sin(a) * dist, s: 0.6 + r("s") * 1.8, rot: r("r") * Math.PI };
      }).filter((k) => k.z < zMax),
    [stationId, count, minR, maxR, zMax],
  );
  return (
    <>
      {rocks.map((k, i) => (
        <mesh key={i} position={[k.x, 0, k.z]} rotation={[k.rot, k.rot * 2, 0]} scale={[k.s, k.s * 0.55, k.s]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={rock} roughness={1} flatShading />
        </mesh>
      ))}
    </>
  );
}

/** Schirmacher Oasis: ice-free rock, Priyadarshini Lake in front, the continental ice sheet behind. */
function MaitriSite({ windKph }: { windKph: number }) {
  const p = useScenePalette();
  return (
    <>
      <mesh rotation={FLAT}>
        <circleGeometry args={[220, 48]} />
        <meshBasicMaterial color={p.ground} />
      </mesh>
      <GroundShape points={blob("maitri:oasis", 0, 4, 58, 46)} color={p.oasis} y={0.004} />
      <GroundShape points={blob("maitri:lake-edge", 0, 34, 34, 12)} color={p.lakeEdge} y={0.008} />
      <GroundShape points={blob("maitri:lake", 0, 34, 31, 10)} color={p.lake} y={0.012} />
      {/* Ice sheet rising gently behind the station */}
      <mesh position={[0, 2, -92]} rotation={[0.16, 0, 0]} receiveShadow>
        <boxGeometry args={[320, 2, 80]} />
        <meshStandardMaterial color={p.ice} emissive={p.iceFace} emissiveIntensity={0.35} roughness={1} />
      </mesh>
      {/* Pipeline from the pump house to the lake */}
      <mesh position={[-10, 0.35, 19.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 9, 8]} />
        <meshStandardMaterial color={p.dark} />
      </mesh>
      <Huts
        items={[
          { p: [-28, 18], r: 0.3 },
          { p: [24, 22], r: -0.2 },
          { p: [30, -2], r: 1.4 },
          { p: [-30, -6], r: 1.2 },
          { p: [10, -26], r: 0, long: true },
          { p: [17, -26], r: 0, long: true },
          { p: [24, -26], r: 0, long: true },
        ]}
      />
      <WindTurbine position={[-34, 0, -24]} windKph={windKph} />
      <SolarArray position={[-30, 0, 4]} rows={2} cols={4} />
      <Rocks stationId="maitri" count={34} minR={28} maxR={52} zMax={22} />
    </>
  );
}

/** Larsemann Hills: a rocky headland with the sea on two sides, icebergs offshore, hills inland. */
function BharatiSite({ windKph }: { windKph: number }) {
  const p = useScenePalette();
  const coast: [number, number][] = [
    [-160, -160], [160, -160], [160, -20], [70, -14], [46, 6], [36, 26], [18, 34], [-4, 36],
    [-24, 30], [-38, 16], [-50, 0], [-80, -10], [-160, -14],
  ];
  const bergs = [
    { x: 42, z: 62, s: 6 }, { x: -46, z: 46, s: 4 }, { x: 88, z: 30, s: 5 }, { x: -12, z: 80, s: 3.5 },
  ];
  const hills = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const r = (k: string) => randomFor(`bharati:hill:${i}:${k}`);
        const a = Math.PI * (1.12 + (i / 6) * 0.76);
        const dist = 64 + r("d") * 16;
        return { x: Math.cos(a) * dist, z: Math.sin(a) * dist, s: 7 + r("s") * 8 };
      }),
    [],
  );
  return (
    <>
      <mesh rotation={FLAT} position={[0, -0.02, 0]}>
        <circleGeometry args={[220, 48]} />
        <meshBasicMaterial color={p.sea} />
      </mesh>
      <GroundShape points={coast} color={p.ground} y={0.0} />
      <GroundShape points={blob("bharati:rock", 0, 6, 46, 30)} color={p.oasis} y={0.004} />
      {bergs.map((b, i) => (
        <mesh key={i} position={[b.x, b.s * 0.25, b.z]} scale={[b.s * 1.4, b.s * 0.6, b.s]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={p.ice} roughness={0.8} flatShading />
        </mesh>
      ))}
      {hills.map((h, i) => (
        <mesh key={i} position={[h.x, -h.s * 0.3, h.z]} scale={[h.s * 1.8, h.s * 0.6, h.s]}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={p.hill} roughness={1} flatShading />
        </mesh>
      ))}
      {/* Sea water intake from the pump house down to the shore */}
      <mesh position={[-24, 0.35, 20]} rotation={[Math.PI / 2, 0, -0.6]}>
        <cylinderGeometry args={[0.18, 0.18, 14, 8]} />
        <meshStandardMaterial color={p.dark} />
      </mesh>
      <Huts
        items={[
          { p: [-30, -8], r: 0.2, long: true },
          { p: [-30, -2], r: 0.2, long: true },
          { p: [30, -22], r: -0.4 },
          { p: [-6, -26], r: 0, long: true },
        ]}
      />
      <WindTurbine position={[34, 0, -30]} windKph={windKph} />
      <SolarArray position={[-4, 0, -34]} rows={1} cols={5} />
      <Rocks stationId="bharati" count={28} minR={26} maxR={44} zMax={18} />
    </>
  );
}

export function StationSite({ stationId, windKph }: { stationId: StationId; windKph: number }) {
  return stationId === "maitri" ? <MaitriSite windKph={windKph} /> : <BharatiSite windKph={windKph} />;
}
