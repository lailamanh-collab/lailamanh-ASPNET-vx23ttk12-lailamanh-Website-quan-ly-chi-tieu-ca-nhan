import { useState } from "react";
import { toast } from "react-toastify";
import { useAuthStore } from "../store/useAuthStore";
import LoadingSpinner from "./LoadingSpinner";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const { changePassword, isLoading } = useAuthStore();
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.oldPassword.trim()) {
      newErrors.oldPassword = "Vui lòng nhập mật khẩu hiện tại";
    }

    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    }

    if (!passwordData.confirmNewPassword.trim()) {
      newErrors.confirmNewPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      newErrors.confirmNewPassword = "Mật khẩu xác nhận không khớp";
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      newErrors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const response = await changePassword(
        passwordData.oldPassword,
        passwordData.newPassword,
        passwordData.confirmNewPassword
      );

      // Hiển thị message từ server hoặc message mặc định
      const successMessage = response?.message || "Đổi mật khẩu thành công!";
      toast.success(successMessage);

      // Delay một chút để user thấy toast trước khi đóng modal
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Đổi mật khẩu thất bại"
          : "Đổi mật khẩu thất bại";
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    setPasswordData({
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setErrors({});
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Đổi mật khẩu
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
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

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mật khẩu hiện tại
              </label>
              <input
                id="oldPassword"
                name="oldPassword"
                type="password"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.oldPassword ? "border-red-500" : "border-gray-300"
                }`}
                value={passwordData.oldPassword}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Nhập mật khẩu hiện tại"
              />
              {errors.oldPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.oldPassword}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mật khẩu mới
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.newPassword ? "border-red-500" : "border-gray-300"
                }`}
                value={passwordData.newPassword}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Nhập mật khẩu mới"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Xác nhận mật khẩu mới
              </label>
              <input
                id="confirmNewPassword"
                name="confirmNewPassword"
                type="password"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.confirmNewPassword
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                value={passwordData.confirmNewPassword}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Nhập lại mật khẩu mới"
              />
              {errors.confirmNewPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmNewPassword}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors flex items-center"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Đang đổi...</span>
                  </>
                ) : (
                  "Đổi mật khẩu"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
