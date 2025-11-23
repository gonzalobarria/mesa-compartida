import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("MesaCompartida", function () {
  let mesaCompartida: any;
  let plateNFT: any;
  let mockToken: any;
  let vendor: any;
  let buyer: any;
  let beneficiary: any;

  beforeEach(async function () {
    [vendor, buyer, beneficiary] = await ethers.getSigners();

    plateNFT = await ethers.deployContract("PlateNFT");
    mesaCompartida = await ethers.deployContract("MesaCompartida", [
      await plateNFT.getAddress(),
    ]);
    mockToken = await ethers.deployContract("MockToken");

    await mockToken.mint(await buyer.getAddress(), ethers.parseEther("1000"));
    await mockToken
      .connect(buyer)
      .approve(
        await mesaCompartida.getAddress(),
        ethers.parseEther("1000")
      );
  });

  describe("Profile Management", function () {
    it("Should create vendor profile", async function () {
      await mesaCompartida
        .connect(vendor)
        .createVendorProfile("Test Vendor", "vendor.eth");

      const profile = await mesaCompartida.getVendorProfile(
        await vendor.getAddress()
      );
      expect(profile.name).to.equal("Test Vendor");
    });

    it("Should not allow duplicate vendor", async function () {
      await mesaCompartida
        .connect(vendor)
        .createVendorProfile("Test Vendor", "vendor.eth");

      await expect(
        mesaCompartida
          .connect(vendor)
          .createVendorProfile("Another", "vendor2.eth")
      ).to.be.revertedWith("Already registered as vendor");
    });

    it("Should create buyer profile", async function () {
      await mesaCompartida
        .connect(buyer)
        .createBuyerProfile("Test Buyer");

      const profile = await mesaCompartida.getBuyerProfile(
        await buyer.getAddress()
      );
      expect(profile.name).to.equal("Test Buyer");
    });

    it("Should create beneficiary profile", async function () {
      await mesaCompartida
        .connect(beneficiary)
        .createBeneficiaryProfile("Test Beneficiary");

      const profile = await mesaCompartida.getBeneficiaryProfile(
        await beneficiary.getAddress()
      );
      expect(profile.name).to.equal("Test Beneficiary");
    });
  });

  describe("Plate Management", function () {
    beforeEach(async function () {
      await mesaCompartida
        .connect(vendor)
        .createVendorProfile("Test Vendor", "vendor.eth");
    });

    it("Should create a plate", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + 86400;
      await mesaCompartida
        .connect(vendor)
        .createPlate("Plate 1", "Description", "ipfs://hash", 10, expiresAt);

      const plates = await mesaCompartida.getVendorPlates(
        await vendor.getAddress()
      );
      expect(plates.length).to.equal(1);
      expect(plates[0].name).to.equal("Plate 1");
    });

    it("Should not allow non-vendors to create plates", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + 86400;

      await expect(
        mesaCompartida
          .connect(buyer)
          .createPlate("Plate 1", "Description", "ipfs://hash", 10, expiresAt)
      ).to.be.revertedWith("Only vendors can create plates");
    });

    it("Should get vendor plates", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + 86400;

      await mesaCompartida
        .connect(vendor)
        .createPlate("Plate 1", "Desc 1", "ipfs://hash1", 10, expiresAt);

      await mesaCompartida
        .connect(vendor)
        .createPlate("Plate 2", "Desc 2", "ipfs://hash2", 5, expiresAt);

      const plates = await mesaCompartida.getVendorPlates(
        await vendor.getAddress()
      );

      expect(plates.length).to.equal(2);
      expect(plates[0].name).to.equal("Plate 1");
      expect(plates[1].name).to.equal("Plate 2");
    });
  });

  describe("Platform Management", function () {
    it("Should set platform fee", async function () {
      await mesaCompartida.setPlatformFee(5);
      const fee = await mesaCompartida.platformFeePercent();
      expect(fee).to.equal(5);
    });

    it("Should not allow fee > 10%", async function () {
      await expect(mesaCompartida.setPlatformFee(11)).to.be.revertedWith(
        "Fee too high (max 10%)"
      );
    });

    it("Should set PlateNFT", async function () {
      const newPlateNFT = await ethers.deployContract("PlateNFT");
      await mesaCompartida.setPlateNFT(await newPlateNFT.getAddress());
      const addr = await mesaCompartida.plateNFT();
      expect(addr).to.equal(await newPlateNFT.getAddress());
    });

    it("Should not allow invalid PlateNFT", async function () {
      await expect(
        mesaCompartida.setPlateNFT(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid plateNFT");
    });
  });

  describe("Marketplace Queries", function () {
    beforeEach(async function () {
      await mesaCompartida
        .connect(vendor)
        .createVendorProfile("Test Vendor", "vendor.eth");

      const expiresAt = Math.floor(Date.now() / 1000) + 86400;
      await mesaCompartida
        .connect(vendor)
        .createPlate("Plate 1", "Description", "ipfs://hash", 10, expiresAt);
    });

    it("Should get marketplace vouchers", async function () {
      const vouchers = await mesaCompartida.getMarketplaceVouchers();
      expect(Array.isArray(vouchers)).to.be.true;
      expect(vouchers.length).to.equal(1);
    });

    it("Should get available vouchers for beneficiary", async function () {
      const vouchers =
        await mesaCompartida.getAvailableVouchersForBeneficiary();
      expect(Array.isArray(vouchers)).to.be.true;
    });

    it("Should get voucher beneficiary", async function () {
      const beneficiaryAddr = await mesaCompartida.getVoucherBeneficiary(0);
      expect(beneficiaryAddr).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Escrow & Earnings", function () {
    it("Should have zero escrow initially", async function () {
      const escrow = await mesaCompartida.getEscrowAmount(0);
      expect(escrow).to.equal(0);
    });

    it("Should have zero vendor earnings", async function () {
      await mesaCompartida
        .connect(vendor)
        .createVendorProfile("Test Vendor", "vendor.eth");

      const earnings = await mesaCompartida.getVendorEarnings(
        await vendor.getAddress(),
        await mockToken.getAddress()
      );
      expect(earnings).to.equal(0);
    });
  });
});
