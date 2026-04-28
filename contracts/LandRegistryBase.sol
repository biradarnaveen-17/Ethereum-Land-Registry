// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract LandRegistryBase {
    struct Land {
        uint256 id;
        string location;
        uint256 areaSqFt;
        string documentHash;
        address owner;
        address pendingBuyer;
        bool verified;
        bool transferApproved;
    }

    address public government;
    uint256 public landCount;

    mapping(uint256 => Land) public lands;

    event LandRegistered(uint256 indexed landId, address indexed owner, string location);
    event LandVerified(uint256 indexed landId, address indexed government);
    event TransferRequested(uint256 indexed landId, address indexed seller, address indexed buyer);
    event TransferApproved(uint256 indexed landId, address indexed government);
    event OwnershipTransferred(uint256 indexed landId, address indexed from, address indexed to);

    modifier onlyGovernment() {
        require(msg.sender == government, "ONLY_GOVERNMENT");
        _;
    }

    modifier onlyOwner(uint256 landId) {
        require(lands[landId].owner == msg.sender, "ONLY_OWNER");
        _;
    }

    constructor() {
        government = msg.sender;
    }

    function registerLand(string memory location, uint256 areaSqFt, string memory documentHash) external returns (uint256) {
        require(bytes(location).length > 0, "EMPTY_LOCATION");
        require(areaSqFt > 0, "INVALID_AREA");
        require(bytes(documentHash).length > 0, "EMPTY_DOCUMENT");

        landCount += 1;
        uint256 landId = landCount;

        lands[landId] = Land({
            id: landId,
            location: location,
            areaSqFt: areaSqFt,
            documentHash: documentHash,
            owner: msg.sender,
            pendingBuyer: address(0),
            verified: false,
            transferApproved: false
        });

        emit LandRegistered(landId, msg.sender, location);
        return landId;
    }

    function verifyLand(uint256 landId) external onlyGovernment {
        require(landId > 0 && landId <= landCount, "LAND_NOT_FOUND");
        lands[landId].verified = true;
        emit LandVerified(landId, msg.sender);
    }

    function requestTransfer(uint256 landId, address buyer) external onlyOwner(landId) {
        require(buyer != address(0), "INVALID_BUYER");
        require(lands[landId].verified, "LAND_NOT_VERIFIED");

        lands[landId].pendingBuyer = buyer;
        lands[landId].transferApproved = false;

        emit TransferRequested(landId, msg.sender, buyer);
    }

    function approveTransfer(uint256 landId) external onlyGovernment {
        require(lands[landId].pendingBuyer != address(0), "NO_PENDING_TRANSFER");
        lands[landId].transferApproved = true;
        emit TransferApproved(landId, msg.sender);
    }

    function transferOwnership(uint256 landId) external {
        Land storage land = lands[landId];
        require(land.pendingBuyer == msg.sender, "ONLY_PENDING_BUYER");
        require(land.transferApproved, "TRANSFER_NOT_APPROVED");

        address previousOwner = land.owner;
        land.owner = msg.sender;
        land.pendingBuyer = address(0);
        land.transferApproved = false;

        emit OwnershipTransferred(landId, previousOwner, msg.sender);
    }
}
