/** Semicircle gauge (SVG). `value` is clamped to [min, max]. */
export function Gauge({
  value,
  min = 0,
  max = 100,
  color,
  label,
  sublabel,
  size = 200,
}: {
  value: number;
  min?: number;
  max?: number;
  color: string;
  label: string;
  sublabel?: string;
  size?: number;
}) {
  const stroke = size * 0.09;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const fraction = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const arc = (f: number) => {
    const angle = Math.PI * (1 - f);
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  };
  const start = arc(0);
  const end = arc(1);
  const tip = arc(fraction);
  const track = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
  const fill = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${tip.x} ${tip.y}`;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + stroke} viewBox={`0 0 ${size} ${size / 2 + stroke}`} role="img" aria-label={`${label}: ${sublabel ?? ""}`}>
        <path d={track} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={stroke} strokeLinecap="round" />
        {fraction > 0.001 && (
          <path d={fill} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" style={{ transition: "all 0.7s ease-out" }} />
        )}
        <text x={cx} y={cy - stroke * 0.2} textAnchor="middle" fill="#E2E8F0" fontSize={size * 0.2} fontWeight={600}>
          {label}
        </text>
      </svg>
      {sublabel && <p className="-mt-1 text-sm text-muted-foreground">{sublabel}</p>}
    </div>
  );
}
