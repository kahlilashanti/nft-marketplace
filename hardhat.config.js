require("@nomiclabs/hardhat-waffle");
require('dotenv');
const fs = require("fs")
const privateKey = fs.readFileSync(".secret").toString()
// const projectId = process.env.INFURA_PROJECT_ID
const projectId = "bc2c458ca80a4fae92092f95589aeb11"

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
// task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
//   const accounts = await hre.ethers.getSigners();

//   for (const account of accounts) {
//     console.log(account.address);
//   }
// });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      chainId: 1337
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${projectId}`,
      accounts: [privateKey]
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${projectId}`,
      accounts: [privateKey]
    },
  },
  solidity: "0.8.10",
};
