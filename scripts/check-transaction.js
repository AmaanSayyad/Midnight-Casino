const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Transaction Details...");

  const [deployer] = await ethers.getSigners();
  const txHash = "0xd0ecf610a6070241e99c82008da0532c5c0edcb663e4bf137cd316277af01bf0";
  
  try {
    const receipt = await deployer.provider.getTransactionReceipt(txHash);
    console.log("📋 Transaction Receipt:");
    console.log("  - Status:", receipt.status);
    console.log("  - Block Number:", receipt.blockNumber);
    console.log("  - Gas Used:", receipt.gasUsed.toString());
    console.log("  - Logs Count:", receipt.logs.length);
    
    console.log("\n📝 Transaction Logs:");
    receipt.logs.forEach((log, index) => {
      console.log(`  ${index + 1}. Address: ${log.address}`);
      console.log(`     Topics: ${log.topics.join(', ')}`);
      console.log(`     Data: ${log.data}`);
      console.log("");
    });
    
    // Try to decode SubscriptionCreated event
    const subscriptionCreatedTopic = ethers.id("SubscriptionCreated(uint64,address)");
    const subscriptionCreatedLog = receipt.logs.find(log => log.topics[0] === subscriptionCreatedTopic);
    
    if (subscriptionCreatedLog) {
      console.log("✅ Found SubscriptionCreated event!");
      const subscriptionId = BigInt(subscriptionCreatedLog.topics[1]).toString();
      const owner = ethers.getAddress(subscriptionCreatedLog.topics[2]);
      console.log("  - Subscription ID:", subscriptionId);
      console.log("  - Owner:", owner);
    } else {
      console.log("❌ SubscriptionCreated event not found");
      
      // Check for other VRF events
      const vrfCoordinatorAddress = "0x6D80646bEAdd07cE68cab36c27c626790bBcf17f";
      const vrfLogs = receipt.logs.filter(log => log.address.toLowerCase() === vrfCoordinatorAddress.toLowerCase());
      
      if (vrfLogs.length > 0) {
        console.log("\n🔍 VRF Coordinator Logs:");
        vrfLogs.forEach((log, index) => {
          console.log(`  ${index + 1}. Topics: ${log.topics.join(', ')}`);
          console.log(`     Data: ${log.data}`);
        });
      }
    }
    
  } catch (error) {
    console.error("❌ Error checking transaction:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



