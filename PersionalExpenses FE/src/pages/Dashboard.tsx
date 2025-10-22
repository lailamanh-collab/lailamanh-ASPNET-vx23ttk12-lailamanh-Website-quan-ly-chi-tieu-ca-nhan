import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import Avatar from "../components/Avatar";
import { useWalletStore } from "../store/useWalletStore";
import { useCategoryStore } from "../store/useCategoryStore";
import StatCard from "../components/dashboard/StatCard";
import TransactionItem from "../components/dashboard/TransactionItem";
import { useTransactionStore } from "../store/useTransactionStore";
import CategoryChart from "../components/dashboard/CategoryChart";
import QuickActions from "../components/dashboard/QuickActions";
import FinancialTips from "../components/dashboard/FinancialTips";
import WalletSelector from "../components/wallet/WalletSelector";
import CreateWalletModal from "../components/wallet/CreateWalletModal";
import CreateCategoryModal from "../components/dashboard/CreateCategoryModal";
import EditCategoryModal from "../components/dashboard/EditCategoryModal";
import CreateTransactionModal from "../components/dashboard/CreateTransactionModal";

// Mock data - sẽ được thay thế bằng API calls thực tế
const mockStats = {
  totalBalance: 12500000,
  monthlyIncome: 8000000,
  monthlyExpenses: 5200000,
  savingsRate: 35,
};

// Recent transactions are loaded from API now

// Category chart data is computed from live data below

