//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    //this increments each token as they are minted
    Counters.Counter private _tokenIds;
    //address of the marketplace that we want the NFT to interact with
    address contractAddress;

    constructor(address markeplaceAddress) ERC721("Metaverse Tokens", "METT") {
        contractAddress = markeplaceAddress;
    }

    //function for minting new tokens
    function createToken(string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();
        //get value of current tokenId
        uint256 newItemId = _tokenIds.current();
        //mint the token with sender as creator and assigning a new item id
        _mint(msg.sender, newItemId);
        //set the token URI
        _setTokenURI(newItemId, tokenURI);
        //give the marketplace the approval to transact the token between users
        setApprovalForAll(contractAddress, true);
        //this is so we can mint the token and set it for sale in a subsequent transaction
        return newItemId;
    }
}
