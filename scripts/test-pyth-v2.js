const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing Pyth Entropy V2 Interface...");

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Pyth Entropy contract address
  const pythEntropyAddress = "0x549ebba8036ab746611b4ffa1423eb0a4df61440";
  
  // Create contract instance with V2 ABI
  const pythContract = new ethers.Contract(
    pythEntropyAddress,
    [
      "function requestV2(uint32 gasLimit) external payable returns (uint64)",
      "function getRandomValue(bytes32 requestId) external view returns (bytes32)",
      "function isRequestFulfilled(bytes32 requestId) external view returns (bool)",
      "function getRequest(bytes32 requestId) external view returns (bool, bytes32, uint64, uint256)",
      "function getFeeV2(uint32 gasLimit) external view returns (uint256)",
      "function getFeeV2() external view returns (uint256)",
      "function getProvider() external view returns (address)",
      "event RandomnessRequested(bytes32 indexed requestId, address indexed provider, bytes32 userRandomNumber, uint64 sequenceNumber, address requester)",
      "event RandomnessFulfilled(bytes32 indexed requestId, bytes32 randomValue)"
    ],
    deployer
  );

  try {
    console.log("\n🔍 Testing Pyth Entropy V2 functions...");
    
    // Test getProvider
    try {
      const provider = await pythContract.getProvider();
      console.log("✅ getProvider():", provider);
    } catch (error) {
      console.log("❌ getProvider() failed:", error.message);
    }
    
    // Test getFeeV2 with default gas limit
    try {
      const defaultFee = await pythContract.getFeeV2();
      console.log("✅ getFeeV2() (default):", ethers.formatEther(defaultFee), "ETH");
    } catch (error) {
      console.log("❌ getFeeV2() (default) failed:", error.message);
    }
    
    // Test getFeeV2 with custom gas limit
    try {
      const customGasLimit = 100000; // Reduced gas limit for faster execution
      const customFee = await pythContract.getFeeV2(customGasLimit);
      console.log(`✅ getFeeV2(${customGasLimit}):`, ethers.formatEther(customFee), "ETH");
    } catch (error) {
      console.log("❌ getFeeV2(custom) failed:", error.message);
    }
    
    // Test requestV2
    console.log("\n🔍 Testing requestV2 function...");
    
    // Get fee first
    let fee;
    try {
      const customGasLimit = 200000;
      fee = await pythContract.getFeeV2(customGasLimit);
      console.log("Fee:", ethers.formatEther(fee), "ETH");
    } catch (error) {
      console.log("Using default fee");
      fee = ethers.parseEther("0.001");
    }
    
    const customGasLimit = 200000;
    const tx = await pythContract.requestV2(customGasLimit, {
      value: fee,
      gasLimit: 500000
    });
    
    console.log("✅ RequestV2 sent:", tx.hash);
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
    console.error("❌ Test failed:", error.message);
    
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
