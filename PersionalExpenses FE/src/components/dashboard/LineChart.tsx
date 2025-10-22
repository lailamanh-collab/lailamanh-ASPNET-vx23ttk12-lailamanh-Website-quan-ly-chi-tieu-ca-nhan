import React from "react";

interface Point {
  x: string;
  income: number;
  expense: number;
}

interface LineChartProps {
  data: Point[]; // x is ISO date (yyyy-mm-dd)
  formatCurrency?: (n: number) => string;
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const width = 520;
  const height = 220;
  const padding = 32;
  const xs = data.map((d) => d.x);
  const incomes = data.map((d) => d.income);
  const expenses = data.map((d) => d.expense);
  const maxY = Math.max(1, ...incomes, ...expenses);
  const minY = 0;

  const xScale = (i: number) =>
    padding + (i * (width - padding * 2)) / Math.max(1, data.length - 1);
  const yScale = (v: number) =>
    height - padding - ((v - minY) / (maxY - minY)) * (height - padding * 2);

  const toPath = (arr: number[]) =>
    arr
      .map((v, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(v)}`)
      .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56">
      <rect x={0} y={0} width={width} height={height} className="fill-white" />
      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line
          key={i}
          x1={padding}
          y1={padding + t * (height - padding * 2)}
          x2={width - padding}
          y2={padding + t * (height - padding * 2)}
          className="stroke-gray-200"
          strokeWidth={1}
        />
      ))}

      {/* income path */}
      <path
        d={toPath(incomes)}
        className="fill-none text-green-500"
        stroke="currentColor"
        strokeWidth={2}
      />
      {/* expense path */}
      <path
        d={toPath(expenses)}
        className="fill-none text-red-500"
        stroke="currentColor"
        strokeWidth={2}
      />

      {/* x labels */}
      {xs.map((d, i) => (
        <text
          key={d}
          x={xScale(i)}
          y={height - 8}
          textAnchor="middle"
          className="text-[10px] fill-gray-500"
        >
          {d.slice(5)}
        </text>
      ))}
    </svg>
  );
};

export default LineChart;
