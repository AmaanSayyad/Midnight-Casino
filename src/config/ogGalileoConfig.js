/**
 * Monad Testnet Testnet Configuration
 * Configuration for Monad Testnet testnet with MATIC token
 */

// Monad Testnet Chain Configuration
export const MONAD_TESTNET_CONFIG = {
  chainId: 16602,
  name: 'monad-testnet-Testnet',
  network: 'monad-testnet-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_0G_GALILEO_RPC || 'https://testnet-rpc.monad.xyz',
        process.env.NEXT_PUBLIC_0G_GALILEO_RPC_FALLBACK || 'https://evm-rpc-galileo.0g.ai'
      ],
    },
    public: {
      http: [
        'https://testnet-rpc.monad.xyz',
        'https://evm-rpc-galileo.0g.ai'
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Testnet Explorer',
      url: process.env.NEXT_PUBLIC_0G_GALILEO_EXPLORER || 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
};

// Monad Testnet Tokens
export const MONAD_TESTNET_TOKENS = {
  MATIC: {
    symbol: 'MATIC',
    name: 'MATIC token',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    isNative: true,
    icon: '🔮',
    faucet: 'https://faucet.0g.ai'
  }
};

// Casino configuration for Monad Testnet
export const MONAD_TESTNET_CASINO_CONFIG = {
  // Deposit/Withdraw settings
  minDeposit: '0.001', // 0.001 MATIC
  maxDeposit: '100',   // 100 MATIC
  minWithdraw: '0.001', // 0.001 MATIC
  maxWithdraw: '100',   // 100 MATIC
  
  // Game settings (same as Arbitrum for consistency)
  games: {
    MINES: {
      minBet: '0.001',
      maxBet: '1.0',
      minMines: 1,
      maxMines: 24,
      defaultMines: 3,
      gridSize: 25
    },
    ROULETTE: {
      minBet: '0.001',
      maxBet: '1.0',
      houseEdge: 0.027
    },
    PLINKO: {
      minBet: '0.001',
      maxBet: '1.0',
      rows: [8, 12, 16],
      defaultRows: 12
    },
    WHEEL: {
      minBet: '0.001',
      maxBet: '1.0',
      segments: [2, 10, 20, 40, 50]
    }
  }
};

// Network switching helper for Monad Testnet
export const switchToOGGalileo = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found');
  }

  try {
    // Try to switch to Monad Testnet
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x40da' }], // 16602 in hex
    });
  } catch (switchError) {
    // If network doesn't exist, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x40da',
          chainName: 'monad-testnet-Testnet',
          nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
          },
          rpcUrls: ['https://testnet-rpc.monad.xyz'],
          blockExplorerUrls: ['https://testnet.monadexplorer.com'],
        }],
      });
    } else {
      throw switchError;
    }
  }
};

export default MONAD_TESTNET_CONFIG;