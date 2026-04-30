require('dotenv').config();
const { ethers } = require('ethers');

// Treasury configuration
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY || "0x080c0b0dc7aa27545fab73d29b06f33e686d1491aef785bf5ced325a32c14506";
const ARBITRUM_SEPOLIA_RPC = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';

async function fundTreasuryForEntropy() {
  try {
    console.log('🏦 Funding Treasury for Pyth Entropy...');
    
    // Create provider and treasury wallet
    const provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
    const treasuryWallet = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);
    
    console.log(`📍 Treasury Address: ${treasuryWallet.address}`);
    
    // Check current balance
    const currentBalance = await provider.getBalance(treasuryWallet.address);
    console.log(`💰 Current Treasury Balance: ${ethers.formatEther(currentBalance)} ETH`);
    
    // Check if we need to fund
    const minRequiredBalance = ethers.parseEther("0.01"); // 0.01 ETH minimum for entropy operations
    
    if (currentBalance >= minRequiredBalance) {
      console.log('✅ Treasury already has sufficient balance for entropy operations');
      return;
    }
    
    console.log('⚠️ Treasury needs funding for entropy operations');
    console.log(`💡 Please send at least ${ethers.formatEther(minRequiredBalance)} ETH to: ${treasuryWallet.address}`);
    console.log(`💡 Current balance: ${ethers.formatEther(currentBalance)} ETH`);
    console.log(`💡 Required: ${ethers.formatEther(minRequiredBalance)} ETH`);
    console.log(`💡 Shortfall: ${ethers.formatEther(minRequiredBalance - currentBalance)} ETH`);
    
    // If running in a script that can send funds automatically
    if (process.env.FUNDER_PRIVATE_KEY) {
      console.log('🔧 Auto-funding enabled...');
      
      const funderWallet = new ethers.Wallet(process.env.FUNDER_PRIVATE_KEY, provider);
      const funderBalance = await provider.getBalance(funderWallet.address);
      
      if (funderBalance < minRequiredBalance) {
        console.log('❌ Funder wallet has insufficient balance');
        return;
      }
      
      const amountToSend = minRequiredBalance - currentBalance;
      console.log(`📤 Sending ${ethers.formatEther(amountToSend)} ETH to treasury...`);
      
      const tx = await funderWallet.sendTransaction({
        to: treasuryWallet.address,
        value: amountToSend,
        gasLimit: 21000
      });
      
      console.log(`📤 Transaction sent: ${tx.hash}`);
      await tx.wait();
      
      const newBalance = await provider.getBalance(treasuryWallet.address);
      console.log(`✅ Treasury funded! New balance: ${ethers.formatEther(newBalance)} ETH`);
    }
    
  } catch (error) {
    console.error('❌ Error funding treasury:', error);
  }
}

// Run the function
fundTreasuryForEntropy();
