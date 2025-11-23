// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {MesaCompartida} from "./MesaCompartida.sol";
import {PlateNFT} from "./PlateNFT.sol";
import {MockToken} from "./MockToken.sol";

/**
 * @title MesaCompartidaEssentialTest
 * @notice Essential Solidity tests for MesaCompartida marketplace contract
 * Using Forge as testing tool - demonstrates core functionality with vouchers and plates
 */
contract MesaCompartidaEssentialTest is Test {
    MesaCompartida marketplace;
    PlateNFT plateNFT;
    MockToken token;

    address owner;
    address vendor;
    address buyer;
    address beneficiary;

    uint256 constant INITIAL_BALANCE = 10000 ether;
    uint256 constant VOUCHER_AMOUNT = 1 ether;

    function setUp() public {
        owner = address(this);
        vendor = address(0x1111);
        buyer = address(0x2222);
        beneficiary = address(0x3333);

        plateNFT = new PlateNFT();
        marketplace = new MesaCompartida(address(plateNFT));
        token = new MockToken();

        plateNFT.transferOwnership(address(marketplace));

        token.mint(buyer, INITIAL_BALANCE);
        token.mint(vendor, INITIAL_BALANCE);

        vm.prank(buyer);
        token.approve(address(marketplace), INITIAL_BALANCE);

        vm.prank(vendor);
        token.approve(address(marketplace), INITIAL_BALANCE);
    }

    function test_CreateVendorProfile() public {
        vm.prank(vendor);
        marketplace.createVendorProfile("Taqueria El Sabor", "maria.mesacompartida.eth");

        MesaCompartida.VendorProfile memory profile = marketplace.getVendorProfile(vendor);
        assertEq(keccak256(bytes(profile.name)), keccak256(bytes("Taqueria El Sabor")));
        assertTrue(marketplace.isVendor(vendor));
    }

    function test_CreateVendorProfile_AlreadyRegistered() public {
        vm.prank(vendor);
        marketplace.createVendorProfile("Taqueria El Sabor", "maria.mesacompartida.eth");

        vm.prank(vendor);
        vm.expectRevert("Already registered as vendor");
        marketplace.createVendorProfile("Otro Nombre", "pedro.mesacompartida.eth");
    }

    function test_CreateVendorProfile_EmptyName() public {
        vm.prank(vendor);
        vm.expectRevert("Name cannot be empty");
        marketplace.createVendorProfile("", "maria.mesacompartida.eth");
    }

    function test_CreateBuyerProfile() public {
        vm.prank(buyer);
        marketplace.createBuyerProfile("Test Buyer");

        MesaCompartida.BuyerProfile memory profile = marketplace.getBuyerProfile(buyer);
        assertEq(keccak256(bytes(profile.name)), keccak256(bytes("Test Buyer")));
        assertTrue(marketplace.isBuyer(buyer));
    }

    function test_CreateBuyerProfile_AlreadyRegistered() public {
        vm.prank(buyer);
        marketplace.createBuyerProfile("Test Buyer");

        vm.prank(buyer);
        vm.expectRevert("Already registered as buyer");
        marketplace.createBuyerProfile("Another Buyer");
    }

    function test_CreateBeneficiaryProfile() public {
        vm.prank(beneficiary);
        marketplace.createBeneficiaryProfile("Test Beneficiary");

        MesaCompartida.BeneficiaryProfile memory profile = marketplace.getBeneficiaryProfile(beneficiary);
        assertEq(keccak256(bytes(profile.name)), keccak256(bytes("Test Beneficiary")));
        assertTrue(marketplace.isBeneficiary(beneficiary));
    }

    function test_CreateBeneficiaryProfile_AlreadyRegistered() public {
        vm.prank(beneficiary);
        marketplace.createBeneficiaryProfile("Test Beneficiary");

        vm.prank(beneficiary);
        vm.expectRevert("Already registered as beneficiary");
        marketplace.createBeneficiaryProfile("Another Beneficiary");
    }

    function test_CreatePlate() public {
        vm.prank(vendor);
        marketplace.createVendorProfile("Taqueria El Sabor", "maria.mesacompartida.eth");

        uint256 expiresAt = block.timestamp + 1 days;

        vm.prank(vendor);
        uint256 plateId = marketplace.createPlate(
            "Tacos al Pastor",
            "Delicious tacos",
            "ipfs://QmHash",
            10,
            expiresAt
        );

        assertEq(plateId, 0);

        PlateNFT.PlateMetadata memory plate = plateNFT.getPlateMetadata(plateId);
        assertEq(keccak256(bytes(plate.name)), keccak256(bytes("Tacos al Pastor")));
        assertEq(plate.maxSupply, 10);
    }

    function test_CreatePlate_OnlyVendor() public {
        uint256 expiresAt = block.timestamp + 1 days;

        vm.prank(buyer);
        vm.expectRevert("Only vendors can create plates");
        marketplace.createPlate(
            "Tacos al Pastor",
            "Delicious tacos",
            "ipfs://QmHash",
            10,
            expiresAt
        );
    }

    function test_GetVendorPlates() public {
        vm.prank(vendor);
        marketplace.createVendorProfile("Taqueria El Sabor", "maria.mesacompartida.eth");

        uint256 expiresAt = block.timestamp + 1 days;

        vm.prank(vendor);
        marketplace.createPlate("Plate 1", "Description 1", "ipfs://hash1", 10, expiresAt);

        vm.prank(vendor);
        marketplace.createPlate("Plate 2", "Description 2", "ipfs://hash2", 5, expiresAt);

        PlateNFT.PlateMetadata[] memory vendorPlates = marketplace.getVendorPlates(vendor);

        assertEq(vendorPlates.length, 2);
        assertEq(keccak256(bytes(vendorPlates[0].name)), keccak256(bytes("Plate 1")));
        assertEq(keccak256(bytes(vendorPlates[1].name)), keccak256(bytes("Plate 2")));
    }

    function test_SetPlatformFee() public {
        marketplace.setPlatformFee(5);
        assertEq(marketplace.platformFeePercent(), 5);
    }

    function test_SetPlatformFee_ExceedsMax() public {
        vm.expectRevert("Fee too high (max 10%)");
        marketplace.setPlatformFee(11);
    }

    function test_SetPlateNFT() public {
        PlateNFT newPlateNFT = new PlateNFT();
        address newAddr = address(newPlateNFT);

        marketplace.setPlateNFT(newAddr);
        assertEq(address(marketplace.plateNFT()), newAddr);
    }

    function test_SetPlateNFT_InvalidAddress() public {
        vm.expectRevert("Invalid plateNFT");
        marketplace.setPlateNFT(address(0));
    }

    function test_GetMarketplaceVouchers() public {
        vm.prank(vendor);
        marketplace.createVendorProfile("Taqueria El Sabor", "maria.mesacompartida.eth");

        uint256 expiresAt = block.timestamp + 1 days;
        vm.prank(vendor);
        marketplace.createPlate("Tacos al Pastor", "Delicious tacos", "ipfs://QmHash", 10, expiresAt);

        PlateNFT.PlateMetadata[] memory vouchers = marketplace.getMarketplaceVouchers();
        assertEq(vouchers.length, 1);
    }

    function test_GetAvailableVouchersForBeneficiary() public view {
        marketplace.getAvailableVouchersForBeneficiary();
    }

    function test_VoucherBeneficiary_NoClaimYet() public view {
        address beneficiaryAddr = marketplace.getVoucherBeneficiary(0);
        assertEq(beneficiaryAddr, address(0));
    }
}
