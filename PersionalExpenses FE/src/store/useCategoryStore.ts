import { create } from "zustand";
import axiosInstance from "../utils/axiosInstance";
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "../types/category";

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

interface CategoryActions {
  fetchCategories: () => Promise<void>;
  createCategory: (data: CreateCategoryRequest) => Promise<Category>;
  updateCategory: (
    id: number,
    data: UpdateCategoryRequest
  ) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  clearError: () => void;
}

type CategoryStore = CategoryState & CategoryActions;

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get("/Categories");
      const raw = res.data?.data ?? res.data ?? [];
      const categories: Category[] = (Array.isArray(raw) ? raw : []).map(
        (c: any) => ({
          id: Number(c.id),
          name: String(c.name),
          type: Number(c.type ?? 0),
          parentId: c.parentId ?? null,
          color: String(c.color ?? "#9ca3af"),
          icon: String(c.icon ?? "•"),
          isActive: Boolean(c.isActive ?? true),
          isDefault: Boolean(c.isDefault ?? false),
        })
      );
      set({ categories, isLoading: false, error: null });
    } catch (error: unknown) {
      set({
        categories: [],
        isLoading: false,
        error:
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message || "Không thể tải danh mục",
      });
    }
  },

  createCategory: async (data: CreateCategoryRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.post("/Categories", data);
      const c: any = res.data?.data ?? res.data;
      const created: Category = {
        id: Number(c.id),
        name: String(c.name ?? data.name),
        type: Number(c.type ?? data.type),
        parentId: c.parentId ?? null,
        color: String(c.color ?? data.color ?? "#9ca3af"),
        icon: String(c.icon ?? data.icon ?? "•"),
        isActive: Boolean(c.isActive ?? true),
        isDefault: Boolean(c.isDefault ?? false),
      };
      set((prev) => ({
        categories: [...prev.categories, created],
        isLoading: false,
        error: null,
      }));
      return created;
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message || "Không thể tạo danh mục",
      });
      throw error;
    }
  },

  updateCategory: async (id: number, data: UpdateCategoryRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.put(`/Categories/${id}`, data);
      const c: any = res.data?.data ?? res.data;
      const updated: Category = {
        id: Number(c.id ?? id),
        name: String(c.name ?? data.name ?? ""),
        type: Number(c.type ?? data.type ?? 0),
        parentId: c.parentId ?? null,
        color: String(c.color ?? (data as any).color ?? "#9ca3af"),
        icon: String(c.icon ?? (data as any).icon ?? "•"),
        isActive: Boolean(c.isActive ?? true),
        isDefault: Boolean(c.isDefault ?? false),
      };
      set((prev) => ({
        categories: prev.categories.map((x) => (x.id === id ? updated : x)),
        isLoading: false,
        error: null,
      }));
      return updated;
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message || "Không thể cập nhật danh mục",
      });
      throw error;
    }
  },

  deleteCategory: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/Categories/${id}`);
      set((prev) => ({
        categories: prev.categories.filter((x) => x.id !== id),
        isLoading: false,
        error: null,
      }));
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message || "Không thể xóa danh mục",
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
