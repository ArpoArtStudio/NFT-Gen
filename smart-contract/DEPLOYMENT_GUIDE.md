# Smart Contract Deployment Guide

**Status:** ✅ Ready for Deployment  
**Last Updated:** November 8, 2025  
**Networks:** Ethereum, Polygon, Arbitrum (+ Testnets)

---

## 📋 Quick Start

```bash
# 1. Install dependencies
cd smart-contract
npm install

# 2. Create .env file (copy from .env.example)
cp .env.example .env
# Then edit .env with your private key and RPC URLs

# 3. Deploy to testnet first (recommended)
npx hardhat run scripts/deploy.js --network sepolia

# 4. Deploy to mainnet (when ready)
npx hardhat run scripts/deploy.js --network ethereum
```

---

## 🔧 Prerequisites

### 1. Node.js & npm
```bash
node --version  # Should be v16 or higher
npm --version   # Should be v7 or higher
```

### 2. Private Key
- Get from MetaMask or other wallet
- For testnet: Create new account, no funds needed yet
- For mainnet: Ensure account has ETH for gas fees

### 3. Test Funds (for testnet only)
- Sepolia: https://sepolia-faucet.pk910.de/
- Mumbai: https://faucet.polygon.technology/
- Arbitrum Goerli: https://testnet.bridge.arbitrum.io/

### 4. RPC URLs & API Keys
Get from these providers (free tier available):

**Alchemy (Recommended)**
- https://www.alchemy.com/
- Supports all networks
- Free tier: 10M compute units/month

**Infura**
- https://infura.io/
- Supports most networks
- Free tier available

**Other Providers**
- QuickNode
- Moralis
- Ankr

---

## 📝 Setup Steps

### Step 1: Install Dependencies

```bash
cd smart-contract
npm install
```

Expected output:
```
added 500+ packages
```

### Step 2: Create Environment File

```bash
cp .env.example .env
```

Edit `.env` file with your values:

```bash
# Get private key (without 0x prefix)
# From MetaMask: Account Details → Export Private Key
PRIVATE_KEY=your_actual_private_key_here

# Get RPC URLs from Alchemy or Infura
ETHEREUM_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-key
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
POLYGON_MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/your-key
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your-key
ARBITRUM_GOERLI_RPC_URL=https://arb-goerli.g.alchemy.com/v2/your-key
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your-key

# Get API keys for contract verification
ETHERSCAN_API_KEY=your_etherscan_key
POLYGONSCAN_API_KEY=your_polygonscan_key
ARBISCAN_API_KEY=your_arbiscan_key
```

### Step 3: Verify Setup

```bash
# Compile smart contract
npx hardhat compile

# Run tests
npm test
```

Expected output:
```
✓ All tests passing
```

---

## 🚀 Deployment

### Option 1: Deploy to Sepolia Testnet (RECOMMENDED FIRST)

**Why test first?**
- No risk
- Verify everything works
- Practice the process
- Free test funds available

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Expected output:
```
Deploying RarityNFT contract...
Contract deployed to: 0x1234567890123456789012345678901234567890
✓ Deployment successful
```

**Verify on Sepolia Etherscan:**
- Go to: https://sepolia.etherscan.io/
- Search for contract address
- Verify source code (optional)

### Option 2: Deploy to Ethereum Mainnet

**⚠️ PRODUCTION - Use after testing on testnet**

```bash
npx hardhat run scripts/deploy.js --network ethereum
```

**Verify on Etherscan:**
- Go to: https://etherscan.io/
- Search for contract address
- Verify source code (optional)

### Option 3: Deploy to Polygon

**Mainnet:**
```bash
npx hardhat run scripts/deploy.js --network polygon
```

**Mumbai Testnet:**
```bash
npx hardhat run scripts/deploy.js --network mumbai
```

### Option 4: Deploy to Arbitrum

**Mainnet:**
```bash
npx hardhat run scripts/deploy.js --network arbitrum
```

**Goerli Testnet:**
```bash
npx hardhat run scripts/deploy.js --network arbitrumGoerli
```

---

## 🔍 Verify Deployment

After deployment, verify the contract:

