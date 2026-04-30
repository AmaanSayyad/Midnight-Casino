const { ethers } = require('ethers');

async function checkTreasuryContract() {
  console.log('🔍 Checking Treasury Contract...');
  
  // Monad Testnet RPC
  const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
  
  const treasuryAddress = '0xb424d2369F07b925D1218B08e56700AF5928287b';
  const targetAddress = '0x8Df3b409C23cA8F8A55016557e03D5d296345611';
  
  try {
    // Check if treasury address is a contract
    const code = await provider.getCode(treasuryAddress);
    console.log('📄 Treasury Address:', treasuryAddress);
    console.log('🔧 Is Contract:', code !== '0x');
    console.log('📏 Code Length:', code.length);
    
    if (code !== '0x') {
      console.log('🤖 Treasury is a smart contract!');
      console.log('📝 Contract Code (first 200 chars):', code.substring(0, 200) + '...');
      
      // Check balance
      const balance = await provider.getBalance(treasuryAddress);
      console.log('💰 Treasury Balance:', ethers.formatEther(balance), 'MON');
    } else {
      console.log('👤 Treasury is an EOA (Externally Owned Account)');
      const balance = await provider.getBalance(treasuryAddress);
      console.log('💰 Treasury Balance:', ethers.formatEther(balance), 'MON');
    }
    
    // Check target address
    console.log('\n🎯 Target Address:', targetAddress);
    const targetCode = await provider.getCode(targetAddress);
    console.log('🔧 Target Is Contract:', targetCode !== '0x');
    const targetBalance = await provider.getBalance(targetAddress);
    console.log('💰 Target Balance:', ethers.formatEther(targetBalance), 'MON');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTreasuryContract();