// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDiamond } from "../libraries/LibDiamond.sol";
import { NftFactory, Template } from "../libraries/LibAppStorage.sol";

contract NftFactoryFacet {
    NftFactory internal s;

    function setNFT(
        string memory name,
        string memory uri,
        bytes memory data,
        uint256 price
        ) public {
            LibDiamond.enforceIsContractOwner();
            s.nftCount++;
            Template memory template;
            template.name = name;
            template.uri = uri;
            template.data = data;
            template.price = price;
            template.tokenId = s.nftCount;
            s.nftTemplate[s.nftCount] = template;
    }

    function getSetNFT(uint256 tokenId) external view returns(
        string memory,
        string memory,
        bytes memory,
        uint256,
        uint256
    ) {
        Template memory template = s.nftTemplate[tokenId];
        return (
            template.name, 
            template.uri, 
            template.data, 
            template.price, 
            template.tokenId
            );
    }

    //function mintSetNFT(address user, uint256 amount) public {
    //    require(msg.sender == address(this), "NftFactory: You are not the minter");
    //    Template memory nft = newNFT[nftCount];
    //    totalSupply[nft.tokenId] += amount;
    //    nftFactory.mint(user, nft.tokenId, amount, nft.data);
    //} 

   
    //function getUserNFTBalance(address user, uint256 tokenId) public view returns(uint256){
    //    return nftFactory.balanceOf(user, tokenId);
    //}
}