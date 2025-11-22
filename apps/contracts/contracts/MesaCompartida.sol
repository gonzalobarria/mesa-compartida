// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./PlateNFT.sol";

contract MesaCompartida is Ownable {
    using SafeERC20 for IERC20;

    enum DeliveryStatus {
        PENDING,
        READY,
        COMPLETED
    }

    struct VoucherTransaction {
        address buyer;
        address vendor;
        uint256 amount;
        IERC20 token;
        DeliveryStatus status;
        uint256 timestamp;
    }

    struct VendorProfile {
        string name;
        uint256 ratingSum;
        uint256 ratingCount;
        uint256 totalSales;
        bool verified;
    }

    struct BuyerProfile {
        string name;
        uint256 ratingSum;
        uint256 ratingCount;
        uint256 totalPurchases;
    }

    mapping (address => VendorProfile) public vendorProfiles;
    mapping (address => BuyerProfile) public buyerProfiles;
    mapping (uint256 => VoucherTransaction) public voucherTransactions;

    mapping(address => bool) public isVendor;
    mapping(address => bool) public isBuyer;

    constructor(address _plateNFT) Ownable(msg.sender) {
        require(_plateNFT != address(0), "Invalid plateNFT");
        plateNFT = PlateNFT(_plateNFT);
    }

    function createVendorProfile(
        string memory _name,
    ) external {
        isVendor[msg.sender] = true;
        vendorProfiles[msg.sender] = VendorProfile({
            name: _name,
            ratingSum: 0,
            ratingCount: 0,
            totalSales: 0,
            verified: false
        });
    }

    function createBuyerProfile(
        string memory _name
    ) external {

        isBuyer[msg.sender] = true;
        buyerProfiles[msg.sender] = BuyerProfile({
            name: _name,
            ratingSum: 0,
            ratingCount: 0,
            totalPurchases: 0
        });
    }
    
    function createPlate(
        string memory _name,wrapper
        string memory _description,
        string memory _ipfsHash,
        uint256 _maxSupply,
        uint256 _expiresAt
    ) external returns (uint256) {
        return plateNFT.createPlate(_name, _description, _ipfsHash, _maxSupply, _expiresAt);
    }
}
