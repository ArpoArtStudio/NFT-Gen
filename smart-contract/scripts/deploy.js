#!/usr/bin/env node

// filepath: /Users/mac/Downloads/hashlips_art_engine_app-main/smart-contract/scripts/deploy.js

/**
 * RarityNFT Smart Contract Deployment Script
 * 
 * Usage:
 * npx hardhat run scripts/deploy.js --network goerli
 * npx hardhat run scripts/deploy.js --network mainnet
 * npx hardhat run scripts/deploy.js --network polygon
 * npx hardhat run scripts/deploy.js --network mumbai
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

async function main() {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║    RarityNFT Smart Contract Deployment    ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════╝${colors.reset}\n`);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`${colors.blue}Deploying account:${colors.reset} ${deployer.address}`);

  // Get network information
  const network = await hre.ethers.provider.getNetwork();
  console.log(`${colors.blue}Network:${colors.reset} ${network.name} (Chain ID: ${network.chainId})`);

  // Get account balance
  const balance = await deployer.getBalance();
  console.log(`${colors.blue}Account balance:${colors.reset} ${hre.ethers.utils.formatEther(balance)} ETH/MATIC`);

  // Check balance is sufficient
  if (balance.lt(hre.ethers.utils.parseEther("0.1"))) {
    console.log(`${colors.yellow}⚠ Warning: Low account balance!${colors.reset}`);
  }

  // Base URI from environment or default
  const baseURI = process.env.BASE_URI || "ipfs://QmYourMetadataHashHere/";
  console.log(`${colors.blue}Base URI:${colors.reset} ${baseURI}`);

  console.log(`\n${colors.cyan}Deploying RarityNFT contract...${colors.reset}`);

  try {
    // Get contract factory
    const RarityNFT = await hre.ethers.getContractFactory("RarityNFT");

    // Deploy contract
    const contract = await RarityNFT.deploy(baseURI, {
      gasLimit: 3000000, // 3M gas limit for deployment
    });

    console.log(`${colors.green}✓ Contract deployed!${colors.reset}`);
    console.log(`${colors.blue}Transaction hash:${colors.reset} ${contract.deployTransaction.hash}`);
    console.log(`${colors.blue}Awaiting confirmation...${colors.reset}`);

    // Wait for deployment confirmation
    await contract.deployed();

    console.log(`${colors.green}✓ Contract deployed successfully!${colors.reset}`);
    console.log(`${colors.blue}Contract address:${colors.reset} ${colors.green}${contract.address}${colors.reset}`);

    // Save deployment info
    const deploymentInfo = {
      network: network.name,
      chainId: network.chainId,
      contractAddress: contract.address,
      deployerAddress: deployer.address,
      baseURI: baseURI,
      deploymentBlock: await hre.ethers.provider.getBlockNumber(),
      deploymentTime: new Date().toISOString(),
      transactionHash: contract.deployTransaction.hash,
    };

    const deploymentPath = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }

    const fileName = `deployment-${network.name}-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(deploymentPath, fileName),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log(`\n${colors.green}Deployment information saved to:${colors.reset} ${fileName}`);

    // Verify on block explorer
    if (process.env.ETHERSCAN_API_KEY || process.env.POLYGONSCAN_API_KEY) {
      console.log(`\n${colors.cyan}Verifying contract on block explorer...${colors.reset}`);
      console.log(`${colors.yellow}Waiting 30 seconds for transaction confirmation...${colors.reset}`);

      // Wait before verification
      await new Promise((resolve) => setTimeout(resolve, 30000));

      try {
        await hre.run("verify:verify", {
          address: contract.address,
          constructorArguments: [baseURI],
        });
        console.log(`${colors.green}✓ Contract verified!${colors.reset}`);
      } catch (error) {
        if (error.message.includes("Already Verified")) {
          console.log(`${colors.green}✓ Contract already verified${colors.reset}`);
        } else {
          console.log(`${colors.yellow}⚠ Verification skipped:${colors.reset} ${error.message}`);
        }
      }
    }

    // Print next steps
    console.log(`\n${colors.cyan}╔═══════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║         Next Steps                        ║${colors.reset}`);
    console.log(`${colors.cyan}╚═══════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`1. ${colors.blue}Add contract address to your application:${colors.reset}`);
    console.log(`   ${colors.green}${contract.address}${colors.reset}`);

    console.log(`\n2. ${colors.blue}Generate NFT metadata and prepare for minting${colors.reset}`);

    console.log(`\n3. ${colors.blue}Mint NFTs using batch minting (recommended):${colors.reset}`);
    console.log(`   See DEPLOYMENT_GUIDE.md for minting examples`);

    console.log(`\n4. ${colors.blue}List on OpenSea:${colors.reset}`);
    console.log(`   https://opensea.io/collection/rarity-nft`);

    console.log(`\n5. ${colors.blue}Monitor on block explorer:${colors.reset}`);
    if (network.chainId === 1) {
      console.log(`   https://etherscan.io/address/${contract.address}`);
    } else if (network.chainId === 5) {
      console.log(`   https://goerli.etherscan.io/address/${contract.address}`);
    } else if (network.chainId === 11155111) {
      console.log(`   https://sepolia.etherscan.io/address/${contract.address}`);
    } else if (network.chainId === 137) {
      console.log(`   https://polygonscan.com/address/${contract.address}`);
    } else if (network.chainId === 80001) {
      console.log(`   https://mumbai.polygonscan.com/address/${contract.address}`);
    }

    console.log(`\n${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);

    return contract.address;

  } catch (error) {
    console.error(`${colors.yellow}✗ Deployment failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run deployment
main()
  .then((address) => {
    console.log(`${colors.green}✓ Deployment complete!${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`${colors.yellow}✗ Error:${colors.reset}`, error);
    process.exit(1);
  });
