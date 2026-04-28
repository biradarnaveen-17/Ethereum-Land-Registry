const { ethers } = require("hardhat");

async function main() {
  const [government, seller, buyer] = await ethers.getSigners();
  const Base = await ethers.getContractFactory("LandRegistryBase");
  const Optimized = await ethers.getContractFactory("LandRegistryOptimized");

  const base = await Base.deploy();
  const optimized = await Optimized.deploy();
  await base.waitForDeployment();
  await optimized.waitForDeployment();

  const location = "Survey 42, Bengaluru North";
  const documentHash = "ipfs://demo-land-document";

  await (await base.connect(seller).registerLand(location, 2400, documentHash)).wait();
  await (await base.verifyLand(1)).wait();
  await (await base.connect(seller).requestTransfer(1, buyer.address)).wait();

  await (await optimized.connect(seller).registerLand(ethers.id(location), 2400, ethers.id(documentHash))).wait();
  await (await optimized.verifyLand(1)).wait();
  await (await optimized.connect(seller).requestTransfer(1, buyer.address)).wait();

  console.log("Government:", government.address);
  console.log("Seller:", seller.address);
  console.log("Buyer:", buyer.address);
  console.log("Base contract:", await base.getAddress());
  console.log("Optimized contract:", await optimized.getAddress());
  console.log("Demo data: land #1 registered, verified, and transfer requested in both contracts.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
