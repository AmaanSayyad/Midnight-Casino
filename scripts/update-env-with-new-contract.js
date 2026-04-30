const fs = require('fs');
const path = require('path');

// Update .env.local with new contract address
const envPath = path.join(__dirname, '..', '.env.local');

try {
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update VRF contract address
  envContent = envContent.replace(
    /NEXT_PUBLIC_VRF_CONTRACT_ADDRESS=.*/,
    'NEXT_PUBLIC_VRF_CONTRACT_ADDRESS=0xe2B5066f1521A4b882053F6D758d4288c5928586'
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local updated with new VRF contract address');
  console.log('📋 New Contract Address: 0xe2B5066f1521A4b882053F6D758d4288c5928586');
  
} catch (error) {
  console.error('❌ Error updating .env.local:', error.message);
}


