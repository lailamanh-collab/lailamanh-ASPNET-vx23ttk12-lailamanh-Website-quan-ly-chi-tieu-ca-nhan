import { create } from "zustand";
import { persist } from "zustand/middleware";
import axiosInstance from "../utils/axiosInstance";

// User interface
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth actions interface
interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (
    oldPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ) => Promise<{ code: number; message: string; data: any }>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  clearError: () => void;
}

// Combined auth store type
type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await axiosInstance.post("/Auth/login", {
            email,
            password,
          });

          const {
            accessToken,
            userId,
            email: userEmail,
            role,
            name,
            imgUrl,
          } = response.data.data;
          // Create user object from API response
          const user: User = {
            id: userId,
            email: userEmail,
            name: name,
            role: role,
            avatar: imgUrl,
          };

          // Store token in localStorage for axios interceptor
          localStorage.setItem("authToken", accessToken);

          set({
            user,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || "Đăng nhập thất bại",
          });
          throw error;
        }
      },

      // Register action
      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await axiosInstance.post("/Auth/register", {
            name,
            email,
            password,
          });

          const {
            accessToken,
            userId,
            email: userEmail,
            role,
            name: userName,
          } = response.data;

          // Create user object from API response
          const user: User = {
            id: userId,
            email: userEmail,
            name: userName,
            role: role,
          };

          // Store token in localStorage for axios interceptor
          localStorage.setItem("authToken", accessToken);

          set({
            user,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || "Đăng ký thất bại",
          });
          throw error;
        }
      },

      // Logout action
      logout: () => {
        // Clear localStorage
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // Update profile action
      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });

        try {
          // Backend endpoint expects { name, imgUrl }
          const payload = {
            name: data.name,
            imgUrl: (data as any).imgUrl ?? data.avatar,
          };
          const response = await axiosInstance.put("/Auth/me/profile", payload);

          const {
            accessToken,
            userId,
            email: userEmail,
            role,
            name,
            imgUrl,
          } = response.data?.data || {};

          // Persist new token if backend rotated it
          if (accessToken) {
            localStorage.setItem("authToken", accessToken);
          }

          const updatedUser: User = {
            id: userId ?? get().user?.id ?? 0,
            email: userEmail ?? data.email ?? get().user?.email ?? "",
            name: name ?? data.name ?? get().user?.name ?? "",
            role: role ?? get().user?.role ?? "User",
            avatar: imgUrl ?? get().user?.avatar,
            createdAt: get().user?.createdAt,
            updatedAt: new Date().toISOString(),
          };

          set({
            user: updatedUser,
            token: accessToken ?? get().token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error:
              error.response?.data?.message || "Cập nhật thông tin thất bại",
          });
          throw error;
        }
      },

      // Change password action
      changePassword: async (
        oldPassword: string,
        newPassword: string,
        confirmNewPassword: string
      ) => {
        set({ isLoading: true, error: null });

        try {
          const response = await axiosInstance.put("/Auth/me/password", {
            oldPassword,
            newPassword,
            confirmNewPassword,
          });

          set({
            isLoading: false,
            error: null,
          });

          return response.data;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || "Đổi mật khẩu thất bại",
          });
          throw error;
        }
      },

      // Role checking helpers
      hasRole: (role: string) => {
        const { user } = get();
        return user?.role === role;
      },

      hasAnyRole: (roles: string[]) => {
        const { user } = get();
        return user ? roles.includes(user.role) : false;
      },

      // Clear error action
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage", // unique name for localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
