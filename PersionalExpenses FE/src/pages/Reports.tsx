import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useWalletStore } from "../store/useWalletStore";
import { useTransactionStore } from "../store/useTransactionStore";
import { useCategoryStore } from "../store/useCategoryStore";
import WalletSelector from "../components/wallet/WalletSelector";
import StatCard from "../components/dashboard/StatCard";
import CategoryChart from "../components/dashboard/CategoryChart";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  Legend as RLegend,
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart as RBarChart,
  Bar,
  AreaChart as RAreaChart,
  Area,
} from "recharts";

const Reports: React.FC = () => {
  const { currentWallet } = useWalletStore();
  const {
    transactions,
    fetchTransactions,
    isLoading: isLoadingTx,
  } = useTransactionStore();
  const {
    categories,
    fetchCategories,
    isLoading: isLoadingCategories,
  } = useCategoryStore();

  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [type, setType] = useState<"all" | 0 | 1>("all");

  useEffect(() => {
    if (currentWallet?.id) fetchTransactions(currentWallet.id);
    if (!categories.length) fetchCategories();
  }, [
    currentWallet?.id,
    fetchTransactions,
    categories.length,
    fetchCategories,
  ]);

  const filtered = useMemo(() => {
    const list = currentWallet?.id
      ? transactions.filter((t) => t.accountId === currentWallet.id)
      : [];
    const byType = type === "all" ? list : list.filter((t) => t.type === type);
    const byFrom = from
      ? byType.filter((t) => new Date(t.trxDate) >= new Date(from))
      : byType;
    const byTo = to
      ? byFrom.filter((t) => new Date(t.trxDate) <= new Date(to))
      : byFrom;
    return byTo.sort((a, b) => +new Date(b.trxDate) - +new Date(a.trxDate));
  }, [transactions, currentWallet?.id, type, from, to]);

  const totals = useMemo(() => {
    const income = filtered
      .filter((t) => t.type === 0)
      .reduce((s, t) => s + t.amount, 0);
    const expense = filtered
      .filter((t) => t.type === 1)
      .reduce((s, t) => s + t.amount, 0);
    const net = income - expense;
    return { income, expense, net };
  }, [filtered]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currentWallet?.currency || "VND",
    }).format(amount);
  };

  const categoryExpenseAgg = useMemo(() => {
    const items = categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        amount: filtered
          .filter((t) => t.type === 1 && t.categoryId === c.id)
          .reduce((s, t) => s + t.amount, 0),
      }))
      .filter((x) => x.amount > 0);
    const total = items.reduce((s, x) => s + x.amount, 0) || 1;
    const palette = [
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
    return items.map((x, i) => ({
      name: x.name,
      amount: x.amount,
      percentage: Math.round((x.amount / total) * 100),
      color: palette[i % palette.length],
    }));
  }, [categories, filtered]);

  const donutData = useMemo(() => {
    return categoryExpenseAgg.map((x) => ({
      label: x.name,
      value: x.amount,
      color: x.color,
    }));
  }, [categoryExpenseAgg]);

  // Income by category aggregation (type === 0)
  const categoryIncomeAgg = useMemo(() => {
    const items = categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        amount: filtered
          .filter((t) => t.type === 0 && t.categoryId === c.id)
          .reduce((s, t) => s + t.amount, 0),
      }))
      .filter((x) => x.amount > 0);
    const total = items.reduce((s, x) => s + x.amount, 0) || 1;
    const palette = [
      "bg-emerald-500",
      "bg-blue-500",
      "bg-sky-500",
      "bg-teal-500",
      "bg-lime-500",
      "bg-indigo-500",
      "bg-cyan-500",
      "bg-green-500",
    ];
    return items.map((x, i) => ({
      name: x.name,
      amount: x.amount,
      percentage: Math.round((x.amount / total) * 100),
      color: palette[i % palette.length],
    }));
  }, [categories, filtered]);

  const donutIncomeData = useMemo(() => {
    return categoryIncomeAgg.map((x) => ({
      label: x.name,
      value: x.amount,
      color: x.color,
    }));
  }, [categoryIncomeAgg]);

  // Dynamic dataset for the first category panel based on current type filter
  const currentCategoryAgg =
    type === 1
      ? categoryExpenseAgg
      : type === 0
      ? categoryIncomeAgg
      : categoryExpenseAgg;
  const currentDonutData =
    type === 1 ? donutData : type === 0 ? donutIncomeData : donutData;
  const currentCategoryTitle =
    type === 1
      ? "Chi tiêu theo danh mục"
      : type === 0
      ? "Thu nhập theo danh mục"
      : "Chi tiêu theo danh mục";
  // const currentTotalLabel = type === 1 ? "Tổng chi" : type === 0 ? "Tổng thu" : "Tổng chi";

  const lineData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    filtered.forEach((t) => {
      const d = new Date(t.trxDate).toISOString().slice(0, 10);
      const cur = map.get(d) || { income: 0, expense: 0 };
      if (t.type === 0) cur.income += t.amount;
      else if (t.type === 1) cur.expense += t.amount;
      map.set(d, cur);
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([x, v]) => ({ x, income: v.income, expense: v.expense }));
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo tổng hợp</h1>
          <div className="flex items-center space-x-3">
            <WalletSelector />
            <Link
              to="/dashboard"
              className="px-4 py-4 text-base bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors font-semibold"
            >
              Về Dashboard
            </Link>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={type}
              onChange={(e) => {
                const val = e.target.value;
                setType(val === "all" ? "all" : (Number(val) as 0 | 1));
              }}
            >
              <option value="all">Tất cả</option>
              <option value={0}>Thu nhập</option>
              <option value={1}>Chi tiêu</option>
            </select>
            <input
              type="date"
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <input
              type="date"
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Tổng thu"
            value={formatCurrency(totals.income)}
            icon={<div />}
            color="bg-green-600"
          />
          <StatCard
            title="Tổng chi"
            value={formatCurrency(totals.expense)}
            icon={<div />}
            color="bg-red-600"
          />
          <StatCard
            title="Thu ròng"
            value={formatCurrency(totals.net)}
            icon={<div />}
            color="bg-indigo-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {currentCategoryTitle}
            </h2>
            <div className="mb-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentDonutData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {currentDonutData.map((_, index) => (
                      <Cell
                        key={`c-${index}`}
                        fill={
                          [
                            "#ef4444",
                            "#3b82f6",
                            "#22c55e",
                            "#a855f7",
                            "#f59e0b",
                            "#ec4899",
                            "#06b6d4",
                            "#10b981",
                          ][index % 8]
                        }
                      />
                    ))}
                  </Pie>
                  <RTooltip
                    formatter={(v: unknown) => formatCurrency(Number(v))}
                  />
                  <RLegend
                    layout="horizontal"
                    align="center"
                    verticalAlign="top"
                    wrapperStyle={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <CategoryChart
              categories={currentCategoryAgg}
              formatCurrency={formatCurrency}
              loading={isLoadingTx || isLoadingCategories}
            />
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Dòng tiền theo thời gian
            </h2>
            {lineData.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RLineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="x"
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis />
                    <RTooltip
                      formatter={(v: unknown) => formatCurrency(Number(v))}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#22c55e"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke="#ef4444"
                      dot={false}
                    />
                  </RLineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              So sánh thu/chi theo ngày
            </h2>
            {lineData.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RBarChart
                    data={lineData.map((x) => ({
                      x: x.x,
                      income: x.income,
                      expense: x.expense,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="x"
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis />
                    <RTooltip
                      formatter={(v: unknown) => formatCurrency(Number(v))}
                    />
                    <Bar dataKey="income" fill="#22c55e" />
                    <Bar dataKey="expense" fill="#ef4444" />
                  </RBarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Thu ròng theo ngày (area)
            </h2>
            {lineData.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RAreaChart
                    data={lineData.map((d) => ({
                      x: d.x,
                      net: d.income - d.expense,
                    }))}
                  >
                    <defs>
                      <linearGradient id="netColor" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="x"
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis />
                    <RTooltip
                      formatter={(v: unknown) => formatCurrency(Number(v))}
                    />
                    <Area
                      type="monotone"
                      dataKey="net"
                      stroke="#10b981"
                      fill="url(#netColor)"
                    />
                  </RAreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* End of reports content */}
      </div>
    </div>
  );
};

export default Reports;
