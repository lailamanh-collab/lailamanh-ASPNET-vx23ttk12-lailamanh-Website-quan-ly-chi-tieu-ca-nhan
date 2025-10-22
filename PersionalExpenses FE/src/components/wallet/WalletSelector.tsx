import React, { useState } from "react";
import { useWalletStore } from "../../store/useWalletStore";
import { getWalletTypeColor } from "../../types/wallet";

interface WalletSelectorProps {
  className?: string;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({ className = "" }) => {
  const { wallets, currentWallet, setCurrentWallet, isLoading } =
    useWalletStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleWalletSelect = (wallet: any) => {
    if (!wallet.isActive) return;
    setCurrentWallet(wallet);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-lg h-12 w-48"></div>
      </div>
    );
  }

  if (wallets.length === 0 || !wallets.some((w) => w.isActive)) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg select-none cursor-not-allowed">
          <div className="w-6 h-6 bg-gray-300 rounded-full" />
          <span className="text-sm font-medium">Chưa có ví đang hoạt động</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Current Wallet Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors shadow-sm"
      >
        {currentWallet && (
          <>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${getWalletTypeColor(
                currentWallet.type
              )}`}
            >
              <span className="text-white text-sm font-semibold">
                {currentWallet.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">
                {currentWallet.name}
              </p>
              <p className="text-xs text-gray-500">
                {currentWallet.type} • {currentWallet.currency}
              </p>
            </div>
          </>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto min-w-[360px]">
          <div className="p-2">
            <p className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Chọn ví ({wallets.length})
            </p>
          </div>

          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleWalletSelect(wallet)}
              className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${
                currentWallet?.id === wallet.id
                  ? "bg-primary-50 border-l-4 border-primary-500"
                  : "hover:bg-gray-50"
              }`}
              disabled={!wallet.isActive}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${getWalletTypeColor(
                  wallet.type
                )}`}
              >
                <span className="text-white text-sm font-semibold">
                  {wallet.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">
                  {wallet.name}
                </p>
                <p className="text-xs text-gray-500">
                  {wallet.type} • {wallet.currency}
                </p>
                <p className="text-xs text-gray-400">
                  Số dư:{" "}
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: wallet.currency,
                  }).format(wallet.balance)}
                </p>
              </div>
              {!wallet.isActive && (
                <span className="text-xs text-gray-400">(không hoạt động)</span>
              )}
              {currentWallet?.id === wallet.id && (
                <svg
                  className="w-4 h-4 text-primary-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default WalletSelector;
