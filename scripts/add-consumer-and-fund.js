const { ethers } = require("hardhat");

// Arbitrum Sepolia VRF Configuration
const VRF_CONFIG = {
  COORDINATOR: "0x6D80646bEAdd07cE68cab36c27c626790bBcf17f", // Arbitrum Sepolia VRF Coordinator
  SUBSCRIPTION_ID: "2719622116", // Subscription ID from transaction (0xa21a23e4)
};

// VRF Coordinator ABI
const VRF_COORDINATOR_ABI = [
  "function addConsumer(uint64 subId, address consumer) external",
  "function fundSubscriptionWithNative(uint64 subId) external payable",
];

async function main() {
  console.log("🎰 Adding Consumer and Funding VRF Subscription...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Get VRF Consumer contract address
  const vrfConsumerAddress = process.env.NEXT_PUBLIC_VRF_CONTRACT_ADDRESS || "0xacA996A4d49e7Ed42dA68a20600F249BE6d024A4";
  console.log("VRF Consumer Address:", vrfConsumerAddress);
  console.log("Subscription ID:", VRF_CONFIG.SUBSCRIPTION_ID);

  // Connect to VRF Coordinator
  const vrfCoordinator = new ethers.Contract(VRF_CONFIG.COORDINATOR, VRF_COORDINATOR_ABI, deployer);
  console.log("VRF Coordinator:", VRF_CONFIG.COORDINATOR);

  try {
    // Step 1: Add consumer to subscription
    console.log("\n🔗 Step 1: Adding consumer to subscription...");
    const addConsumerTx = await vrfCoordinator.addConsumer(VRF_CONFIG.SUBSCRIPTION_ID, vrfConsumerAddress);
    console.log("Transaction hash:", addConsumerTx.hash);
    await addConsumerTx.wait();
    console.log("✅ Consumer added to subscription!");

    // Step 2: Fund subscription with ETH (0.01 ETH)
    console.log("\n💰 Step 2: Funding subscription with 0.01 ETH...");
    const fundAmount = ethers.parseEther("0.01");
    const fundTx = await vrfCoordinator.fundSubscriptionWithNative(VRF_CONFIG.SUBSCRIPTION_ID, {
      value: fundAmount
    });
    console.log("Transaction hash:", fundTx.hash);
    await fundTx.wait();
    console.log("✅ Subscription funded with 0.02 ETH!");

    // Step 3: Update VRF Consumer contract with subscription ID
    console.log("\n🔄 Step 3: Updating VRF Consumer contract...");
    const vrfConsumer = await ethers.getContractAt("CasinoVRFConsumer", vrfConsumerAddress);
    const updateTx = await vrfConsumer.updateSubscriptionId(VRF_CONFIG.SUBSCRIPTION_ID);
    await updateTx.wait();
    console.log("✅ VRF Consumer contract updated with subscription ID!");

    console.log("\n🎉 VRF Configuration Complete!");
    console.log("=====================================");
    console.log("Subscription ID:", VRF_CONFIG.SUBSCRIPTION_ID);
    console.log("VRF Coordinator:", VRF_CONFIG.COORDINATOR);
    console.log("Consumer Address:", vrfConsumerAddress);
    console.log("=====================================");
    
    console.log("\n🔗 Explorer Links:");
    console.log(`VRF Coordinator: https://sepolia.arbiscan.io/address/${VRF_CONFIG.COORDINATOR}`);
    console.log(`VRF Consumer: https://sepolia.arbiscan.io/address/${vrfConsumerAddress}`);

  } catch (error) {
    console.error("❌ Error configuring VRF subscription:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Solution: Get more ARB ETH from faucet:");
      console.log("https://faucet.triangleplatform.com/arbitrum/sepolia");
    }
    
    if (error.message.includes("InvalidSubscription")) {
      console.log("\n💡 Solution: Check if subscription ID is correct");
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
