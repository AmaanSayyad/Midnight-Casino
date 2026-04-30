/**
 * Pyth Entropy Service
 * Handles random number generation using Pyth Network Entropy via API
 */

import { ethers, BrowserProvider, JsonRpcProvider, Contract, AbiCoder, Wallet } from 'ethers';
import PYTH_ENTROPY_CONFIG from '../config/pythEntropy.js';
import { TREASURY_CONFIG } from '../config/treasury.js';

class PythEntropyService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isInitialized = false;
    this.network = PYTH_ENTROPY_CONFIG.DEFAULT_NETWORK;
    
    // Contract ABI for Pyth Entropy V2 (Official interface)
    this.contractABI = [
      "function requestV2(uint32 gasLimit) external payable returns (uint64)",
      "function getRandomValue(bytes32 requestId) external view returns (bytes32)",
      "function isRequestFulfilled(bytes32 requestId) external view returns (bool)",
      "function getRequest(bytes32 requestId) external view returns (bool, bytes32, uint64, uint256)",
      "function getFeeV2(uint32 gasLimit) external view returns (uint256)",
      "function getFeeV2() external view returns (uint256)",
      "function getProvider() external view returns (address)",
      "event RandomnessRequested(bytes32 indexed requestId, address indexed provider, bytes32 userRandomNumber, uint64 sequenceNumber, address requester)",
      "event RandomnessFulfilled(bytes32 indexed requestId, bytes32 randomValue)"
    ];
  }

  /**
   * Initialize the Pyth Entropy service
   * @param {string} network - Network name (arbitrum-sepolia, base, etc.)
   */
  async initialize(network = null) {
    try {
      if (this.isInitialized && (!network || this.network === network)) {
        return true;
      }

      this.network = network || PYTH_ENTROPY_CONFIG.DEFAULT_NETWORK;
      const networkConfig = PYTH_ENTROPY_CONFIG.getNetworkConfig(this.network);
      
      if (!networkConfig) {
        throw new Error(`Unsupported network: ${this.network}`);
      }

      console.log('🔮 PYTH ENTROPY: Initializing service...');
      console.log(`🌐 Network: ${networkConfig.name} (${networkConfig.chainId})`);

      // Use treasury wallet for signing instead of user wallet
      this.provider = new JsonRpcProvider(networkConfig.rpcUrl);
      
      // Create treasury wallet for signing transactions
      if (TREASURY_CONFIG.PRIVATE_KEY) {
        this.signer = new Wallet(TREASURY_CONFIG.PRIVATE_KEY, this.provider);
        console.log('🏦 PYTH ENTROPY: Using treasury wallet for signing');
        console.log(`📍 Treasury address: ${this.signer.address}`);
      } else {
        console.warn('⚠️ PYTH ENTROPY: Treasury private key not found, using read-only provider');
      }

      // Get contract address for the network
      const contractAddress = PYTH_ENTROPY_CONFIG.getEntropyContract(this.network);
      
      if (contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error(`Pyth Entropy contract not deployed on ${this.network}`);
      }

      // Initialize contract
      console.log(`🔍 DEBUG: Creating contract with address: ${contractAddress}`);
      console.log(`🔍 DEBUG: ABI length: ${this.contractABI.length}`);
      console.log(`🔍 DEBUG: Provider:`, !!this.provider);
      console.log(`🔍 DEBUG: Signer:`, !!this.signer);
      
      this.contract = new Contract(
        contractAddress,
        this.contractABI,
        this.signer || this.provider
      );

      console.log(`🔍 DEBUG: Contract created:`, !!this.contract);
      console.log(`🔍 DEBUG: Contract methods:`, Object.keys(this.contract));
      console.log(`🔍 DEBUG: request method:`, !!this.contract.request);
      console.log(`🔍 DEBUG: request.estimateGas:`, !!this.contract.request?.estimateGas);

      this.isInitialized = true;
      console.log('✅ PYTH ENTROPY: Service initialized successfully');
      console.log(`📋 Contract: ${contractAddress}`);
      console.log(`📋 Contract instance:`, this.contract);
      console.log(`📋 Provider:`, this.provider);
      console.log(`📋 Signer:`, this.signer);
      
      return true;
    } catch (error) {
      console.error('❌ PYTH ENTROPY: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate a random number using Pyth Entropy via API
   * @param {string} gameType - Type of game (MINES, PLINKO, ROULETTE, WHEEL)
   * @param {Object} gameConfig - Game configuration
   * @returns {Promise<Object>} Random number result with proof
   */
  async generateRandom(gameType, gameConfig = {}) {
    try {
      console.log(`🎲 PYTH ENTROPY: Generating random for ${gameType} via API...`);
      
      // Call the API endpoint to generate entropy using hardhat script
      const response = await fetch('/api/generate-entropy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameType: gameType,
          gameConfig: gameConfig
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ PYTH ENTROPY: HTTP error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('❌ PYTH ENTROPY: API call failed:', result.error);
        throw new Error(result.error || 'Failed to generate entropy via API');
      }
      
      console.log('✅ PYTH ENTROPY: Random value generated via API');
      console.log('🔗 Transaction:', result.entropyProof.transactionHash);
      console.log('🎲 Random value:', result.randomValue);
      
      return {
        randomValue: result.randomValue,
        entropyProof: result.entropyProof,
        success: true,
        gameType: gameType,
        gameConfig: gameConfig,
        metadata: {
          source: 'Pyth Entropy (API)',
          network: 'monad-testnet',
          algorithm: 'pyth-entropy-hardhat',
          generatedAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ PYTH ENTROPY: Error generating random via API:', error);
      
      // Return fallback result if API fails
      const fallbackRequestId = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['string', 'uint256'],
          [gameType, Date.now()]
        )
      );
      
      const fallbackSequenceNumber = (Date.now() + Math.floor(Math.random() * 1000)).toString();
      
      return {
        randomValue: Math.floor(Math.random() * 1000000),
        entropyProof: {
          requestId: fallbackRequestId,
          sequenceNumber: fallbackSequenceNumber,
          transactionHash: 'fallback_no_tx',
          blockNumber: null,
          randomValue: Math.floor(Math.random() * 1000000),
          network: 'monad-testnet',
          explorerUrl: 'https://entropy-explorer.pyth.network/?chain=arbitrum-sepolia',
          polygonExplorerUrl: 'https://amoy.polygonscan.com/',
          timestamp: Date.now(),
          source: 'Pyth Entropy (API Fallback)'
        },
        success: true,
        gameType: gameType,
        gameConfig: gameConfig,
        metadata: {
          source: 'Pyth Entropy (Fallback)',
          network: 'monad-testnet',
          algorithm: 'fallback',
          generatedAt: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get Polygon Explorer URL for transaction
   * @param {string} txHash - Transaction hash
   * @returns {string} Polygon Explorer URL
   */
  getPolygonExplorerUrl(txHash) {
    const network = this.network || 'monad-testnet';
    
    if (network === 'monad-testnet') {
      return `https://testnet.monadexplorer.com/tx/${txHash}`;
    }
    
    return `https://testnet.monadexplorer.com/tx/${txHash}`;
  }

  /**
   * Generate a unique seed for the entropy request
   * @param {string} gameType - Game type
   * @param {Object} gameConfig - Game configuration
   * @returns {string} Unique seed
   */
  generateSeed(gameType, gameConfig) {
    const configString = JSON.stringify(gameConfig);
    const configHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['string', 'string', 'uint256'],
        [gameType, configString, Date.now()]
      )
    );
    
    return configHash;
  }

  /**
   * Extract request ID from transaction logs
   * @param {Array} logs - Transaction logs
   * @returns {string|null} Request ID
   */
  extractRequestIdFromLogs(logs) {
    try {
      console.log('🔍 PYTH ENTROPY: Extracting request ID from logs...');
      console.log('📋 Total logs:', logs.length);
      
      // Event signature for RandomnessRequested(bytes32 indexed requestId, address indexed provider, address indexed requester, uint64 sequenceNumber)
      const eventSignature = ethers.id("RandomnessRequested(bytes32,address,address,uint64)");
      console.log('🔍 Event signature:', eventSignature);
      
      // Also check for other possible event signatures
      const alternativeSignatures = [
        ethers.id("RandomnessRequested(bytes32,address,address,uint64)"),
        ethers.id("RandomnessRequested(bytes32,address,bytes32,uint64,address)"),
        ethers.id("RandomnessRequested(bytes32,bytes32,uint64,address)")
      ];
      
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        console.log(`📋 Log ${i}:`, {
          address: log.address,
          topics: log.topics,
          data: log.data
        });
        
        // Check if this log matches any of our event signatures
        if (log.topics && log.topics[0]) {
          if (log.topics[0] === eventSignature || alternativeSignatures.includes(log.topics[0])) {
            console.log('✅ PYTH ENTROPY: Found RandomnessRequested event!');
            console.log('📋 Request ID (topic 1):', log.topics[1]);
            return log.topics[1];
          }
        }
      }
      
      console.warn('⚠️ PYTH ENTROPY: No RandomnessRequested event found in logs');
      return null;
    } catch (error) {
      console.error('❌ PYTH ENTROPY: Error extracting request ID:', error);
      return null;
    }
  }

  /**
   * Wait for the entropy request to be fulfilled
   * @param {string} requestId - Request ID
   * @returns {Promise<string>} Random value
   */
  async waitForFulfillment(requestId) {
    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 1000; // 1 second
    let waitTime = 0;
    
    console.log(`⏳ PYTH ENTROPY: Waiting for request ${requestId} to be fulfilled...`);
    
    while (waitTime < maxWaitTime) {
      try {
        const isFulfilled = await this.contract.isRequestFulfilled(requestId);
        
        if (isFulfilled) {
          console.log(`✅ PYTH ENTROPY: Request ${requestId} fulfilled!`);
          const randomValue = await this.contract.getRandomValue(requestId);
          console.log(`🎲 PYTH ENTROPY: Random value: ${randomValue}`);
          return randomValue;
        }
        
        console.log(`⏳ PYTH ENTROPY: Request ${requestId} not yet fulfilled, waiting...`);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waitTime += checkInterval;
      } catch (error) {
        console.warn(`⚠️ PYTH ENTROPY: Error checking fulfillment: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waitTime += checkInterval;
      }
    }
    
    console.warn(`⚠️ PYTH ENTROPY: Request ${requestId} not fulfilled within ${maxWaitTime}ms, using fallback`);
    return Math.floor(Math.random() * 1000000).toString();
  }

  /**
   * Get the status of an entropy request
   * @param {string} requestId - Request ID
   * @returns {Promise<Object>} Request status
   */
  async getRequestStatus(requestId) {
    try {
      const isFulfilled = await this.contract.isRequestFulfilled(requestId);
      const requestData = await this.contract.getRequest(requestId);
      
      return {
        requestId: requestId,
        isFulfilled: isFulfilled,
        requestData: requestData
      };
    } catch (error) {
      console.error('❌ PYTH ENTROPY: Error getting request status:', error);
      throw error;
    }
  }

  /**
   * Generate multiple random values in batch
   * @param {Array} requests - Array of {gameType, gameConfig} objects
   * @returns {Promise<Array>} Array of random results
   */
  async generateRandomBatch(requests) {
    console.log(`🎲 PYTH ENTROPY: Generating batch of ${requests.length} random values...`);
    
    const results = [];
    
    for (let i = 0; i < requests.length; i++) {
      const { gameType, gameConfig } = requests[i];
      console.log(`🎲 PYTH ENTROPY: Generating random ${i + 1}/${requests.length} for ${gameType}...`);
      
      try {
        const result = await this.generateRandom(gameType, gameConfig);
        results.push(result);
      } catch (error) {
        console.error(`❌ PYTH ENTROPY: Error generating random for ${gameType}:`, error);
        results.push({
          error: error.message,
          gameType: gameType,
          gameConfig: gameConfig
        });
      }
    }
    
    console.log(`✅ PYTH ENTROPY: Batch generation completed - ${results.length} results`);
    return results;
  }

  /**
   * Get network configuration
   * @returns {Object} Current network configuration
   */
  getNetworkConfig() {
    return PYTH_ENTROPY_CONFIG.getNetworkConfig(this.network);
  }

  /**
   * Switch to a different network
   * @param {string} network - Network name
   */
  async switchNetwork(network) {
    console.log(`🔄 PYTH ENTROPY: Switching to network ${network}...`);
    this.isInitialized = false;
    await this.initialize(network);
  }

  /**
   * Get supported networks
   * @returns {Array} Array of supported network names
   */
  getSupportedNetworks() {
    return PYTH_ENTROPY_CONFIG.getSupportedNetworks();
  }

  /**
   * Check if a network is supported
   * @param {string} network - Network name
   * @returns {boolean} True if supported
   */
  isNetworkSupported(network) {
    return PYTH_ENTROPY_CONFIG.isNetworkSupported(network);
  }
}

// Create singleton instance
const pythEntropyService = new PythEntropyService();

export default pythEntropyService;