// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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
}
