import React from "react";

interface DonutSlice {
  label: string;
  value: number;
  color: string; // Tailwind bg- color converted to stroke via mapping below
}

interface DonutChartProps {
  data: DonutSlice[];
  totalLabel?: string;
  totalFormatter?: (n: number) => string;
  valueFormatter?: (n: number) => string;
}

function colorToStrokeClass(color: string): string {
  // Convert bg-*-* to stroke-*-* for SVG stroke color
  if (color.startsWith("bg-")) return color.replace("bg-", "stroke-");
  return "stroke-gray-400";
}

const DonutChart: React.FC<DonutChartProps> = ({
  data,
  totalLabel,
  totalFormatter,
  valueFormatter,
}) => {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const sum = data.reduce((s, d) => s + d.value, 0);
  let offset = 0;

  return (
    <div className="flex items-center space-x-6">
      <svg viewBox="0 0 120 120" className="w-40 h-40">
        <g transform="rotate(-90 60 60)">
          {data.map((d, idx) => {
            const frac = sum > 0 ? d.value / sum : 0;
            const dash = frac * circumference;
            const dashArray = `${dash} ${circumference - dash}`;
            const strokeDashoffset = offset;
            offset += dash;
            const cls = colorToStrokeClass(d.color);
            return (
              <circle
                key={idx}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                strokeWidth="16"
                className={`${cls}`}
                strokeDasharray={dashArray}
                strokeDashoffset={`${-strokeDashoffset}`}
              />
            );
          })}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            strokeWidth="16"
            className="stroke-gray-200"
            strokeDasharray={`${circumference} 0`}
            strokeOpacity={sum === 0 ? 1 : 0}
          />
        </g>
        <circle cx="60" cy="60" r="36" className="fill-white" />
        <text
          x="60"
          y="58"
          textAnchor="middle"
          className="text-sm fill-gray-900 font-semibold"
        >
          {totalFormatter ? totalFormatter(sum) : sum}
        </text>
        {totalLabel && (
          <text
            x="60"
            y="76"
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            {totalLabel}
          </text>
        )}
      </svg>
      <div className="space-y-2">
        {data.map((d, idx) => {
          const pct = sum > 0 ? Math.round((d.value / sum) * 100) : 0;
          return (
            <div key={idx} className="flex items-center space-x-2 text-sm">
              <span className={`inline-block w-3 h-3 rounded ${d.color}`} />
              <span className="text-gray-700">{d.label}</span>
              <span className="text-gray-500">({pct}%)</span>
              {valueFormatter && (
                <span className="text-gray-600">{valueFormatter(d.value)}</span>
              )}
            </div>
          );
        })}
        {data.length === 0 && (
          <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>
        )}
      </div>
    </div>
  );
};

export default DonutChart;
