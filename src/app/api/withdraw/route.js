import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Polygon Amoy Treasury private key from environment
const POLYGON_TREASURY_PRIVATE_KEY = process.env.POLYGON_TREASURY_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY;

// Polygon Amoy Testnet RPC URL
const POLYGON_AMOY_RPC = process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology';

// Create provider and wallet
const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
const treasuryWallet = POLYGON_TREASURY_PRIVATE_KEY ? new ethers.Wallet(POLYGON_TREASURY_PRIVATE_KEY, provider) : null;

export async function POST(request) {
  try {
    const { userAddress, amount } = await request.json();

    console.log('📥 Received withdrawal request:', { userAddress, amount, type: typeof userAddress });

    // Validate input
    if (!userAddress || !amount || amount <= 0) {
      return new Response(JSON.stringify({
        error: 'Invalid parameters'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    if (!POLYGON_TREASURY_PRIVATE_KEY || !treasuryWallet) {
      return NextResponse.json(
        { error: 'Treasury not configured. Please set POLYGON_TREASURY_PRIVATE_KEY environment variable.' },
        { status: 500 }
      );
    }

    console.log(`🏦 Processing withdrawal: ${amount} MATIC to ${userAddress}`);
    console.log(`📍 Treasury: ${treasuryWallet?.address || 'Not configured'}`);

    // Check treasury balance
    let treasuryBalance = 0;
    try {
      treasuryBalance = await provider.getBalance(treasuryWallet.address);
      console.log(`💰 Treasury balance: ${ethers.formatEther(treasuryBalance)} MATIC`);
    } catch (balanceError) {
      console.log('⚠️ Could not check treasury balance, proceeding with transfer attempt...');
      console.log('Balance error:', balanceError.message);
    }

    // Check if treasury has sufficient funds
    const amountWei = ethers.parseEther(amount.toString());
    if (treasuryBalance < amountWei) {
      return NextResponse.json(
        { error: `Insufficient treasury funds. Available: ${ethers.formatEther(treasuryBalance)} MATIC, Requested: ${amount} MATIC` },
        { status: 400 }
      );
    }

    // Format user address
    let formattedUserAddress;
    if (typeof userAddress === 'object' && userAddress.data) {
      // Convert Uint8Array-like object to hex string
      const bytes = Object.values(userAddress.data);
      formattedUserAddress = '0x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    } else if (typeof userAddress === 'string') {
      formattedUserAddress = userAddress.startsWith('0x') ? userAddress : `0x${userAddress}`;
    } else {
      throw new Error(`Invalid userAddress format: ${typeof userAddress}`);
    }

    console.log('🔧 Formatted user address:', formattedUserAddress);
    console.log('🔧 Treasury account:', treasuryWallet.address);
    console.log('🔧 Amount in Wei:', amountWei.toString());

    // Send transaction from treasury to user
    const tx = await treasuryWallet.sendTransaction({
      to: formattedUserAddress,
      value: amountWei,
      gasLimit: process.env.GAS_LIMIT_WITHDRAW ? parseInt(process.env.GAS_LIMIT_WITHDRAW) : 100000
    });

    console.log(`📤 Transaction sent: ${tx.hash}`);

    // Return transaction hash immediately without waiting for confirmation
    // User can check transaction status on Etherscan
    console.log(`✅ Withdraw MATIC to ${userAddress}, TX: ${tx.hash}`);

    return new Response(JSON.stringify({
      success: true,
      transactionHash: tx.hash,
      amount: amount,
      userAddress: userAddress,
      treasuryAddress: treasuryWallet.address,
      status: 'pending',
      message: 'Transaction sent successfully. Check PolygonScan for confirmation.',
      explorerUrl: `https://amoy.polygonscan.com/tx/${tx.hash}`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Withdraw API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Ensure error message is a string
    const errorMessage = error?.message || 'Unknown error occurred';
    const safeErrorMessage = typeof errorMessage === 'string' ? errorMessage : 'Unknown error occurred';

    return new Response(JSON.stringify({
      error: `Withdrawal failed: ${safeErrorMessage}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// GET endpoint to check treasury balance
export async function GET() {
  try {
    if (!POLYGON_TREASURY_PRIVATE_KEY || !treasuryWallet) {
      return NextResponse.json(
        { error: 'Treasury not configured' },
        { status: 500 }
      );
    }

    try {
      const balance = await provider.getBalance(treasuryWallet.address);
      const balanceInMatic = ethers.formatEther(balance);

      return NextResponse.json({
        treasuryAddress: treasuryWallet.address,
        balance: parseFloat(balanceInMatic),
        balanceWei: balance.toString(),
        status: 'active',
        network: 'Polygon Amoy'
      });
    } catch (balanceError) {
      console.error('Balance check error:', balanceError);
      return NextResponse.json({
        treasuryAddress: treasuryWallet.address,
        balance: 0,
        balanceWei: '0',
        status: 'error',
        error: balanceError.message,
        network: 'Polygon Amoy'
      });
    }

  } catch (error) {
    console.error('Treasury balance check error:', error);
    return NextResponse.json(
      { error: 'Failed to check treasury balance: ' + error.message },
      { status: 500 }
    );
  }
}