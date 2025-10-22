import React from "react";

interface BarPoint {
  x: string; // label (yyyy-mm-dd)
  income: number;
  expense: number;
}

interface BarChartProps {
  data: BarPoint[];
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const width = 520;
  const height = 240;
  const padding = 36;
  const barGroup = 16; // width per stacked group
  const gap = 18; // gap between groups

  const maxY = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)));
  const scaleY = (v: number) =>
    Math.max(0, ((v / maxY) * (height - padding * 2)) | 0);
  const totalWidth = padding * 2 + data.length * (barGroup + gap) - gap;

  return (
    <svg
      viewBox={`0 0 ${Math.max(width, totalWidth)} ${height}`}
      className="w-full h-60"
    >
      <rect
        x={0}
        y={0}
        width={Math.max(width, totalWidth)}
        height={height}
        className="fill-white"
      />
      {/* axes */}
      <line
        x1={padding}
        y1={height - padding}
        x2={Math.max(width, totalWidth) - padding}
        y2={height - padding}
        className="stroke-gray-300"
        strokeWidth={1}
      />
      {/* bars */}
      {data.map((d, i) => {
        const baseX = padding + i * (barGroup + gap);
        const hIncome = scaleY(d.income);
        const hExpense = scaleY(d.expense);
        const yIncome = height - padding - hIncome;
        const yExpense = height - padding - hExpense;
        return (
          <g key={d.x}>
            <rect
              x={baseX}
              y={yIncome}
              width={barGroup / 2 - 2}
              height={hIncome}
              className="fill-green-500"
              rx={2}
            />
            <rect
              x={baseX + barGroup / 2 + 2}
              y={yExpense}
              width={barGroup / 2 - 2}
              height={hExpense}
              className="fill-red-500"
              rx={2}
            />
            <text
              x={baseX + barGroup / 2}
              y={height - padding + 12}
              textAnchor="middle"
              className="text-[10px] fill-gray-500"
            >
              {d.x.slice(5)}
            </text>
          </g>
        );
      })}
      {/* legend */}
      <g>
        <rect
          x={padding}
          y={12}
          width={10}
          height={10}
          className="fill-green-500"
        />
        <text x={padding + 14} y={21} className="text-[10px] fill-gray-600">
          Thu nhập
        </text>
        <rect
          x={padding + 70}
          y={12}
          width={10}
          height={10}
          className="fill-red-500"
        />
        <text x={padding + 84} y={21} className="text-[10px] fill-gray-600">
          Chi tiêu
        </text>
      </g>
    </svg>
  );
};

export default BarChart;
