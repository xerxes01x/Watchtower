const NODES = [
  { label: "HTTP", angle: -90, color: "cyan" },
  { label: "gRPC", angle: -18, color: "indigo" },
  { label: "JSON", angle: 54, color: "violet" },
  { label: "REGEX", angle: 126, color: "emerald" },
  { label: "TLS", angle: 198, color: "rose" },
];

const NODE_COLORS: Record<string, string> = {
  cyan: "border-cyan-400/50 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.35)]",
  indigo: "border-indigo-400/50 text-indigo-200 shadow-[0_0_24px_rgba(99,102,241,0.35)]",
  violet: "border-violet-400/50 text-violet-200 shadow-[0_0_24px_rgba(139,92,246,0.35)]",
  emerald: "border-emerald-400/50 text-emerald-200 shadow-[0_0_24px_rgba(34,197,94,0.35)]",
  rose: "border-rose-400/50 text-rose-200 shadow-[0_0_24px_rgba(244,63,94,0.35)]",
};

export default function EngineDiagram() {
  const SIZE = 380;
  const NODE_RADIUS = 158; // distance from center to node center

  return (
    <div
      className="engine-scene relative"
      style={{ width: SIZE, height: SIZE }}
    >
      {/* Tilted 3D stage with rings */}
      <div
        className="engine-stage absolute inset-0"
        style={{ width: SIZE, height: SIZE }}
      >
        {/* Outer ring */}
        <div
          className="engine-ring engine-ring--indigo animate-spin-slow"
          style={{ inset: 0 }}
        >
          <div
            className="engine-orbit-dot"
            style={{ transform: "translate(190px, 0)" }}
          />
        </div>

        {/* Middle ring (reverse spin) */}
        <div
          className="engine-ring engine-ring--glow animate-spin-reverse"
          style={{ inset: 56 }}
        >
          <div
            className="engine-orbit-dot"
            style={{ transform: "translate(135px, 0)", background: "#A78BFA", boxShadow: "0 0 14px rgba(167, 139, 250, 0.9), 0 0 28px rgba(167, 139, 250, 0.5)" }}
          />
          <div
            className="engine-orbit-dot"
            style={{ transform: "translate(-135px, 0)" }}
          />
        </div>

        {/* Inner ring (fast) */}
        <div
          className="engine-ring animate-spin-fast"
          style={{
            inset: 110,
            borderColor: "rgba(99, 102, 241, 0.5)",
            boxShadow:
              "0 0 24px rgba(99, 102, 241, 0.25), inset 0 0 20px rgba(99, 102, 241, 0.18)",
          }}
        >
          <div
            className="engine-orbit-dot"
            style={{ transform: "translate(80px, 0)", background: "#22C55E", boxShadow: "0 0 14px rgba(34, 197, 94, 0.9), 0 0 28px rgba(34, 197, 94, 0.5)" }}
          />
        </div>

        {/* Glowing core */}
        <div className="engine-core" />
      </div>

      {/* Spokes from center to each node (in 2D overlay) */}
      <svg
        className="pointer-events-none absolute inset-0"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
      >
        <defs>
          <linearGradient id="spoke-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </linearGradient>
        </defs>
        {NODES.map((n) => {
          const rad = (n.angle * Math.PI) / 180;
          const cx = SIZE / 2;
          const cy = SIZE / 2;
          const x2 = cx + Math.cos(rad) * NODE_RADIUS;
          const y2 = cy + Math.sin(rad) * NODE_RADIUS;
          return (
            <line
              key={n.label}
              x1={cx}
              y1={cy}
              x2={x2}
              y2={y2}
              stroke="url(#spoke-grad)"
              strokeWidth="1"
              strokeDasharray="3 6"
              opacity={0.55}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-90"
                dur="3s"
                repeatCount="indefinite"
              />
            </line>
          );
        })}
      </svg>

      {/* Labeled service nodes (2D, overlayed on top of 3D scene) */}
      {NODES.map((n) => {
        const rad = (n.angle * Math.PI) / 180;
        const x = SIZE / 2 + Math.cos(rad) * NODE_RADIUS;
        const y = SIZE / 2 + Math.sin(rad) * NODE_RADIUS;
        return (
          <div
            key={n.label}
            className={`absolute flex size-[68px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border bg-slate-950/85 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur-md ${NODE_COLORS[n.color]} animate-float`}
            style={{
              left: x,
              top: y,
              animationDelay: `${(n.angle / 90) * 0.4}s`,
            }}
          >
            {n.label}
          </div>
        );
      })}
    </div>
  );
}
