const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Updating VRF Contract with New Subscription ID...");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  const vrfContractAddress = process.env.NEXT_PUBLIC_VRF_CONTRACT_ADDRESS || "0xacA996A4d49e7Ed42dA68a20600F249BE6d024A4";
  const subscriptionId = "453";

  try {
    const vrfContract = await ethers.getContractAt("CasinoVRFConsumer", vrfContractAddress);
    
    console.log("\n🔄 Updating VRF contract with subscription ID:", subscriptionId);
    const updateTx = await vrfContract.updateSubscriptionId(subscriptionId);
    console.log("Transaction hash:", updateTx.hash);
    await updateTx.wait();
    console.log("✅ VRF contract updated with subscription ID!");
    
    // Verify the update
    const currentSubscriptionId = await vrfContract.s_subscriptionId();
    console.log("📋 Current Subscription ID in contract:", currentSubscriptionId.toString());
    
    console.log("\n🎉 VRF Contract Update Complete!");
    
  } catch (error) {
    console.error("❌ Error updating VRF contract:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


