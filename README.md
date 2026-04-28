# Ethereum Land Registry Gas Analysis

This project builds the demo described in the PPT: a blockchain-based land registration and property transfer system with a base smart contract and a gas-optimized smart contract.

## What The Demo Shows

- Seller registers land.
- Government authority verifies land.
- Seller requests transfer to buyer.
- Government authority approves transfer.
- Buyer completes ownership transfer.
- Benchmark script compares base vs optimized gas use for 10, 100, and 500 complete workflows.

## Why The Optimized Contract Uses Less Gas

- Stores hashes as `bytes32` instead of dynamic `string` values.
- Uses custom errors instead of revert strings.
- Uses an immutable government address.
- Packs smaller numeric fields into fewer storage slots.
- Avoids unnecessary writes when state is already false.
- Uses `delete` for storage refunds where appropriate.

## Commands

```bash
npm install
npm run compile
npm test
npm run benchmark
```

For frontend demo:

```bash
npm run node
npm run demo-data
npm run dev
```

Open the Vite URL and connect MetaMask to `http://127.0.0.1:8545`, chain id `31337`.
