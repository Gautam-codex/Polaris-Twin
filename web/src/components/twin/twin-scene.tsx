"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { StationSnapshot } from "@/shared/types";
import { BuildingMesh } from "./building-mesh";
import { SiteProps } from "./site-props";
import { Snow, WIND_FROM_DEG, WindArrow } from "./weather-effects";

const BACKGROUND = "#EAF2FB";
const CAMERA: [number, number, number] = [38, 30, 42];

/** Pulls the camera back on narrow or tall views so the whole station stays in frame. */
function FitCamera({ controls }: { controls: RefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((state) => state.camera);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  useEffect(() => {
    const aspect = width / Math.max(1, height);
    const k = aspect < 0.9 ? 1.55 : aspect < 1.3 ? 1.3 : aspect < 1.6 ? 1.1 : 1;
    camera.position.set(CAMERA[0] * k, CAMERA[1] * k, CAMERA[2] * k);
    camera.lookAt(0, 2, 0);
    controls.current?.target.set(0, 2, 0);
    controls.current?.update();
    controls.current?.saveState();
  }, [camera, width, height, controls]);
  return null;
}

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
      flat
      dpr={[1, mode === "preview" ? 1.25 : 1.75]}
      camera={{ position: CAMERA, fov: 45, near: 0.5, far: 400 }}
      onPointerMissed={() => interactive && onSelect?.(null)}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, 130, 280]} />
      <ambientLight intensity={0.9} />
      <hemisphereLight args={["#FFFFFF", "#C6E1FF", 0.8]} />
      <directionalLight
        position={[30, 45, 20]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />

      {/* Unlit white snow, with shadows drawn on a transparent layer just above it. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[110, 48]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[60, 48]} />
        <shadowMaterial opacity={0.12} />
      </mesh>
      <gridHelper args={[60, 12, "#C6E1FF", "#E3EEFA"]} position={[0, 0.02, 0]} />

      <SiteProps stationId={snapshot.stationId} buildings={snapshot.buildings} />

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

      <FitCamera controls={controls} />
      <OrbitControls
        ref={controls}
        target={[0, 2, 0]}
        enableDamping
        maxPolarAngle={Math.PI / 2.15}
        minDistance={20}
        maxDistance={170}
        enablePan={interactive}
        enableZoom={interactive}
        enableRotate={interactive}
        autoRotate={!interactive}
        autoRotateSpeed={0.6}
      />
    </Canvas>
  );
}
