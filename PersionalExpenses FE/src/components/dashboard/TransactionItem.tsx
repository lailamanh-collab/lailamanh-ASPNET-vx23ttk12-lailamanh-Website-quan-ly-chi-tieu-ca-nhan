import React from "react";

interface Transaction {
  id: number;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
  icon: string;
}

interface TransactionItemProps {
  transaction: Transaction;
  formatCurrency: (amount: number) => string;
  onClick?: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  formatCurrency,
  onClick,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(transaction);
    }
  };

  return (
    <div
      className={`flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 ${
        onClick ? "cursor-pointer hover:border-primary-200" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-4">
        <div className="text-2xl">{transaction.icon}</div>
        <div>
          <p className="font-medium text-gray-900">{transaction.description}</p>
          <p className="text-sm text-gray-500">{transaction.category}</p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-semibold ${
            transaction.type === "income" ? "text-green-600" : "text-red-600"
          }`}
        >
          {transaction.type === "income" ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </p>
        <p className="text-sm text-gray-500">{transaction.date}</p>
      </div>
    </div>
  );
};

export default TransactionItem;
