
/**
 * Hardhat Configuration for RarityNFT Smart Contract
 * Supports: Ethereum, Goerli, Sepolia, Polygon, Mumbai
 */

require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

const {
  PRIVATE_KEY = "",
  INFURA_API_KEY = "",
  ETHERSCAN_API_KEY = "",
  POLYGONSCAN_API_KEY = "",
  COINMARKETCAP_API_KEY = "",
} = process.env;

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    hardhat: {
      chainId: 31337,
    },

    // Ethereum Mainnet
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 1,
    },

    // Ethereum Testnet - Goerli
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 5,
    },

    // Ethereum Testnet - Sepolia
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },

    // Polygon Mainnet
    polygon: {
      url: "https://polygon-rpc.com",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 137,
      gasPrice: 80000000000, // 80 Gwei
    },

    // Polygon Mumbai Testnet
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 80001,
      gasPrice: 20000000000, // 20 Gwei
    },

    // Arbitrum One
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 42161,
    },

    // Arbitrum Goerli Testnet
    arbitrumGoerli: {
      url: "https://goerli-rollup.arbitrum.io/rpc",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 421613,
    },
  },

  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      goerli: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
    },
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY,
    outputFile: "gas-report.txt",
    noColors: true,
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  mocha: {
    timeout: 40000,
  },
};
