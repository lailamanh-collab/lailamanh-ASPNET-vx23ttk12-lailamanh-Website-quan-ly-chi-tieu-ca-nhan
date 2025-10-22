import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTransactionStore } from "../../store/useTransactionStore";
import { useWalletStore } from "../../store/useWalletStore";
import { useCategoryStore } from "../../store/useCategoryStore";

interface Props {
  isOpen: boolean;
  defaultType: 0 | 1; // 0 income, 1 expense
  onClose: () => void;
}

const CreateTransactionModal: React.FC<Props> = ({
  isOpen,
  defaultType,
  onClose,
}) => {
  const { createTransaction, isLoading } = useTransactionStore();
  const { currentWallet } = useWalletStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [form, setForm] = useState({
    type: defaultType as 0 | 1,
    amount: 0,
    trxDateTime: new Date().toISOString().slice(0, 16), // yyyy-MM-ddTHH:mm
    categoryId: 0,
    note: "",
  });
  const [amountInput, setAmountInput] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    // Ensure categories are loaded
    if (!categories || categories.length === 0) {
      fetchCategories();
    }
  }, [isOpen, categories, fetchCategories]);

  useEffect(() => {
    if (!isOpen) return;
    setForm((prev) => ({
      ...prev,
      type: defaultType,
      amount: 0,
      note: "",
      trxDateTime: new Date().toISOString().slice(0, 16),
      categoryId:
        categories.find((c) => c.type === defaultType)?.id ||
        categories[0]?.id ||
        0,
    }));
    setAmountInput("");
    setErrors({});
  }, [defaultType, isOpen, categories]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "amount") {
      const onlyDigits = value.replace(/[^0-9]/g, "");
      setAmountInput(onlyDigits);
      setForm((prev) => ({ ...prev, amount: Number(onlyDigits || 0) }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]:
          name === "categoryId" || name === "type" ? Number(value) : value,
      }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!currentWallet?.id) e.wallet = "Chưa chọn ví";
    if (!form.amount || form.amount <= 0) e.amount = "Số tiền phải > 0";
    if (!form.categoryId) e.categoryId = "Chọn danh mục";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!validate()) return;
    try {
      await createTransaction({
        accountId: currentWallet!.id,
        type: form.type,
        amount: form.amount,
        trxDate: new Date(form.trxDateTime).toISOString(),
        categoryId: form.categoryId,
        note: form.note,
      });
      toast.success("Tạo giao dịch thành công");
      onClose();
    } catch {
      toast.error("Không thể tạo giao dịch");
    }
  };

  const handleClose = () => {
    setForm({
      type: defaultType,
      amount: 0,
      trxDateTime: new Date().toISOString().slice(0, 16),
      categoryId: 0,
      note: "",
    });
    setAmountInput("");
    setErrors({});
    onClose();
  };

  const typeOptions = [
    { value: 0, label: "Thu nhập" },
    { value: 1, label: "Chi tiêu" },
  ];

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
              Thêm giao dịch
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày giờ
                </label>
                <input
                  type="datetime-local"
                  name="trxDateTime"
                  value={form.trxDateTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số tiền
              </label>
              <input
                type="text"
                name="amount"
                value={amountInput}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.amount ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="0"
                disabled={isLoading}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục
              </label>
              <div className="max-h-48 overflow-y-auto flex flex-wrap gap-2">
                {categories
                  .filter((c) => c.type === form.type)
                  .map((c) => {
                    const selected = form.categoryId === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() =>
                          setForm((prev) => ({ ...prev, categoryId: c.id }))
                        }
                        className={`px-3 py-1 rounded-full border text-sm flex items-center space-x-1 ${
                          selected
                            ? "bg-primary-100 border-primary-300 text-primary-800"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                        disabled={isLoading}
                        title={c.name}
                      >
                        <span>{c.icon}</span>
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                {categories.filter((c) => c.type === form.type).length ===
                  0 && (
                  <span className="text-sm text-gray-500">
                    Chưa có danh mục phù hợp
                  </span>
                )}
              </div>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              <input
                name="note"
                value={form.note}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ví dụ: Ăn sáng, lương, ..."
                disabled={isLoading}
              />
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

export default CreateTransactionModal;
