"use client";
import React from 'react';
import { useGlobalWalletPersistence } from '@/hooks/useGlobalWalletPersistence';

/**
 * Wallet Connection Guard
 * Ensures wallet stays connected across page navigations
 */
export default function WalletConnectionGuard({ children }) {
  const { isReconnecting } = useGlobalWalletPersistence();

  return (
    <>
      {children}
      {isReconnecting && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Reconnecting wallet...</span>
          </div>
        </div>
      )}
    </>
  );
}