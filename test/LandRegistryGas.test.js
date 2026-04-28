const { expect } = require("chai");
const { ethers } = require("hardhat");

async function gasOf(txPromise) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  return receipt.gasUsed;
}

describe("Land registry base vs optimized", function () {
  async function deployFixture() {
    const [government, seller, buyer] = await ethers.getSigners();
    const Base = await ethers.getContractFactory("LandRegistryBase");
    const Optimized = await ethers.getContractFactory("LandRegistryOptimized");
    const base = await Base.deploy();
    const optimized = await Optimized.deploy();
    await base.waitForDeployment();
    await optimized.waitForDeployment();
    return { government, seller, buyer, base, optimized };
  }

  it("runs the same complete workflow on both contracts", async function () {
    const { seller, buyer, base, optimized } = await deployFixture();

    await base.connect(seller).registerLand("Survey 1", 1800, "ipfs://doc-1");
    await base.verifyLand(1);
    await base.connect(seller).requestTransfer(1, buyer.address);
    await base.approveTransfer(1);
    await base.connect(buyer).transferOwnership(1);
    expect((await base.lands(1)).owner).to.equal(buyer.address);

    await optimized.connect(seller).registerLand(ethers.id("Survey 1"), 1800, ethers.id("ipfs://doc-1"));
    await optimized.verifyLand(1);
    await optimized.connect(seller).requestTransfer(1, buyer.address);
    await optimized.approveTransfer(1);
    await optimized.connect(buyer).transferOwnership(1);
    const land = await optimized.getLand(1);
    expect(land.owner).to.equal(buyer.address);
  });

  it("uses less gas for the complete optimized workflow", async function () {
    const { seller, buyer, base, optimized } = await deployFixture();

    let baseGas = 0n;
    baseGas += await gasOf(base.connect(seller).registerLand("Survey 1, Bengaluru North", 1800, "ipfs://doc-1"));
    baseGas += await gasOf(base.verifyLand(1));
    baseGas += await gasOf(base.connect(seller).requestTransfer(1, buyer.address));
    baseGas += await gasOf(base.approveTransfer(1));
    baseGas += await gasOf(base.connect(buyer).transferOwnership(1));

    let optimizedGas = 0n;
    optimizedGas += await gasOf(optimized.connect(seller).registerLand(ethers.id("Survey 1, Bengaluru North"), 1800, ethers.id("ipfs://doc-1")));
    optimizedGas += await gasOf(optimized.verifyLand(1));
    optimizedGas += await gasOf(optimized.connect(seller).requestTransfer(1, buyer.address));
    optimizedGas += await gasOf(optimized.approveTransfer(1));
    optimizedGas += await gasOf(optimized.connect(buyer).transferOwnership(1));

    expect(optimizedGas).to.be.lessThan(baseGas);
  });
});
