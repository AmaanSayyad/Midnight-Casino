"use client";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from 'react-redux';
import { setBalance, setLoading } from '@/store/balanceSlice';
import MidnightConnectWalletButton from "./MidnightConnectWalletButton";
import useWalletStatus from "@/hooks/useWalletStatus";
import WithdrawModal from "./WithdrawModal";
import LiveChat from "./LiveChat";
import { useNotification } from './NotificationSystem';
import {
  TREASURY_CONFIG,
  getTreasuryUnshieldedAddress,
  isValidMidnightUnshieldedAddress,
} from '../config/treasury';

const PLAY_BALANCE_KEY = 'playTnignt';

// Audit log only — real funds move via Lace makeTransfer
const UserBalanceSystem = {
  getBalance: async () => localStorage.getItem(PLAY_BALANCE_KEY) || localStorage.getItem('userBalance') || '0',

  deposit: async (userAddress, amount, transactionHash) => {
    try {
      console.log('Logging deposit:', { userAddress, amount, transactionHash });

      const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          amount,
          transactionHash: transactionHash || `lace-${Date.now()}`,
          currency: 'tNIGHT',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Deposit log failed');
      }
      
      // Don't update balance here - it's already updated in the main deposit function
      console.log('UserBalanceSystem deposit: API call successful, balance already updated');
      
      return result;
    } catch (error) {
      console.error('Deposit error:', error);
      throw error;
    }
  }
};

const parseAptAmount = (amount) => {
  // Mock parsing for demo
  return parseFloat(amount) / 100000000;
};

const ethereumClient = {
  waitForTransaction: async ({ transactionHash }) => {
    // Mock transaction wait for demo
    return new Promise(resolve => setTimeout(resolve, 1000));
  }
};

