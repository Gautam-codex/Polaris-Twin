import { View } from "react-native";
import Svg, { G, Path, Rect, Text as SvgText } from "react-native-svg";
import { colors, healthColor, roofColor } from "@/lib/theme";
import type { Building } from "@shared/types";

const EXTENT = 24;

/** Top-down SVG plan of the station; buildings coloured by health and tappable. */
export function SiteMap({ buildings, selectedId, onSelect }: { buildings: Building[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const size = EXTENT * 2;
  return (
    <View style={{ aspectRatio: 1.25, width: "100%", backgroundColor: "#FFFFFF", borderRadius: 8, overflow: "hidden" }}>
      <Svg width="100%" height="100%" viewBox={`${-EXTENT} ${-EXTENT * 0.8} ${size} ${size * 0.8}`}>
        {Array.from({ length: 11 }, (_, i) => -EXTENT + i * 5).map((v) => (
          <G key={v}>
            <Path d={`M ${v} ${-EXTENT} V ${EXTENT}`} stroke="#E3EEFA" strokeWidth={0.15} />
            <Path d={`M ${-EXTENT} ${v} H ${EXTENT}`} stroke="#E3EEFA" strokeWidth={0.15} />
          </G>
        ))}
        {buildings.map((b) => {
          const [x, , z] = b.position;
          const [w, , d] = b.size;
          const selected = selectedId === b.id;
          return (
            <G key={b.id} onPress={() => onSelect(b.id)}>
              <Rect
                x={x - w / 2}
                y={z - d / 2}
                width={w}
                height={d}
                rx={0.5}
                fill={roofColor[b.health]}
                stroke={selected ? colors.primary : healthColor[b.health]}
                strokeWidth={selected ? 0.6 : 0.25}
              />
              {w >= 6 && (
                <SvgText x={x} y={z + 0.6} fontSize={1.7} fill={colors.text} textAnchor="middle">
                  {b.name.split(" ")[0]}
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

/** Semicircle gauge. */
export function Gauge({ value, max = 100, color, size = 180 }: { value: number; max?: number; color: string; size?: number }) {
  const stroke = size * 0.1;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const f = Math.min(1, Math.max(0, value / max));
  const point = (t: number) => {
    const a = Math.PI * (1 - t);
    return `${cx + r * Math.cos(a)} ${cy - r * Math.sin(a)}`;
  };
  return (
    <Svg width={size} height={size / 2 + stroke / 2}>
      <Path d={`M ${point(0)} A ${r} ${r} 0 0 1 ${point(1)}`} stroke={colors.accent} strokeWidth={stroke} fill="none" />
      {f > 0.001 && <Path d={`M ${point(0)} A ${r} ${r} 0 0 1 ${point(f)}`} stroke={color} strokeWidth={stroke} fill="none" />}
    </Svg>
  );
}
