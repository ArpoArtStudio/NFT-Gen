# ⚡ QUICK START - Step by Step

**30-second overview:**
1. Add images → 2. Generate → 3. Upload to IPFS → 4. Deploy

---

## Step 1: Add Your 156 Images

Put your PNG files here:
```
layers/face/      Face_01.png to Face_26.png
layers/hat/       Hat_01.png to Hat_26.png
layers/pants/     Pants_01.png to Pants_26.png
layers/shirt/     Shirt_01.png to Shirt_26.png
layers/shoes/     Shoes_01.png to Shoes_26.png
layers/socks/     Socks_01.png to Socks_26.png
```

Verify:
```bash
npm run validate:setup
```

---

## Step 2: Generate 10,000 NFTs

**Option A: AWS (10 minutes, $5-15)**
```bash
npm run generate:aws
```

**Option B: Local (2-3 hours, free)**
```bash
npm run generate:local
```

Generate specific range (testing):
```bash
npm run generate:local -- --start=1 --end=100
```

---

## Step 3: Upload to IPFS (nft.storage)

1. Go to https://nft.storage/ and create an API key
2. Run:
```bash
export NFT_STORAGE_TOKEN=YOUR_TOKEN
npm run upload:ipfs
```
3. Copy the returned CID(s)

---

## Step 4: Deploy Smart Contract

1. Open `smart-contract/RarityNFT.sol`
2. Set:
```solidity
string public baseURI = "ipfs://YOUR_IMAGES_CID/";
```
3. Deploy:
```bash
cd smart-contract
npm run deploy-sepolia   # testnet (free)
# or
npm run deploy-ethereum  # mainnet (paid gas)
```

---

## Next Steps

Need full detail? Read: `SETUP_GUIDE.md`
Want AWS specifics? Read: `AWS_IPFS_GUIDE.md`
Metadata format? See: `METADATA_TEMPLATE.md`
Production checklist? See: `PRODUCTION_SETUP.md`

---

## Common Issues

Module not found:
```bash
npm install
```

Out of memory locally:
```bash
npm run generate:local -- --start=1 --end=1000
```

IPFS upload failed:
```bash
export NFT_STORAGE_TOKEN=YOUR_TOKEN
npm run upload:ipfs
```

---

**Status:** ✅ Ready to generate 10,000 NFTs with 9-tier rarity system

---
