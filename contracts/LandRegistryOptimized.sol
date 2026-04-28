// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract LandRegistryOptimized {
    error OnlyGovernment();
    error OnlyOwner();
    error LandNotFound();
    error InvalidArea();
    error EmptyHash();
    error InvalidBuyer();
    error LandNotVerified();
    error NoPendingTransfer();
    error OnlyPendingBuyer();
    error TransferNotApproved();

    struct Land {
        address owner;
        address pendingBuyer;
        bytes32 locationHash;
        bytes32 documentHash;
        uint96 areaSqFt;
        bool verified;
        bool transferApproved;
    }

    address public immutable government;
    uint256 public landCount;

    mapping(uint256 landId => Land land) private lands;

    event LandRegistered(uint256 indexed landId, address indexed owner, bytes32 indexed locationHash);
    event LandVerified(uint256 indexed landId);
    event TransferRequested(uint256 indexed landId, address indexed seller, address indexed buyer);
    event TransferApproved(uint256 indexed landId);
    event OwnershipTransferred(uint256 indexed landId, address indexed from, address indexed to);

    modifier onlyGovernment() {
        if (msg.sender != government) revert OnlyGovernment();
        _;
    }

    constructor() {
        government = msg.sender;
    }

    function registerLand(bytes32 locationHash, uint96 areaSqFt, bytes32 documentHash) external returns (uint256 landId) {
        if (areaSqFt == 0) revert InvalidArea();
        if (locationHash == bytes32(0) || documentHash == bytes32(0)) revert EmptyHash();

        unchecked {
            landId = ++landCount;
        }

        Land storage land = lands[landId];
        land.owner = msg.sender;
        land.locationHash = locationHash;
        land.documentHash = documentHash;
        land.areaSqFt = areaSqFt;

        emit LandRegistered(landId, msg.sender, locationHash);
    }

    function verifyLand(uint256 landId) external onlyGovernment {
        Land storage land = _land(landId);
        land.verified = true;
        emit LandVerified(landId);
    }

    function requestTransfer(uint256 landId, address buyer) external {
        if (buyer == address(0)) revert InvalidBuyer();

        Land storage land = _land(landId);
        if (land.owner != msg.sender) revert OnlyOwner();
        if (!land.verified) revert LandNotVerified();

        land.pendingBuyer = buyer;
        if (land.transferApproved) land.transferApproved = false;

        emit TransferRequested(landId, msg.sender, buyer);
    }

    function approveTransfer(uint256 landId) external onlyGovernment {
        Land storage land = _land(landId);
        if (land.pendingBuyer == address(0)) revert NoPendingTransfer();

        land.transferApproved = true;
        emit TransferApproved(landId);
    }

    function transferOwnership(uint256 landId) external {
        Land storage land = _land(landId);
        address buyer = land.pendingBuyer;

        if (buyer != msg.sender) revert OnlyPendingBuyer();
        if (!land.transferApproved) revert TransferNotApproved();

        address previousOwner = land.owner;
        land.owner = buyer;
        delete land.pendingBuyer;
        delete land.transferApproved;

        emit OwnershipTransferred(landId, previousOwner, buyer);
    }

    function getLand(uint256 landId)
        external
        view
        returns (
            address owner,
            address pendingBuyer,
            bytes32 locationHash,
            bytes32 documentHash,
            uint96 areaSqFt,
            bool verified,
            bool transferApproved
        )
    {
        Land storage land = _land(landId);
        return (
            land.owner,
            land.pendingBuyer,
            land.locationHash,
            land.documentHash,
            land.areaSqFt,
            land.verified,
            land.transferApproved
        );
    }

    function _land(uint256 landId) private view returns (Land storage land) {
        if (landId == 0 || landId > landCount) revert LandNotFound();
        return lands[landId];
    }
}
