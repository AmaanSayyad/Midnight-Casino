// MetaMask Smart Accounts utilities
export const SMART_ACCOUNT_FEATURES = {
  BATCH_TRANSACTIONS: 'batchTransactions',
  SPONSORED_TRANSACTIONS: 'sponsoredTransactions',
  SESSION_KEYS: 'sessionKeys',
  SOCIAL_RECOVERY: 'socialRecovery'
};

export const checkSmartAccountSupport = async (walletClient) => {
  if (!walletClient || !window.ethereum) {
    return {
      isSupported: false,
      capabilities: {},
      provider: 'Unknown'
    };
  }

  try {
    const provider = window.ethereum;
    
    // Check MetaMask version and Smart Account support
    let isMetaMask = false;
    let version = null;
    
    try {
      isMetaMask = provider.isMetaMask || false;
      // Check if it's a recent MetaMask version that might support Smart Accounts
      if (isMetaMask && provider._metamask?.getProviderState) {
        const state = await provider._metamask.getProviderState();
        version = state.version;
      }
    } catch (versionError) {
      console.warn('Could not check MetaMask version:', versionError);
    }

    // For now, return basic support info since Smart Accounts are still in beta
    // In the future, this would check actual capabilities
    return {
      isSupported: isMetaMask, // Basic MetaMask detection
      capabilities: {
        // These would be actual capabilities in a full implementation
        batchTransactions: false, // Not widely supported yet
        sponsoredTransactions: false,
        sessionKeys: false,
        socialRecovery: false
      },
      provider: isMetaMask ? 'MetaMask' : 'Unknown',
      version: version,
      note: 'Smart Accounts are in beta - features may be limited'
    };
  } catch (error) {
    console.warn('Error checking Smart Account support:', error);
    return {
      isSupported: false,
      capabilities: {},
      provider: 'Unknown'
    };
  }
};

export const enableSmartAccountFeatures = async (walletClient) => {
  if (!walletClient || !window.ethereum) return false;

  try {
    const provider = window.ethereum;
    
    // Request Smart Account permissions with error handling
    let permissions = null;
    
    try {
      permissions = await provider.request({
        method: 'wallet_requestPermissions',
        params: [{
          eth_accounts: {},
          // Add Smart Account specific permissions here
        }]
      });
    } catch (permError) {
      console.warn('wallet_requestPermissions not supported or failed:', permError);
      // Try alternative method or return false gracefully
      return false;
    }

    return !!permissions;
  } catch (error) {
    console.warn('Error enabling Smart Account features:', error);
    return false;
  }
};

export const batchTransactions = async (walletClient, transactions) => {
  if (!walletClient || !window.ethereum) return null;

  try {
    const provider = window.ethereum;
    
    // Check if batch transactions are supported
    const capabilities = await checkSmartAccountSupport(walletClient);
    if (!capabilities?.capabilities?.batchTransactions) {
      console.warn('Batch transactions not supported, falling back to individual transactions');
      // Could implement fallback to individual transactions here
      throw new Error('Batch transactions not supported');
    }

    // Execute batch transaction with error handling
    let result = null;
    
    try {
      result = await provider.request({
        method: 'eth_sendTransactionBatch',
        params: [transactions]
      });
    } catch (batchError) {
      console.warn('eth_sendTransactionBatch failed:', batchError);
      throw new Error('Batch transaction execution failed');
    }

    return result;
  } catch (error) {
    console.warn('Error executing batch transactions:', error);
    throw error;
  }
};

export const getSmartAccountInfo = async (address, walletClient) => {
  if (!address) {
    return {
      address: null,
      type: 'Unknown',
      isSmartAccount: false
    };
  }

  try {
    // Get account code to determine if it's a smart account
    let code = '0x';
    let isSmartAccount = false;

    try {
      // Use the most reliable method to get bytecode
      if (window.ethereum) {
        code = await window.ethereum.request({
          method: 'eth_getCode',
          params: [address, 'latest']
        });
      } else if (walletClient?.getBytecode) {
        code = await walletClient.getBytecode({ address });
      } else if (walletClient?.getCode) {
        code = await walletClient.getCode({ address });
      }
      
      // A smart account has contract code (more than just '0x')
      isSmartAccount = code && code !== '0x' && code.length > 2;
    } catch (codeError) {
      console.warn('Could not get bytecode for address', address, ':', codeError);
      isSmartAccount = false;
    }

    // Get Smart Account capabilities
    const capabilities = await checkSmartAccountSupport(walletClient);

    const accountInfo = {
      address,
      type: isSmartAccount ? 'Smart Account (EIP-4337)' : 'EOA',
      isSmartAccount,
      code: isSmartAccount ? code : null,
      codeSize: isSmartAccount ? (code?.length || 0) : 0,
      capabilities: capabilities?.capabilities || {},
      features: {
        // These features are theoretical - actual support depends on the Smart Account implementation
        batchTransactions: isSmartAccount && !!capabilities?.capabilities?.batchTransactions,
        sponsoredTransactions: isSmartAccount && !!capabilities?.capabilities?.sponsoredTransactions,
        sessionKeys: isSmartAccount && !!capabilities?.capabilities?.sessionKeys,
        socialRecovery: isSmartAccount && !!capabilities?.capabilities?.socialRecovery
      },
      note: isSmartAccount ? 'Smart Account detected - features depend on implementation' : 'Standard Ethereum account'
    };

    console.log('Account analysis:', accountInfo);
    return accountInfo;
  } catch (error) {
    console.warn('Error getting Smart Account info:', error);
    // Return EOA as safe fallback
    return {
      address,
      type: 'EOA (Fallback)',
      isSmartAccount: false,
      note: 'Could not determine account type - assuming EOA'
    };
  }
};

export const formatSmartAccountAddress = (address, isSmartAccount = false) => {
  if (!address) return '';
  
  const prefix = isSmartAccount ? '🔷' : '👤';
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  return `${prefix} ${shortAddress}`;
};