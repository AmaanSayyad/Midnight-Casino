const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Updating VRF Subscription ID...");
  
  const contractAddress = process.env.NEXT_PUBLIC_VRF_CONTRACT_ADDRESS;
  const subscriptionId = process.env.VRF_SUBSCRIPTION_ID;
  
  if (!contractAddress) {
    throw new Error("NEXT_PUBLIC_VRF_CONTRACT_ADDRESS not set in .env.local");
  }
  
  if (!subscriptionId) {
    throw new Error("VRF_SUBSCRIPTION_ID not set in .env.local");
  }
  
  console.log("Contract Address:", contractAddress);
  console.log("Subscription ID:", subscriptionId);
  
  // Get contract instance
  const CasinoVRFConsumer = await ethers.getContractFactory("CasinoVRFConsumer");
  const contract = CasinoVRFConsumer.attach(contractAddress);
  
  // Update subscription ID
  console.log("📝 Updating subscription ID...");
  const tx = await contract.updateSubscriptionId(subscriptionId);
  console.log("🔗 Transaction hash:", tx.hash);
  
  // Wait for confirmation
  await tx.wait();
  console.log("✅ Subscription ID updated successfully!");
  
  // Verify the update
  const contractInfo = await contract.getContractInfo();
  console.log("\n📊 Updated Contract Info:");
  console.log("- Subscription ID:", contractInfo.subscriptionId.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Update failed:", error);
    process.exit(1);
  });