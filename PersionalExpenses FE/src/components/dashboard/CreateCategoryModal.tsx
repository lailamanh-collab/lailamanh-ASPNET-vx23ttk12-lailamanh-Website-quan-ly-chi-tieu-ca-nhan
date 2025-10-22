import React, { useState } from "react";
import { useCategoryStore } from "../../store/useCategoryStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CreateCategoryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { createCategory, isLoading } = useCategoryStore();
  const [form, setForm] = useState({
    name: "",
    type: 0,
    color: "#9ca3af",
    icon: "•",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "type" ? Number(value) : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập tên danh mục";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!validate()) return;
    await createCategory({
      name: form.name,
      type: form.type,
      color: form.color,
      icon: form.icon,
    });
    onClose();
    setForm({ name: "", type: 0, color: "#9ca3af", icon: "•" });
  };

  const handleClose = () => {
    setForm({ name: "", type: 0, color: "#9ca3af", icon: "•" });
    setErrors({});
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="fixed inset-0 bg-black bg-opacity-50" />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Thêm danh mục
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên danh mục
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="Ví dụ: Ăn uống"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value={0}>Thu nhập</option>
                <option value={1}>Chi tiêu</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Màu
                </label>
                <input
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <input
                  name="icon"
                  value={form.icon}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Tạo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCategoryModal;
