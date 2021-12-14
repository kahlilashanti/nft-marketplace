import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
//data fetching library
import axios from 'axios'
//allows you to connect to wallets
import Web3Modal from 'web3modal';

// when we deploy 
// we are going to need a reference to our marketplace address as well as our nft address using config.js file
import {
  nftaddress, nftmarketaddress
} from '../config';

//ABIs are a json representation of a smart contract and allows us to interact with 
//the smart contract from a client side application
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';


export default function Home() {
  //we're going to have an array of nfts and a function to reset that array
  const [nfts, setNfts] = useState([])
  //loading state is a variable and setLoading will allow us to update it
  //this lets us show or hide our UI as needed
  const [loadingState, setLoadingState] = useState('not-loaded')

  useEffect(() => {
    loadNFTs()
  }, [])

  //this function loads all nfts
  async function loadNFTs() {
    //this is where we call our smart contract and fetch our NFTs when the page loads
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider);
    //this will return an array of unsold NFTs per the smart contract
    const data = await marketContract.fetchMarketItems();

    //map over all of those NFTs 
    const items = await Promise.all(data.map(async i => {
      //call tokencontract to the the uri 
      const tokenUri = await tokenContract.tokenUri(i.tokenId)
      //use axios to get the metadata from the contract
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item
    }))
    //this is going to set the new items array 
    setNfts(items)
    setLoadingState('loaded')
  }

  //this function allows the user to buy nfts
  async function buyNft(nft) {
    //allow user to connect to their wallet
    const web3Modal = new Web3Modal()
    //if the user has a wallet connection we can now work with that
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)

    //not only do we need the users address we need them to sign an actual transaction
    //create a signer
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarkretaddress, Market.abi, signer)

    //we want to get a reference to the price
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')

    //now we create the market sale
    const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, {
      value: price
    })
    //wait until transaction has completed
    await transaction.wait()
    //then reload the screen with the purchased nft now gone
    loadNFTs()


  }

  if (loadingState === 'loaded' && !nfts.length) return (<h1 className='px-20 py-10 text-3xl'>No Items In Marketplace</h1>)




  return (
    <div className='flex justify-center'>
      <div className='px-4' style={{ maxWidth: '1600px' }}>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4'>
          {
            nfts.map((nft, i) => {
              <div key={i} className='border shadow rounded-xl overflow-hidden'>
                <img src={nft.image} alt='nft image' />
                <div className='p-4'>
                  <p style={{ height: '64px' }} className='text-2xl font-semibold'>{nft.name}
                  </p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className='text-gray-400'>{nft.description}</p>
                  </div>
                </div>
                <div className='p-4 bg-black'>
                  <p className='text-2xl mb-4 font-bold text-white'>{nft.price} ETH</p>
                  <button className='w-full bg-pink-500 text-white font-bold py-2 px-12 rounded'
                    onClick={() => buyNft(nft)}>Buy</button>
                </div>
              </div>
            })
          }
        </div>
      </div>
    </div>
  )
}
