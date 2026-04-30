const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Decoding Transaction Return Value...");

  const [deployer] = await ethers.getSigners();
  const txHash = "0xd0ecf610a6070241e99c82008da0532c5c0edcb663e4bf137cd316277af01bf0";
  
  try {
    // Get transaction details
    const tx = await deployer.provider.getTransaction(txHash);
    const receipt = await deployer.provider.getTransactionReceipt(txHash);
    
    console.log("📋 Transaction Details:");
    console.log("  - From:", tx.from);
    console.log("  - To:", tx.to);
    console.log("  - Data:", tx.data);
    console.log("  - Status:", receipt.status);
    
    // The transaction data is 0xa21a23e4 which is createSubscription()
    // Let's try to simulate the transaction to get the return value
    const vrfCoordinatorAddress = "0x6D80646bEAdd07cE68cab36c27c626790bBcf17f";
    
    if (tx.to?.toLowerCase() === vrfCoordinatorAddress.toLowerCase()) {
      console.log("\n🎯 Simulating createSubscription call...");
      
      try {
        // Use callStatic to simulate the transaction
        const vrfCoordinatorABI = [
          "function createSubscription() external returns (uint64 subId)"
        ];
        
        const vrfCoordinator = new ethers.Contract(vrfCoordinatorAddress, vrfCoordinatorABI, deployer);
        
        // Simulate the call at the same block
        const result = await vrfCoordinator.createSubscription.staticCall({
          blockTag: receipt.blockNumber
        });
        
        console.log("🎉 Subscription ID from simulation:", result.toString());
        
        // Now let's verify this subscription exists
        const checkABI = [
          "function getSubscription(uint64 subId) external view returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers)"
        ];
        const checkContract = new ethers.Contract(vrfCoordinatorAddress, checkABI, deployer);
        
        const subscription = await checkContract.getSubscription(result);
        console.log("\n📋 Subscription Details:");
        console.log("  - Balance:", ethers.formatEther(subscription.balance), "ETH");
        console.log("  - Request Count:", subscription.reqCount.toString());
        console.log("  - Owner:", subscription.owner);
        console.log("  - Consumers:", subscription.consumers);
        
        if (subscription.owner.toLowerCase() === deployer.address.toLowerCase()) {
          console.log("\n✅ This is our subscription!");
          
          // Add consumer and fund
          console.log("\n🔗 Adding consumer...");
          const vrfContractAddress = process.env.NEXT_PUBLIC_VRF_CONTRACT_ADDRESS || "0xacA996A4d49e7Ed42dA68a20600F249BE6d024A4";
          
          const addConsumerABI = [
            "function addConsumer(uint64 subId, address consumer) external"
          ];
          const addConsumerContract = new ethers.Contract(vrfCoordinatorAddress, addConsumerABI, deployer);
          
          const addConsumerTx = await addConsumerContract.addConsumer(result, vrfContractAddress);
          console.log("Add consumer tx:", addConsumerTx.hash);
          await addConsumerTx.wait();
          console.log("✅ Consumer added!");
          
          // Fund subscription
          console.log("\n💰 Funding subscription...");
          const fundABI = [
            "function fundSubscriptionWithNative(uint64 subId) external payable"
          ];
          const fundContract = new ethers.Contract(vrfCoordinatorAddress, fundABI, deployer);
          
          const fundTx = await fundContract.fundSubscriptionWithNative(result, {
            value: ethers.parseEther("0.01")
          });
          console.log("Fund tx:", fundTx.hash);
          await fundTx.wait();
          console.log("✅ Subscription funded!");
          
          console.log("\n🎉 VRF Subscription Setup Complete!");
          console.log("Subscription ID:", result.toString());
          console.log("Consumer Address:", vrfContractAddress);
          
          console.log("\n📝 Update your .env.local file:");
          console.log(`VRF_SUBSCRIPTION_ID=${result.toString()}`);
          
        } else {
          console.log("❌ This is not our subscription");
        }
        
      } catch (error) {
        console.error("❌ Error simulating transaction:", error.message);
        
        // If simulation fails, let's try to find the subscription by checking recent blocks
        console.log("\n🔄 Trying to find subscription by checking recent blocks...");
        
        const currentBlock = await deployer.provider.getBlockNumber();
        console.log("Current block:", currentBlock);
        
        // Check if we can find the subscription by trying different IDs
        const checkSubscriptionABI = [
          "function getSubscription(uint64 subId) external view returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers)"
        ];
        const checkContract = new ethers.Contract(vrfCoordinatorAddress, checkSubscriptionABI, deployer);
        
        // Try to find a valid subscription ID
        for (let i = 1; i <= 100; i++) {
          try {
            const subscription = await checkContract.getSubscription(i);
            if (subscription.owner.toLowerCase() === deployer.address.toLowerCase()) {
              console.log(`🎉 Found our subscription: ${i}`);
              console.log("  - Balance:", ethers.formatEther(subscription.balance), "ETH");
              console.log("  - Request Count:", subscription.reqCount.toString());
              console.log("  - Consumers:", subscription.consumers);
              break;
            }
          } catch (error) {
            // Subscription doesn't exist
          }
        }
      }
    } else {
      console.log("❌ This is not a VRF Coordinator transaction");
    }
    
  } catch (error) {
    console.error("❌ Error decoding transaction return:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



