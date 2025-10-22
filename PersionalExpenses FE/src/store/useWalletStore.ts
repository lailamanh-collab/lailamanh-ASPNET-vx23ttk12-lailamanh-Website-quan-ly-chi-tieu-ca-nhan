import { create } from "zustand";
import { persist } from "zustand/middleware";
import axiosInstance from "../utils/axiosInstance";
import type {
  Wallet,
  CreateWalletRequest,
  UpdateWalletRequest,
} from "../types/wallet";
type ApiWallet = {
  id?: number;
  name?: string;
  type?: number | string;
  currency?: string;
  balance?: number;
  initialBalance?: number;
  isActive?: boolean;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
};

function toWallet(w: ApiWallet): Wallet {
  const createdAt = w.createdAt ?? new Date().toISOString();
  return {
    id: Number(w.id ?? 0),
    name: String(w.name ?? ""),
    type: String((w.type as string) ?? "cá nhân"),
    currency: String(w.currency ?? "VND"),
    balance: Number((w.balance ?? w.initialBalance ?? 0) as number),
    initialBalance: Number((w.initialBalance ?? w.balance ?? 0) as number),
    isActive: Boolean(w.isActive ?? false),
    userId: Number(w.userId ?? 0),
    createdAt,
    updatedAt: w.updatedAt ?? createdAt,
  };
}

// Wallet state interface
interface WalletState {
  wallets: Wallet[];
  currentWallet: Wallet | null;
  isLoading: boolean;
  error: string | null;
}

// Wallet actions interface
interface WalletActions {
  // Fetch operations
  fetchWallets: () => Promise<void>;
  setCurrentWallet: (wallet: Wallet) => void;

  // CRUD operations
  createWallet: (data: CreateWalletRequest) => Promise<Wallet>;
  updateWallet: (id: number, data: UpdateWalletRequest) => Promise<Wallet>;
  deleteWallet: (id: number) => Promise<void>;

  // Utility functions
  getWalletById: (id: number) => Wallet | undefined;
  clearError: () => void;
}

// Combined wallet store type
type WalletStore = WalletState & WalletActions;

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      // Initial state
      wallets: [],
      currentWallet: null,
      isLoading: false,
      error: null,

      // Fetch all wallets for the current user
      fetchWallets: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await axiosInstance.get("/Accounts");
          const raw = response.data?.data ?? response.data ?? [];
          const wallets: Wallet[] = (Array.isArray(raw) ? raw : []).map(
            (w: ApiWallet) => toWallet(w)
          );

          set({ wallets, isLoading: false, error: null });

          // Reconcile currentWallet with fetched list (handles new account, logout/login, cross-user)
          const { currentWallet } = get();
          if (wallets.length === 0) {
            set({ currentWallet: null });
            return;
          }
          const match = currentWallet
            ? wallets.find((w) => w.id === currentWallet.id)
            : undefined;
          if (!match) {
            const firstActive = wallets.find((w) => w.isActive) || null;
            set({ currentWallet: firstActive });
          } else if (!match.isActive) {
            const firstActive = wallets.find((w) => w.isActive) || null;
            set({ currentWallet: firstActive });
          }
        } catch (error: unknown) {
          set({
            wallets: [],
            isLoading: false,
            error:
              (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message || "Không thể tải danh sách ví",
          });
        }
      },

      // Set current wallet
      setCurrentWallet: (wallet: Wallet) => {
        if (!wallet.isActive) {
          return; // do not allow selecting inactive wallet
        }
        set({ currentWallet: wallet });
      },

      // Create new wallet
      createWallet: async (data: CreateWalletRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await axiosInstance.post("/Accounts", data);
          const w: ApiWallet = response.data?.data ?? response.data;
          const newWallet: Wallet = toWallet({
            ...w,
            currency: w.currency ?? data.currency,
            initialBalance: w.initialBalance ?? data.initialBalance,
            type: (w.type as string) ?? data.type,
          });

          const { wallets } = get();
          set({
            wallets: [...wallets, newWallet],
            isLoading: false,
            error: null,
          });

          return newWallet;
        } catch (error: unknown) {
          set({
            isLoading: false,
            error:
              (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message || "Không thể tạo ví mới",
          });
          throw error;
        }
      },

      // Update wallet
      updateWallet: async (id: number, data: UpdateWalletRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await axiosInstance.put(`/Accounts/${id}`, data);
          const w: ApiWallet = response.data?.data ?? response.data;
          const updatedWallet: Wallet = toWallet({
            id,
            ...w,
            name: w.name ?? data.name,
            type: (w.type as string) ?? data.type,
            currency: w.currency ?? data.currency,
          });

          const { wallets, currentWallet } = get();
          const updatedWallets = wallets.map((wallet) =>
            wallet.id === id ? updatedWallet : wallet
          );

          let nextCurrent = currentWallet;
          if (currentWallet?.id === id) {
            nextCurrent = updatedWallet.isActive
              ? updatedWallet
              : updatedWallets.find((w) => w.isActive) || null;
          }

          set({
            wallets: updatedWallets,
            currentWallet: nextCurrent,
            isLoading: false,
            error: null,
          });

          return updatedWallet;
        } catch (error: unknown) {
          set({
            isLoading: false,
            error:
              (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message || "Không thể cập nhật ví",
          });
          throw error;
        }
      },

      // Delete wallet
      deleteWallet: async (id: number) => {
        set({ isLoading: true, error: null });

        try {
          await axiosInstance.delete(`/Accounts/${id}`);

          const { wallets, currentWallet } = get();
          const filteredWallets = wallets.filter((wallet) => wallet.id !== id);

          set({
            wallets: filteredWallets,
            currentWallet:
              currentWallet?.id === id
                ? filteredWallets.length > 0
                  ? filteredWallets[0]
                  : null
                : currentWallet,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          set({
            isLoading: false,
            error:
              (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message || "Không thể xóa ví",
          });
          throw error;
        }
      },

      // Get wallet by ID
      getWalletById: (id: number) => {
        const { wallets } = get();
        return wallets.find((wallet) => wallet.id === id);
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "wallet-storage",
      partialize: (state) => ({
        currentWallet: state.currentWallet,
      }),
    }
  )
);
