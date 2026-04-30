const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Analyzing Pyth Entropy Contract...");

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
    
    // Try to find function selectors by testing common function names
    const commonFunctions = [
      "getProvider()",
      "provider()",
      "getFee(address)",
      "fee(address)",
      "request(address,bytes32)",
      "requestWithCallback(address,bytes32)",
      "requestRandomness(address,bytes32)",
      "entropy(address,bytes32)"
    ];
    
    console.log("\n🔍 Testing function selectors...");
    
    for (const func of commonFunctions) {
      try {
        const selector = ethers.id(func).slice(0, 10);
        console.log(`Testing ${func} -> ${selector}`);
        
        // Try to call the function
        const result = await deployer.call({
          to: pythEntropyAddress,
          data: selector
        });
        
        if (result && result !== "0x") {
          console.log(`✅ ${func} exists! Result: ${result}`);
        }
      } catch (error) {
        // Function doesn't exist or reverts
      }
    }
    
    // Try to get contract info from Arbiscan
    console.log("\n🔍 Checking Arbiscan for contract info...");
    console.log(`Arbiscan URL: https://sepolia.arbiscan.io/address/${pythEntropyAddress}`);
    
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
