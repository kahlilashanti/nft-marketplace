const { expect } = require("chai");
const { ethers } = require("hardhat");

//to run the test open terminal and run npx hardhat test

describe("NFTMarket", function () {
  it("Should execute and create market sales", async function () {
    //we want to simulate deplying a contract creating an NFT and selling it
    //get a reference to that market contract
    const Market = await ethers.getContractFactory("NFTMarket");
    //deploy the market and wait for it to be delpoyed
    const market = await Market.deploy();
    await market.deployed();
    const marketAddress = market.address;

    //deploy the NFT contract
    const NFT = await ethers.getContractFactory("NFT");
    //pass in the market address to the constructor of the NFT
    const nft = await NFT.deploy(marketAddress);
    await nft.deployed();
    //get a reference to the NFT contract address
    const nftContractAddress = nft.address;
    //we need a way to know how much the listing price is
    let listingPrice = await market.getListingPrice();
    //convert the listing price to a string
    listingPrice = listingPrice.toString();
    //create a value for the auction price or how much we are selling our items for
    //parseUnits allows us to work with whole units instead of wei which is 18 decimals (a pain to work with)
    const auctionPrice = ethers.utils.parseUnits("1", 'ether');

    //create a few tokens to sell
    await nft.createToken("https://www.mytokenlocation.com")
    await nft.createToken("https://www.mytokenlocation2.com")

    //list these two tokens on the actual market now that they're created
    await market.createMarketItem(nftContractAddress, 1, auctionPrice, { value: listingPrice });
    await market.createMarketItem(nftContractAddress, 2, auctionPrice, { value: listingPrice });

    //in a real world scenario we would identify users by their metamask accounts
    //in a testing environment we can just get reference to a bunch of test accounts
    const [_, buyerAddress] = await ethers.getSigners(); //returns an array of accounts
    //when testing we don't want the buyer to be the same person as the seller so we want to get a different address
    await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, { value: auctionPrice });

    //we want to use this buyer address to connect to the market and create a sale
    //we want to map over all these items and update the value of them
    let items = await market.fetchMarketItems();

    items = await Promise.all(items.map(async i => {
      //get the tokenUri 
      const tokenUri = await nft.tokenURI(i.tokenId);
      let item = {
        //this object makes it easier for humans to read the data on the front end
        price: i.price.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenUri
      }
      return item;
    }))


    console.log('items: ', items);

  });
})