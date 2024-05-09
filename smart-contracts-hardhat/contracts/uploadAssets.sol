// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import '@lukso/lsp-contracts/contracts/Token/ERC721/IERC721.sol';
// import '@lukso/lsp-contracts/contracts/Token/ERC721/ERC721.sol';

// contract HashDataStorage {
//   // Mapping from token ID to hash data
//   mapping(uint256 => string) private _hashData;

//   // Event emitted when hash data is set for a token
//   event HashDataSet(uint256 indexed tokenId, string hashData);

//   // Function to set hash data for a token
//   function setHashData(uint256 tokenId, string memory hashData) external {
//     require(
//       _isTokenOwner(msg.sender, tokenId),
//       'HashDataStorage: caller is not the token owner'
//     );
//     _hashData[tokenId] = hashData;
//     emit HashDataSet(tokenId, hashData);
//   }

//   // Function to get hash data for a token
//   function getHashData(uint256 tokenId) external view returns (string memory) {
//     return _hashData[tokenId];
//   }

//   // Internal function to check if the caller is the owner of the token
//   function _isTokenOwner(
//     address caller,
//     uint256 tokenId
//   ) internal view returns (bool) {
//     return IERC721(msg.sender).ownerOf(tokenId) == caller;
//   }
// }
