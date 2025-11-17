// Smart Contract Integration Helper
// Generates contract-ready data for efficient on-chain distribution tracking

const fs = require('fs');
const path = require('path');

class SmartContractHelper {
  
  // Generate contract deployment data
  static generateContractData(metadataList, outputPath) {
    console.log('🔗 Generating smart contract integration data...');
    
    const contractData = {
      totalSupply: metadataList.length,
      generationTimestamp: Date.now(),
      rarityTiers: this.getTierDistribution(metadataList),
      tokenData: this.getTokenMappings(metadataList),
      distributionWeights: this.getDistributionWeights(metadataList),
      summary: this.getCollectionSummary(metadataList)
    };
    
    // Save contract data
    const contractFile = path.join(outputPath, 'build', 'contract-data.json');
    fs.writeFileSync(contractFile, JSON.stringify(contractData, null, 2));
    
    // Generate Solidity mapping code
    const solidityCode = this.generateSolidityMappings(metadataList);
    const solidityFile = path.join(outputPath, 'build', 'contract-mappings.sol');
    fs.writeFileSync(solidityFile, solidityCode);
    
    // Generate deployment instructions
    const deploymentGuide = this.generateDeploymentGuide(contractData);
    const guideFile = path.join(outputPath, 'DEPLOYMENT_GUIDE.md');
    fs.writeFileSync(guideFile, deploymentGuide);
    
    console.log('✅ Contract data generated successfully!');
    console.log(`📄 Contract data: ${contractFile}`);
    console.log(`⚡ Solidity code: ${solidityFile}`);
    console.log(`📖 Deployment guide: ${guideFile}`);
    
    return contractData;
  }
  
  // Get tier distribution for contract
  static getTierDistribution(metadataList) {
    const distribution = {};
    
    metadataList.forEach(nft => {
      const tier = nft.tierId;
      if (!distribution[tier]) {
        distribution[tier] = {
          count: 0,
          minPoints: nft.totalPoints,
          maxPoints: nft.totalPoints,
          tierName: nft.rarityTier
        };
      }
      distribution[tier].count++;
      distribution[tier].minPoints = Math.min(distribution[tier].minPoints, nft.totalPoints);
      distribution[tier].maxPoints = Math.max(distribution[tier].maxPoints, nft.totalPoints);
    });
    
    return distribution;
  }
  
  // Generate token ID to points mapping for contract
  static getTokenMappings(metadataList) {
    return metadataList.map(nft => ({
      tokenId: nft.edition,
      totalPoints: nft.totalPoints,
      tierId: nft.tierId,
      rarityTier: nft.rarityTier,
      distributionWeight: nft.distributionWeight
    }));
  }
  
  // Calculate distribution weights for rewards
  static getDistributionWeights(metadataList) {
    const weights = {};
    let totalWeight = 0;
    
    metadataList.forEach(nft => {
      weights[nft.edition] = nft.totalPoints;
      totalWeight += nft.totalPoints;
    });
    
    // Convert to percentages
    const percentageWeights = {};
    Object.keys(weights).forEach(tokenId => {
      percentageWeights[tokenId] = ((weights[tokenId] / totalWeight) * 100).toFixed(6);
    });
    
    return {
      absolute: weights,
      percentage: percentageWeights,
      totalWeight
    };
  }
  
  // Generate collection summary
  static getCollectionSummary(metadataList) {
    const summary = {
      totalTokens: metadataList.length,
      minPoints: Math.min(...metadataList.map(nft => nft.totalPoints)),
      maxPoints: Math.max(...metadataList.map(nft => nft.totalPoints)),
      averagePoints: (metadataList.reduce((sum, nft) => sum + nft.totalPoints, 0) / metadataList.length).toFixed(2),
      uniqueScores: [...new Set(metadataList.map(nft => nft.totalPoints))].length
    };
    
    // Add tier breakdown
    const tierBreakdown = {};
    metadataList.forEach(nft => {
      if (!tierBreakdown[nft.tierId]) {
        tierBreakdown[nft.tierId] = { count: 0, avgPoints: 0 };
      }
      tierBreakdown[nft.tierId].count++;
    });
    
    Object.keys(tierBreakdown).forEach(tier => {
      const tierNFTs = metadataList.filter(nft => nft.tierId === tier);
      tierBreakdown[tier].avgPoints = (tierNFTs.reduce((sum, nft) => sum + nft.totalPoints, 0) / tierNFTs.length).toFixed(2);
    });
    
    summary.tierBreakdown = tierBreakdown;
    return summary;
  }
  
