/**
 * Entropy Explorer Service
 * Handles integration with Pyth Entropy Explorer for transaction verification
 */

import PYTH_ENTROPY_CONFIG from '../config/pythEntropy.js';

class EntropyExplorerService {
  constructor() {
    this.baseUrl = 'https://fortuna.pyth.network';
    this.supportedChains = PYTH_ENTROPY_CONFIG.EXPLORER_CONFIG.supportedChains;
  }

  /**
   * Get transaction URL for Entropy Explorer
   * @param {string} txHash - Transaction hash
   * @param {string} network - Network name (optional)
   * @returns {string} Explorer URL
   */
  getTransactionUrl(txHash, network = null) {
    if (!txHash) {
      throw new Error('Transaction hash is required');
    }

    const networkName = network || PYTH_ENTROPY_CONFIG.DEFAULT_NETWORK;
    
    if (!this.supportedChains.includes(networkName)) {
      console.warn(`Network ${networkName} not supported by Entropy Explorer`);
      return `${this.baseUrl}/tx/${txHash}`;
    }

    return `${this.baseUrl}/tx/${txHash}`;
  }

  /**
   * Get request details from Entropy Explorer
   * @param {string} requestId - Request ID
   * @param {string} network - Network name (optional)
   * @returns {Promise<Object>} Request details
   */
  async getRequestDetails(requestId, network = null) {
    try {
      const networkName = network || PYTH_ENTROPY_CONFIG.DEFAULT_NETWORK;
      const chainId = PYTH_ENTROPY_CONFIG.getNetworkConfig(networkName).chainId;
      
      console.log(`🔍 FORTUNA API: Fetching request details for ${requestId}`);
      
      // Get logs from Fortuna API
      const logsUrl = `${this.baseUrl}/v1/logs`;
      const response = await fetch(logsUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Find the specific request
      const request = data.requests.find(req => 
        req.sequence === requestId && req.chain_id === chainId
      );
      
      if (!request) {
        console.log(`⚠️ FORTUNA API: Request ${requestId} not found`);
        return null;
      }
      
      const requestDetails = {
        requestId: request.sequence,
        sequenceNumber: request.sequence,
        status: request.state,
        transactionHash: request.request_tx_hash,
        callbackTransactionHash: null, // Not available in Fortuna API
        timestamp: request.created_at,
        network: networkName,
        chainId: chainId,
        randomValue: request.user_random_number,
        explorerUrl: this.getTransactionUrl(request.request_tx_hash, networkName),
        gasLimit: request.gas_limit,
        sender: request.sender,
        provider: request.provider
      };
      
      console.log(`✅ FORTUNA API: Request details fetched successfully`);
      return requestDetails;
      
    } catch (error) {
      console.error('❌ FORTUNA API: Failed to fetch request details:', error);
      return null;
    }
  }

  /**
   * Get recent entropy requests for a network
   * @param {string} network - Network name (optional)
   * @param {number} limit - Number of requests to fetch (default: 50)
   * @returns {Promise<Array>} Array of recent requests
   */
  async getRecentRequests(network = null, limit = 50) {
    try {
      const networkName = network || PYTH_ENTROPY_CONFIG.DEFAULT_NETWORK;
      const url = `${this.baseUrl}/api/requests?network=${networkName}&limit=${limit}`;
      
      console.log(`🔍 ENTROPY EXPLORER: Fetching recent requests for ${networkName}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recent requests: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log(`✅ ENTROPY EXPLORER: Fetched ${data.requests.length} recent requests`);
      
      return data.requests.map(request => ({
        requestId: request.requestId,
        sequenceNumber: request.sequenceNumber,
        status: request.status,
        transactionHash: request.transactionHash,
        callbackTransactionHash: request.callbackTransactionHash,
        timestamp: request.timestamp,
        network: request.network,
        randomValue: request.randomValue,
        explorerUrl: this.getTransactionUrl(request.transactionHash, networkName)
      }));
    } catch (error) {
      console.error('❌ FORTUNA API: Failed to fetch recent requests:', error);
      return [];
    }
  }

  /**
   * Get network statistics
   * @param {string} network - Network name (optional)
   * @returns {Promise<Object>} Network statistics
   */
  async getNetworkStats(network = null) {
    try {
      const networkName = network || PYTH_ENTROPY_CONFIG.DEFAULT_NETWORK;
      const chainId = PYTH_ENTROPY_CONFIG.getNetworkConfig(networkName).chainId;
      
      console.log(`📊 FORTUNA API: Fetching logs for chain ${chainId}`);
      
      // Get logs from Fortuna API
      const logsUrl = `${this.baseUrl}/v1/logs`;
      const response = await fetch(logsUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Filter logs for the specific chain
      const chainLogs = data.requests.filter(req => req.chain_id === chainId);
      
      const stats = {
        network: networkName,
        chainId: chainId,
        totalRequests: chainLogs.length,
        completedRequests: chainLogs.filter(req => req.state === 'fulfilled').length,
        pendingRequests: chainLogs.filter(req => req.state === 'pending').length,
        failedRequests: chainLogs.filter(req => req.state === 'failed').length,
        lastUpdated: new Date().toISOString()
      };
      
      console.log(`✅ FORTUNA API: Network stats fetched successfully`, stats);
      return stats;
      
    } catch (error) {
      console.error('❌ FORTUNA API: Failed to fetch network stats:', error);
      return null;
    }
  }

  /**
   * Verify a random value against its proof
   * @param {string} requestId - Request ID
   * @param {string} randomValue - Random value to verify
   * @param {string} network - Network name (optional)
   * @returns {Promise<boolean>} True if verification passes
   */
  async verifyRandomValue(requestId, randomValue, network = null) {
    try {
      const requestDetails = await this.getRequestDetails(requestId, network);
      
      if (!requestDetails.randomValue) {
        throw new Error('Request not yet fulfilled');
      }
      
      const isValid = requestDetails.randomValue === randomValue;
      
      console.log(`🔍 ENTROPY EXPLORER: Verification ${isValid ? 'passed' : 'failed'} for request ${requestId}`);
      
      return {
        isValid,
        requestDetails,
        explorerUrl: requestDetails.explorerUrl
      };
    } catch (error) {
      console.error('❌ ENTROPY EXPLORER: Verification failed:', error);
      throw error;
    }
  }

  /**
   * Get supported networks for explorer
   * @returns {Array} Array of supported network names
   */
  getSupportedNetworks() {
    return this.supportedChains;
  }

  /**
   * Check if a network is supported by explorer
   * @param {string} network - Network name
   * @returns {boolean} True if supported
   */
  isNetworkSupported(network) {
    return this.supportedChains.includes(network);
  }

  /**
   * Format request ID for display
   * @param {string} requestId - Request ID
   * @returns {string} Formatted request ID
   */
  formatRequestId(requestId) {
    if (!requestId) return 'N/A';
    return `${requestId.slice(0, 8)}...${requestId.slice(-8)}`;
  }

  /**
   * Format sequence number for display
   * @param {string|number} sequenceNumber - Sequence number
   * @returns {string} Formatted sequence number
   */
  formatSequenceNumber(sequenceNumber) {
    if (!sequenceNumber) return 'N/A';
    return `#${sequenceNumber}`;
  }

  /**
   * Get status color for UI display
   * @param {string} status - Request status
   * @returns {string} CSS color class
   */
  getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case 'complete':
      case 'fulfilled':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  }

  /**
   * Get status icon for UI display
   * @param {string} status - Request status
   * @returns {string} Icon name or SVG path
   */
  getStatusIcon(status) {
    switch (status?.toLowerCase()) {
      case 'complete':
      case 'fulfilled':
        return 'check-circle';
      case 'pending':
        return 'clock';
      case 'failed':
      case 'error':
        return 'x-circle';
      default:
        return 'question-circle';
    }
  }
}

// Create singleton instance
const entropyExplorerService = new EntropyExplorerService();

export default entropyExplorerService;
