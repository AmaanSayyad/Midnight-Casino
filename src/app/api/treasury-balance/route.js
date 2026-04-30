import { NextResponse } from 'next/server';
import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { TREASURY_CONFIG } from '@/config/treasury.js';
import PYTH_ENTROPY_CONFIG from '@/config/pythEntropy.js';

export async function GET() {
  try {
    const network = process.env.NEXT_PUBLIC_NETWORK || 'monad-testnet';
    const networkConfig = PYTH_ENTROPY_CONFIG.getNetworkConfig(network);
    
    if (!networkConfig) {
      return NextResponse.json(
        { error: 'Unsupported network' },
        { status: 400 }
      );
    }

    // Create provider
    const provider = new JsonRpcProvider(networkConfig.rpcUrl);
    
    // Create treasury wallet
    const treasuryWallet = new Wallet(TREASURY_CONFIG.PRIVATE_KEY, provider);
    
    // Get treasury balance
    const balance = await provider.getBalance(treasuryWallet.address);
    const balanceInMatic = ethers.formatEther(balance);
    
    // Get entropy contract address
    const entropyContractAddress = PYTH_ENTROPY_CONFIG.getEntropyContract(network);
    
    return NextResponse.json({
      success: true,
      treasury: {
        address: treasuryWallet.address,
        balance: balanceInMatic,
        balanceWei: balance.toString()
      },
      network: {
        name: networkConfig.name,
        chainId: networkConfig.chainId,
        rpcUrl: networkConfig.rpcUrl
      },
      entropy: {
        contractAddress: entropyContractAddress,
        requiredFee: "0.001" // MATIC
      }
    });
    
  } catch (error) {
    console.error('❌ Treasury balance check failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check treasury balance',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