  // Generate Solidity code for on-chain storage
  static generateSolidityMappings(metadataList) {
    let code = `// Auto-generated Solidity mappings for RarityNFT contract
// Generated: ${new Date().toISOString()}
// Total NFTs: ${metadataList.length}

pragma solidity ^0.8.0;

contract RarityNFTMappings {
    
    // Token ID -> Total Points mapping
    mapping(uint256 => uint16) public tokenPoints;
    
    // Token ID -> Tier ID mapping (0-8)
    mapping(uint256 => uint8) public tokenTier;
    
    // Tier quota tracking
    mapping(uint8 => uint16) public tierMinted;
    
    // Initialize all token data (call after deployment)
    function initializeTokenData() external {
`;

    // Add token data initialization
    let tierCounts = {};
    metadataList.forEach((nft, index) => {
      if (index % 100 === 0) {
        code += `        // Tokens ${index}-${Math.min(index + 99, metadataList.length - 1)}\n`;
      }
      code += `        tokenPoints[${nft.edition}] = ${nft.totalPoints};\n`;
      code += `        tokenTier[${nft.edition}] = ${nft.tierId};\n`;
      
      tierCounts[nft.tierId] = (tierCounts[nft.tierId] || 0) + 1;
    });

    code += `\n        // Tier totals\n`;
    Object.keys(tierCounts).forEach(tier => {
      code += `        tierMinted[${tier}] = ${tierCounts[tier]};\n`;
    });

    code += `    }\n}\n`;
    
    return code;
  }
  
