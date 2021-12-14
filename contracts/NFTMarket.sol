//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
//protects from multiple transactions and slim shadys
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    //create a variable for the owner of the contract
    //owner makes a commission on every item sold
    //owner charges a listing fee and anyone who lists it pays the owner a listing
    //fee and a % of each transaction
    address payable owner;
    //set listing price
    uint256 listingPrice = 0.025 ether;

    //the owner of this contract is the person deploying it
    constructor() {
        owner = payable(msg.sender);
    }

    //define a struct for each individual market item
    struct MarketItem {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    //keep up with all the items that have been created
    //allows you to fetch or find items based on id, which is assigned using the uint256
    mapping(uint256 => MarketItem) private idToMarketItem;

    //have an event for when a market item is created
    event MarketItemCreated(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    //function that returns the listing price, so we can see on the front end
    //how much it is to list an item
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    //creating a market item and putting it for sale
    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        //prevent people from listing something for zero eth or wei
        require(price > 0, "price must be at least 1 wei");
        //the user sending in this transaction must be passing in the required listing price
        require(
            msg.value == listingPrice,
            "price must be equal to listing price"
        );
        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        //create our mapping for the market item
        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );

        //transfer ownership of the nft to the contract itself
        //the contract will take ownership and transfer to the next buyer
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        //emit the event that an item has been created
        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }

    //creating a market sale for selling between parties
    function createMarketSale(address nftContract, uint256 itemId)
        public
        payable
        nonReentrant
    {
        uint256 price = idToMarketItem[itemId].price;
        uint256 tokenId = idToMarketItem[itemId].tokenId;
        //require that the person who has sent in this transaction has sent in
        //the correct value
        require(
            msg.value == price,
            "please submit the asking price to complete the purchase"
        );

        //transer the value of the transaction to the seller
        idToMarketItem[itemId].seller.transfer(msg.value);
        //transfer the ownership of this token to the sender
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        //set the local value for the owner to be message sender
        idToMarketItem[itemId].owner = payable(msg.sender);
        //show item as sold
        idToMarketItem[itemId].sold = true;
        //increment items sold
        _itemsSold.increment();
        //pay the owner of the contract their commission
        payable(owner).transfer(listingPrice);
    }

    //function that returns all unsold items
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        //above returns an array of items in the shop
        //return the total number of items we have created
        uint256 itemCount = _itemIds.current();
        //subtract items that have been sold from the total number of items created
        uint256 unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint256 currentIndex = 0;
        //loop over the array and check for unsold items by seeing which ones have an empty address
        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        for (uint256 i = 0; i < itemCount; i++) {
            //check to see if the item is unsold, and insert them into the array and then increment
            if (idToMarketItem[i + 1].owner == address(0)) {
                uint256 currentId = idToMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                //insert the item into the array
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    //function that returns only the NFTs that the user has purchased
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                uint256 currentId = idToMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    //return an array of the NFTs that a user has created themselves
    function fetchItemsCreated() public view returns (MarketItem[] memory) {
        //instead of looking for the owner to be the user, we will look for the seller to be the user
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                uint256 currentId = idToMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                //get the current item and insert it into the array
                items[currentIndex] = currentItem;
                //increment the current index
                currentIndex += 1;
            }
        }
        return items;
    }
}
