const { ethers } = require("hardhat");

async function gasOf(label, txPromise) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  console.log(`${label} gas: ${receipt.gasUsed.toString()}`);
  return receipt.gasUsed;
}

async function main() {
  const [government, seller, buyer] = await ethers.getSigners();
  const Optimized = await ethers.getContractFactory("LandRegistryOptimized");
  const registry = await Optimized.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  const location = "Survey 77, Bengaluru North";
  const documentRef = "ipfs://demo-final-transfer-document";
  let totalGas = 0n;

  console.log("\nFull Land Registry Demo");
  console.log("=======================");
  console.log("Optimized contract:", contractAddress);
  console.log("Government:", government.address);
  console.log("Seller:", seller.address);
  console.log("Buyer:", buyer.address);

  console.log("\n1. Seller registers land");
  totalGas += await gasOf(
    "Register land",
    registry.connect(seller).registerLand(ethers.id(location), 2400, ethers.id(documentRef))
  );

  const landId = await registry.landCount();
  console.log("Registered land ID:", landId.toString());

  console.log("\n2. Government verifies land");
  totalGas += await gasOf("Verify land", registry.connect(government).verifyLand(landId));

  console.log("\n3. Seller requests transfer to buyer");
  totalGas += await gasOf(
    "Request transfer",
    registry.connect(seller).requestTransfer(landId, buyer.address)
  );

  console.log("\n4. Government approves transfer");
  totalGas += await gasOf("Approve transfer", registry.connect(government).approveTransfer(landId));

  console.log("\n5. Buyer completes ownership transfer");
  totalGas += await gasOf("Transfer ownership", registry.connect(buyer).transferOwnership(landId));

  const land = await registry.getLand(landId);

  console.log("\nFinal Land Record");
  console.log("=================");
  console.log("Land ID:", landId.toString());
  console.log("Owner:", land.owner);
  console.log("Pending buyer:", land.pendingBuyer);
  console.log("Area sq ft:", land.areaSqFt.toString());
  console.log("Verified:", land.verified);
  console.log("Transfer approved:", land.transferApproved);
  console.log("Total optimized workflow gas:", totalGas.toString());
  console.log("\nOwnership transfer successful:", land.owner === buyer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
