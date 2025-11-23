// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PlateNFT is ERC721, ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;
    uint256[] private _allPlateIds;

    struct PlateMetadata {
        string name;
        string description;
        string ipfsHash;
        address vendor;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 maxSupply;
        uint256 availableVouchers;
    }

    struct VoucherNFT {
        uint256 plateId;
        bool redeemed;
        uint256 redeemedAt;
    }

    mapping(uint256 => PlateMetadata) public plateMetadata;
    mapping(uint256 => VoucherNFT) public voucherNFTs;
    mapping(address => uint256[]) public vendorPlates;
    mapping(uint256 => uint256) public voucherToRedemptionCode;
    mapping(uint256 => uint256) public redemptionCodeToVoucher;

    constructor() ERC721("MesaCompartidaPlates", "PLATE") Ownable(msg.sender) {}

    function createPlate(
        string memory _name,
        string memory _description,
        string memory _ipfsHash,
        uint256 _maxSupply,
        uint256 _expiresAt
    ) external returns (uint256) {
        return _createPlateInternal(msg.sender, _name, _description, _ipfsHash, _maxSupply, _expiresAt);
    }

    function createPlateForVendor(
        address _vendor,
        string memory _name,
        string memory _description,
        string memory _ipfsHash,
        uint256 _maxSupply,
        uint256 _expiresAt
    ) external returns (uint256) {
        return _createPlateInternal(_vendor, _name, _description, _ipfsHash, _maxSupply, _expiresAt);
    }

    function _createPlateInternal(
        address _vendor,
        string memory _name,
        string memory _description,
        string memory _ipfsHash,
        uint256 _maxSupply,
        uint256 _expiresAt
    ) internal returns (uint256) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_maxSupply > 0, "Max supply must be > 0");
        require(
            _expiresAt > block.timestamp,
            "Expiration must be in the future"
        );

        uint256 plateId = _tokenIdCounter++;

        plateMetadata[plateId] = PlateMetadata({
            name: _name,
            description: _description,
            ipfsHash: _ipfsHash,
            vendor: _vendor,
            createdAt: block.timestamp,
            expiresAt: _expiresAt,
            maxSupply: _maxSupply,
            availableVouchers: _maxSupply
        });

        vendorPlates[_vendor].push(plateId);
        _allPlateIds.push(plateId);

        for (uint256 i = 0; i < _maxSupply; i++) {
            uint256 tokenId = _tokenIdCounter++;

            voucherNFTs[tokenId] = VoucherNFT({
                plateId: plateId,
                redeemed: false,
                redeemedAt: 0
            });

            uint256 redemptionCode = uint256(
                keccak256(
                    abi.encodePacked(plateId, i, block.timestamp, _vendor)
                )
            );

            voucherToRedemptionCode[tokenId] = redemptionCode;
            redemptionCodeToVoucher[redemptionCode] = tokenId;

            _mint(_vendor, tokenId);
        }

        return plateId;
    }

    function transferVoucher(uint256 _tokenId, address _to) external {
        require(ownerOf(_tokenId) == msg.sender, "Not voucher owner");

        VoucherNFT memory voucher = voucherNFTs[_tokenId];
        PlateMetadata storage plate = plateMetadata[voucher.plateId];

        require(block.timestamp < plate.expiresAt, "Voucher has expired");
        require(!voucher.redeemed, "Voucher already redeemed");

        plate.availableVouchers--;
        _transfer(msg.sender, _to, _tokenId);
    }

    function transferVoucherFrom(
        uint256 _tokenId,
        address _from,
        address _to
    ) external onlyOwner {
        require(ownerOf(_tokenId) == _from, "Not voucher owner");

        VoucherNFT memory voucher = voucherNFTs[_tokenId];
        PlateMetadata storage plate = plateMetadata[voucher.plateId];

        require(block.timestamp < plate.expiresAt, "Voucher has expired");
        require(!voucher.redeemed, "Voucher already redeemed");

        _transfer(_from, _to, _tokenId);
    }

    function redeemVoucher(uint256 _tokenId) external {
        VoucherNFT storage voucher = voucherNFTs[_tokenId];
        PlateMetadata storage plate = plateMetadata[voucher.plateId];

        require(ownerOf(_tokenId) == msg.sender, "Not voucher owner");
        require(!voucher.redeemed, "Voucher already redeemed");
        require(block.timestamp < plate.expiresAt, "Voucher has expired");

        voucher.redeemed = true;
        voucher.redeemedAt = block.timestamp;
    }

    function redeemVoucherByCode(uint256 _redemptionCode) external {
        uint256 tokenId = redemptionCodeToVoucher[_redemptionCode];
        require(tokenId != 0, "Invalid redemption code");

        VoucherNFT storage voucher = voucherNFTs[tokenId];
        PlateMetadata storage plate = plateMetadata[voucher.plateId];

        require(ownerOf(tokenId) == msg.sender, "Not voucher owner");
        require(!voucher.redeemed, "Voucher already redeemed");
        require(block.timestamp < plate.expiresAt, "Voucher has expired");

        voucher.redeemed = true;
        voucher.redeemedAt = block.timestamp;
    }

    function isVoucherValid(uint256 _tokenId) external view returns (bool) {
        VoucherNFT memory voucher = voucherNFTs[_tokenId];
        PlateMetadata memory plate = plateMetadata[voucher.plateId];

        return !voucher.redeemed && block.timestamp < plate.expiresAt;
    }

    function isVoucherExpired(uint256 _tokenId) external view returns (bool) {
        VoucherNFT memory voucher = voucherNFTs[_tokenId];
        PlateMetadata memory plate = plateMetadata[voucher.plateId];

        return block.timestamp >= plate.expiresAt;
    }

    function getVoucherInfo(
        uint256 _tokenId
    ) external view returns (VoucherNFT memory) {
        return voucherNFTs[_tokenId];
    }

    function getPlateMetadata(
        uint256 _plateId
    ) external view returns (PlateMetadata memory) {
        return plateMetadata[_plateId];
    }

    function getVendorPlates(
        address _vendor
    ) external view returns (uint256[] memory) {
        return vendorPlates[_vendor];
    }

    function getActivePlates() external view returns (PlateMetadata[] memory) {
        uint256 count = 0;

        for (uint256 i = 0; i < _allPlateIds.length; i++) {
            if (plateMetadata[_allPlateIds[i]].expiresAt > block.timestamp) {
                count++;
            }
        }

        PlateMetadata[] memory activePlates = new PlateMetadata[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < _allPlateIds.length; i++) {
            uint256 plateId = _allPlateIds[i];
            if (plateMetadata[plateId].expiresAt > block.timestamp) {
                activePlates[index] = plateMetadata[plateId];
                index++;
            }
        }

        return activePlates;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(
        uint256 _tokenId
    ) public view override returns (string memory) {
        require(ownerOf(_tokenId) != address(0), "Token does not exist");

        VoucherNFT memory voucher = voucherNFTs[_tokenId];
        PlateMetadata memory plate = plateMetadata[voucher.plateId];

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        plate.name,
                        '", "description": "',
                        plate.description,
                        '", "image": "ipfs://',
                        plate.ipfsHash,
                        '", "attributes": [{"trait_type": "Vendor", "value": "',
                        _addressToString(plate.vendor),
                        '"}, {"trait_type": "Redeemed", "value": "',
                        voucher.redeemed ? "true" : "false",
                        '"}, {"trait_type": "Expires At", "value": "',
                        Strings.toString(plate.expiresAt),
                        '"}]}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function _addressToString(
        address _addr
    ) internal pure returns (string memory) {
        bytes32 _bytes = bytes32(uint256(uint160(_addr)));
        bytes memory HEX = "0123456789abcdef";
        bytes memory result = new bytes(42);
        result[0] = "0";
        result[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            result[2 + i * 2] = HEX[uint8(_bytes[i + 12] >> 4)];
            result[3 + i * 2] = HEX[uint8(_bytes[i + 12] & 0x0f)];
        }
        return string(result);
    }
}
