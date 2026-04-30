const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking VRF Subscription Status...");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  const subscriptionId = "453";
  const vrfCoordinatorAddress = "0x50d47e4142598E3411aA864e08a44284e471AC6f";
  const vrfContractAddress = "0xe2B5066f1521A4b882053F6D758d4288c5928586";

  try {
    const vrfCoordinatorABI = [
      "function getSubscription(uint64 subId) external view returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers)",
      "function getRequestConfig() external view returns (uint16 minimumRequestConfirmations, uint32 maxGasLimit, uint32 maxNumWords)"
    ];
    
    const vrfCoordinator = new ethers.Contract(vrfCoordinatorAddress, vrfCoordinatorABI, deployer.provider);
    
    console.log("\n📋 VRF Coordinator Address:", vrfCoordinatorAddress);
    console.log("📝 Subscription ID:", subscriptionId);
    
    // Check subscription details
    const subscription = await vrfCoordinator.getSubscription(subscriptionId);
    console.log("\n💰 Subscription Details:");
    console.log("  - Balance:", ethers.formatEther(subscription.balance), "ETH");
    console.log("  - Request Count:", subscription.reqCount.toString());
    console.log("  - Owner:", subscription.owner);
    console.log("  - Consumers:", subscription.consumers);
    
    // Check if our contract is in consumers
    const isConsumer = subscription.consumers.includes(vrfContractAddress);
    console.log("  - Our contract is consumer:", isConsumer);
    
    // Check VRF configuration
    const requestConfig = await vrfCoordinator.getRequestConfig();
    console.log("\n⚙️ VRF Request Config:");
    console.log("  - Minimum Request Confirmations:", requestConfig.minimumRequestConfirmations);
    console.log("  - Max Gas Limit:", requestConfig.maxGasLimit);
    console.log("  - Max Num Words:", requestConfig.maxNumWords);
    
    // Try to fund with smaller amount
    if (subscription.balance === 0n) {
      console.log("\n💰 Attempting to fund subscription with 0.005 ETH...");
      const fundABI = [
        "function fundSubscriptionWithNative(uint64 subId) external payable"
      ];
      const fundContract = new ethers.Contract(vrfCoordinatorAddress, fundABI, deployer);
      
      try {
        const fundTx = await fundContract.fundSubscriptionWithNative(subscriptionId, {
          value: ethers.parseEther("0.005")
        });
        console.log("Transaction hash:", fundTx.hash);
        await fundTx.wait();
        console.log("✅ Subscription funded with 0.005 ETH!");
        
        // Check balance again
        const updatedSubscription = await vrfCoordinator.getSubscription(subscriptionId);
        console.log("💰 Updated Balance:", ethers.formatEther(updatedSubscription.balance), "ETH");
        
      } catch (error) {
        console.error("❌ Error funding subscription:", error.message);
      }
    }
    
  } catch (error) {
    console.error("❌ Error checking subscription:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


