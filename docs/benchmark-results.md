# Benchmark Results

Environment: local Hardhat blockchain, Solidity optimizer enabled with 200 runs.

Each workflow includes:

1. Register land
2. Verify land
3. Request transfer
4. Approve transfer
5. Transfer ownership

| Workload | Contract | Total Gas | Average Gas / Workflow | Time (ms) | Failures |
| ---: | --- | ---: | ---: | ---: | ---: |
| 10 | Base | 2,925,486 | 292,548 | 146.95 | 0 |
| 10 | Optimized | 2,710,902 | 271,090 | 111.96 | 0 |
| 100 | Base | 29,103,204 | 291,032 | 1,057.50 | 0 |
| 100 | Optimized | 26,955,168 | 269,551 | 1,048.94 | 0 |
| 500 | Base | 145,469,976 | 290,939 | 7,563.68 | 0 |
| 500 | Optimized | 134,719,164 | 269,438 | 8,604.82 | 0 |

| Workload | Gas Saved | Reduction |
| ---: | ---: | ---: |
| 10 | 214,584 | 7.33% |
| 100 | 2,148,036 | 7.38% |
| 500 | 10,750,812 | 7.39% |

The optimized contract consistently reduces gas consumption and has zero failures across all tested workloads. Local wall-clock timing is useful for demonstration, but gas per workflow is the stronger blockchain performance metric because it directly represents execution cost on Ethereum-compatible networks.
