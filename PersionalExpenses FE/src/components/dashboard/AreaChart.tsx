import React from "react";

interface AreaPoint {
  x: string; // yyyy-mm-dd
  value: number; // e.g., net = income - expense
}

interface AreaChartProps {
  data: AreaPoint[];
  color?: string; // tailwind stroke/fill color base
}

const AreaChart: React.FC<AreaChartProps> = ({ data, color = "emerald" }) => {
  const width = 520;
  const height = 220;
  const padding = 32;
  const values = data.map((d) => d.value);
  const maxY = Math.max(1, ...values, 0);
  const minY = Math.min(0, ...values);

  const xScale = (i: number) =>
    padding + (i * (width - padding * 2)) / Math.max(1, data.length - 1);
  const yScale = (v: number) =>
    height - padding - ((v - minY) / (maxY - minY)) * (height - padding * 2);

  const path = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(d.value)}`)
    .join(" ");
  const area = `${path} L${xScale(data.length - 1)},${yScale(0)} L${xScale(
    0
  )},${yScale(0)} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56">
      <rect x={0} y={0} width={width} height={height} className="fill-white" />
      {/* zero line */}
      <line
        x1={padding}
        y1={yScale(0)}
        x2={width - padding}
        y2={yScale(0)}
        className="stroke-gray-200"
        strokeWidth={1}
      />
      {/* area */}
      <path d={area} className="fill-emerald-100" />
      {/* line */}
      <path
        d={path}
        className="fill-none text-emerald-500"
        stroke="currentColor"
        strokeWidth={2}
      />
      {/* x labels */}
      {data.map((d, i) => (
        <text
          key={d.x}
          x={xScale(i)}
          y={height - 8}
          textAnchor="middle"
          className="text-[10px] fill-gray-500"
        >
          {d.x.slice(5)}
        </text>
      ))}
    </svg>
  );
};

export default AreaChart;
