import { create } from "zustand";
import axiosInstance from "../utils/axiosInstance";
import type {
  Transaction,
  CreateTransactionRequest,
} from "../types/transaction";

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

interface TransactionActions {
  fetchTransactions: (accountId?: number) => Promise<void>;
  createTransaction: (data: CreateTransactionRequest) => Promise<Transaction>;
  clearError: () => void;
}

type TransactionStore = TransactionState & TransactionActions;

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async (accountId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get("/Transactions", {
        params: accountId ? { accountId } : undefined,
      });
      const raw = res.data?.data ?? res.data ?? [];
      const txs: Transaction[] = (Array.isArray(raw) ? raw : []).map(
        (t: any) => ({
          id: Number(t.id),
          accountId: Number(t.accountId),
          type: Number(t.type),
          amount: Number(t.amount),
          trxDate: String(t.trxDate),
          categoryId: Number(t.categoryId),
          note: t.note ?? "",
          transferAccountId: t.transferAccountId ?? null,
          createdAt: t.createdAt,
        })
      );
      set({ transactions: txs, isLoading: false, error: null });
    } catch (error: unknown) {
      set({
        transactions: [],
        isLoading: false,
        error:
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message || "Không thể tải giao dịch",
      });
    }
  },

  createTransaction: async (data: CreateTransactionRequest) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        ...data,
        transferAccountId:
          data.transferAccountId === undefined ||
          data.transferAccountId === null
            ? data.accountId
            : data.transferAccountId,
      };
      const res = await axiosInstance.post("/Transactions", payload);
      const t: any = res.data?.data ?? res.data;
      const created: Transaction = {
        id: Number(t.id),
        accountId: Number(t.accountId),
        type: Number(t.type),
        amount: Number(t.amount),
        trxDate: String(t.trxDate),
        categoryId: Number(t.categoryId),
        note: t.note ?? "",
        transferAccountId: t.transferAccountId ?? null,
        createdAt: t.createdAt,
      };
      set((prev) => ({
        transactions: [created, ...prev.transactions],
        isLoading: false,
        error: null,
      }));
      return created;
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message || "Không thể tạo giao dịch",
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
