// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

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
        uint256 voucherTokenId;
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
        uint256 totalPurchases;
    }

    struct BeneficiaryProfile {
        string name;
        uint256 ratingSum;
        uint256 ratingCount;
        uint256 totalRedemptions;
    }

    mapping(uint256 => VoucherTransaction) public voucherTransactions;
    mapping(uint256 => bool) public vendorRated;

    mapping(address => VendorProfile) public vendorProfiles;
    mapping(address => BuyerProfile) public buyerProfiles;
    mapping(address => BeneficiaryProfile) public beneficiaryProfiles;

    mapping(address => bool) public isVendor;
    mapping(address => bool) public isBuyer;
    mapping(address => bool) public isBeneficiary;

    mapping(uint256 => address) public voucherBeneficiary;

    mapping(uint256 => uint256) public escrowAmount;

    uint256 public platformFeePercent = 0;
    mapping(address => uint256) public platformBalance;
    mapping(address => mapping(address => uint256)) public vendorEarnings;
    PlateNFT public plateNFT;
    uint256 public voucherTransactionCounter;

    constructor(address _plateNFT) Ownable(msg.sender) {
        require(_plateNFT != address(0), "Invalid plateNFT");
        plateNFT = PlateNFT(_plateNFT);
    }

    function setPlateNFT(address _plateNFT) external onlyOwner {
        require(_plateNFT != address(0), "Invalid plateNFT");
        plateNFT = PlateNFT(_plateNFT);
    }

    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 10, "Fee too high (max 10%)");
        platformFeePercent = _feePercent;
    }

    function createVendorProfile(
        string memory _name,
        string memory _ensDomain
    ) external {
        require(!isVendor[msg.sender], "Already registered as vendor");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_ensDomain).length > 0, "ENS domain cannot be empty");

        isVendor[msg.sender] = true;
        vendorProfiles[msg.sender] = VendorProfile({
            name: _name,
            ratingSum: 0,
            ratingCount: 0,
            totalSales: 0,
            verified: false
        });
    }

    function createBuyerProfile(string memory _name) external {
        require(!isBuyer[msg.sender], "Already registered as buyer");
        require(bytes(_name).length > 0, "Name cannot be empty");

        isBuyer[msg.sender] = true;
        buyerProfiles[msg.sender] = BuyerProfile({
            name: _name,
            totalPurchases: 0
        });
    }

    function createBeneficiaryProfile(string memory _name) external {
        require(
            !isBeneficiary[msg.sender],
            "Already registered as beneficiary"
        );
        require(bytes(_name).length > 0, "Name cannot be empty");

        isBeneficiary[msg.sender] = true;
        beneficiaryProfiles[msg.sender] = BeneficiaryProfile({
            name: _name,
            ratingSum: 0,
            ratingCount: 0,
            totalRedemptions: 0
        });
    }

    function createPlate(
        string memory _name,
        string memory _description,
        string memory _ipfsHash,
        uint256 _maxSupply,
        uint256 _expiresAt
    ) external returns (uint256) {
        require(isVendor[msg.sender], "Only vendors can create plates");

        return
            plateNFT.createPlate(
                _name,
                _description,
                _ipfsHash,
                _maxSupply,
                _expiresAt
            );
    }

    function purchaseVoucher(
        uint256 _voucherTokenId,
        uint256 _amount,
        address _token
    ) external returns (uint256) {
        address vendor = plateNFT.ownerOf(_voucherTokenId);
        require(vendor != address(0), "Invalid voucher");
        require(_amount > 0, "Amount must be > 0");
        require(_token != address(0), "Invalid token");
        require(isVendor[vendor], "Vendor not registered");

        PlateNFT.VoucherNFT memory voucher = plateNFT.getVoucherInfo(
            _voucherTokenId
        );
        PlateNFT.PlateMetadata memory plate = plateNFT.getPlateMetadata(
            voucher.plateId
        );

        require(!voucher.redeemed, "Voucher already redeemed");
        require(block.timestamp < plate.expiresAt, "Plate has expired");

        uint256 transactionId = voucherTransactionCounter++;

        voucherTransactions[transactionId] = VoucherTransaction({
            buyer: msg.sender,
            vendor: vendor,
            amount: _amount,
            token: IERC20(_token),
            status: DeliveryStatus.PENDING,
            timestamp: block.timestamp,
            voucherTokenId: _voucherTokenId
        });

        escrowAmount[transactionId] = _amount;

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        plateNFT.transferVoucher(_voucherTokenId, msg.sender);

        if (!isBuyer[msg.sender]) {
            isBuyer[msg.sender] = true;
            buyerProfiles[msg.sender] = BuyerProfile({
                name: "",
                totalPurchases: 1
            });
        } else {
            buyerProfiles[msg.sender].totalPurchases++;
        }

        return transactionId;
    }

    function markReady(uint256 _transactionId) external {
        VoucherTransaction storage transaction = voucherTransactions[
            _transactionId
        ];

        require(msg.sender == transaction.vendor, "Only vendor can mark ready");
        require(transaction.status == DeliveryStatus.PENDING, "Invalid status");

        transaction.status = DeliveryStatus.READY;
    }

    function confirmDelivery(uint256 _transactionId) external {
        VoucherTransaction storage transaction = voucherTransactions[
            _transactionId
        ];

        address beneficiary = voucherBeneficiary[_transactionId];

        if (beneficiary != address(0)) {
            require(msg.sender == beneficiary, "Only beneficiary can confirm");
        } else {
            require(msg.sender == transaction.buyer, "Only buyer can confirm");
        }
        require(transaction.status == DeliveryStatus.READY, "Not ready");

        transaction.status = DeliveryStatus.COMPLETED;

        uint256 feeAmount = (transaction.amount * platformFeePercent) / 100;
        uint256 vendorAmount = transaction.amount - feeAmount;

        platformBalance[address(transaction.token)] += feeAmount;
        require(
            escrowAmount[_transactionId] == transaction.amount,
            "Escrow mismatch"
        );
        escrowAmount[_transactionId] = 0;

        transaction.token.safeTransfer(transaction.vendor, vendorAmount);

        vendorProfiles[transaction.vendor].totalSales++;
        vendorEarnings[transaction.vendor][
            address(transaction.token)
        ] += vendorAmount;

        if (beneficiary != address(0)) {
            beneficiaryProfiles[beneficiary].totalRedemptions++;
        }
    }
}