const CASINO_MODULE_ADDRESS = process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS || "0x0000000000000000000000000000000000000000";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userAddress, setUserAddress] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const notification = useNotification();
  const isDev = process.env.NODE_ENV === 'development';
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const dispatch = useDispatch();
  const { userBalance, isLoading: isLoadingBalance } = useSelector((state) => state.balance);
  const [walletNetworkName, setWalletNetworkName] = useState("");

  // User balance management
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("0");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const withdrawAbortRef = useRef(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);


  // Lace only — no wagmi/Temple/MetaMask auto-connect
  const laceWallet = useWalletStatus();
  const isConnected = !!laceWallet.isConnected;
  const address = laceWallet.address;
  const isWalletReady = !!(laceWallet.isConnected && laceWallet.address);
  const chainId = laceWallet.networkId;
  const walletClient = null;
  const isSmartAccount = false;
  const laceTnignt = laceWallet.tnightBalance || '0';
  const refreshLaceBalances = laceWallet.refreshBalances;
  const transferTnignt = laceWallet.transferTnignt;
  const connectedWalletName = laceWallet.walletName || '1AM';
  const treasuryAddr = getTreasuryUnshieldedAddress();
  const hasTreasury = isValidMidnightUnshieldedAddress(treasuryAddr);

  // Debug wallet connection
  useEffect(() => {
    console.log('🔗 Wallet connection state:', {
      isConnected,
      address,
      chainId,
      laceTnignt,
      hasTreasury,
    });
  }, [isConnected, address, chainId, laceTnignt, hasTreasury]);

  // Keep play balance across wallet reconnect (do not reset to deposit / wallet tNIGHT)
  useEffect(() => {
    const restorePlay = () => {
      const saved =
        localStorage.getItem(PLAY_BALANCE_KEY) ||
        localStorage.getItem('userBalance');
      if (saved != null && !isNaN(saved) && parseFloat(saved) >= 0) {
        dispatch(setBalance(saved));
      }
    };
    const onConnected = () => restorePlay();
    const onBalances = () => {
      // Only sync wallet→play when there is no treasury (sync-only mode)
      if (!hasTreasury) {
        // leave existing listener behavior below via separate path
      }
    };
    window.addEventListener('midnight-lace-connected', onConnected);
    window.addEventListener('midnight-lace-balances', onBalances);
    return () => {
      window.removeEventListener('midnight-lace-connected', onConnected);
      window.removeEventListener('midnight-lace-balances', onBalances);
    };
  }, [dispatch, hasTreasury]);

  // Sync play from wallet only when treasury is NOT configured (legacy sync mode)
  useEffect(() => {
    if (hasTreasury) return undefined;
    const applyLaceTnignt = (tnight) => {
      if (tnight == null) return;
      dispatch(setBalance(tnight));
      localStorage.setItem('userBalance', tnight);
      localStorage.setItem(PLAY_BALANCE_KEY, tnight);
    };
    const onConnected = (e) => applyLaceTnignt(e?.detail?.tnight);
    const onBalances = (e) => applyLaceTnignt(e?.detail?.tnight);
    window.addEventListener('midnight-lace-connected', onConnected);
    window.addEventListener('midnight-lace-balances', onBalances);
    return () => {
      window.removeEventListener('midnight-lace-connected', onConnected);
      window.removeEventListener('midnight-lace-balances', onBalances);
    };
  }, [dispatch, hasTreasury]);

  const loadUserBalance = async () => {
    if (!address) return;
    try {
      dispatch(setLoading(true));
      if (refreshLaceBalances) {
        const balances = await refreshLaceBalances();
        if (!hasTreasury && balances?.tnight != null) {
          dispatch(setBalance(balances.tnight));
          localStorage.setItem('userBalance', balances.tnight);
          localStorage.setItem(PLAY_BALANCE_KEY, balances.tnight);
          return;
        }
      }
      const saved = localStorage.getItem(PLAY_BALANCE_KEY) || localStorage.getItem('userBalance') || '0';
      dispatch(setBalance(saved));
    } catch (error) {
      console.error('Error loading tNIGHT balance:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Load balance when Lace connects
  useEffect(() => {
    if (isWalletReady && address) {
      loadUserBalance();
    }
  }, [isWalletReady, address]);
  
  // Load deposit history


  // Check if wallet was previously connected on page load
  useEffect(() => {
    const checkWalletConnection = async () => {
      // Check if wallet was previously connected
      const wasConnected = localStorage.getItem('wagmi.connected');
      if (wasConnected === 'true') {
        console.log('🔄 Wallet was previously connected, restoring balance...');
        
        // Restore balance from localStorage
        const savedBalance = localStorage.getItem('userBalance');
        if (savedBalance) {
          console.log('💰 Restoring balance from localStorage:', savedBalance);
          dispatch(setBalance(parseFloat(savedBalance)));
        }
      }
    };
    
    checkWalletConnection();
  }, [dispatch]);

  useEffect(() => {
    setIsClient(true);
    if (isDev) {
      setUserAddress('0x1234...dev');
    }
  }, [isDev]);

  // Close balance modal with ESC
  useEffect(() => {
    if (!showBalanceModal) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowBalanceModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showBalanceModal]);
  
  // Poll for balance changes
  const pollForBalance = async (initialBalance, attempts = 10, interval = 2000) => {
    dispatch(setLoading(true));
    for (let i = 0; i < attempts; i++) {
      try {
        const newBalance = await UserBalanceSystem.getBalance(address);
        if (newBalance !== initialBalance) {
          dispatch(setBalance(newBalance));
          notification.success('Balance updated successfully!');
          dispatch(setLoading(false));
          return;
        }
      } catch (error) {
        console.error(`Polling attempt ${i + 1} failed:`, error);
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    notification.error('Balance update timed out. Please refresh manually.');
    dispatch(setLoading(false));
  };

  const cancelWithdraw = () => {
    withdrawAbortRef.current?.abort();
    withdrawAbortRef.current = null;
    setIsWithdrawing(false);
    notification.error('Withdraw cancelled. If the server was still proving, wait a moment before retrying.');
  };

  // On-chain house → player payout via treasury seed (MIDNIGHT_TREASURY_SEED)
  const handleWithdraw = async () => {
    if (isWithdrawing) return;
    if (!isConnected || !address) {
      notification.error('Connect 1AM first');
      return;
    }
    if (!hasTreasury) {
      notification.error('Treasury address not configured');
      return;
    }

    const play = parseFloat(userBalance || '0');
    let amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      amount = play;
    }
    if (!amount || amount <= 0) {
      notification.error('No play balance to withdraw');
      return;
    }
    if (amount > play + 1e-12) {
      notification.error(`Play balance is only ${play} tNIGHT`);
      return;
    }
    // Hard cap matches API MAX_WITHDRAW; play chips can exceed on-chain treasury
    if (amount > 100) {
      notification.error('Max on-chain withdraw is 100 tNIGHT per request');
      return;
    }

    const controller = new AbortController();
    withdrawAbortRef.current = controller;
    setIsWithdrawing(true);
    try {
      notification.success('Withdraw started — syncing treasury / proving (~1 min)…');
      const res = await fetch('/api/midnight-withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: address, amount }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Withdraw failed');
      }

      const next = Math.max(0, play - amount).toFixed(6);
      dispatch(setBalance(next));
      localStorage.setItem(PLAY_BALANCE_KEY, next);
      localStorage.setItem('userBalance', next);
      setWithdrawAmount('');
      notification.success(
        `On-chain withdraw: ${amount} tNIGHT sent to your 1AM wallet${data.txId ? ` (${String(data.txId).slice(0, 18)}…)` : ''}.`,
      );
      try {
        await refreshLaceBalances?.();
      } catch {
        // ignore
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      notification.error(`Withdraw failed: ${error?.message || 'Unknown error'}`);
    } finally {
      if (withdrawAbortRef.current === controller) {
        withdrawAbortRef.current = null;
      }
      setIsWithdrawing(false);
    }
  };

  // Real Lace makeTransfer of tNIGHT → treasury (when configured).
  // Without treasury: sync play balance from Lace wallet tNIGHT.
  const handleDeposit = async () => {
    if (isDepositing) return;

    if (!isConnected || !address) {
      notification.error('Connect 1AM first');
      return;
    }

    if (!hasTreasury) {
      try {
        setIsDepositing(true);
        const balances = await refreshLaceBalances();
        const tnight = balances?.tnight || laceTnignt || '0';
        dispatch(setBalance(tnight));
        localStorage.setItem('userBalance', tnight);
        localStorage.setItem(PLAY_BALANCE_KEY, tnight);
        notification.success(`Synced play balance from ${connectedWalletName}: ${tnight} tNIGHT`);
        setDepositAmount('');
      } catch (error) {
        notification.error(error?.message || 'Failed to sync wallet tNIGHT');
      } finally {
        setIsDepositing(false);
      }
      return;
    }

    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      notification.error('Enter a valid tNIGHT amount');
      return;
    }

    if (amount < TREASURY_CONFIG.LIMITS.MIN_DEPOSIT) {
      notification.error(`Minimum deposit is ${TREASURY_CONFIG.LIMITS.MIN_DEPOSIT} tNIGHT`);
      return;
    }

    if (amount > TREASURY_CONFIG.LIMITS.MAX_DEPOSIT) {
      notification.error(`Maximum deposit is ${TREASURY_CONFIG.LIMITS.MAX_DEPOSIT} tNIGHT`);
      return;
    }

    setIsDepositing(true);
    try {
      await transferTnignt(treasuryAddr, amount);
      const next = (parseFloat(userBalance || '0') + amount).toFixed(6);
      dispatch(setBalance(next));
      localStorage.setItem(PLAY_BALANCE_KEY, next);
      localStorage.setItem('userBalance', next);

      try {
        await UserBalanceSystem.deposit(address, amount, `lace-transfer-${Date.now()}`);
      } catch (apiError) {
        console.warn('Deposit API log skipped:', apiError);
      }

      notification.success(
        `On-chain: sent ${amount} tNIGHT to house. Play balance credited. Approve was in ${connectedWalletName}.`,
      );
      setDepositAmount('');
    } catch (error) {
      notification.error(`Deposit failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsDepositing(false);
    }
  };

  /** Unblock play when faucet tNIGHT is stuck Pending / tDUST empty — uses Lace-reported balance. */
  const handlePlayFromLaceBalance = async () => {
    if (!isConnected) {
      notification.error('Connect 1AM first');
      return;
    }
    try {
      setIsDepositing(true);
      const balances = await refreshLaceBalances();
      const tnight = balances?.tnight || laceTnignt || '0';
      if (parseFloat(tnight) <= 0) {
        notification.error(
          'Wallet still reports 0 spendable. Open https://faucet.preview.midnight.network with your mn_addr_preview… address, then resync in 1AM.',
        );
        return;
      }
      dispatch(setBalance(tnight));
      localStorage.setItem('userBalance', tnight);
      localStorage.setItem(PLAY_BALANCE_KEY, tnight);
      notification.success(
        `Play credited ${tnight} tNIGHT from wallet balance (faucet may still show Pending — on-chain send needs confirmed tNIGHT + tDUST).`,
      );
    } catch (e) {
      notification.error(e?.message || 'Could not read wallet balance');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleProfileClick = () => {
    router.push("/profile");
  };

  const navLinks = [
    {
      name: "Home",
      path: "/",
      classes: "text-hover-gradient-home",
    },
    {
      name: "Game",
      path: "/game",
      classes: "text-hover-gradient-game",
    },
    {
      name: "Live",
      path: "/live",
      classes: "text-hover-gradient-live",
    },
    {
      name: "Bank",
      path: "/bank",
      classes: "text-hover-gradient-bank",
    },
  ];

  // Midnight entropy handles randomness generation

  return (
    <>
      <nav className="backdrop-blur-md bg-midnight-black/95 fixed w-full z-20 transition-all duration-300 shadow-lg shadow-midnight-blue/10">
        <div className="flex w-full items-center justify-between py-6 px-4 sm:px-10 md:px-20 lg:px-36">
          <div className="flex items-center">
            <a href="/" className="logo mr-6">
            <Image
              src="/brand/midnight-logo-horizontal-white.svg"
              alt="Midnight logo"
              width={180}
              height={24}
              />
            </a>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden text-white p-1 rounded-lg hover:bg-midnight-blue/20 transition-colors"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle mobile menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {showMobileMenu ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
          </div>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex font-display gap-8 lg:gap-12 items-center">
            {navLinks.map(({ name, path, classes }, index) => (
              <div key={index} className="relative group">
              <Link
                  className={`${path === pathname ? "text-transparent bg-clip-text bg-gradient-to-r from-red-magic to-blue-magic font-semibold" : classes} flex items-center gap-1 text-lg font-medium transition-all duration-200 hover:scale-105`}
                href={path}
              >
                {name}
              </Link>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            

            
            {/* User Balance Display */}
            {isWalletReady && (
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-green-900/20 to-green-800/10 rounded-lg border border-green-800/30 px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-300">Balance:</span>
                    <span className="text-sm text-green-300 font-medium">
                      {isLoadingBalance ? 'Loading...' : `${parseFloat(userBalance || '0').toFixed(5)} tNIGHT`}
                    </span>
                    <button
                      onClick={() => setShowBalanceModal(true)}
                      className="ml-2 text-xs bg-green-600/30 hover:bg-green-500/30 text-green-300 px-2 py-1 rounded transition-colors"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Midnight wallet status badge */}
            {isConnected && (
              <div className="px-3 py-2 bg-gradient-to-r from-violet-500/20 to-purple-600/20 border border-violet-500/30 text-violet-200 font-medium rounded-lg text-sm">
                {connectedWalletName}
              </div>
            )}
            
            {/* Live Chat Button */}
            <button
              onClick={() => setShowLiveChat(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-700/90 to-blue-800/80 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg border border-blue-600/30 transition-all duration-200 hover:scale-105 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Live Chat
            </button>
            
            {/* Midnight Wallet Button */}
            <MidnightConnectWalletButton />
      
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-midnight-black/95 backdrop-blur-md p-4 border-t border-midnight-blue/20 animate-slideDown">
            <div className="flex flex-col space-y-3">
              {navLinks.map(({ name, path, classes }, index) => (
                <div key={index}>
                  <Link
                    className={`${path === pathname ? 'text-white font-semibold' : 'text-white/80'} py-2 px-3 rounded-md hover:bg-midnight-blue/10 flex items-center w-full text-lg`}
                    href={path}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {name}
                  </Link>
                </div>
              ))}
              {/* Switch to Testnet button removed */}
              
              {/* User Balance in Mobile Menu */}
              {isWalletReady && (
                <div className="pt-2 mt-2 border-t border-midnight-blue/10">
                  <div className="p-3 bg-gradient-to-r from-green-900/20 to-green-800/10 rounded-lg border border-green-800/30">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">House Balance:</span>
                      <span className="text-sm text-green-300 font-medium">
                      {isLoadingBalance ? 'Loading...' : `${parseFloat(userBalance || '0').toFixed(5)} tNIGHT`}
                    </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowBalanceModal(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-xs bg-green-600/30 hover:bg-green-500/30 text-green-300 px-3 py-2 rounded transition-colors"
                    >
                      Manage Balance
                    </button>
                  </div>
                </div>
              )}
              
              <div className="pt-2 mt-2 border-t border-midnight-blue/10">
                <a 
                  href="#support" 
                  className="block py-2 px-3 text-white/80 hover:text-white hover:bg-midnight-blue/10 rounded-md"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Support
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* Balance Management Modal (portal) */}
        {isClient && showBalanceModal && createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBalanceModal(false)}
          >
            <div
              className="bg-midnight-black border border-midnight-blue/20 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">tNIGHT Balance</h3>
                <button
                  onClick={() => setShowBalanceModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Current Balance */}
              <div className="mb-4 p-3 bg-gradient-to-r from-green-900/20 to-green-800/10 rounded-lg border border-green-800/30">
                <span className="text-sm text-gray-300">Play balance:</span>
                <div className="text-lg text-green-300 font-bold">
                  {isLoadingBalance ? 'Loading...' : `${parseFloat(userBalance || '0').toFixed(5)} tNIGHT`}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {connectedWalletName}: {parseFloat(laceTnignt || '0').toFixed(5)} tNIGHT
                </div>
              </div>
              
              {/* Deposit Section */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-white mb-2">
                  {hasTreasury ? 'Deposit tNIGHT (on-chain via wallet)' : 'Sync tNIGHT from wallet'}
                </h4>
                <div className="text-xs text-gray-400 mb-2">
                  {hasTreasury
                    ? 'Sends real unshielded tNIGHT to the house treasury with makeTransfer + submitTransaction (1AM / DApp Connector).'
                    : 'No treasury address configured — syncs play balance from your wallet tNIGHT (faucet funds). Set NEXT_PUBLIC_MIDNIGHT_TREASURY_UNSHIELDED for on-chain deposits.'}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder={hasTreasury ? 'Enter tNIGHT amount' : 'Optional — click Sync'}
                    className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded text-white placeholder-gray-400 focus:outline-none focus:border-midnight-blue/50 focus:ring-1 focus:ring-midnight-blue/25"
                    min="0"
                    step="0.000001"
                    disabled={isDepositing || !hasTreasury}
                  />
                  <button
                    onClick={handleDeposit}
                    disabled={
                      !isConnected ||
                      isDepositing ||
                      (hasTreasury && (!depositAmount || parseFloat(depositAmount) <= 0))
                    }
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded border border-violet-500/30 font-medium transition-colors flex items-center gap-2"
                  >
                    {isDepositing ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
                        {hasTreasury ? 'Confirm in wallet…' : 'Syncing…'}
                      </>
                    ) : hasTreasury ? (
                      <>Deposit tNIGHT</>
                    ) : (
                      <>Sync from wallet</>
                    )}
                  </button>
                  {isDepositing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDepositing(false);
                        notification.error(
                          'Deposit cancelled. If the wallet never opened: wait until tNIGHT is not Pending, Generate tDUST, set proof server http://127.0.0.1:6300, then retry.',
                        );
                      }}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <p className="text-xs text-amber-300/90 mt-2">
                  1AM uses dust sponsorship. If you see “Dust Sponsorship Failed / transaction already pending”: wait for Activity to clear, tap YOUR DUST, then retry. If Activity already shows Sent SUCCESS, use Unblock below — play balance may still be 0.
                </p>
                <button
                  type="button"
                  onClick={handlePlayFromLaceBalance}
                  disabled={!isConnected || isDepositing}
                  className="mt-2 w-full px-3 py-2 text-sm rounded border border-amber-500/40 bg-amber-900/20 hover:bg-amber-800/30 text-amber-100 disabled:opacity-50"
                >
                  Unblock play — credit from wallet balance (skip on-chain)
                </button>
                <a
                  href="https://faucet.preview.midnight.network/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-center text-xs text-violet-300 hover:text-violet-200 underline"
                >
                  Open Preview faucet (mn_addr_preview… only)
                </a>
                <p className="text-xs text-gray-400 mt-1">
                  Currency: tNIGHT (Midnight preview) — not MetaMask
                </p>
                {/* Quick Deposit Buttons */}
                {hasTreasury && (
                <div className="flex gap-1 mt-2">
                  {[0.001, 0.01, 0.1, 1].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount.toString())}
                      className="flex-1 px-2 py-1 text-xs bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded transition-colors"
                      disabled={isDepositing}
                    >
                      {amount} tNIGHT
                    </button>
                  ))}
                </div>
                )}
                
              </div>

              {/* Withdraw Section */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-white mb-2">Withdraw tNIGHT (on-chain)</h4>
                <div className="text-xs text-gray-400 mb-2">
                  Sends from house treasury → your 1AM address. Needs{' '}
                  <code className="text-white/70">MIDNIGHT_TREASURY_SEED</code> +{' '}
                  <code className="text-white/70">npm run proof:up</code>. Leave amount empty to withdraw all play balance.
                </div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Amount (max 100)"
                    className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded text-white placeholder-gray-400 focus:outline-none focus:border-midnight-blue/50"
                    min="0"
                    max="100"
                    step="0.000001"
                    disabled={isWithdrawing}
                  />
                  {isWithdrawing ? (
                    <button
                      type="button"
                      onClick={cancelWithdraw}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={handleWithdraw}
                      disabled={!isConnected || parseFloat(userBalance || '0') <= 0}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isConnected
                        ? parseFloat(userBalance || '0') > 0
                          ? 'Withdraw'
                          : 'No Balance'
                        : 'Connect 1AM'}
                    </button>
                  )}
                </div>
                {isWithdrawing && (
                  <p className="text-xs text-amber-300/90 mt-1 text-center flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin w-3 h-3 border-2 border-amber-300/30 border-t-amber-300 rounded-full" />
                    Syncing / proving… if this fails, treasury tDUST may still be generating — wait a few minutes.
                  </p>
                )}
                {!isWithdrawing && (
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    Pays from on-chain treasury (not full play chips). First withdraw after funding may need treasury tDUST.
                  </p>
                )}
              </div>
              
              {/* Refresh Balance */}
              <div className="mt-6">
                <button
                  onClick={() => loadUserBalance()}
                  className="w-full px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded font-medium transition-colors"
                >
                  Refresh from wallet
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
        
        <div className="w-full h-[2px] magic-gradient overflow-hidden"></div>
      </nav>
      
      {/* Midnight entropy handles randomness generation */}
      
      {/* Live Chat Modal */}
      <LiveChat
        open={showLiveChat}
        onClose={() => setShowLiveChat(false)}
      />
      
    </>
  );
}