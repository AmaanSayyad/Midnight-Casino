const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log('Treasury Address:', signer.address);
  const balance = await signer.provider.getBalance(signer.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH');
}

main().catch(console.error);