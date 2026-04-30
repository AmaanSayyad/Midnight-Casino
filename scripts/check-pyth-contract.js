const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Pyth Entropy Contract...");

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Pyth Entropy contract address
  const pythEntropyAddress = "0x549ebba8036ab746611b4ffa1423eb0a4df61440";
  
  try {
    // Check if contract exists
    const code = await deployer.provider.getCode(pythEntropyAddress);
    console.log("Contract code length:", code.length);
    
    if (code === "0x") {
      console.log("❌ No contract found at this address");
      return;
    }
    
    console.log("✅ Contract exists at address");
    
    // Try to create a simple contract instance
    const pythContract = new ethers.Contract(
      pythEntropyAddress,
      [
        "function getProvider() external view returns (address)"
      ],
      deployer
    );

    console.log("\n🔍 Testing getProvider...");
    const provider = await pythContract.getProvider();
    console.log("✅ Provider:", provider);

  } catch (error) {
    console.error("❌ Error:", error.message);
    
    // Try different approaches
    console.log("\n🔍 Trying alternative approach...");
    
    // Check if it's a different interface
    try {
      const altContract = new ethers.Contract(
        pythEntropyAddress,
        [
          "function provider() external view returns (address)"
        ],
        deployer
      );
      
      const provider = await altContract.provider();
      console.log("✅ Alternative provider:", provider);
      
    } catch (altError) {
      console.error("❌ Alternative approach failed:", altError.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
