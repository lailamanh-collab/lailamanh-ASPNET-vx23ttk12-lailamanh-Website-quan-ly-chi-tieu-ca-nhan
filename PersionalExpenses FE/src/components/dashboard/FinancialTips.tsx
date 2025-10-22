import React, { useState } from "react";

interface FinancialTip {
  id: number;
  title: string;
  content: string;
  icon: string;
  category: string;
}

interface FinancialTipsProps {
  savingsRate: number;
}

const FinancialTips: React.FC<FinancialTipsProps> = ({ savingsRate }) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const tips: FinancialTip[] = [
    {
      id: 1,
      title: "Tỷ lệ tiết kiệm tốt",
      content: `Bạn đang tiết kiệm tốt với tỷ lệ ${savingsRate}%. Hãy tiếp tục duy trì thói quen này để đạt được mục tiêu tài chính dài hạn!`,
      icon: "💡",
      category: "Tiết kiệm",
    },
    {
      id: 2,
      title: "Đa dạng hóa đầu tư",
      content:
        "Hãy xem xét đầu tư một phần tiền tiết kiệm vào các kênh khác nhau để tăng trưởng tài sản.",
      icon: "📈",
      category: "Đầu tư",
    },
    {
      id: 3,
      title: "Theo dõi ngân sách",
      content:
        "Thiết lập ngân sách hàng tháng và theo dõi chi tiêu để kiểm soát tài chính tốt hơn.",
      icon: "📊",
      category: "Quản lý",
    },
    {
      id: 4,
      title: "Quỹ khẩn cấp",
      content:
        "Xây dựng quỹ khẩn cấp tương đương 3-6 tháng chi phí sinh hoạt để đảm bảo an toàn tài chính.",
      icon: "🛡️",
      category: "An toàn",
    },
  ];

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length);
  };

  const currentTip = tips[currentTipIndex];

  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{currentTip.icon} Mẹo tài chính</h3>
        <button
          onClick={nextTip}
          className="text-white/80 hover:text-white transition-colors"
          title="Mẹo tiếp theo"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <span className="inline-block bg-white/20 text-xs px-2 py-1 rounded-full mb-2">
          {currentTip.category}
        </span>
        <h4 className="font-semibold mb-2">{currentTip.title}</h4>
        <p className="text-primary-100 text-sm leading-relaxed">
          {currentTip.content}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          {tips.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentTipIndex ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
        <button className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors">
          Xem thêm mẹo
        </button>
      </div>
    </div>
  );
};

export default FinancialTips;
