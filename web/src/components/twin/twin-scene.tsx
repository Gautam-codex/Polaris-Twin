"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { StationSnapshot } from "@/shared/types";
import { BuildingMesh } from "./building-mesh";
import { Snow, WIND_FROM_DEG, WindArrow } from "./weather-effects";

const BACKGROUND = "#0B1220";

export interface TwinSceneProps {
  snapshot: StationSnapshot;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  /** "full" = interactive twin page; "preview" = slow auto-rotate, no interaction. */
  mode?: "full" | "preview";
  /** Increment to reset the camera. */
  resetKey?: number;
}

/** Low-poly 3D station: buildings coloured by health, snow and wind, orbit camera. */
export default function TwinScene({ snapshot, selectedId = null, onSelect, mode = "full", resetKey = 0 }: TwinSceneProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const interactive = mode === "full";
  const fromDeg = WIND_FROM_DEG[snapshot.stationId];

  useEffect(() => {
    if (resetKey > 0) controls.current?.reset();
  }, [resetKey]);

  useEffect(() => () => {
    document.body.style.cursor = "auto";
  }, []);

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, mode === "preview" ? 1.25 : 1.75]}
      camera={{ position: [38, 30, 42], fov: 45, near: 0.5, far: 400 }}
      onPointerMissed={() => interactive && onSelect?.(null)}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, 70, 170]} />
      <hemisphereLight args={["#BFDBFE", "#0B1220", 0.7]} />
      <directionalLight
        position={[30, 45, 20]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[110, 48]} />
        <meshStandardMaterial color="#DCE6F2" roughness={1} />
      </mesh>
      <gridHelper args={[60, 12, "#94A3B8", "#B6C4D6"]} position={[0, 0.02, 0]} />

      {snapshot.buildings.map((b) => (
        <BuildingMesh
          key={b.id}
          building={b}
          selected={selectedId === b.id}
          hovered={hovered === b.id}
          interactive={interactive}
          onHover={setHovered}
          onSelect={(id) => onSelect?.(id)}
        />
      ))}

      <Snow windKph={snapshot.weather.windKph} fromDeg={fromDeg} />
      <WindArrow windKph={snapshot.weather.windKph} fromDeg={fromDeg} />

      <OrbitControls
        ref={controls}
        target={[0, 2, 0]}
        enableDamping
        maxPolarAngle={Math.PI / 2.15}
        minDistance={20}
        maxDistance={120}
        enablePan={interactive}
        enableZoom={interactive}
        enableRotate={interactive}
        autoRotate={!interactive}
        autoRotateSpeed={0.6}
      />
    </Canvas>
  );
}
