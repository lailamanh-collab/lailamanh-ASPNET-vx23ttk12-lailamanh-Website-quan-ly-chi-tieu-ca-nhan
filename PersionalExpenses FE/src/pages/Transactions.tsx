import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTransactionStore } from "../store/useTransactionStore";
import { useWalletStore } from "../store/useWalletStore";
import { useCategoryStore } from "../store/useCategoryStore";
import WalletSelector from "../components/wallet/WalletSelector";

const TransactionsPage: React.FC = () => {
  const { transactions, fetchTransactions, isLoading } = useTransactionStore();
  const { currentWallet } = useWalletStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [categoryId, setCategoryId] = useState<number | 0>(0);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  useEffect(() => {
    if (currentWallet?.id) fetchTransactions(currentWallet.id);
    if (!categories.length) fetchCategories();
  }, [
    currentWallet?.id,
    fetchTransactions,
    categories.length,
    fetchCategories,
  ]);

  const tx = useMemo(() => {
    const accountId = currentWallet?.id;
    let list = accountId
      ? transactions.filter((t) => t.accountId === accountId)
      : [];
    if (type !== "all")
      list = list.filter((t) => t.type === (type === "income" ? 0 : 1));
    if (categoryId) list = list.filter((t) => t.categoryId === categoryId);
    if (from) list = list.filter((t) => new Date(t.trxDate) >= new Date(from));
    if (to) list = list.filter((t) => new Date(t.trxDate) <= new Date(to));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((t) => (t.note || "").toLowerCase().includes(q));
    }
    return list.sort((a, b) => +new Date(b.trxDate) - +new Date(a.trxDate));
  }, [transactions, currentWallet?.id, type, categoryId, from, to, query]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currentWallet?.currency || "VND",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tất cả giao dịch</h1>
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

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Tìm ghi chú..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
            >
              <option value="all">Tất cả</option>
              <option value="income">Thu nhập</option>
              <option value="expense">Chi tiêu</option>
            </select>
            <select
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
            >
              <option value={0}>Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {`${c.icon ? c.icon + " " : ""}${c.name}`}
                </option>
              ))}
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="divide-y">
            {isLoading && currentWallet?.id ? (
              <div className="p-4">Đang tải...</div>
            ) : tx.length === 0 ? (
              <div className="p-6 text-gray-500">
                Chưa có giao dịch phù hợp.
              </div>
            ) : (
              tx.map((t) => (
                <div
                  key={t.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {t.note || (t.type === 0 ? "Thu nhập" : "Chi tiêu")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(t.trxDate).toLocaleString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </div>
                  </div>
                  <div
                    className={`font-semibold ${
                      t.type === 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {t.type === 0 ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
