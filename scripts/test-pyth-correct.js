const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing Pyth Entropy with Correct Provider...");

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Pyth Entropy contract address
  const pythEntropyAddress = "0x549ebba8036ab746611b4ffa1423eb0a4df61440";
  const providerAddress = "0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344";
  
  // Create contract instance with correct ABI
  const pythContract = new ethers.Contract(
    pythEntropyAddress,
    [
      "function request(address provider, bytes32 userRandomNumber) external payable returns (uint64)",
      "function requestWithCallback(address provider, bytes32 userRandomNumber) external payable returns (uint64)",
      "function getRandomValue(bytes32 requestId) external view returns (bytes32)",
      "function isRequestFulfilled(bytes32 requestId) external view returns (bool)",
      "function getRequest(bytes32 requestId) external view returns (bool, bytes32, uint64, uint256)",
      "function getFee(address provider) external view returns (uint128)",
      "function getProvider() external view returns (address)",
      "event RandomnessRequested(bytes32 indexed requestId, address indexed provider, bytes32 userRandomNumber, uint64 sequenceNumber, address requester)",
      "event RandomnessFulfilled(bytes32 indexed requestId, bytes32 randomValue)"
    ],
    deployer
  );

  try {
    console.log("\n🔍 Testing Pyth Entropy functions...");
    
    // Test getProvider
    try {
      const provider = await pythContract.getProvider();
      console.log("✅ getProvider():", provider);
    } catch (error) {
      console.log("❌ getProvider() failed:", error.message);
    }
    
    // Test getFee
    try {
      const fee = await pythContract.getFee(providerAddress);
      console.log("✅ getFee():", ethers.formatEther(fee), "ETH");
    } catch (error) {
      console.log("❌ getFee() failed:", error.message);
    }
    
    // Test request
    console.log("\n🔍 Testing request function...");
    const userRandomNumber = ethers.keccak256(ethers.toUtf8Bytes("test_" + Date.now()));
    console.log("User Random Number:", userRandomNumber);
    
    // Get fee first
    let fee;
    try {
      fee = await pythContract.getFee(providerAddress);
      console.log("Fee:", ethers.formatEther(fee), "ETH");
    } catch (error) {
      console.log("Using default fee");
      fee = ethers.parseEther("0.001");
    }
    
    const tx = await pythContract.request(providerAddress, userRandomNumber, {
      value: fee,
      gasLimit: 500000
    });
    
    console.log("✅ Request sent:", tx.hash);
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
