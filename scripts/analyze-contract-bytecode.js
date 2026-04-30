const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Analyzing Contract Bytecode...");

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
    
    // Try to find function selectors in bytecode
    console.log("\n🔍 Searching for function selectors in bytecode...");
    
    // Common function selectors to look for
    const commonSelectors = [
      "0x3e68a932", // request(address,bytes32)
      "0x19cb825f", // requestWithCallback(address,bytes32)
      "0x080d840c", // getRandomValue(bytes32)
      "0x92a442ea", // isRequestFulfilled(bytes32)
      "0xfb1e61ca", // getRequest(bytes32)
      "0x483d45bd", // getProvider()
      "0x085d4883", // provider()
      "0xb88c9148", // getFee(address)
      "0x6fcca69b", // fee(address)
      "0x54fd4d50", // version()
      "0x8da5cb5b", // owner()
      "0x5c60da1b", // implementation()
      "0x3659cfe6", // upgradeTo(address)
      "0x4f1ef286", // upgradeToAndCall(address,bytes)
      "0x8f283970", // changeAdmin(address)
      "0xf851a440", // admin()
      "0x5c975abb", // paused()
      "0xb187bd26", // isPaused()
      "0x8456cb59", // pause()
      "0x3f4ba83a", // unpause()
    ];
    
    const foundSelectors = [];
    
    for (const selector of commonSelectors) {
      if (code.includes(selector)) {
        foundSelectors.push(selector);
        console.log(`✅ Found selector: ${selector}`);
      }
    }
    
    console.log(`\n📋 Found ${foundSelectors.length} selectors in bytecode`);
    
    // Try to decode version string
    console.log("\n🔍 Decoding version...");
    try {
      const versionResult = await deployer.call({
        to: pythEntropyAddress,
        data: "0x54fd4d50"
      });
      
      if (versionResult && versionResult !== "0x") {
        // Decode the string
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["string"], versionResult);
        console.log("Version:", decoded[0]);
      }
    } catch (error) {
      console.log("❌ Could not decode version");
    }
    
    // Try to get owner
    console.log("\n🔍 Getting owner...");
    try {
      const ownerResult = await deployer.call({
        to: pythEntropyAddress,
        data: "0x8da5cb5b"
      });
      
      if (ownerResult && ownerResult !== "0x") {
        const owner = ethers.getAddress("0x" + ownerResult.slice(-40));
        console.log("Owner:", owner);
      }
    } catch (error) {
      console.log("❌ Could not get owner");
    }
    
    // Check if it's a proxy
    console.log("\n🔍 Checking if it's a proxy...");
    try {
      const implementationResult = await deployer.call({
        to: pythEntropyAddress,
        data: "0x5c60da1b" // implementation()
      });
      
      if (implementationResult && implementationResult !== "0x") {
        const implementation = ethers.getAddress("0x" + implementationResult.slice(-40));
        console.log("✅ This is a proxy contract!");
        console.log("Implementation:", implementation);
        
        // Check implementation contract
        const implCode = await deployer.provider.getCode(implementation);
        console.log("Implementation bytecode length:", implCode.length);
      }
    } catch (error) {
      console.log("❌ Not a standard proxy contract");
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
