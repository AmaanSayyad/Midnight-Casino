const { ethers } = require('ethers');

function generateNewTreasury() {
  console.log('🏦 Generating New Treasury Wallet...');
  
  // Generate a new random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log('✅ New Treasury Generated:');
  console.log('📍 Address:', wallet.address);
  console.log('🔑 Private Key:', wallet.privateKey);
  console.log('🌱 Mnemonic:', wallet.mnemonic.phrase);
  
  console.log('\n📝 Add these to your .env file:');
  console.log(`TREASURY_ADDRESS=${wallet.address}`);
  console.log(`TREASURY_PRIVATE_KEY=${wallet.privateKey}`);
  
  console.log('\n⚠️  IMPORTANT:');
  console.log('1. Save the private key and mnemonic securely');
  console.log('2. Fund this address with MON tokens for withdrawals');
  console.log('3. Update your .env file with the new address');
  console.log('4. Never share the private key publicly');
}

generateNewTreasury();