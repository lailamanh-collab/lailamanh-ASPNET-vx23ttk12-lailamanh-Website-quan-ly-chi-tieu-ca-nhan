import React, { useState } from "react";
import { toast } from "react-toastify";
import { useWalletStore } from "../../store/useWalletStore";
import type { CreateWalletRequest } from "../../types/wallet";
import { WALLET_TYPE_OPTIONS, CURRENCY_OPTIONS } from "../../types/wallet";

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateWalletModal: React.FC<CreateWalletModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createWallet, isLoading } = useWalletStore();
  const [formData, setFormData] = useState<CreateWalletRequest>({
    name: "",
    type: "cá nhân",
    currency: "VND",
    initialBalance: 0,
  });
  const [initialBalanceInput, setInitialBalanceInput] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "initialBalance") {
      const onlyDigits = value.replace(/[^0-9]/g, "");
      setInitialBalanceInput(onlyDigits);
      setFormData((prev) => ({
        ...prev,
        initialBalance: Number(onlyDigits || 0),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
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

    if (formData.initialBalance < 0) {
      newErrors.initialBalance = "Số dư ban đầu không được âm";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createWallet(formData);
      toast.success("Tạo ví mới thành công!");

      // Reset form
      setFormData({
        name: "",
        type: "cá nhân",
        currency: "VND",
        initialBalance: 0,
      });
      setInitialBalanceInput("");
      setErrors({});
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Không thể tạo ví mới");
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      type: "cá nhân",
      currency: "VND",
      initialBalance: 0,
    });
    setInitialBalanceInput("");
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Tạo ví mới</h2>
            <button
              onClick={handleClose}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Wallet Name */}
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
                placeholder="Ví dụ: Ví gia đình, Ví cá nhân..."
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Wallet Type */}
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

            {/* Currency */}
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

            {/* Initial Balance */}
            <div>
              <label
                htmlFor="initialBalance"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Số dư ban đầu
              </label>
              <input
                type="text"
                id="initialBalance"
                name="initialBalance"
                value={initialBalanceInput}
                onChange={handleChange}
                inputMode="numeric"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.initialBalance
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="0"
                disabled={isLoading}
              />
              {errors.initialBalance && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.initialBalance}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
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
                {isLoading ? "Đang tạo..." : "Tạo ví"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateWalletModal;
