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
}