const Dashboard = () => {
  const { user } = useAuthStore();
  const { currentWallet, fetchWallets } = useWalletStore();
  const {
    categories,
    fetchCategories,
    isLoading: isLoadingCategories,
  } = useCategoryStore();
  const {
    transactions,
    fetchTransactions,
    isLoading: isLoadingTx,
  } = useTransactionStore();
  const navigate = useNavigate();
  // Selected month filter in format YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateWalletModalOpen, setIsCreateWalletModalOpen] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] =
    useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null
  );
  const [txModalOpen, setTxModalOpen] = useState<{
    open: boolean;
    type: 0 | 1;
  }>({ open: false, type: 0 });

  // removed old inline deleter; handled inside EditCategoryModal

  useEffect(() => {
    // Fetch wallets when component mounts
    fetchWallets();
    // Fetch categories for dashboard display
    fetchCategories();
    // Fetch transactions
    if (currentWallet?.id) {
      fetchTransactions(currentWallet.id);
    }

    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [fetchWallets, fetchCategories, fetchTransactions, currentWallet?.id]);

  const formatCurrency = (amount: number) => {
    const currency = currentWallet?.currency || "VND";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Aggregates for selected month (YYYY-MM)
  const isInSelectedMonth = (iso: string) => {
    if (!selectedMonth) return true;
    const d = new Date(iso);
    const [y, m] = selectedMonth.split("-").map((x) => Number(x));
    return d.getFullYear() === y && d.getMonth() + 1 === m;
  };
  const accountId = currentWallet?.id;
  const hasActiveWallet = Boolean(currentWallet && currentWallet.isActive);
  const txForCurrent = accountId
    ? transactions.filter((t) => t.accountId === accountId)
    : [];
  const monthlyIncome = txForCurrent
    .filter((t) => t.type === 0 && isInSelectedMonth(t.trxDate))
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpense = txForCurrent
    .filter((t) => t.type === 1 && isInSelectedMonth(t.trxDate))
    .reduce((sum, t) => sum + t.amount, 0);
  const savingsRateStr = (() => {
    const rate =
      monthlyIncome > 0
        ? Math.max(
            0,
            Math.min(
              100,
              Math.round(
                ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100
              )
            )
          )
        : 0;
    return `${rate}%`;
  })();

  // Derive current total balance from initialBalance and all-time transactions
  const totalIncomeAll = txForCurrent
    .filter((t) => t.type === 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenseAll = txForCurrent
    .filter((t) => t.type === 1)
    .reduce((sum, t) => sum + t.amount, 0);
  const derivedBalance = hasActiveWallet
    ? (currentWallet?.initialBalance ?? 0) + (totalIncomeAll - totalExpenseAll)
    : 0;
  const monthlyNetIncome = monthlyIncome - monthlyExpense;
  const txCountThisMonth = txForCurrent.filter((t) =>
    isInSelectedMonth(t.trxDate)
  ).length;
  const daysPassedInMonth = (() => {
    const [y, m] = selectedMonth.split("-").map((x) => Number(x));
    // if currently viewing current month, use today's day; else use days in that month
    const now = new Date();
    if (now.getFullYear() === y && now.getMonth() + 1 === m)
      return now.getDate();
    // days in selected month
    return new Date(y, m, 0).getDate();
  })();
  const avgDailyExpense =
    daysPassedInMonth > 0 ? Math.round(monthlyExpense / daysPassedInMonth) : 0;

  // Build expense-by-category dataset for the current month
  const categoryColorPalette = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-cyan-500",
  ];
  const expenseByCategoryRaw = categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      amount: txForCurrent
        .filter(
          (t) =>
            t.type === 1 &&
            t.categoryId === c.id &&
            isInSelectedMonth(t.trxDate)
        )
        .reduce((sum, t) => sum + t.amount, 0),
    }))
    .filter((x) => x.amount > 0);
  const totalExpenseForChart = expenseByCategoryRaw.reduce(
    (s, x) => s + x.amount,
    0
  );
  const categoryChartData = expenseByCategoryRaw.map((x, idx) => ({
    name: x.name,
    amount: x.amount,
    percentage:
      totalExpenseForChart > 0
        ? Math.round((x.amount / totalExpenseForChart) * 100)
        : 0,
    color: categoryColorPalette[idx % categoryColorPalette.length],
  }));

  // Quick actions configuration
  const quickActions = [
    {
      id: "add-income",
      title: "Thêm thu nhập",
      icon: (
        <svg
          className="w-6 h-6 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
      color: "bg-green-100",
      onClick: async () =>
        hasActiveWallet
          ? setTxModalOpen({ open: true, type: 0 })
          : alert("Vui lòng tạo ví trước."),
    },
    {
      id: "add-expense",
      title: "Thêm chi tiêu",
      icon: (
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
      color: "bg-red-100",
      onClick: async () =>
        hasActiveWallet
          ? setTxModalOpen({ open: true, type: 1 })
          : alert("Vui lòng tạo ví trước."),
    },
    {
      id: "view-reports",
      title: "Báo cáo",
      icon: (
        <svg
          className="w-6 h-6 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      color: "bg-blue-100",
      onClick: () => (hasActiveWallet ? navigate("/reports") : undefined),
    },
    {
      id: "settings",
      title: "Cài đặt",
      icon: (
        <svg
          className="w-6 h-6 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      color: "bg-purple-100",
      onClick: () => console.log("Settings clicked"),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Personal Expenses
              </span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>

              <div className="relative group">
                <div onClick={() => navigate("/profile")}>
                  {/* Use shared Avatar so it renders image when available and initials otherwise */}
                  <Avatar
                    src={user?.avatar}
                    name={user?.name || ""}
                    size="medium"
                  />
                </div>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Hồ sơ cá nhân
                    </Link>
                    {user?.role !== "Admin" && (
                      <Link
                        to="/wallets"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Quản lý ví
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        useAuthStore.getState().logout();
                        navigate("/");
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Chào mừng trở lại, {user?.name}!
                </h1>
                <p className="text-gray-600 mt-1">
                  Đây là tổng quan tài chính của bạn
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Wallet Selector */}
            <div className="flex items-center space-x-4">
              <WalletSelector />
              <button
                onClick={() => setIsCreateWalletModalOpen(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                + Tạo ví mới
              </button>
              {!hasActiveWallet && (
                <span className="text-sm text-gray-500">
                  Chưa có ví đang hoạt động. Hãy tạo ví trước khi sử dụng các
                  tính năng.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid - exactly 8 cards, 4 per row on large screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Tổng số dư"
            value={
              hasActiveWallet
                ? formatCurrency(derivedBalance)
                : formatCurrency(0)
            }
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            }
            color="bg-gradient-to-br from-green-500 to-green-600"
          />

          <StatCard
            title="Số dư gốc"
            value={
              hasActiveWallet && currentWallet
                ? formatCurrency(currentWallet.initialBalance ?? 0)
                : formatCurrency(0)
            }
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h10M5 6h14"
                />
              </svg>
            }
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />

          <StatCard
            title="Thu nhập tháng"
            value={
              hasActiveWallet
                ? formatCurrency(monthlyIncome)
                : formatCurrency(0)
            }
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            }
            color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          />

          <StatCard
            title="Chi tiêu tháng"
            value={
              hasActiveWallet
                ? formatCurrency(monthlyExpense)
                : formatCurrency(0)
            }
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              </svg>
            }
            color="bg-gradient-to-br from-red-500 to-red-600"
          />

          <StatCard
            title="Tỷ lệ tiết kiệm"
            value={hasActiveWallet ? savingsRateStr : "0%"}
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />

          {/* New: Thu nhập ròng tháng */}
          <StatCard
            title="Thu nhập ròng tháng"
            value={
              hasActiveWallet
                ? formatCurrency(monthlyNetIncome)
                : formatCurrency(0)
            }
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12h6l3 3 6-6 3 3"
                />
              </svg>
            }
            color="bg-gradient-to-br from-cyan-500 to-cyan-600"
          />

          {/* New: Số giao dịch tháng */}
          <StatCard
            title="Số giao dịch tháng"
            value={hasActiveWallet ? `${txCountThisMonth}` : "0"}
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h8M8 12h8M8 17h8"
                />
              </svg>
            }
            color="bg-gradient-to-br from-slate-500 to-slate-600"
          />

          {/* New: Chi tiêu TB/ngày */}
          <StatCard
            title="Chi tiêu TB/ngày"
            value={
              hasActiveWallet
                ? formatCurrency(avgDailyExpense)
                : formatCurrency(0)
            }
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M5 6h14M5 18h7"
                />
              </svg>
            }
            color="bg-gradient-to-br from-orange-500 to-orange-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            {/* Quick Actions - moved to top */}
            <div
              className={`bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8 ${
                !hasActiveWallet
                  ? "opacity-60 pointer-events-none select-none"
                  : ""
              }`}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Thao tác nhanh
              </h2>
              <QuickActions actions={quickActions} />
            </div>

            <div
              className={`bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8 ${
                !hasActiveWallet
                  ? "opacity-60 pointer-events-none select-none"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Chi tiêu theo danh mục
                </h2>
                <button className="text-primary-600 hover:text-primary-700 font-medium">
                  Xem chi tiết
                </button>
              </div>

              {/* Category Chart - from live data */}
              <CategoryChart
                categories={categoryChartData}
                formatCurrency={formatCurrency}
                loading={isLoadingTx || isLoadingCategories}
              />
            </div>

            {/* Categories Panel - moved to left column */}
            <div
              className={`bg-white rounded-xl p-6 shadow-lg border border-gray-100 mt-8 ${
                !hasActiveWallet
                  ? "opacity-60 pointer-events-none select-none"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Danh mục</h2>
                <button
                  onClick={() => setIsCreateCategoryModalOpen(true)}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  + Thêm
                </button>
              </div>
              {isLoadingCategories ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-4 bg-gray-200 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có danh mục.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {categories.map((c) => (
                    <div key={c.id} className="flex items-center">
                      <button
                        onClick={() => setEditingCategoryId(c.id)}
                        className="flex items-center space-x-2 px-3 py-2 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors whitespace-nowrap"
                        title="Chỉnh sửa"
                      >
                        <span className="inline-flex w-6 h-6 rounded-full bg-gray-200 items-center justify-center">
                          {c.icon}
                        </span>
                        <span className="text-sm text-gray-900 font-medium">
                          {c.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({c.type === 0 ? "Thu nhập" : "Chi tiêu"})
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Giao dịch gần đây
                </h2>
              </div>

              <div className="space-y-3">
                {isLoadingTx && accountId ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-16 bg-gray-100 rounded animate-pulse"
                      />
                    ))}
                  </div>
                ) : txForCurrent.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có giao dịch.</p>
                ) : (
                  txForCurrent.slice(0, 5).map((t) => (
                    <TransactionItem
                      key={t.id}
                      transaction={{
                        id: t.id,
                        type: t.type === 0 ? "income" : ("expense" as const),
                        category:
                          categories.find((c) => c.id === t.categoryId)?.name ||
                          "Danh mục",
                        amount: t.amount,
                        description:
                          t.note || (t.type === 0 ? "Thu nhập" : "Chi tiêu"),
                        date: new Date(t.trxDate).toLocaleString("vi-VN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }),
                        icon:
                          categories.find((c) => c.id === t.categoryId)?.icon ||
                          "💸",
                      }}
                      formatCurrency={formatCurrency}
                    />
                  ))
                )}
              </div>

              {accountId && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Link
                    to="/transactions"
                    className="block w-full text-center py-2 px-4 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors font-medium"
                  >
                    Xem tất cả giao dịch
                  </Link>
                </div>
              )}
            </div>

            {/* Financial Tips */}
            <div className="mt-8">
              <FinancialTips savingsRate={mockStats.savingsRate} />
            </div>
          </div>
        </div>
      </div>

      {/* Create Wallet Modal */}
      <CreateWalletModal
        isOpen={isCreateWalletModalOpen}
        onClose={() => setIsCreateWalletModalOpen(false)}
      />
      <CreateCategoryModal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
      />
      <CreateTransactionModal
        isOpen={txModalOpen.open}
        defaultType={txModalOpen.type}
        onClose={() => {
          setTxModalOpen({ open: false, type: 0 });
          fetchTransactions(currentWallet?.id);
        }}
      />
      <EditCategoryModal
        isOpen={editingCategoryId !== null}
        onClose={() => setEditingCategoryId(null)}
        category={
          editingCategoryId !== null
            ? categories.find((x) => x.id === editingCategoryId) ?? null
            : null
        }
      />
    </div>
  );
};

export default Dashboard;
