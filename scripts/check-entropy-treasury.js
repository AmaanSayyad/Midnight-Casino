const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Entropy Treasury Balance...");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get signer
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  console.log(`👤 Signer: ${signerAddress}`);

  // Check signer balance
  const signerBalance = await ethers.provider.getBalance(signerAddress);
  console.log(`💰 Signer Balance: ${ethers.formatEther(signerBalance)} ETH`);

  // Treasury address from env
  const treasuryAddress = process.env.ARBITRUM_TREASURY_ADDRESS || process.env.TREASURY_ADDRESS;
  console.log(`🏦 Treasury Address: ${treasuryAddress}`);

  // Check treasury balance
  const treasuryBalance = await ethers.provider.getBalance(treasuryAddress);
  console.log(`💰 Treasury Balance: ${ethers.formatEther(treasuryBalance)} ETH`);

  // Entropy contract address
  const entropyContract = process.env.NEXT_PUBLIC_POLYGON_PYTH_ENTROPY_CONTRACT || "0x549Ebba8036Ab746611B4fFA1423eb0A4Df61440";
  console.log(`🎲 Entropy Contract: ${entropyContract}`);

  // Check if we have enough for entropy fee (0.001 ETH)
  const entropyFee = ethers.parseEther("0.001");
  console.log(`💸 Entropy Fee: ${ethers.formatEther(entropyFee)} ETH`);

  if (treasuryBalance >= entropyFee) {
    console.log("✅ Treasury has sufficient balance for entropy operations");
  } else {
    console.log("❌ Treasury needs more ETH for entropy operations");
    const needed = entropyFee - treasuryBalance;
    console.log(`💸 Need additional: ${ethers.formatEther(needed)} ETH`);
  }

  // Check if we can send some ETH to treasury if needed
  if (treasuryBalance < entropyFee && signerBalance > ethers.parseEther("0.01")) {
    console.log("\n🔄 Would you like to send ETH to treasury? (This is just a check, not executing)");
    const amountToSend = ethers.parseEther("0.1"); // 0.1 ETH
    console.log(`💸 Could send: ${ethers.formatEther(amountToSend)} ETH to treasury`);
  }

  console.log("\n📊 Summary:");
  console.log(`   Treasury: ${ethers.formatEther(treasuryBalance)} ETH`);
  console.log(`   Required: ${ethers.formatEther(entropyFee)} ETH`);
  console.log(`   Status: ${treasuryBalance >= entropyFee ? '✅ Sufficient' : '❌ Insufficient'}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });