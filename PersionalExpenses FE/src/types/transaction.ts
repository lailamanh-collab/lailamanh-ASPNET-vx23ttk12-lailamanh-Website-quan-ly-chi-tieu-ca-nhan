export interface Transaction {
  id: number;
  accountId: number;
  type: number; // 0 income, 1 expense (assumption per API)
  amount: number;
  trxDate: string; // ISO string
  categoryId: number;
  note?: string;
  transferAccountId?: number | null;
  createdAt?: string;
}

export interface CreateTransactionRequest {
  accountId: number;
  type: number; // 0 income, 1 expense, 2 transfer? (server-defined)
  amount: number;
  trxDate: string; // ISO string
  categoryId: number;
  note?: string;
  transferAccountId?: number | null;
}