```bash
# Set these variables
export CONTRACT_ADDRESS=0x...
export ETHERSCAN_API_KEY=your_key

# Verify on Etherscan (Ethereum)
npx hardhat verify --network ethereum $CONTRACT_ADDRESS

# Verify on PolygonScan (Polygon)
npx hardhat verify --network polygon $CONTRACT_ADDRESS

# Verify on Arbiscan (Arbitrum)
npx hardhat verify --network arbitrum $CONTRACT_ADDRESS
```

---

## 🧪 Testing After Deployment

### 1. Mint Test NFT

```bash
# Create a simple minting script
# Or use blockchain explorer to call mint() function
```

### 2. Check Token URI

```bash
# Call tokenURI(0) on deployed contract
# Should return: ipfs://YOUR_HASH/nft_00001.png
```

### 3. Verify Metadata Format

```bash
# Run metadata validator
node ../validate-opensea-metadata.js
```

---

## 💰 Gas Fees

Approximate costs:

| Network | Deployment Cost | Operation | Cost |
|---------|-----------------|-----------|------|
| Ethereum Mainnet | 0.1-0.5 ETH | Mint | 0.01-0.05 ETH |
| Polygon | $1-5 | Mint | <$0.01 |
| Arbitrum | $2-10 | Mint | <$0.01 |
| Testnet | FREE | Mint | FREE |

---

## ⚠️ Important Notes

### Security
- ❌ Never share your private key
- ❌ Never commit .env to git
- ✅ Add .env to .gitignore
- ✅ Store private key securely (hardware wallet recommended)

### Gas Optimization
- Deploy to testnet first
- Monitor gas prices
- Deploy during low-traffic periods for cheaper fees

### Verification
- Always verify on explorers (Etherscan, PolygonScan, etc.)
- Check contract address is correct
- Verify metadata format before launch

---

## 🆘 Troubleshooting

### Error: "Insufficient funds"
- Need to send ETH to deployment wallet
- Mainnet: Send from exchange
- Testnet: Use faucet

### Error: "RPC URL not responding"
- Check .env file has correct URL
- Verify API key is valid
- Try different RPC provider

### Error: "Private key invalid"
- Remove 0x prefix from private key
- Ensure it's 64 hex characters
- Double-check no spaces or special chars

### Error: "Cannot find module"
- Run: `npm install`
- Delete `node_modules`: `rm -rf node_modules`
- Install again: `npm install`

### Contract deploys but won't verify
- Check constructor arguments match
- Use flattened source code
- Verify compiler version matches

---

## 📋 Deployment Checklist

- [ ] Node.js installed (v16+)
- [ ] npm installed
- [ ] `npm install` completed
- [ ] `.env` file created with all values
- [ ] Private key has test funds (testnet) or ETH (mainnet)
- [ ] `npx hardhat compile` passes
- [ ] `npm test` passes
- [ ] Deployed to testnet successfully
- [ ] Verified on testnet explorer
- [ ] Metadata format correct
- [ ] Minting works on testnet
- [ ] Ready for mainnet deployment

---

## 🎯 Next Steps After Deployment

1. **Get Contract Address** from deployment output
2. **Update IPFS Metadata** (if not done yet):
   ```bash
   node update-ipfs-metadata.js --hash QmYour... --output-dir output/nfts-final
   ```
3. **Create Collection** on marketplace:
   - OpenSea: https://opensea.io/create
   - Magic Eden: https://www.magiceden.io/
   - Blur: https://blur.io/
4. **Import Metadata**:
   - Use contract address
   - Specify metadata folder
   - Set royalties
5. **Launch Collection**

---

## 📞 Additional Resources

- **Hardhat Docs:** https://hardhat.org/
- **OpenZeppelin:** https://docs.openzeppelin.com/
- **Ethers.js:** https://docs.ethers.org/
- **Ethereum Dev Docs:** https://ethereum.org/en/developers/
- **OpenSea API:** https://docs.opensea.io/
- **Magic Eden API:** https://developers.magiceden.io/

---

**Status:** ✅ Ready to Deploy  
**Last Updated:** November 8, 2025

Good luck with your deployment! 🚀
