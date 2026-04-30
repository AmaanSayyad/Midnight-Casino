const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing Pyth Entropy Contract Directly...");

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Pyth Entropy contract address
  const pythEntropyAddress = "0x549ebba8036ab746611b4ffa1423eb0a4df61440";
  
  // Create contract instance with basic ABI
  const pythContract = new ethers.Contract(
    pythEntropyAddress,
    [
      "function getProvider() external view returns (address)",
      "function getFee(address provider) external view returns (uint128)",
      "function requestWithCallback(address provider, bytes32 userRandomNumber) external payable returns (uint64)",
      "function request(address provider, bytes32 userRandomNumber) external payable returns (uint64)"
    ],
    deployer
  );

  try {
    console.log("\n🔍 Getting Pyth provider...");
    const provider = await pythContract.getProvider();
    console.log("Provider:", provider);

    console.log("\n🔍 Getting fee...");
    const fee = await pythContract.getFee(provider);
    console.log("Fee:", ethers.formatEther(fee), "ETH");

    console.log("\n🔍 Testing direct request...");
    const userRandomNumber = ethers.keccak256(ethers.toUtf8Bytes("test_" + Date.now()));
    console.log("User Random Number:", userRandomNumber);

    // Try direct request first
    const tx = await pythContract.request(provider, userRandomNumber, {
      value: fee,
      gasLimit: 500000
    });
    
    console.log("✅ Direct request sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
    // Check logs
    console.log("📋 Transaction logs:", receipt.logs.length);
    for (let i = 0; i < receipt.logs.length; i++) {
      console.log(`Log ${i}:`, {
        address: receipt.logs[i].address,
        topics: receipt.logs[i].topics,
        data: receipt.logs[i].data
      });
    }

  } catch (error) {
    console.error("❌ Direct request failed:", error.message);
    
    // Try to get more details
    if (error.data) {
      console.log("Error data:", error.data);
    }
    if (error.reason) {
      console.log("Error reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
