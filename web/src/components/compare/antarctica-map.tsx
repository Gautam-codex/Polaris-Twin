import { STATIONS } from "@/shared/stations";

// Schematic equirectangular map, 5°E–95°E and 28°N–82°S. Coastlines are simplified by hand.
const LON_MIN = 5;
const LON_MAX = 95;
const LAT_MAX = 28;
const LAT_MIN = -82;
const W = 450;
const H = (W * (LAT_MAX - LAT_MIN)) / (LON_MAX - LON_MIN);

function xy(lon: number, lat: number): [number, number] {
  return [((lon - LON_MIN) / (LON_MAX - LON_MIN)) * W, ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H];
}

function path(points: [number, number][]): string {
  return points.map(([lon, lat], i) => `${i ? "L" : "M"}${xy(lon, lat).map((v) => v.toFixed(1)).join(" ")}`).join(" ") + " Z";
}

const ANTARCTIC_COAST: [number, number][] = [
  [5, -70.3], [10, -70.2], [15, -70], [20, -70], [25, -70.3], [30, -69.8], [35, -69.5], [40, -68.5], [45, -67.8],
  [50, -66.5], [55, -66.5], [60, -67.3], [65, -67.8], [70, -68.5], [72, -69.8], [75, -69.3], [78, -68.5], [80, -67.2],
  [85, -66.6], [90, -66.5], [95, -66.3], [95, -82], [5, -82],
];

const INDIA: [number, number][] = [
  [68.2, 23.6], [70, 22.5], [72.6, 21], [73, 19], [73.5, 16], [74.5, 13], [76.5, 8.3], [77.5, 8.1], [78.2, 9],
  [79.8, 10.3], [80.2, 13], [80.3, 15.5], [82.3, 17], [84.8, 19.3], [87, 21.5], [88.7, 22], [89, 25], [88, 27],
  [85, 27], [80.5, 29], [78, 31], [74, 31], [70, 28],
];

const GOA = { name: "NCPOR Goa", lon: 73.83, lat: 15.49 };

/** Indian Ocean schematic linking Maitri and Bharati to the NCPOR control room in Goa. */
export function AntarcticaMap() {
  const [gx, gy] = xy(GOA.lon, GOA.lat);
  const points = [STATIONS.maitri, STATIONS.bharati].map((s) => ({ name: s.name, xy: xy(s.lon, s.lat) }));
  const [sx, sy] = xy(80.7, 7.8);

  return (
    <svg viewBox={`0 0 ${W} ${H.toFixed(0)}`} className="h-auto w-full" role="img" aria-label="Map of Maitri, Bharati and NCPOR Goa">
      <rect width={W} height={H} fill="#EEF5FD" />
      {[0, -30, -60].map((lat) => {
        const [, y] = xy(LON_MIN, lat);
        return (
          <g key={lat}>
            <line x1={0} x2={W} y1={y} y2={y} stroke="#D6E5F5" strokeDasharray="3 4" />
            <text x={4} y={y - 4} fontSize={10} fill="#7A8CA0">
              {lat === 0 ? "Equator" : `${Math.abs(lat)}° S`}
            </text>
          </g>
        );
      })}
      <path d={path(ANTARCTIC_COAST)} fill="#FFFFFF" stroke="#B9CDE3" />
      <path d={path(INDIA)} fill="#FFFFFF" stroke="#B9CDE3" />
      <ellipse cx={sx} cy={sy} rx={4} ry={6} fill="#FFFFFF" stroke="#B9CDE3" />
      {points.map((p) => (
        <line key={p.name} x1={p.xy[0]} y1={p.xy[1]} x2={gx} y2={gy} stroke="#5B9BDC" strokeWidth={1.2} strokeDasharray="5 4" />
      ))}
      {points.map((p) => (
        <g key={`${p.name}-pin`}>
          <circle cx={p.xy[0]} cy={p.xy[1]} r={5} fill="#1D4F86" stroke="#FFFFFF" strokeWidth={1.5} />
          <text x={p.xy[0]} y={p.xy[1] - 10} textAnchor="middle" fontSize={12} fontWeight={600} fill="#0F1F33">
            {p.name}
          </text>
        </g>
      ))}
      <rect x={gx - 5} y={gy - 5} width={10} height={10} fill="#B42318" stroke="#FFFFFF" strokeWidth={1.5} />
      <text x={gx - 10} y={gy + 4} textAnchor="end" fontSize={12} fontWeight={600} fill="#0F1F33">
        {GOA.name}
      </text>
      <text x={W / 2} y={xy(50, -76)[1]} textAnchor="middle" fontSize={11} letterSpacing={3} fill="#7A8CA0">
        ANTARCTICA
      </text>
      <text x={6} y={14} fontSize={10} fill="#7A8CA0">
        Schematic, not for navigation
      </text>
    </svg>
  );
}
