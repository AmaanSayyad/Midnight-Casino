const { ethers } = require("hardhat");

async function main() {
  const txHash = "0x0fdb1c885ef89bd40c9a37b16cdfbb6a7fc4cb15723708384768236701069c5d";
  
  console.log("🔍 Analyzing transaction:", txHash);
  
  const provider = ethers.provider;
  const receipt = await provider.getTransactionReceipt(txHash);
  
  console.log("📋 Transaction Details:");
  console.log("- Block:", receipt.blockNumber);
  console.log("- Status:", receipt.status === 1 ? "✅ Success" : "❌ Failed");
  console.log("- Gas Used:", receipt.gasUsed.toString());
  console.log("- Logs Count:", receipt.logs.length);
  
  // The SubscriptionCreated event signature
  const subscriptionCreatedTopic = "0x464722b4166576d3dcbba877b999bc35cf911f4eaf434b7eba68fa113951d0bf";
  
  console.log("\n🔍 Looking for SubscriptionCreated event...");
  
  for (let i = 0; i < receipt.logs.length; i++) {
    const log = receipt.logs[i];
    console.log(`Log ${i}:`, {
      address: log.address,
      topics: log.topics,
      data: log.data
    });
    
    if (log.topics[0] === subscriptionCreatedTopic) {
      // Parse subscription ID from topics[1]
      const subscriptionId = parseInt(log.topics[1], 16);
      console.log("🎯 Found Subscription ID:", subscriptionId);
      
      // Verify it exists
      const VRF_COORDINATOR_ABI = [
        "function getSubscription(uint64 subId) external view returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers)"
      ];
      
      const vrfCoordinator = new ethers.Contract(
        "0x6D80646bEAdd07cE68cab36c27c626790bBcf17f",
        VRF_COORDINATOR_ABI,
        provider
      );
      
      try {
        const info = await vrfCoordinator.getSubscription(subscriptionId);
        console.log("✅ Subscription verified!");
        console.log("- Owner:", info.owner);
        console.log("- Balance:", ethers.formatEther(info.balance), "LINK");
        
        console.log("\n📝 Update your .env.local:");
        console.log(`VRF_SUBSCRIPTION_ID=${subscriptionId}`);
        
      } catch (error) {
        console.log("❌ Error verifying subscription:", error.message);
      }
      
      return;
    }
  }
  
  console.log("❌ SubscriptionCreated event not found");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });