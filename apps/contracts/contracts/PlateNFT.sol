// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract PlateNFT is ERC721, ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;

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

    constructor() ERC721("MesaCompartidaPlates", "PLATE") Ownable(msg.sender) {}

    function createPlate(
        string memory _name,
        string memory _description,
        string memory _ipfsHash,
        uint256 _maxSupply,
        uint256 _expiresAt
    ) external returns (uint256) {
        uint256 plateId = _tokenIdCounter++;

        plateMetadata[plateId] = PlateMetadata({
            name: _name,
            description: _description,
            ipfsHash: _ipfsHash,
            vendor: msg.sender,
            createdAt: block.timestamp,
            expiresAt: _expiresAt,
            maxSupply: _maxSupply,
            availableVouchers: _maxSupply
        });

        for (uint256 i = 0; i < _maxSupply; i++) {
            uint256 tokenId = _tokenIdCounter++;

            voucherNFTs[tokenId] = VoucherNFT({
                plateId: plateId,
                redeemed: false,
                redeemedAt: 0
            });
        }

        return plateId;
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
}
