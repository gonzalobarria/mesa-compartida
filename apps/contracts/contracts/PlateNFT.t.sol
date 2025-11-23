// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {PlateNFT} from "./PlateNFT.sol";

contract PlateNFTTest is Test {
    PlateNFT plateNFT;
    address owner;
    address vendor;
    address buyer;

    function setUp() public {
        owner = address(this);
        vendor = address(0x1111);
        buyer = address(0x2222);
        plateNFT = new PlateNFT();
    }

    function test_CreatePlate() public {
        uint256 expiresAt = block.timestamp + 1 days;
        uint256 plateId = plateNFT.createPlate("Tacos", "Delicious", "QmHash", 10, expiresAt);

        assertEq(plateId, 0);
        PlateNFT.PlateMetadata memory plate = plateNFT.getPlateMetadata(plateId);
        assertEq(plate.name, "Tacos");
        assertEq(plate.maxSupply, 10);
    }

    function test_CreatePlate_EmptyName() public {
        uint256 expiresAt = block.timestamp + 1 days;
        vm.expectRevert("Name cannot be empty");
        plateNFT.createPlate("", "Description", "QmHash", 10, expiresAt);
    }

    function test_CreatePlate_InvalidExpiration() public {
        uint256 expiresAt = block.timestamp;
        vm.expectRevert("Expiration must be in the future");
        plateNFT.createPlate("Plate", "Description", "QmHash", 10, expiresAt);
    }

    function test_TransferVoucher() public {
        uint256 expiresAt = block.timestamp + 1 days;
        plateNFT.createPlate("Plate", "Description", "QmHash", 5, expiresAt);
        plateNFT.transferVoucher(1, buyer);
        assertEq(plateNFT.ownerOf(1), buyer);
    }

    function test_TransferVoucher_NotOwner() public {
        uint256 expiresAt = block.timestamp + 1 days;
        plateNFT.createPlate("Plate", "Description", "QmHash", 5, expiresAt);
        vm.prank(buyer);
        vm.expectRevert("Not voucher owner");
        plateNFT.transferVoucher(1, buyer);
    }

    function test_RedeemVoucher() public {
        uint256 expiresAt = block.timestamp + 1 days;
        plateNFT.createPlate("Plate", "Description", "QmHash", 5, expiresAt);
        plateNFT.redeemVoucher(1);

        PlateNFT.VoucherNFT memory voucher = plateNFT.getVoucherInfo(1);
        assertTrue(voucher.redeemed);
    }

    function test_RedeemVoucher_ByCode() public {
        uint256 expiresAt = block.timestamp + 1 days;
        plateNFT.createPlate("Plate", "Description", "QmHash", 5, expiresAt);
        uint256 code = plateNFT.voucherToRedemptionCode(1);
        plateNFT.redeemVoucherByCode(code);

        PlateNFT.VoucherNFT memory voucher = plateNFT.getVoucherInfo(1);
        assertTrue(voucher.redeemed);
    }

    function test_RedeemVoucher_AlreadyRedeemed() public {
        uint256 expiresAt = block.timestamp + 1 days;
        plateNFT.createPlate("Plate", "Description", "QmHash", 5, expiresAt);
        plateNFT.redeemVoucher(1);
        vm.expectRevert("Voucher already redeemed");
        plateNFT.redeemVoucher(1);
    }

    function test_IsVoucherValid() public {
        uint256 expiresAt = block.timestamp + 1 days;
        plateNFT.createPlate("Plate", "Description", "QmHash", 5, expiresAt);
        assertTrue(plateNFT.isVoucherValid(1));
    }

    function test_IsVoucherExpired() public {
        uint256 expiresAt = block.timestamp + 1 days;
        plateNFT.createPlate("Plate", "Description", "QmHash", 5, expiresAt);
        assertFalse(plateNFT.isVoucherExpired(1));
        vm.warp(block.timestamp + 2 days);
        assertTrue(plateNFT.isVoucherExpired(1));
    }

    function test_GetVendorPlates() public {
        uint256 expiresAt = block.timestamp + 1 days;
        vm.prank(vendor);
        plateNFT.createPlate("Plate 1", "Desc 1", "Hash1", 5, expiresAt);
        vm.prank(vendor);
        plateNFT.createPlate("Plate 2", "Desc 2", "Hash2", 10, expiresAt);

        uint256[] memory plates = plateNFT.getVendorPlates(vendor);
        assertEq(plates.length, 2);
    }

    function test_GetActivePlates() public {
        PlateNFT testPlate = new PlateNFT();
        uint256 expiresAt = block.timestamp + 1 days;
        testPlate.createPlate("Active 1", "Desc 1", "Hash1", 5, expiresAt);
        testPlate.createPlate("Active 2", "Desc 2", "Hash2", 10, expiresAt);

        PlateNFT.PlateMetadata[] memory plates = testPlate.getActivePlates();
        assertEq(plates.length, 2);
    }

    function test_TokenURI() public {
        uint256 expiresAt = block.timestamp + 1 days;
        plateNFT.createPlate("Pizza", "Delicious", "QmHash123", 5, expiresAt);
        string memory uri = plateNFT.tokenURI(1);
        assertTrue(bytes(uri).length > 0);
    }
}
