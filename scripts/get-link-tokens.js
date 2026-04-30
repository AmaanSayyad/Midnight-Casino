const { ethers } = require("hardhat");

async function main() {
  console.log("🪙 Getting LINK Tokens for VRF...");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  const linkTokenAddress = "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E"; // Arbitrum Sepolia LINK Token
  const vrfCoordinatorAddress = "0x50d47e4142598E3411aA864e08a44284e471AC6f";
  const subscriptionId = "453";

  try {
    // Check LINK token balance
    console.log("\n🔍 Checking LINK token balance...");
    const linkTokenABI = [
      "function balanceOf(address account) external view returns (uint256)",
      "function transfer(address to, uint256 amount) external returns (bool)",
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function allowance(address owner, address spender) external view returns (uint256)"
    ];
    
    const linkToken = new ethers.Contract(linkTokenAddress, linkTokenABI, deployer);
    const linkBalance = await linkToken.balanceOf(deployer.address);
    console.log("💰 LINK Balance:", ethers.formatEther(linkBalance), "LINK");
    
    if (linkBalance === 0n) {
      console.log("\n❌ No LINK tokens found!");
      console.log("🔗 Please get LINK tokens from Arbitrum Sepolia faucet:");
      console.log("   https://faucets.chain.link/arbitrum-sepolia");
      console.log("\n📝 Steps:");
      console.log("1. Go to the faucet link above");
      console.log("2. Connect your wallet: 0xb424d2369F07b925D1218B08e56700AF5928287b");
      console.log("3. Request LINK tokens");
      console.log("4. Wait for tokens to arrive");
      console.log("5. Run this script again");
      return;
    }
    
    // Check VRF Coordinator allowance
    console.log("\n🔍 Checking VRF Coordinator allowance...");
    const allowance = await linkToken.allowance(deployer.address, vrfCoordinatorAddress);
    console.log("🔐 Allowance:", ethers.formatEther(allowance), "LINK");
    
    if (allowance < ethers.parseEther("1")) {
      console.log("\n🔓 Approving VRF Coordinator to spend LINK tokens...");
      const approveTx = await linkToken.approve(vrfCoordinatorAddress, ethers.parseEther("10"));
      console.log("Transaction hash:", approveTx.hash);
      await approveTx.wait();
      console.log("✅ VRF Coordinator approved!");
    }
    
    // Fund subscription with LINK tokens
    console.log("\n💰 Funding subscription with LINK tokens...");
    const vrfCoordinatorABI = [
      "function fundSubscription(uint64 subId, uint96 amount) external",
      "function getSubscription(uint64 subId) external view returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers)"
    ];
    
    const vrfCoordinator = new ethers.Contract(vrfCoordinatorAddress, vrfCoordinatorABI, deployer);
    
    const fundAmount = ethers.parseEther("1"); // 1 LINK
    const fundTx = await vrfCoordinator.fundSubscription(subscriptionId, fundAmount);
    console.log("Transaction hash:", fundTx.hash);
    await fundTx.wait();
    console.log("✅ Subscription funded with 1 LINK!");
    
    // Check updated balance
    const subscription = await vrfCoordinator.getSubscription(subscriptionId);
    console.log("💰 Subscription Balance:", ethers.formatEther(subscription.balance), "LINK");
    
    console.log("\n🎉 VRF Subscription Funding Complete!");
    console.log("=====================================");
    console.log("Subscription ID:", subscriptionId);
    console.log("Balance:", ethers.formatEther(subscription.balance), "LINK");
    console.log("=====================================");
    
  } catch (error) {
    console.error("❌ Error funding subscription:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

