type SparkProps = {
  history: { newsScore: number }[];
  h?: number;
  w?: number;
};

export function NEWSSparkline({ history, h = 42, w = 160 }: SparkProps) {
  const pts = history.map((v) => v.newsScore);
  const max = Math.max(8, ...pts);
  const stepX = w / (pts.length - 1);
  const path = pts
    .map((y, i) => `${i === 0 ? "M" : "L"}${i * stepX} ${h - (y / max) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="block">
      <line x1="0" y1={h - (5 / max) * h} x2={w} y2={h - (5 / max) * h} stroke="#fde68a" strokeDasharray="3 3" />
      <line x1="0" y1={h - (7 / max) * h} x2={w} y2={h - (7 / max) * h} stroke="#fca5a5" strokeDasharray="3 3" />
      <path d={path} stroke="#0b5cab" strokeWidth="1.6" fill="none" />
      {pts.map((y, i) => (
        <circle key={i} cx={i * stepX} cy={h - (y / max) * h} r={y >= 7 ? 2.5 : y >= 5 ? 2 : 1.5} fill={y >= 7 ? "#b91c1c" : y >= 5 ? "#b45309" : "#0b5cab"} />
      ))}
    </svg>
  );
}

type DonutProps = {
  pct: number;
  size?: number;
};

export function Donut({ pct, size = 56 }: DonutProps) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth="6" fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#15803d"
        strokeWidth="6"
        fill="none"
        strokeDasharray={`${(c * pct) / 100} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        strokeLinecap="round"
      />
    </svg>
  );
}

type BarChartProps = {
  title: string;
  labels: string[];
  values: number[];
  values2?: number[];
  unit?: string;
};

export function BarChart({ title, labels, values, values2, unit }: BarChartProps) {
  const max = Math.max(...values, ...(values2 || [0]));
  return (
    <div>
      <h3 className="font-semibold text-sm mb-4">{title}</h3>
      <div className="flex items-end gap-3 h-56 border-b hairline">
        {labels.map((label, i) => (
          <div key={label} className="flex-1 flex flex-col items-center justify-end gap-1">
            <div className="w-full flex gap-1 items-end" style={{ height: "100%" }}>
              <div
                className="flex-1 rounded-t"
                style={{ height: `${(values[i] / max) * 90}%`, background: "#0b5cab" }}
                title={`${values[i]}${unit || ""}`}
              />
              {values2 && (
                <div
                  className="flex-1 rounded-t"
                  style={{ height: `${(values2[i] / max) * 90}%`, background: "#0e7490" }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2">
        {labels.map((label) => (
          <div key={label} className="flex-1 text-center text-[10px] ink-mute mono">
            {label}
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-xs mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: "#0b5cab" }} />
          {values2 ? "Admissions" : "Value"}
        </div>
        {values2 && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: "#0e7490" }} />
            Discharges
          </div>
        )}
      </div>
    </div>
  );
}
