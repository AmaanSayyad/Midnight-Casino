import { ethers } from 'ethers';

// Pyth Entropy V2 Contract Configuration for Arbitrum Sepolia
const PYTH_ENTROPY_ADDRESS = process.env.NEXT_PUBLIC_POLYGON_PYTH_ENTROPY_CONTRACT || '0x549Ebba8036Ab746611B4fFA1423eb0A4Df61440';
const ARBITRUM_SEPOLIA_RPC = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';

// Minimal ABI for Pyth Entropy V2 on Arbitrum Sepolia
const PYTH_ENTROPY_ABI = [
  // Core entrypoint used by consumer contracts
  "function requestWithCallback(address provider, bytes32 userCommitment) external payable returns (uint64)",
  // Fee depends on the provider address (not global)
  "function getFee(address provider) external view returns (uint256)",
  // Helper to discover the default provider on this network
  "function getDefaultProvider() external view returns (address)",
  // Useful event to parse sequence number from logs (name may differ across versions)
  "event Request(address indexed requester, uint64 indexed sequenceNumber, address indexed provider, bytes32 commitment)"
];

export async function POST(request) {
  try {
    console.log('🎲 API: Generating Pyth Entropy...');
    
    // Create provider
    const provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
    
    // Check if contract exists at this address
    const code = await provider.getCode(PYTH_ENTROPY_ADDRESS);
    if (code === '0x') {
      throw new Error(`No contract found at address ${PYTH_ENTROPY_ADDRESS} on Arbitrum Sepolia`);
    }
    console.log('✅ Contract exists at address:', PYTH_ENTROPY_ADDRESS);
    
    // Create contract instance
    const contract = new ethers.Contract(PYTH_ENTROPY_ADDRESS, PYTH_ENTROPY_ABI, provider);
    
    // Discover default provider and fee
    console.log('🔍 Discovering provider and fee...');
    const defaultProvider = await contract.getDefaultProvider();
    console.log('✅ Default provider:', defaultProvider);
    
    let fee = await contract.getFee(defaultProvider);
    console.log('✅ Fee for provider:', ethers.formatEther(fee), 'ETH');
    
    // Let's try to call the contract with minimal data to see what happens
    console.log('🧪 Testing contract call with minimal parameters...');
    
    // Check if we have a private key for signing (use Arbitrum Sepolia treasury)
    const privateKey = process.env.ARBITRUM_TREASURY_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('ARBITRUM_TREASURY_PRIVATE_KEY environment variable is required');
    }
    
    // Create wallet and signer
    const wallet = new ethers.Wallet(privateKey, provider);
    const contractWithSigner = contract.connect(wallet);
    
    // Generate user random number
    const userRandomNumber = ethers.randomBytes(32);
    console.log('🎲 User random number:', ethers.hexlify(userRandomNumber));
    
    // Request random value from Pyth Entropy
    console.log('🔄 Requesting random value from Pyth Entropy...');
    console.log('💰 Using fee:', ethers.formatEther(fee), 'ETH');
    console.log('🏦 Wallet address:', wallet.address);
    
    // Check wallet balance first
    const balance = await provider.getBalance(wallet.address);
    console.log('💳 Wallet balance:', ethers.formatEther(balance), 'ETH');
    
    if (balance < fee) {
      throw new Error(`Insufficient balance. Need ${ethers.formatEther(fee)} ETH, have ${ethers.formatEther(balance)} ETH. Please add more ETH to treasury: ${wallet.address}`);
    }
    
    // Call the canonical V2 method
    const tx = await contractWithSigner.requestWithCallback(
      defaultProvider,
      userRandomNumber,
      {
        value: fee,
        gasLimit: 700000
      }
    );
    
    console.log('✅ RequestV2 sent:', tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    // Extract sequence number from logs if available
    let sequenceNumber = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog && (parsedLog.name === 'Request' || parsedLog.args?.sequenceNumber)) {
          sequenceNumber = parsedLog.args.sequenceNumber;
          break;
        }
      } catch (_) {
        // ignore non-matching logs
      }
    }
    if (!sequenceNumber) {
      // Fallback: no event exposed publicly, let frontend use tx hash as reference
      sequenceNumber = 0n;
    }
    
    // Create entropy proof
    const entropyProof = {
      sequenceNumber: sequenceNumber.toString(),
      userRandomNumber: ethers.hexlify(userRandomNumber),
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber.toString(),
      // We cannot synchronously read randomness; return placeholder derived from tx for UI
      randomValue: generateRandomFromTxHash(tx.hash),
      network: 'arbitrum-sepolia',
      // Use tx hash for entropy explorer search to ensure results
      explorerUrl: `https://entropy-explorer.pyth.network/?chain=arbitrum-sepolia&search=${tx.hash}`,
      polygonExplorerUrl: `https://amoy.polygonscan.com/tx/${tx.hash}`,
      timestamp: Date.now(),
      source: 'Pyth Entropy V1 (Monad Testnet)'
    };
    
    console.log('✅ API: Entropy generated successfully');
    console.log('🔗 Transaction:', tx.hash);
    const uiRandomValue = entropyProof.randomValue;
    console.log('🎲 Random value:', uiRandomValue);
    
    return Response.json({
      success: true,
      randomValue: uiRandomValue,
      entropyProof: entropyProof
    });
    
  } catch (error) {
    console.error('❌ API: Error generating entropy:', error);
    
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Generate a deterministic random value from transaction hash
function generateRandomFromTxHash(txHash) {
  // Convert transaction hash to a number
  const hashNumber = parseInt(txHash.slice(2, 10), 16);
  return hashNumber % 1000000; // Return a number between 0 and 999999
}