  // Generate deployment guide
  static generateDeploymentGuide(contractData) {
    const guide = `# Smart Contract Deployment Guide

## Overview
This guide covers deploying the RarityNFT smart contract to Ethereum, Polygon, or other EVM chains.

## Prerequisites
1. **Hardhat** or **Truffle** - Ethereum development framework
2. **Web3.js** or **Ethers.js** - Blockchain interaction library
3. **Node.js** 16+ and npm/yarn
4. **MetaMask** or other Web3 wallet
5. Testnet ETH or MATIC for gas fees

## Installation

\`\`\`bash
# Initialize Hardhat project
npm install --save-dev hardhat
npx hardhat

# Install OpenZeppelin contracts
npm install @openzeppelin/contracts

# Install other dependencies
npm install --save-dev @nomicfoundation/hardhat-toolbox
npm install dotenv
\`\`\`

## Contract Deployment

### Step 1: Prepare Environment

Create \`.env\` file:
\`\`\`
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_key_here
ETHERSCAN_API_KEY=your_etherscan_key_here
POLYGONSCAN_API_KEY=your_polygonscan_key_here
\`\`\`

### Step 2: Deploy to Testnet (Goerli)

\`\`\`bash
npx hardhat run scripts/deploy.js --network goerli
\`\`\`

### Step 3: Verify Contract

\`\`\`bash
npx hardhat verify \\
  --network goerli \\
  CONTRACT_ADDRESS \\
  "ipfs://QmYourBaseURI/"
\`\`\`

### Step 4: Deploy to Mainnet

\`\`\`bash
npx hardhat run scripts/deploy.js --network mainnet
\`\`\`

## Collection Statistics
- **Total Supply:** ${contractData.totalSupply}
- **Total Tiers:** 9 (T1-T9)
- **Minimum Points:** ${contractData.summary.minPoints}
- **Maximum Points:** ${contractData.summary.maxPoints}
- **Average Points:** ${contractData.summary.averagePoints}
- **Unique Scores:** ${contractData.summary.uniqueScores}

## Tier Distribution
${Object.entries(contractData.rarityTiers).map(([tier, data]) => 
  `- **Tier ${tier}**: ${data.count} NFTs (${data.tierName}) - Points: ${data.minPoints}-${data.maxPoints}`
).join('\n')}

## Minting Functions

### Single Mint
\`\`\`javascript
const tx = await contract.mintRarityNFT(
  ownerAddress,
  tierID,              // 0-8
  totalPoints,         // 42-270
  socksPoints,         // 7-45
  shoesPoints,         // 7-45
  pantsPoints,         // 7-45
  shirtPoints,         // 7-45
  facePoints,          // 7-45
  hatPoints,           // 7-45
  tokenURI             // ipfs://...
);
await tx.wait();
\`\`\`

### Batch Mint (Recommended)
\`\`\`javascript
const rarityDataArray = nfts.map(nft => ({
  tier: nft.tierId,
  totalPoints: nft.totalPoints,
  socksPoints: nft.points.socks,
  shoesPoints: nft.points.shoes,
  pantsPoints: nft.points.pants,
  shirtPoints: nft.points.shirt,
  facePoints: nft.points.face,
  hatPoints: nft.points.hat
}));

const tx = await contract.batchMintRarityNFTs(
  ownerAddress,
  rarityDataArray,
  tokenURIs
);
await tx.wait();
\`\`\`

## Query Functions

### Get Rarity Info
\`\`\`javascript
const tier = await contract.getTierName(tokenId);
const points = await contract.getTotalPoints(tokenId);
const rarityIndex = await contract.getRarityIndex(tokenId);
\`\`\`

### Get Tier Statistics
\`\`\`javascript
const stats = await contract.getTierStats(tierID);
console.log(stats.name, stats.minted, stats.quota);
\`\`\`

### Get Tokens by Rarity
\`\`\`javascript
const tierTokens = await contract.getTokensByTier(tierID);
const scoreRange = await contract.getTokensByScoreRange(minScore, maxScore);
\`\`\`

## Gas Estimates

- **Single Mint:** ~95,000 gas
- **Batch Mint (100 NFTs):** ~6,500,000 gas (batch optimization)
- **Query Functions:** ~2,000-5,000 gas (free calls)

## Security Considerations

1. **Access Control:** Only contract owner can mint
2. **Tier Quotas:** Enforced at contract level
3. **Score Validation:** Points must match tier ranges
4. **Supply Cap:** Hard-coded 10,000 limit
5. **Pausable:** Consider adding emergency pause function

## Verification on Block Explorers

### Etherscan (Ethereum/Goerli)
1. Go to https://etherscan.io or https://goerli.etherscan.io
2. Paste contract address
3. Click "Verify and Publish"
4. Select Solidity compiler version 0.8.0+
5. Paste contract source code

### PolygonScan (Polygon)
1. Go to https://polygonscan.com
2. Follow same process as Etherscan

## Metadata Integration

Each NFT should have metadata JSON:
\`\`\`json
{
  "name": "NFT #0",
  "description": "Rare tier NFT with 156 total points",
  "image": "ipfs://QmYourImageHash",
  "attributes": [
    { "trait_type": "Rarity Tier", "value": "Common" },
    { "trait_type": "Total Points", "value": 156 },
    { "trait_type": "Socks", "value": 26, "max_value": 45 },
    { "trait_type": "Shoes", "value": 26, "max_value": 45 },
    { "trait_type": "Pants", "value": 26, "max_value": 45 },
    { "trait_type": "Shirt", "value": 26, "max_value": 45 },
    { "trait_type": "Face", "value": 26, "max_value": 45 },
    { "trait_type": "Hat", "value": 26, "max_value": 45 }
  ]
}
\`\`\`

## Listing on OpenSea

1. Connect to OpenSea.io
2. Import collection with contract address
3. Set collection metadata (name, description, image)
4. Configure collection rarity settings
5. Wait for indexing (can take 24-48 hours)
6. Collection will appear under your profile

## Troubleshooting

### "Tier quota exceeded"
- Ensure you're not exceeding tier limits during batch minting
- Check remaining quotas: \`contract.remainingTierSupply(tierID)\`

### "Points not in tier range"
- Verify total points match tier score range
- T5 should be 144-174, for example

### High gas costs
- Use batch minting instead of single mints
- Optimize transaction timing
- Consider L2 solutions (Polygon, Arbitrum)

## Support & Resources

- **Hardhat Docs:** https://hardhat.org
- **OpenZeppelin:** https://docs.openzeppelin.com
- **Ethers.js:** https://docs.ethers.io
- **Solidity Docs:** https://docs.soliditylang.org

---

Generated: ${new Date().toISOString()}
`;
    
    return guide;
  }

  // Generate Hardhat deployment script
  static generateHardhatScript() {
    const script = `// scripts/deploy.js
// Hardhat deployment script for RarityNFT

const hre = require("hardhat");

async function main() {
  console.log("Deploying RarityNFT contract...");

  const baseURI = process.env.BASE_URI || "ipfs://QmYourBaseURIHere/";

  const RarityNFT = await hre.ethers.getContractFactory("RarityNFT");
  const contract = await RarityNFT.deploy(baseURI);

  await contract.deployed();

  console.log("✓ RarityNFT deployed to:", contract.address);
  console.log("✓ Base URI set to:", baseURI);
  
  // Verify contract on block explorer
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\\nWaiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    await hre.run("verify:verify", {
      address: contract.address,
      constructorArguments: [baseURI]
    });
    console.log("✓ Contract verified!");
  }

  return contract.address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
`;
    
    return script;
  }

  // Export for use in generation pipeline
  static exportForContract(metadataList) {
    return {
      contractReady: true,
      totalSupply: metadataList.length,
      tierDistribution: this.getTierDistribution(metadataList),
      deploymentReady: true,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = SmartContractHelper;
