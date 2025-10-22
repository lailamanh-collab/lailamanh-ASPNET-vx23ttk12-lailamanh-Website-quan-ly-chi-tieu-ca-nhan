import React from "react";

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={action.onClick}
          className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
        >
          <div
            className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}
          >
            {action.icon}
          </div>
          <span className="text-sm font-medium text-gray-900 group-hover:text-primary-700 transition-colors">
            {action.title}
          </span>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
