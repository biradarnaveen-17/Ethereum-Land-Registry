const { ethers } = require("hardhat");

const WORKLOADS = [10, 100, 500];

function toMillis(start) {
  return Number(process.hrtime.bigint() - start) / 1_000_000;
}

async function gasOf(txPromise) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  return receipt.gasUsed;
}

function avg(total, count) {
  return count === 0 ? 0n : total / BigInt(count);
}

async function deploy() {
  const Base = await ethers.getContractFactory("LandRegistryBase");
  const Optimized = await ethers.getContractFactory("LandRegistryOptimized");
  const base = await Base.deploy();
  const optimized = await Optimized.deploy();
  await base.waitForDeployment();
  await optimized.waitForDeployment();
  return { base, optimized };
}

async function runBase(base, workload, accounts) {
  let gas = 0n;
  let failures = 0;
  const inputs = Array.from({ length: workload }, (_, i) => ({
    location: `Survey-${i}-Bengaluru-North`,
    documentHash: `ipfs://land-document-${i}`,
    area: 1200 + i
  }));
  const start = process.hrtime.bigint();

  for (let i = 0; i < workload; i += 1) {
    const seller = accounts[(i % (accounts.length - 2)) + 1];
    const buyer = accounts[((i + 1) % (accounts.length - 2)) + 1];
    const sellerContract = base.connect(seller);
    const buyerContract = base.connect(buyer);

    try {
      gas += await gasOf(sellerContract.registerLand(inputs[i].location, inputs[i].area, inputs[i].documentHash));
      const landId = await base.landCount();
      gas += await gasOf(base.verifyLand(landId));
      gas += await gasOf(sellerContract.requestTransfer(landId, buyer.address));
      gas += await gasOf(base.approveTransfer(landId));
      gas += await gasOf(buyerContract.transferOwnership(landId));
    } catch (error) {
      failures += 1;
    }
  }

  return {
    workload,
    totalGas: gas,
    averageGasPerWorkflow: avg(gas, workload),
    timeMs: toMillis(start),
    failures
  };
}

async function runOptimized(optimized, workload, accounts) {
  let gas = 0n;
  let failures = 0;
  const inputs = Array.from({ length: workload }, (_, i) => ({
    locationHash: ethers.id(`Survey-${i}-Bengaluru-North`),
    documentHash: ethers.id(`ipfs://land-document-${i}`),
    area: 1200 + i
  }));
  const start = process.hrtime.bigint();

  for (let i = 0; i < workload; i += 1) {
    const seller = accounts[(i % (accounts.length - 2)) + 1];
    const buyer = accounts[((i + 1) % (accounts.length - 2)) + 1];
    const sellerContract = optimized.connect(seller);
    const buyerContract = optimized.connect(buyer);

    try {
      gas += await gasOf(sellerContract.registerLand(inputs[i].locationHash, inputs[i].area, inputs[i].documentHash));
      const landId = await optimized.landCount();
      gas += await gasOf(optimized.verifyLand(landId));
      gas += await gasOf(sellerContract.requestTransfer(landId, buyer.address));
      gas += await gasOf(optimized.approveTransfer(landId));
      gas += await gasOf(buyerContract.transferOwnership(landId));
    } catch (error) {
      failures += 1;
    }
  }

  return {
    workload,
    totalGas: gas,
    averageGasPerWorkflow: avg(gas, workload),
    timeMs: toMillis(start),
    failures
  };
}

function printResult(base, optimized) {
  const saved = base.totalGas - optimized.totalGas;
  const savedPct = Number((saved * 10_000n) / base.totalGas) / 100;
  console.log(`\nWorkload: ${base.workload} full land-transfer workflows`);
  console.table([
    {
      contract: "Base",
      totalGas: base.totalGas.toString(),
      averageGasPerWorkflow: base.averageGasPerWorkflow.toString(),
      timeMs: base.timeMs.toFixed(2),
      failures: base.failures
    },
    {
      contract: "Optimized",
      totalGas: optimized.totalGas.toString(),
      averageGasPerWorkflow: optimized.averageGasPerWorkflow.toString(),
      timeMs: optimized.timeMs.toFixed(2),
      failures: optimized.failures
    }
  ]);
  console.log(`Gas saved by optimized contract: ${saved.toString()} (${savedPct}%)`);
}

async function main() {
  const accounts = await ethers.getSigners();

  for (const workload of WORKLOADS) {
    const { base, optimized } = await deploy();
    const baseResult = await runBase(base, workload, accounts);
    const optimizedResult = await runOptimized(optimized, workload, accounts);
    printResult(baseResult, optimizedResult);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
