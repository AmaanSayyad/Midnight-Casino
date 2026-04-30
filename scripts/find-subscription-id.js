const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Finding Subscription ID from Transaction...");

  const [deployer] = await ethers.getSigners();
  const txHash = "0xd0ecf610a6070241e99c82008da0532c5c0edcb663e4bf137cd316277af01bf0";
  
  try {
    const receipt = await deployer.provider.getTransactionReceipt(txHash);
    console.log("📋 Transaction Status:", receipt.status === 1 ? "Success" : "Failed");
    
    // Get transaction details
    const tx = await deployer.provider.getTransaction(txHash);
    console.log("📝 Transaction Data:", tx.data);
    
    // Decode the transaction data to find subscription ID
    // The createSubscription function should return the subscription ID
    const vrfCoordinatorAddress = "0x6D80646bEAdd07cE68cab36c27c626790bBcf17f";
    
    // Check if this is a createSubscription call
    const createSubscriptionSelector = "0x7d5e81e2"; // createSubscription() selector
    if (tx.data.startsWith(createSubscriptionSelector)) {
      console.log("✅ This is a createSubscription call");
      
      // The subscription ID should be in the return data
      // Let's try to call the function and get the return value
      const vrfCoordinatorABI = [
        "function createSubscription() external returns (uint64 subId)"
      ];
      
      const vrfCoordinator = new ethers.Contract(vrfCoordinatorAddress, vrfCoordinatorABI, deployer);
      
      try {
        // Call the function to get the subscription ID
        const subscriptionId = await vrfCoordinator.createSubscription.staticCall();
        console.log("🎉 Subscription ID:", subscriptionId.toString());
        
        // Now let's add consumer and fund
        console.log("\n🔗 Adding consumer...");
        const vrfContractAddress = process.env.NEXT_PUBLIC_VRF_CONTRACT_ADDRESS || "0xacA996A4d49e7Ed42dA68a20600F249BE6d024A4";
        
        const addConsumerABI = [
          "function addConsumer(uint64 subId, address consumer) external"
        ];
        const addConsumerContract = new ethers.Contract(vrfCoordinatorAddress, addConsumerABI, deployer);
        
        const addConsumerTx = await addConsumerContract.addConsumer(subscriptionId, vrfContractAddress);
        console.log("Add consumer tx:", addConsumerTx.hash);
        await addConsumerTx.wait();
        console.log("✅ Consumer added!");
        
        // Fund subscription
        console.log("\n💰 Funding subscription...");
        const fundABI = [
          "function fundSubscriptionWithNative(uint64 subId) external payable"
        ];
        const fundContract = new ethers.Contract(vrfCoordinatorAddress, fundABI, deployer);
        
        const fundTx = await fundContract.fundSubscriptionWithNative(subscriptionId, {
          value: ethers.parseEther("0.01")
        });
        console.log("Fund tx:", fundTx.hash);
        await fundTx.wait();
        console.log("✅ Subscription funded!");
        
        console.log("\n🎉 VRF Subscription Setup Complete!");
        console.log("Subscription ID:", subscriptionId.toString());
        console.log("Consumer Address:", vrfContractAddress);
        
        console.log("\n📝 Update your .env.local file:");
        console.log(`VRF_SUBSCRIPTION_ID=${subscriptionId.toString()}`);
        
      } catch (error) {
        console.error("❌ Error calling createSubscription:", error.message);
      }
    } else {
      console.log("❌ This is not a createSubscription call");
    }
    
  } catch (error) {
    console.error("❌ Error finding subscription ID:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



