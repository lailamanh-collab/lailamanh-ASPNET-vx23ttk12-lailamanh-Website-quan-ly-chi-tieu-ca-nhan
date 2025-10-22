// Wallet types and interfaces
export interface Wallet {
  id: number;
  name: string;
  type: string; // API returns string (e.g., "cá nhân")
  currency: string;
  balance: number;
  initialBalance?: number;
  isActive?: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalletRequest {
  name: string;
  type: string; // string type per API
  currency: string;
  initialBalance: number;
}

export interface UpdateWalletRequest {
  name?: string;
  type?: string; // string type per API
  currency?: string;
}

export const WALLET_TYPE_OPTIONS = [
  { value: "cá nhân", label: "Cá nhân" },
  { value: "gia đình", label: "Gia đình" },
  { value: "kinh doanh", label: "Kinh doanh" },
  { value: "tiết kiệm", label: "Tiết kiệm" },
  { value: "đầu tư", label: "Đầu tư" },
];

export function getWalletTypeColor(type: string): string {
  const key = type.trim().toLowerCase();
  switch (key) {
    case "cá nhân":
      return "bg-blue-500";
    case "gia đình":
      return "bg-green-500";
    case "kinh doanh":
      return "bg-purple-500";
    case "tiết kiệm":
      return "bg-yellow-500";
    case "đầu tư":
      return "bg-indigo-500";
    default:
      return "bg-gray-500";
  }
}

// Currency options
export const CURRENCY_OPTIONS = [
  { value: "VND", label: "Việt Nam Đồng (₫)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
];
