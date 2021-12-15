import { ethers } from 'ethers';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import { useState } from 'react';
import Web3Modal from 'web3modal';
import { useRouter } from 'next/router';

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0/');

import {
    nftaddress, nftmarketaddress
} from '../config';

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';

export default function CreateItem() {
    //this is for the ipfs file we are going to allow the user to upload their NFT image
    const [fileUrl, setFileUrl] = useState(null);
    //this allows the user to fill in the form to complete the info about their NFT
    const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' });
    const router = useRouter();

    //function to handle the form submission
    async function onChange(e) {
        const file = e.target.files[0];
        try {
            const added = await client.add(file,
                {
                    progress: (prog) => console.log(`received: ${prog}`)
                }
            )
            //we can now set the url of the asset
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            setFileUrl(url);
        } catch (e) {
            console.log(e);
        }
    }
    //create the item and save it to IPFS
    async function createItem() {
        //first grab the values the user filled in from the form
        const { price, name, description } = formInput;
        //form validation in case any of the fields are empty
        if (!price || !name || !description || !fileUrl)
            return;

        //turn the nft into JSON
        const data = JSON.stringify({
            name, description, image: fileUrl
        })

        try {
            const added = await client.add(data)
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            //after the file is uploaded to IPFS, pass the url to save it on Polygon
            createSale(url)
        } catch (error) {
            console.log('Error uploading file: ', error)
        }

    }
    //this function will list the item for sale
    async function createSale(url) {
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        //interact with NFT contract
        let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
        //create transaction
        let transaction = await contract.createToken(url)
        //wait for transaction to complete
        let tx = await transaction.wait()

        //we want to get the tokenID return from that transaction
        //we get an events array back
        let event = tx.events[0]
        let value = event.args[2]
        let tokenId = value.toNumber()

        //get reference to the price we want to sell the item for
        const price = ethers.utils.parseUnits(formInput.price, 'ether')

        //we now want to move the reference to the market contract
        contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        //get the listing price and turn it into a string
        let listingPrice = await contract.getListingPrice()
        listingPrice = listingPrice.toString()

        transaction = await contract.createMarketItem(nftaddress, tokenId, price, { value: listingPrice })
        //wait for transaction to complete
        await transaction.wait()
        //reroute user to another page - in this case the home page
        //where we re-fetch the nfts and render them
        router.push('/')
    }
    //return our UI
    return (
        <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
                <input
                    placeholder="Asset name"
                    className="mt-8 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
                />
                <textarea
                    placeholder="Asset description"
                    className="mt-2 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
                />
                <input
                    placeholder="Asset Price in Eth"
                    className="mt-2 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
                />
                <input
                    type="file"
                    name="Asset"
                    className="my-4"
                    onChange={onChange}
                />
                {
                    fileUrl && (
                        <img className="rounded mt-4" width="350" src={fileUrl} alt="preview" />
                    )
                }
                <button
                    onClick={createItem}
                    className="font-bold mt-4 bg-pink-500 text-white rounded
                p-4 shadow-lg">
                    Create Digial Asset
                </button>
            </div>
        </div>
    )
}
