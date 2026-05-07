const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Casino Entropy Consumer to Midnight Network...");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get deployer account
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No signers available. Please check your private key configuration.");
  }
  
  const deployer = signers[0];
  const deployerAddress = deployer.address;
  console.log(`👤 Deployer: ${deployerAddress}`);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} POL`);

  // Deployment parameters for Midnight Network
  const ARBITRUM_SEPOLIA_ENTROPY_CONTRACT = process.env.NEXT_PUBLIC_POLYGON_PYTH_ENTROPY_CONTRACT || "0x549Ebba8036Ab746611B4fFA1423eb0A4Df61440";
  const ARBITRUM_SEPOLIA_ENTROPY_PROVIDER = process.env.NEXT_PUBLIC_POLYGON_PYTH_ENTROPY_PROVIDER || "0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344";
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || deployerAddress;

  console.log(`🔧 Entropy Contract (Midnight Network): ${ARBITRUM_SEPOLIA_ENTROPY_CONTRACT}`);
  console.log(`🔧 Entropy Provider (Midnight Network): ${ARBITRUM_SEPOLIA_ENTROPY_PROVIDER}`);
  console.log(`🔧 Treasury Address: ${TREASURY_ADDRESS}`);

  try {
    // Deploy CasinoEntropyConsumerV2
    console.log("\n📦 Deploying CasinoEntropyConsumerV2...");
    const CasinoEntropyConsumerV2 = await ethers.getContractFactory("CasinoEntropyConsumerV2");
    
    const casinoContract = await CasinoEntropyConsumerV2.deploy(
      ARBITRUM_SEPOLIA_ENTROPY_CONTRACT,
      ARBITRUM_SEPOLIA_ENTROPY_PROVIDER,
      TREASURY_ADDRESS
    );

    await casinoContract.waitForDeployment();
    const contractAddress = await casinoContract.getAddress();

    console.log(`✅ CasinoEntropyConsumerV2 deployed to: ${contractAddress}`);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const contractInfo = await casinoContract.getContractInfo();
    console.log(`📊 Contract Info:`, {
      contractAddress: contractInfo.contractAddress,
      treasuryAddress: contractInfo.treasuryAddress,
      totalRequests: contractInfo.totalRequests.toString(),
      totalFulfilled: contractInfo.totalFulfilled.toString(),
      contractBalance: ethers.formatEther(contractInfo.contractBalance)
    });

    // Save deployment info
    const deploymentInfo = {
      network: "polygon-amoy",
      chainId: Number(network.chainId),
      contractAddress: contractAddress,
      entropyContract: ARBITRUM_SEPOLIA_ENTROPY_CONTRACT,
      entropyProvider: ARBITRUM_SEPOLIA_ENTROPY_PROVIDER,
      treasuryAddress: TREASURY_ADDRESS,
      deployerAddress: deployerAddress,
      deploymentTime: new Date().toISOString(),
      transactionHash: casinoContract.deploymentTransaction()?.hash,
      blockNumber: await ethers.provider.getBlockNumber()
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment info to file
    const filename = `casino-entropy-polygon-amoy-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

    console.log(`\n💾 Deployment info saved to: ${filepath}`);

    // Update .env file
    console.log("\n📝 Updating .env file...");
    const envPath = path.join(__dirname, "..", ".env");
    let envContent = fs.readFileSync(envPath, "utf8");
    
    // Update or add the contract address
    const contractEnvVar = "NEXT_PUBLIC_POLYGON_CASINO_CONTRACT";
    if (envContent.includes(contractEnvVar)) {
      envContent = envContent.replace(
        new RegExp(`${contractEnvVar}=.*`),
        `${contractEnvVar}=${contractAddress}`
      );
    } else {
      envContent += `\n${contractEnvVar}=${contractAddress}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Updated ${contractEnvVar} in .env file`);

    console.log("\n🎉 Deployment completed successfully!");
    console.log(`\n📋 Summary:`);
    console.log(`   Network: Midnight Network (${network.chainId})`);
    console.log(`   Contract: ${contractAddress}`);
    console.log(`   Entropy Network: Midnight Network`);
    console.log(`   Entropy Contract: ${ARBITRUM_SEPOLIA_ENTROPY_CONTRACT}`);
    console.log(`   Treasury: ${TREASURY_ADDRESS}`);
    console.log(`   Explorer: https://midnight.network/address/${contractAddress}`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });