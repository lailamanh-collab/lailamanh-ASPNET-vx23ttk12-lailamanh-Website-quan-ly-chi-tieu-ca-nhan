import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuthStore } from "../store/useAuthStore";
import Avatar from "../components/Avatar";
import LoadingSpinner from "../components/LoadingSpinner";
import ChangePasswordModal from "../components/ChangePasswordModal";

const Profile = () => {
  const { user, updateProfile, isLoading, clearError } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    imgUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        imgUrl: user.avatar || "",
      });
    }
  }, [user]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập họ tên";
    }

    if (formData.imgUrl && !/^https?:\/\//i.test(formData.imgUrl)) {
      newErrors.imgUrl = "Đường dẫn ảnh phải bắt đầu bằng http(s)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
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
      // imgUrl is mapped in store to avatar
      await updateProfile({
        name: formData.name,
        avatar: formData.imgUrl as any,
      });
      toast.success("Cập nhật thông tin thành công!");
      setIsEditing(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Cập nhật thất bại"
          : "Cập nhật thất bại";
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        imgUrl: user.avatar || "",
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Đang tải thông tin..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Hồ sơ cá nhân
              </h1>
              {!isEditing && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowChangePasswordModal(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2 inline"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                    Đổi mật khẩu
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-primary"
                  >
                    Chỉnh sửa
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6 mb-8">
              <Avatar src={user.avatar} name={user.name} size="large" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.name}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mt-1">
                  {user.role}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Họ và tên
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className={`input-field mt-1 ${
                    errors.name ? "border-red-500" : ""
                  } ${!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}`}
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing || isLoading}
                  readOnly={!isEditing}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email - read-only display */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`input-field mt-1 bg-gray-50 cursor-not-allowed`}
                  value={user.email}
                  onChange={() => {}}
                  disabled
                  readOnly
                />
              </div>

              {isEditing && (
                <div>
                  <label
                    htmlFor="imgUrl"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Ảnh đại diện (Image URL)
                  </label>
                  <input
                    id="imgUrl"
                    name="imgUrl"
                    type="url"
                    className={`input-field mt-1 ${
                      errors.imgUrl ? "border-red-500" : ""
                    } ${!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}`}
                    value={formData.imgUrl}
                    onChange={handleChange}
                    disabled={!isEditing || isLoading}
                    readOnly={!isEditing}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  {errors.imgUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.imgUrl}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vai trò
                  </label>
                  <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {user.role}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="small" />
                        <span className="ml-2">Đang lưu...</span>
                      </>
                    ) : (
                      "Lưu thay đổi"
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
};

export default Profile;
