import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ethers } from "ethers";
import { CheckCircle2, FileCheck2, Landmark, Send, ShieldCheck, Wallet } from "lucide-react";
import "./styles.css";

const optimizedAbi = [
  "function government() view returns (address)",
  "function landCount() view returns (uint256)",
  "function registerLand(bytes32 locationHash,uint96 areaSqFt,bytes32 documentHash) returns (uint256)",
  "function verifyLand(uint256 landId)",
  "function requestTransfer(uint256 landId,address buyer)",
  "function approveTransfer(uint256 landId)",
  "function transferOwnership(uint256 landId)",
  "function getLand(uint256 landId) view returns (address owner,address pendingBuyer,bytes32 locationHash,bytes32 documentHash,uint96 areaSqFt,bool verified,bool transferApproved)"
];

function App() {
  const [address, setAddress] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [landId, setLandId] = useState("1");
  const [location, setLocation] = useState("Survey 42, Bengaluru North");
  const [area, setArea] = useState("2400");
  const [documentHash, setDocumentHash] = useState("ipfs://demo-land-document");
  const [buyer, setBuyer] = useState("");
  const [land, setLand] = useState(null);
  const [status, setStatus] = useState("Deploy contracts with npm run demo-data, paste the optimized contract address, then connect wallet.");

  const canUseWallet = typeof window !== "undefined" && Boolean(window.ethereum);

  async function getContract() {
    if (!canUseWallet) throw new Error("MetaMask is not available.");
    if (!ethers.isAddress(contractAddress)) throw new Error("Paste a valid optimized contract address.");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, optimizedAbi, signer);
  }

  async function connect() {
    if (!canUseWallet) {
      setStatus("MetaMask is required for the browser demo.");
      return;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAddress(accounts[0]);
    setStatus("Wallet connected.");
  }

  async function runAction(label, action) {
    try {
      setStatus(`${label} transaction submitted...`);
      const contract = await getContract();
      const tx = await action(contract);
      const receipt = await tx.wait();
      setStatus(`${label} completed. Gas used: ${receipt.gasUsed.toString()}`);
      await refreshLand();
    } catch (error) {
      setStatus(error.shortMessage || error.message);
    }
  }

  async function registerLand() {
    await runAction("Register land", (contract) =>
      contract.registerLand(ethers.id(location), BigInt(area), ethers.id(documentHash))
    );
  }

  async function refreshLand() {
    try {
      const contract = await getContract();
      const data = await contract.getLand(BigInt(landId));
      setLand({
        owner: data.owner,
        pendingBuyer: data.pendingBuyer,
        locationHash: data.locationHash,
        documentHash: data.documentHash,
        areaSqFt: data.areaSqFt.toString(),
        verified: data.verified,
        transferApproved: data.transferApproved
      });
    } catch (error) {
      setStatus(error.shortMessage || error.message);
    }
  }

  const steps = useMemo(() => [
    { icon: FileCheck2, label: "Register", detail: "Seller records land hash and area." },
    { icon: ShieldCheck, label: "Verify", detail: "Government validates the land record." },
    { icon: Send, label: "Request", detail: "Seller requests transfer to buyer." },
    { icon: CheckCircle2, label: "Approve", detail: "Government approves the transfer." },
    { icon: Landmark, label: "Transfer", detail: "Buyer receives ownership on-chain." }
  ], []);

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Ethereum smart contract demo</p>
          <h1>Gas-optimized land registration</h1>
          <p className="summary">
            A working workflow for land registration, government verification, transfer approval, and ownership update.
          </p>
        </div>
        <button className="wallet" onClick={connect}>
          <Wallet size={18} />
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect"}
        </button>
      </section>

      <section className="workflow">
        {steps.map((step) => (
          <article key={step.label}>
            <step.icon size={22} />
            <strong>{step.label}</strong>
            <span>{step.detail}</span>
          </article>
        ))}
      </section>

      <section className="workspace">
        <div className="panel">
          <h2>Optimized Contract</h2>
          <label>
            Contract address
            <input value={contractAddress} onChange={(event) => setContractAddress(event.target.value)} placeholder="0x..." />
          </label>
          <label>
            Land ID
            <input value={landId} onChange={(event) => setLandId(event.target.value)} />
          </label>
          <button onClick={refreshLand}>Load Land</button>
        </div>

        <div className="panel">
          <h2>Register Land</h2>
          <label>
            Location
            <input value={location} onChange={(event) => setLocation(event.target.value)} />
          </label>
          <label>
            Area sq ft
            <input value={area} onChange={(event) => setArea(event.target.value)} />
          </label>
          <label>
            Document reference
            <input value={documentHash} onChange={(event) => setDocumentHash(event.target.value)} />
          </label>
          <button onClick={registerLand}>Register</button>
        </div>

        <div className="panel">
          <h2>Transfer Workflow</h2>
          <label>
            Buyer address
            <input value={buyer} onChange={(event) => setBuyer(event.target.value)} placeholder="0x..." />
          </label>
          <button onClick={() => runAction("Verify land", (contract) => contract.verifyLand(BigInt(landId)))}>Verify</button>
          <button onClick={() => runAction("Request transfer", (contract) => contract.requestTransfer(BigInt(landId), buyer))}>Request Transfer</button>
          <button onClick={() => runAction("Approve transfer", (contract) => contract.approveTransfer(BigInt(landId)))}>Approve</button>
          <button onClick={() => runAction("Transfer ownership", (contract) => contract.transferOwnership(BigInt(landId)))}>Transfer Ownership</button>
        </div>
      </section>

      <section className="status">
        <div>
          <h2>Current Land Record</h2>
          {land ? (
            <dl>
              <dt>Owner</dt><dd>{land.owner}</dd>
              <dt>Pending buyer</dt><dd>{land.pendingBuyer}</dd>
              <dt>Area</dt><dd>{land.areaSqFt} sq ft</dd>
              <dt>Verified</dt><dd>{land.verified ? "Yes" : "No"}</dd>
              <dt>Transfer approved</dt><dd>{land.transferApproved ? "Yes" : "No"}</dd>
              <dt>Location hash</dt><dd>{land.locationHash}</dd>
              <dt>Document hash</dt><dd>{land.documentHash}</dd>
            </dl>
          ) : (
            <p>No land loaded yet.</p>
          )}
        </div>
        <aside>{status}</aside>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
