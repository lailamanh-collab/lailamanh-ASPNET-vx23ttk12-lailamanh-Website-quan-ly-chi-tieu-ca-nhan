import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useAuthStore } from "../store/useAuthStore";
import axiosInstance from "../utils/axiosInstance";

interface ApiUserItem {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  role: number | string;
  createdAt: string;
}

interface PagedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); // vẫn dùng để user chọn trang hiển thị cục bộ (client-side)
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | "Admin" | "User">("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [data, setData] = useState<PagedResponse<ApiUserItem>>({
    total: 0,
    page: 1,
    pageSize: 20,
    items: [],
  });

  const fetchUsers = async (p = page, ps = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/Users", {
        params: { page: p }, // API chỉ nhận page
      });
      const payload = res.data?.data as PagedResponse<ApiUserItem>;
      setData(payload || { total: 0, page: p, pageSize: ps, items: [] });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || "Không thể tải danh sách người dùng";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(data.total / data.pageSize || pageSize)),
    [data.total, data.pageSize, pageSize]
  );

  const roleToText = (r: number | string) =>
    String(r) === "1" || String(r) === "Admin" ? "Admin" : "User";

  // Client-side filtering on current page's items
  const filteredItems = useMemo(() => {
    let list = data.items || [];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    if (role !== "all") {
      list = list.filter((u) => roleToText(u.role) === role);
    }
    if (status !== "all") {
      list = list.filter((u) =>
        status === "active" ? u.isActive : !u.isActive
      );
    }
    if (from) {
      const f = new Date(from);
      list = list.filter((u) => new Date(u.createdAt) >= f);
    }
    if (to) {
      const t = new Date(to);
      list = list.filter((u) => new Date(u.createdAt) <= t);
    }
    return list;
  }, [data.items, query, role, status, from, to]);

  const updateUserActive = async (id: number, nextActive: boolean) => {
    try {
      await axiosInstance.put(`/Users/${id}/status`, undefined, {
        params: { active: nextActive },
      });
      setData((prev) => ({
        ...prev,
        items: prev.items.map((u) =>
          u.id === id ? { ...u, isActive: nextActive } : u
        ),
      }));
      toast.success("Cập nhật trạng thái thành công");
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || "Không thể cập nhật trạng thái"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="text-sm text-gray-600">Xin chào, {user?.name}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Tìm tên hoặc email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="px-3 py-2 border rounded-lg"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
            <select
              className="px-3 py-2 border rounded-lg"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
            <input
              type="date"
              className="px-3 py-2 border rounded-lg"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <input
              type="date"
              className="px-3 py-2 border rounded-lg"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Kích thước trang</label>
              <select
                className="px-3 py-2 border rounded-lg"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setPage(1)}
                className="ml-auto px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-gray-500"
                      colSpan={6}
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-gray-500"
                      colSpan={6}
                    >
                      Chưa có người dùng.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {u.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {u.email}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            roleToText(u.role) === "Admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {roleToText(u.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              u.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {u.isActive ? "Hoạt động" : "Không hoạt động"}
                          </span>
                          {roleToText(u.role) !== "Admin" && (
                            <button
                              onClick={() =>
                                updateUserActive(u.id, !u.isActive)
                              }
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                u.isActive ? "bg-green-600" : "bg-gray-300"
                              }`}
                              title="Bật/tắt hoạt động"
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                  u.isActive ? "translate-x-5" : "translate-x-1"
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Trang {page} / {totalPages} • Tổng {data.total}
            </div>
            <div className="space-x-2">
              <button
                onClick={() => {
                  const p = Math.max(1, page - 1);
                  setPage(p);
                  fetchUsers(p, pageSize);
                }}
                disabled={page <= 1 || loading}
                className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => {
                  const p = Math.min(totalPages, page + 1);
                  setPage(p);
                  fetchUsers(p, pageSize);
                }}
                disabled={page >= totalPages || loading}
                className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
