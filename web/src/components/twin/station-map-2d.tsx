"use client";

import { cn } from "cn";
import { HEALTH_HEX, ROOF_HEX } from "@/lib/health";
import type { StationSnapshot } from "@/shared/types";

const EXTENT = 24;

/** Top-down SVG plan of the station: a light alternative to the 3D twin for low bandwidth. */
export function StationMap2D({
  snapshot,
  selectedId = null,
  onSelect,
  className,
}: {
  snapshot: StationSnapshot;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  className?: string;
}) {
  const size = EXTENT * 2;
  return (
    <svg
      viewBox={`${-EXTENT} ${-EXTENT} ${size} ${size}`}
      className={cn("h-full w-full bg-white", className)}
      role="img"
      aria-label={`Site plan of ${snapshot.stationId}`}
      onClick={() => onSelect?.(null)}
    >
      <defs>
        <pattern id="grid2d" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#E3EEFA" strokeWidth="0.15" />
        </pattern>
      </defs>
      <rect x={-EXTENT} y={-EXTENT} width={size} height={size} fill="url(#grid2d)" />
      {snapshot.buildings.map((b) => {
        const [x, , z] = b.position;
        const [w, , d] = b.size;
        const selected = selectedId === b.id;
        return (
          <g
            key={b.id}
            className={onSelect ? "cursor-pointer" : undefined}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(b.id);
            }}
          >
            <title>{`${b.name}: ${b.health}`}</title>
            <rect
              x={x - w / 2}
              y={z - d / 2}
              width={w}
              height={d}
              rx={0.4}
              fill={ROOF_HEX[b.health]}
              stroke={selected ? "#1D4F86" : HEALTH_HEX[b.health]}
              strokeWidth={selected ? 0.5 : 0.2}
            />
            {w >= 6 && (
              <text x={x} y={z + 0.6} textAnchor="middle" fontSize={1.5} fill="#0F1F33">
                {b.name.split(" ")[0]}
              </text>
            )}
          </g>
        );
      })}
      <text x={EXTENT - 1} y={-EXTENT + 2} textAnchor="end" fontSize={1.4} fill="#5A6B80">
        N ↑ · grid 5 m
      </text>
    </svg>
  );
}
