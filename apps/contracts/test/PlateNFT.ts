import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("PlateNFT", function () {
  let plateNFT: any;
  let vendor: any;
  let buyer: any;

  beforeEach(async function () {
    const [, vendorSigner, buyerSigner] = await ethers.getSigners();
    vendor = vendorSigner;
    buyer = buyerSigner;
    plateNFT = await ethers.deployContract("PlateNFT");
  });

  describe("Plate Creation", function () {
    it("Should create a plate", async function () {
      const block = await ethers.provider.getBlock('latest');
      const expiresAt = block!.timestamp + 86400;

      await plateNFT.createPlate("Tacos", "Delicious", "QmHash", 10, expiresAt);
      const plate = await plateNFT.getPlateMetadata(0);

      expect(plate.name).to.equal("Tacos");
      expect(plate.maxSupply).to.equal(10);
    });

    it("Should reject empty name", async function () {
      const block = await ethers.provider.getBlock('latest');
      const expiresAt = block!.timestamp + 86400;

      await expect(
        plateNFT.createPlate("", "Description", "QmHash", 10, expiresAt)
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should reject invalid expiration", async function () {
      const block = await ethers.provider.getBlock('latest');
      const expiresAt = block!.timestamp;

      await expect(
        plateNFT.createPlate("Plate", "Description", "QmHash", 10, expiresAt)
      ).to.be.revertedWith("Expiration must be in the future");
    });
  });

  describe("Voucher Transfer", function () {
    beforeEach(async function () {
      const block = await ethers.provider.getBlock('latest');
      const expiresAt = block!.timestamp + 86400;
      await plateNFT.createPlate("Plate", "Description", "QmHash", 5, expiresAt);
    });

    it("Should transfer voucher", async function () {
      await plateNFT.transferVoucher(1, await buyer.getAddress());
      expect(await plateNFT.ownerOf(1)).to.equal(await buyer.getAddress());
    });

    it("Should reject transfer by non-owner", async function () {
      await expect(
        plateNFT.connect(buyer).transferVoucher(1, await buyer.getAddress())
      ).to.be.revertedWith("Not voucher owner");
    });
  });

  describe("Voucher Redemption", function () {
    beforeEach(async function () {
      const block = await ethers.provider.getBlock('latest');
      const expiresAt = block!.timestamp + 86400;
      await plateNFT.createPlate("Plate", "Description", "QmHash", 5, expiresAt);
    });

    it("Should redeem voucher", async function () {
      await plateNFT.redeemVoucher(1);
      const voucher = await plateNFT.getVoucherInfo(1);
      expect(voucher.redeemed).to.be.true;
    });

    it("Should redeem by code", async function () {
      const code = await plateNFT.voucherToRedemptionCode(1);
      await plateNFT.redeemVoucherByCode(code);
      const voucher = await plateNFT.getVoucherInfo(1);
      expect(voucher.redeemed).to.be.true;
    });

    it("Should reject double redemption", async function () {
      await plateNFT.redeemVoucher(1);
      await expect(plateNFT.redeemVoucher(1)).to.be.revertedWith(
        "Voucher already redeemed"
      );
    });
  });

  describe("Voucher Validity", function () {
    beforeEach(async function () {
      const block = await ethers.provider.getBlock('latest');
      const expiresAt = block!.timestamp + 86400;
      await plateNFT.createPlate("Plate", "Description", "QmHash", 5, expiresAt);
    });

    it("Should check if voucher is valid", async function () {
      const isValid = await plateNFT.isVoucherValid(1);
      expect(isValid).to.be.true;
    });

    it("Should detect expired voucher", async function () {
      await ethers.provider.send("evm_increaseTime", [86400 + 3600]);
      await ethers.provider.send("evm_mine");
      const isExpired = await plateNFT.isVoucherExpired(1);
      expect(isExpired).to.be.true;
    });
  });

  describe("Plate Queries", function () {
    it("Should get vendor plates", async function () {
      const block = await ethers.provider.getBlock('latest');
      const expiresAt = block!.timestamp + 86400;

      await plateNFT.connect(vendor).createPlate("Plate 1", "Desc 1", "Hash1", 5, expiresAt);
      await plateNFT.connect(vendor).createPlate("Plate 2", "Desc 2", "Hash2", 10, expiresAt);

      const plates = await plateNFT.getVendorPlates(await vendor.getAddress());
      expect(plates.length).to.be.greaterThanOrEqual(2);
    });

    it("Should get active plates", async function () {
      const newPlate = await ethers.deployContract("PlateNFT");
      const block = await ethers.provider.getBlock('latest');
      const expiresAt = block!.timestamp + 86400;

      await newPlate.createPlate("Active 1", "Desc 1", "Hash1", 5, expiresAt);
      await newPlate.createPlate("Active 2", "Desc 2", "Hash2", 10, expiresAt);

      const plates = await newPlate.getActivePlates();
      expect(plates.length).to.equal(2);
    });
  });

  describe("Token URI", function () {
    it("Should return valid URI", async function () {
      const block = await ethers.provider.getBlock('latest');
      const expiresAt = block!.timestamp + 86400;
      await plateNFT.createPlate("Pizza", "Delicious", "QmHash123", 5, expiresAt);

      const uri = await plateNFT.tokenURI(1);
      expect(uri).to.include("data:application/json;base64,");
    });
  });
});
