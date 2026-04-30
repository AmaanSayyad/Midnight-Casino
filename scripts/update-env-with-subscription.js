const fs = require('fs');
const path = require('path');

// Update .env.local with subscription ID
const envPath = path.join(__dirname, '..', '.env.local');

try {
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update subscription ID
  envContent = envContent.replace(
    /VRF_SUBSCRIPTION_ID=.*/,
    'VRF_SUBSCRIPTION_ID=453'
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local updated with subscription ID: 453');
  
} catch (error) {
  console.error('❌ Error updating .env.local:', error.message);
}


