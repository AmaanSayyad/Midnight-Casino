const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Checking Treasury Balance...");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  const vrfContractAddress = "0xe2B5066f1521A4b882053F6D758d4288c5928586";
  const vrfContract = await ethers.getContractAt("CasinoVRFConsumer", vrfContractAddress);

  try {
    // Check contract info
    console.log("\n📋 VRF Contract Info:");
    const contractInfo = await vrfContract.getContractInfo();
    console.log("  - Contract Address:", contractInfo.contractAddress);
    console.log("  - Treasury Address:", contractInfo.treasuryAddress);
    console.log("  - Subscription ID:", contractInfo.subscriptionId.toString());
    console.log("  - Total Requests:", contractInfo.totalRequests.toString());
    console.log("  - Total Fulfilled:", contractInfo.totalFulfilled.toString());
    
    // Check if treasury has enough funds
    const treasuryBalance = await deployer.provider.getBalance(contractInfo.treasuryAddress);
    console.log("\n💰 Treasury Balance:", ethers.formatEther(treasuryBalance), "ETH");
    
    if (treasuryBalance < ethers.parseEther("0.2")) {
      console.log("\n❌ Treasury needs more ARB ETH!");
      console.log("🔗 Please fund the treasury wallet:");
      console.log("   Address: 0xb424d2369F07b925D1218B08e56700AF5928287b");
      console.log("   Faucet: https://faucet.triangleplatform.com/arbitrum/sepolia");
      console.log("   Amount needed: At least 0.2 ARB ETH");
    } else {
      console.log("✅ Treasury has sufficient funds!");
    }
    
  } catch (error) {
    console.error("❌ Error checking treasury balance:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

