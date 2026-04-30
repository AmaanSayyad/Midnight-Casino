const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging CasinoEntropyConsumer Contract...");

  // Contract address
  const contractAddress = "0x3670108F005C480500d424424ecB09A2896b64e9";
  
  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Get contract instance
  const CasinoEntropyConsumer = await ethers.getContractFactory("CasinoEntropyConsumer");
  const contract = CasinoEntropyConsumer.attach(contractAddress);

  console.log("\n📋 Contract Info:");
  try {
    const contractInfo = await contract.getContractInfo();
    console.log("Contract Address:", contractInfo[0]);
    console.log("Treasury Address:", contractInfo[1]);
    console.log("Total Requests:", contractInfo[2].toString());
    console.log("Total Fulfilled:", contractInfo[3].toString());
    console.log("Contract Balance:", ethers.formatEther(contractInfo[4]), "ETH");
  } catch (error) {
    console.error("❌ Error getting contract info:", error.message);
  }

  console.log("\n🔍 Testing request function...");
  try {
    // Test with a simple user random number
    const userRandomNumber = ethers.keccak256(ethers.toUtf8Bytes("test_" + Date.now()));
    console.log("User Random Number:", userRandomNumber);
    
    // Check if we have enough balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    // Try to estimate gas first
    try {
      const gasEstimate = await contract.request.estimateGas(userRandomNumber, {
        value: ethers.parseEther("0.001")
      });
      console.log("Gas estimate:", gasEstimate.toString());
    } catch (gasError) {
      console.error("❌ Gas estimation failed:", gasError.message);
    }

    // Try the actual request
    const tx = await contract.request(userRandomNumber, {
      value: ethers.parseEther("0.001"),
      gasLimit: 500000
    });
    
    console.log("✅ Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
  } catch (error) {
    console.error("❌ Request failed:", error.message);
    
    // Try to get more details about the error
    if (error.data) {
      console.log("Error data:", error.data);
    }
    if (error.reason) {
      console.log("Error reason:", error.reason);
    }
  }

  console.log("\n🔍 Checking Pyth Entropy contract...");
  try {
    const pythEntropyAddress = "0x549ebba8036ab746611b4ffa1423eb0a4df61440";
    const pythContract = new ethers.Contract(
      pythEntropyAddress,
      [
        "function getFee(address provider) external view returns (uint128)",
        "function getProvider() external view returns (address)"
      ],
      deployer
    );
    
    const provider = await pythContract.getProvider();
    console.log("Pyth Provider:", provider);
    
    const fee = await pythContract.getFee(provider);
    console.log("Pyth Fee:", ethers.formatEther(fee), "ETH");
    
  } catch (error) {
    console.error("❌ Error checking Pyth contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
