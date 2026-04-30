"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

// Mock functions for demo purposes
const ethereumClient = {
  getAccountResources: async ({ accountAddress }) => {
    // Mock resources for demo
    return [
      {
        type: "0x1::coin::CoinStore<0x1::ethereum_coin::EthereumCoin>",
        data: { coin: { value: "1000000000000000000" } }
      }
    ];
  },
  waitForTransaction: async ({ transactionHash }) => {
    // Mock transaction wait for demo
    return new Promise(resolve => setTimeout(resolve, 1000));
  }
};

const CASINO_MODULE_ADDRESS = process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS || "0x0000000000000000000000000000000000000000";

const formatEthAmount = (amount) => {
  // Mock formatting for demo
  return (parseFloat(amount) / 100000000).toFixed(8);
};

const parseEthAmount = (amount) => {
  // Mock parsing for demo
  return (parseFloat(amount) * 100000000).toString();
};

const CasinoGames = {
  roulette: {
    placeBet: (betType, betValue, amount, numbers = []) => ({
      // Mock payload for demo
      betType,
      betValue,
      amount,
      numbers
    }),
    getGameState: async () => ({
      // Mock game state for demo
      isActive: false,
      currentRound: 1,
      lastResult: null
    })
  },
  mines: {
    startGame: (betAmount, minesCount, tilesToReveal) => ({
      // Mock payload for demo
      betAmount,
      minesCount,
      tilesToReveal
    }),
    revealTile: (gameId, tileIndex) => ({
      // Mock payload for demo
      gameId,
      tileIndex
    }),
    cashout: (gameId) => ({
      // Mock payload for demo
      gameId
    })
  },
  wheel: {
    spin: (betAmount, segments) => ({
      // Mock payload for demo
      betAmount,
      segments
    })
  }
};

export const useEthereumCasino = () => {
  const { address: account, isConnected: connected } = useAccount();
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update balance when wallet connects
  useEffect(() => {
    if (connected && account) {
      updateBalance();
    } else {
      setBalance('0');
    }
  }, [connected, account]);

  const updateBalance = async () => {
    if (!account) return;
    
    try {
      setLoading(true);
      const balance = await getAccountBalance(account);
      setBalance(formatEthAmount(balance));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get account balance
  const getAccountBalance = async (address) => {
    try {
      const resources = await ethereumClient.getAccountResources({ accountAddress: address });
      const ethCoinResource = resources.find(r => r.type === "0x1::coin::CoinStore<0x1::ethereum_coin::EthereumCoin>");
      if (ethCoinResource) {
        return ethCoinResource.data.coin.value;
      }
      return "0";
    } catch (error) {
      console.error("Error getting account balance:", error);
      return "0";
    }
  };

  // Roulette game functions
  const placeRouletteBet = useCallback(async (betType, betValue, amount, numbers = []) => {
    if (!connected || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const payload = CasinoGames.roulette.placeBet(betType, betValue, parseEthAmount(amount), numbers);
      
      // Mock transaction for demo
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      await ethereumClient.waitForTransaction({ transactionHash: mockTxHash });
      
      // Update balance after transaction
      await updateBalance();
      
      return mockTxHash;
    } catch (error) {
      console.error('Roulette bet failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, account, updateBalance]);

  const getRouletteGameState = useCallback(async () => {
    try {
      return await CasinoGames.roulette.getGameState();
    } catch (error) {
      console.error('Error getting roulette game state:', error);
      return null;
    }
  }, []);

  // Mines game functions
  const startMinesGame = useCallback(async (betAmount, minesCount, tilesToReveal) => {
    if (!connected || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const payload = CasinoGames.mines.startGame(parseEthAmount(betAmount), minesCount, tilesToReveal);
      
      // Mock transaction for demo
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      await ethereumClient.waitForTransaction({ transactionHash: mockTxHash });
      
      // Update balance after transaction
      await updateBalance();
      
      return mockTxHash;
    } catch (error) {
      console.error('Mines game start failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, account, updateBalance]);

  const revealMinesTile = useCallback(async (gameId, tileIndex) => {
    if (!connected || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const payload = CasinoGames.mines.revealTile(gameId, tileIndex);
      
      // Mock transaction for demo
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      await ethereumClient.waitForTransaction({ transactionHash: mockTxHash });
      
      return mockTxHash;
    } catch (error) {
      console.error('Mines tile reveal failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, account]);

  const cashoutMinesGame = useCallback(async (gameId) => {
    if (!connected || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const payload = CasinoGames.mines.cashout(gameId);
      
      // Mock transaction for demo
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      await ethereumClient.waitForTransaction({ transactionHash: mockTxHash });
      
      // Update balance after transaction
      await updateBalance();
      
      return mockTxHash;
    } catch (error) {
      console.error('Mines cashout failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, account, updateBalance]);

  // Wheel game functions
  const spinWheel = useCallback(async (betAmount, segments) => {
    if (!connected || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const payload = CasinoGames.wheel.spin(parseEthAmount(betAmount), segments);
      
      // Mock transaction for demo
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      await ethereumClient.waitForTransaction({ transactionHash: mockTxHash });
      
      // Update balance after transaction
      await updateBalance();
      
      return mockTxHash;
    } catch (error) {
      console.error('Wheel spin failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, account, updateBalance]);

  // General casino functions
  const getCasinoBalance = useCallback(async () => {
    try {
      // Mock casino balance for demo
      return "1000000.00";
    } catch (error) {
      console.error('Error getting casino balance:', error);
      return "0";
    }
  }, []);

  const getGameHistory = useCallback(async (gameType, limit = 10) => {
    try {
      // Mock game history for demo
      return Array.from({ length: limit }, (_, i) => ({
        id: `game_${i}`,
        type: gameType,
        betAmount: (Math.random() * 100).toFixed(2),
        result: Math.random() > 0.5 ? 'win' : 'loss',
        timestamp: new Date(Date.now() - i * 60000).toISOString()
      }));
    } catch (error) {
      console.error('Error getting game history:', error);
      return [];
    }
  }, []);

  return {
    // State
    balance,
    loading,
    error,
    
    // Wallet state
    connected,
    account,
    
    // Functions
    updateBalance,
    placeRouletteBet,
    getRouletteGameState,
    startMinesGame,
    revealMinesTile,
    cashoutMinesGame,
    spinWheel,
    getCasinoBalance,
    getGameHistory,
    
    // Utility functions
    formatEthAmount,
    parseEthAmount,
  };
}; 