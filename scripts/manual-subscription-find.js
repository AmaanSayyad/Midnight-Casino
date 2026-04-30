const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Manually Finding Subscription ID...");

  const [deployer] = await ethers.getSigners();
  
  try {
    const vrfCoordinatorAddress = "0x6D80646bEAdd07cE68cab36c27c626790bBcf17f";
    
    // Check if we can find the subscription by trying different IDs
    const checkSubscriptionABI = [
      "function getSubscription(uint64 subId) external view returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers)"
    ];
    const checkContract = new ethers.Contract(vrfCoordinatorAddress, checkSubscriptionABI, deployer);
    
    console.log("🔍 Searching for our subscription...");
    console.log("Our address:", deployer.address);
    
    // Try to find a valid subscription ID
    for (let i = 1; i <= 1000; i++) {
      try {
        const subscription = await checkContract.getSubscription(i);
        if (subscription.owner.toLowerCase() === deployer.address.toLowerCase()) {
          console.log(`\n🎉 Found our subscription: ${i}`);
          console.log("  - Balance:", ethers.formatEther(subscription.balance), "ETH");
          console.log("  - Request Count:", subscription.reqCount.toString());
          console.log("  - Consumers:", subscription.consumers);
          
          // Now let's add consumer and fund
          console.log("\n🔗 Adding consumer...");
          const vrfContractAddress = process.env.NEXT_PUBLIC_VRF_CONTRACT_ADDRESS || "0xacA996A4d49e7Ed42dA68a20600F249BE6d024A4";
          
          const addConsumerABI = [
            "function addConsumer(uint64 subId, address consumer) external"
          ];
          const addConsumerContract = new ethers.Contract(vrfCoordinatorAddress, addConsumerABI, deployer);
          
          const addConsumerTx = await addConsumerContract.addConsumer(i, vrfContractAddress);
          console.log("Add consumer tx:", addConsumerTx.hash);
          await addConsumerTx.wait();
          console.log("✅ Consumer added!");
          
          // Fund subscription
          console.log("\n💰 Funding subscription...");
          const fundABI = [
            "function fundSubscriptionWithNative(uint64 subId) external payable"
          ];
          const fundContract = new ethers.Contract(vrfCoordinatorAddress, fundABI, deployer);
          
          const fundTx = await fundContract.fundSubscriptionWithNative(i, {
            value: ethers.parseEther("0.01")
          });
          console.log("Fund tx:", fundTx.hash);
          await fundTx.wait();
          console.log("✅ Subscription funded!");
          
          console.log("\n🎉 VRF Subscription Setup Complete!");
          console.log("Subscription ID:", i);
          console.log("Consumer Address:", vrfContractAddress);
          
          console.log("\n📝 Update your .env.local file:");
          console.log(`VRF_SUBSCRIPTION_ID=${i}`);
          
          break;
        }
      } catch (error) {
        // Subscription doesn't exist
        if (i % 100 === 0) {
          console.log(`Checked ${i} subscriptions...`);
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Error finding subscription:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



