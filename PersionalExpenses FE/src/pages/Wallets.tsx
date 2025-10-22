import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useWalletStore } from "../store/useWalletStore";
import {
  WALLET_TYPE_OPTIONS,
  getWalletTypeColor,
  CURRENCY_OPTIONS,
} from "../types/wallet";
import CreateWalletModal from "../components/wallet/CreateWalletModal";

const Wallets: React.FC = () => {
  const { user } = useWalletStore();
  const {
    wallets,
    currentWallet,
    fetchWallets,
    updateWallet,
    deleteWallet,
    setCurrentWallet,
    isLoading,
    error,
  } = useWalletStore();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleEditWallet = (wallet: any) => {
    setEditingWallet(wallet);
    setIsEditModalOpen(true);
  };

  const handleUpdateWallet = async (data: any) => {
    if (!editingWallet) return;

    try {
      await updateWallet(editingWallet.id, data);
      toast.success("Cập nhật ví thành công!");
      setIsEditModalOpen(false);
      setEditingWallet(null);
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật ví");
    }
  };

  const handleDeleteWallet = async (wallet: any) => {
    const toastId = toast(
      ({ closeToast }) => (
        <div className="space-y-3">
          <p className="text-sm text-gray-800">
            Xóa ví "{wallet.name}"? Hành động này không thể hoàn tác.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={async () => {
                try {
                  await deleteWallet(wallet.id);
                  toast.dismiss(toastId);
                  toast.success("Xóa ví thành công!");
                } catch (error: any) {
                  toast.dismiss(toastId);
                  toast.error(error.message || "Không thể xóa ví");
                }
              }}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Xóa
            </button>
            <button
              onClick={() => toast.dismiss(toastId)}
              className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </div>
      ),
      { autoClose: false, closeOnClick: false }
    );
  };

  const handleSetCurrentWallet = (wallet: any) => {
    if (!wallet.isActive) {
      toast.warn(
        "Ví này đang không hoạt động. Hãy kích hoạt trước khi sử dụng."
      );
      return;
    }
    setCurrentWallet(wallet);
    toast.success(`Đã chuyển sang ví "${wallet.name}"`);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý ví</h1>
            <p className="text-gray-600 mt-1">
              Tạo và quản lý các ví tài chính của bạn
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary"
          >
            + Tạo ví mới
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Wallets Grid */}
        {wallets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
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
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có ví nào
            </h3>
            <p className="text-gray-500 mb-6">
              Hãy tạo ví đầu tiên để bắt đầu quản lý tài chính
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary"
            >
              Tạo ví đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${
                  currentWallet?.id === wallet.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="p-6">
                  {/* Wallet Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${getWalletTypeColor(
                          wallet.type
                        )}`}
                      >
                        <span className="text-white font-semibold">
                          {wallet.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {wallet.name}
                        </h3>
                        <p className="text-sm text-gray-500">{wallet.type}</p>
                      </div>
                    </div>

                    {currentWallet?.id === wallet.id && wallet.isActive && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                        Đang sử dụng
                      </span>
                    )}
                  </div>

                  {/* Wallet Info */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Số dư:</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatCurrency(wallet.balance, wallet.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Đơn vị:</span>
                      <span className="text-sm font-medium text-gray-700">
                        {wallet.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Ngày tạo:</span>
                      <span className="text-sm text-gray-700">
                        {new Date(wallet.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    {(!wallet.isActive || currentWallet?.id !== wallet.id) &&
                      (wallet.isActive && currentWallet?.id !== wallet.id ? (
                        <button
                          onClick={() => handleSetCurrentWallet(wallet)}
                          className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Sử dụng
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 px-3 py-2 bg-gray-200 text-gray-500 text-sm rounded-lg cursor-not-allowed"
                          title="Ví đang không hoạt động"
                        >
                          Không hoạt động
                        </button>
                      ))}
                    <button
                      onClick={() => handleEditWallet(wallet)}
                      className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteWallet(wallet)}
                      className="px-3 py-2 border border-red-300 text-red-700 text-sm rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Quay lại Dashboard
          </Link>
        </div>
      </div>

      {/* Create Wallet Modal */}
      <CreateWalletModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Wallet Modal */}
      {editingWallet && (
        <EditWalletModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingWallet(null);
          }}
          wallet={editingWallet}
          onUpdate={handleUpdateWallet}
        />
      )}
    </div>
  );
};

// Edit Wallet Modal Component
interface EditWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: any;
  onUpdate: (data: any) => void;
}

const EditWalletModal: React.FC<EditWalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    name: wallet?.name || "",
    type: wallet?.type || WALLET_TYPE_OPTIONS[0]?.value || "cá nhân",
    currency: wallet?.currency || "VND",
    initialBalance: wallet?.initialBalance || 0,
    isActive: wallet?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (wallet) {
      setFormData({
        name: wallet.name,
        type: wallet.type,
        currency: wallet.currency,
        initialBalance: wallet.initialBalance || 0,
        isActive: wallet.isActive ?? true,
      });
    }
  }, [wallet]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "initialBalance" ? Number(value) : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập tên ví";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Tên ví phải có ít nhất 2 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(formData);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa ví</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tên ví *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Loại ví *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoading}
              >
                {WALLET_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="currency"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Đơn vị tiền tệ *
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoading}
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="initialBalance"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Số dư ban đầu
              </label>
              <input
                type="number"
                id="initialBalance"
                name="initialBalance"
                min={0}
                value={formData.initialBalance}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                disabled={isLoading}
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Kích hoạt ví
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? "Đang cập nhật..." : "Cập nhật"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Wallets;
