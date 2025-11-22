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
