const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Treasury Balance and VRF Contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Check VRF contract
  const vrfContractAddress = process.env.NEXT_PUBLIC_VRF_CONTRACT_ADDRESS || "0xacA996A4d49e7Ed42dA68a20600F249BE6d024A4";
  console.log("\n📋 VRF Contract Address:", vrfContractAddress);

  // Get VRF contract info
  const vrfContract = await ethers.getContractAt("CasinoVRFConsumer", vrfContractAddress);
  
  try {
    const treasury = await vrfContract.treasury();
    console.log("🏦 Treasury Address in Contract:", treasury);
    
    const subscriptionId = await vrfContract.s_subscriptionId();
    console.log("📝 Subscription ID in Contract:", subscriptionId.toString());
    
    const keyHash = await vrfContract.keyHash();
    console.log("🔑 Key Hash in Contract:", keyHash);
    
    const callbackGasLimit = await vrfContract.callbackGasLimit();
    console.log("⛽ Callback Gas Limit:", callbackGasLimit.toString());
    
    const requestConfirmations = await vrfContract.requestConfirmations();
    console.log("🔒 Request Confirmations:", requestConfirmations.toString());
    
    // Check if treasury matches
    const treasuryFromEnv = process.env.TREASURY_ADDRESS || "0xb424d2369F07b925D1218B08e56700AF5928287b";
    console.log("\n🔍 Treasury Address from ENV:", treasuryFromEnv);
    console.log("✅ Treasury addresses match:", treasury.toLowerCase() === treasuryFromEnv.toLowerCase());
    
  } catch (error) {
    console.error("❌ Error reading VRF contract:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



