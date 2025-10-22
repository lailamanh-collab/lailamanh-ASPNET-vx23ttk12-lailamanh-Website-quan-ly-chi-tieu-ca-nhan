import React from "react";

interface Category {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface CategoryChartProps {
  categories: Category[];
  formatCurrency: (amount: number) => string;
  loading?: boolean;
}

const CategoryChart: React.FC<CategoryChartProps> = ({
  categories,
  formatCurrency,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 rounded-full mr-3"></div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 bg-gray-300 rounded-full w-1/3"></div>
              </div>
              <div className="h-3 w-8 bg-gray-200 rounded mt-1"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((category, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`w-4 h-4 rounded-full mr-3 flex-shrink-0 ${category.color
              .replace("bg-", "bg-")
              .replace("-500", "-400")}`}
          ></div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-900">
                {category.name}
              </span>
              <span className="text-sm text-gray-600">
                {formatCurrency(category.amount)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${category.color}`}
                style={{ width: `${category.percentage}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500 mt-1">
              {category.percentage}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryChart;
