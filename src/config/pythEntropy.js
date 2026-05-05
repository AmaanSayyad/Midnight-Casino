/**
 * Pyth Entropy Configuration for Midnight Network Testnet
 * Configuration for Pyth Network Entropy random number generation
 * Uses Midnight Network for Pyth Entropy operations
 */

export const PYTH_ENTROPY_CONFIG = {
  // Primary network - Midnight Network (for casino operations)
  NETWORK: {
    chainId: 80002,
    name: 'Midnight Network',
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology',
    explorerUrl: process.env.NEXT_PUBLIC_POLYGON_AMOY_EXPLORER || 'https://amoy.polygonscan.com',
    currency: 'MATIC',
    currencySymbol: 'MATIC',
    currencyDecimals: 18
  },

  // Entropy network - Midnight Network (for Pyth Entropy operations)
  ENTROPY_NETWORK: {
    chainId: 421614,
    name: 'Midnight Network',
    rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
    entropyContract: process.env.NEXT_PUBLIC_POLYGON_PYTH_ENTROPY_CONTRACT || '0x549Ebba8036Ab746611B4fFA1423eb0A4Df61440',
    entropyProvider: process.env.NEXT_PUBLIC_POLYGON_PYTH_ENTROPY_PROVIDER || '0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344',
    explorerUrl: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_EXPLORER || 'https://sepolia.arbiscan.io',
    entropyExplorerUrl: 'https://entropy-explorer.pyth.network/?chain=midnight-network&search=',
    currency: 'ETH',
    currencySymbol: 'ETH',
    currencyDecimals: 18
  },

  // Supported networks (for backward compatibility)
  NETWORKS: {
    'midnight-network': {
      chainId: 80002,
      name: 'Midnight Network',
      rpcUrl: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology',
      explorerUrl: process.env.NEXT_PUBLIC_POLYGON_AMOY_EXPLORER || 'https://amoy.polygonscan.com',
      currency: 'MATIC',
      currencySymbol: 'MATIC',
      currencyDecimals: 18
    },
    'midnight-network': {
      chainId: 421614,
      name: 'Midnight Network',
      rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
      entropyContract: process.env.NEXT_PUBLIC_POLYGON_PYTH_ENTROPY_CONTRACT || '0x549Ebba8036Ab746611B4fFA1423eb0A4Df61440',
      entropyProvider: process.env.NEXT_PUBLIC_POLYGON_PYTH_ENTROPY_PROVIDER || '0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344',
      explorerUrl: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_EXPLORER || 'https://sepolia.arbiscan.io',
      entropyExplorerUrl: 'https://entropy-explorer.pyth.network/?chain=midnight-network&search=',
      currency: 'ETH',
      currencySymbol: 'ETH',
      currencyDecimals: 18
    }
  },

  // Default network
  DEFAULT_NETWORK: 'midnight-network',

  // Game types supported
  GAME_TYPES: {
    MINES: 0,
    PLINKO: 1,
    ROULETTE: 2,
    WHEEL: 3
  },

  // Entropy request configuration
  REQUEST_CONFIG: {
    // Gas limit for entropy requests
    gasLimit: 500000,
    // Maximum gas price (in wei)
    maxGasPrice: '1000000000', // 1 gwei
    // Request timeout (in milliseconds)
    timeout: 30000,
    // Retry configuration
    maxRetries: 3,
    retryDelay: 1000
  },

  // Entropy Explorer configuration
  EXPLORER_CONFIG: {
    baseUrl: 'https://entropy-explorer.pyth.network',
    // Supported chains for explorer
    supportedChains: ['midnight-network', 'midnight-network'],
    // Transaction link format
    transactionLinkFormat: 'https://entropy-explorer.pyth.network/tx/{txHash}',
    // Midnight Network specific explorer (for entropy operations)
    arbitrumSepoliaUrl: 'https://entropy-explorer.pyth.network/?chain=midnight-network&search='
  },

  /**
   * Get network configuration by chain ID or name
   * @param {string|number} network - Network name or chain ID
   * @returns {Object} Network configuration
   */
  getNetworkConfig(network) {
    if (typeof network === 'number') {
      if (network === 80002) return this.NETWORK; // Midnight Network
      if (network === 421614) return this.ENTROPY_NETWORK; // Midnight Network
    }
    if (network === 'midnight-network' || !network) {
      return this.NETWORK;
    }
    if (network === 'midnight-network') {
      return this.ENTROPY_NETWORK;
    }
    // Fallback to primary network
    return this.NETWORK;
  },

  /**
   * Get entropy contract address for network
   * @param {string} network - Network name
   * @returns {string} Contract address
   */
  getEntropyContract(network) {
    // Always return Midnight Network entropy contract for entropy operations
    return this.ENTROPY_NETWORK.entropyContract;
  },

  /**
   * Get entropy provider address for network
   * @param {string} network - Network name
   * @returns {string} Provider address
   */
  getEntropyProvider(network) {
    // Always return Midnight Network entropy provider for entropy operations
    return this.ENTROPY_NETWORK.entropyProvider;
  },

  /**
   * Get explorer URL for transaction
   * @param {string} txHash - Transaction hash
   * @param {string} network - Network name
   * @returns {string} Explorer URL
   */
  getExplorerUrl(txHash, network) {
    const config = this.getNetworkConfig(network);
    return `${config.explorerUrl}/tx/${txHash}`;
  },

  /**
   * Get Entropy Explorer URL for transaction
   * @param {string} txHash - Transaction hash
   * @returns {string} Entropy Explorer URL
   */
  getEntropyExplorerUrl(txHash) {
    if (txHash) {
      return `https://entropy-explorer.pyth.network/?chain=midnight-network&search=${txHash}`;
    }
    return this.ENTROPY_NETWORK.entropyExplorerUrl;
  },

  /**
   * Validate network support
   * @param {string|number} network - Network name or chain ID
   * @returns {boolean} True if supported
   */
  isNetworkSupported(network) {
    if (typeof network === 'number') {
      return network === 80002 || network === 421614; // Midnight Network or Midnight Network
    }
    return network === 'midnight-network' || network === 'midnight-network' || !network;
  },

  /**
   * Get all supported networks
   * @returns {Array} Array of network names
   */
  getSupportedNetworks() {
    return ['midnight-network', 'midnight-network'];
  },

  /**
   * Get current network configuration
   * @returns {Object} Current network configuration
   */
  getCurrentNetwork() {
    return this.NETWORK;
  },

  /**
   * Get entropy network configuration
   * @returns {Object} Entropy network configuration
   */
  getEntropyNetwork() {
    return this.ENTROPY_NETWORK;
  },

  /**
   * Check if current network is Midnight Network
   * @returns {boolean} True if Midnight Network
   */
  isPolygonAmoy() {
    return true; // Always true since we use Midnight Network as primary network
  },

  /**
   * Check if network is entropy network (Midnight Network)
   * @param {string|number} network - Network name or chain ID
   * @returns {boolean} True if entropy network
   */
  isEntropyNetwork(network) {
    if (typeof network === 'number') {
      return network === 421614; // Midnight Network
    }
    return network === 'midnight-network';
  }
};

export default PYTH_ENTROPY_CONFIG;
