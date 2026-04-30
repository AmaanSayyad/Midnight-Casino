const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Finding Pyth Entropy Functions...");

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Pyth Entropy contract address
  const pythEntropyAddress = "0x549ebba8036ab746611b4ffa1423eb0a4df61440";
  
  try {
    // Get contract bytecode
    const code = await deployer.provider.getCode(pythEntropyAddress);
    console.log("Contract bytecode length:", code.length);
    
    if (code === "0x") {
      console.log("❌ No contract found at this address");
      return;
    }
    
    // Try different function signatures that might exist
    const functionSignatures = [
      // Common entropy functions
      "request(address,bytes32)",
      "requestWithCallback(address,bytes32)",
      "getRandomValue(bytes32)",
      "isRequestFulfilled(bytes32)",
      "getRequest(bytes32)",
      
      // Provider functions
      "getProvider()",
      "provider()",
      "getFee(address)",
      "fee(address)",
      
      // Alternative names
      "entropy(address,bytes32)",
      "random(address,bytes32)",
      "generate(address,bytes32)",
      "requestRandomness(address,bytes32)",
      
      // Simple functions
      "version()",
      "owner()",
      "admin()",
      "paused()",
      "isPaused()"
    ];
    
    console.log("\n🔍 Testing function signatures...");
    const workingFunctions = [];
    
    for (const func of functionSignatures) {
      try {
        const selector = ethers.id(func).slice(0, 10);
        console.log(`Testing ${func} -> ${selector}`);
        
        // Try to call the function with minimal gas
        const result = await deployer.call({
          to: pythEntropyAddress,
          data: selector,
          gasLimit: 100000
        });
        
        if (result && result !== "0x") {
          console.log(`✅ ${func} works! Result: ${result}`);
          workingFunctions.push(func);
        }
      } catch (error) {
        // Function doesn't exist or reverts
        console.log(`❌ ${func} failed: ${error.message.slice(0, 50)}...`);
      }
    }
    
    console.log("\n📋 Working functions found:");
    workingFunctions.forEach(func => console.log(`  - ${func}`));
    
    if (workingFunctions.length === 0) {
      console.log("❌ No working functions found. Contract might be a proxy or have different interface.");
      
      // Try to detect if it's a proxy
      console.log("\n🔍 Checking if it's a proxy contract...");
      try {
        const proxyResult = await deployer.call({
          to: pythEntropyAddress,
          data: "0x5c60da1b" // implementation() selector
        });
        
        if (proxyResult && proxyResult !== "0x") {
          console.log("✅ This might be a proxy contract!");
          console.log("Implementation address:", proxyResult);
        }
      } catch (error) {
        console.log("❌ Not a standard proxy contract");
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
