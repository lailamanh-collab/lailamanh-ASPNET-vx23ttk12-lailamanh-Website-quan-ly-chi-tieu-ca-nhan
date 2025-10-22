import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          <div className="text-right">
            <div className="h-8 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
            {value}
          </p>
          <p className="text-sm text-gray-600">{title}</p>
        </div>
      </div>
      {change !== undefined && (
        <div className="flex items-center">
          <span
            className={`text-sm font-medium ${
              change > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {change > 0 ? "+" : ""}
            {change}%
          </span>
          <span className="text-sm text-gray-500 ml-2">so với tháng trước</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
