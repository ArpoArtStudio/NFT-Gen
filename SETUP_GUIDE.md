# 🎨 NFT COLLECTION - COMPLETE SETUP GUIDE

**This is the ONLY guide you need. No fluff, just what to do.**

---

## 📋 TABLE OF CONTENTS

1. [What You Need](#-what-you-need)
2. [Step 1: Prepare Your Images](#step-1-prepare-your-images)
3. [Step 2: Generate NFTs](#step-2-generate-nfts-pick-one)
4. [Step 3: Upload to IPFS](#step-3-upload-to-ipfs)
5. [Step 4: Deploy Smart Contract](#step-4-deploy-smart-contract)
6. [Troubleshooting](#troubleshooting)

---

## 📦 What You Need

### To Generate Locally (Slow, Free)
- Your computer
- 156 trait images

### To Generate on AWS (Fast, $5-15)
- AWS account (free to create)
- Credit card
- 156 trait images

### To Upload to IPFS
- nft.storage account (free)

### To Deploy Smart Contract
- Your wallet with ETH (testnet = free, mainnet = costs gas)

---

## STEP 1: Prepare Your Images

### Naming Your Images

Your images must be named exactly like this:

```
Face_01.png, Face_02.png, ... Face_26.png
Hat_01.png, Hat_02.png, ... Hat_26.png
Pants_01.png, Pants_02.png, ... Pants_26.png
Shirt_01.png, Shirt_02.png, ... Shirt_26.png
Shoes_01.png, Shoes_02.png, ... Shoes_26.png
Socks_01.png, Socks_02.png, ... Socks_26.png
```

**Total: 156 PNG files**

### Where to Put Them

Copy them into these folders:

```
Your Project/
├── layers/
│   ├── face/        ← Face_01.png to Face_26.png
│   ├── hat/         ← Hat_01.png to Hat_26.png
│   ├── pants/       ← Pants_01.png to Pants_26.png
│   ├── shirt/       ← Shirt_01.png to Shirt_26.png
│   ├── shoes/       ← Shoes_01.png to Shoes_26.png
│   └── socks/       ← Socks_01.png to Socks_26.png
```

### Verify They're There

Run this command:

```bash
npm run validate:setup
```

You should see: ✅ All 156 images found

---

## STEP 2: Generate NFTs (Pick ONE)

### OPTION A: AWS (Fast - 10 minutes, $5-15)

**Why AWS?** Your computer takes 2-3 hours. AWS takes 10 minutes.

#### 2A-1: Get AWS Credentials

1. Go to: https://console.aws.amazon.com/iam/
2. Click **"Users"** (left side)
3. Click **"Create user"**
4. Name: `nft-generator`
5. Click **"Next"** → **"Attach policies directly"**
6. Check: `AWSLambdaFullAccess`
7. Check: `AmazonS3FullAccess`
8. Click **"Create user"**
9. Click your new user → **"Security credentials"** tab
10. Click **"Create access key"**
11. Choose **"Command Line Interface"**
12. Click **"Create access key"**
13. **COPY BOTH KEYS** (you'll need them)

#### 2A-2: Create S3 Bucket

1. Go to: https://console.aws.amazon.com/s3/
2. Click **"Create bucket"**
3. Name: `nft-collection-output` (must be unique, so try `nft-collection-yourname` if taken)
4. Click **"Create bucket"**

#### 2A-3: Start Generation

On your computer, open terminal and type:

```bash
cd /Users/mac/Desktop/hashlips_art_engine_app-main
npm run generate:aws
```

When asked:
- **AWS Access Key**: Paste the Access Key ID from step 2A-1
- **AWS Secret Key**: Paste the Secret Access Key from step 2A-1
- **Region**: Type `us-east-1`
- **Bucket**: Type `nft-collection-output`

#### 2A-4: Wait for Generation

AWS will generate 10,000 NFTs. Takes about 10 minutes.

Watch progress here: https://console.aws.amazon.com/lambda/

#### 2A-5: Download to Your Computer

```bash
npm run download:aws
```

This creates:
```
output/aws-generated/
├── images/     (10,000 PNG files)
└── metadata/   (10,000 JSON files)
```

### OPTION B: Local (Slow - 2-3 hours, Free)

Your computer generates the NFTs. No AWS needed.

```bash
npm run generate:local
```

**Wait 2-3 hours.**

When done, check:
```
output/nfts-final/    (10,000 JSON files)
```

---

## STEP 3: Upload to IPFS

IPFS = Permanent storage for your images. Like Google Drive for NFTs.

### 3-1: Get nft.storage API Key

1. Go to: https://nft.storage/
2. Click **"Sign Up"**
3. Create account with email + password
4. Go to **"API Keys"**
5. Click **"Create New Key"**
6. **COPY THE KEY**

### 3-2: Upload

```bash
npm run upload:ipfs
```

When asked:
- **nft.storage API Key**: Paste the key from step 3-1

### 3-3: Wait for Upload

Takes about 20 minutes.

When done, you'll see:
```
✅ Upload complete!
IPFS Hash: Qmb2d8c7e3f1a9b5c2d8e3f1a9b5c2d8e3f1a9b5c
```

**SAVE THIS HASH!** You need it next.

---

## STEP 4: Deploy Smart Contract

### 4-1: Update Contract with IPFS Hash

Open: `smart-contract/RarityNFT.sol`

Find this line:
```javascript
string public baseURI = "ipfs://YOUR_IPFS_HASH_HERE/";
```

Replace `YOUR_IPFS_HASH_HERE` with your hash from Step 3. Example:
```javascript
string public baseURI = "ipfs://Qmb2d8c7e3f1a9b5c2d8e3f1a9b5c2d8e3f1a9b5c/";
```

Save the file.

### 4-2: Get ETH (if deploying on mainnet)

**For Testnet (free):**
- Go to: https://faucet.sepolia.dev/
- Paste your wallet address
- Get free test ETH

**For Mainnet (costs money):**
- You need ETH in your wallet ($10-50 for gas fees)

### 4-3: Deploy

```bash
cd smart-contract
npm run deploy
```

When asked:
- **Network**: Choose `sepolia` (testnet, free) or `mainnet`
- **Private Key**: Your wallet's private key

Done! Your NFTs are on the blockchain! 🎉

---

## ✅ WHAT YOU'VE ACCOMPLISHED

After these 4 steps, you have:

✅ 10,000 unique NFTs generated
✅ Metadata created for each
✅ All images on IPFS (permanent)
✅ Smart contract deployed on blockchain
✅ NFTs visible on OpenSea/Magic Eden

---

## 💰 COSTS

| Item | Cost |
|------|------|
| AWS Lambda | $0.20 - $5.00 |
| AWS S3 Storage | $0.10 - $1.00 |
| AWS Data Transfer | $1.00 - $3.00 |
| nft.storage | FREE |
| Testnet Deploy | FREE |
| Mainnet Deploy | $10 - $50 (gas fees) |
| **TOTAL** | **$5 - $60** |

---

## ⏱️ TIME BREAKDOWN

**With AWS (Recommended):**
- Step 1 (Prepare images): 5 min
- Step 2 (Generate): 10 min
- Step 3 (Upload): 20 min
- Step 4 (Deploy): 5 min
- **TOTAL: ~40 minutes**

**With Local:**
- Step 1 (Prepare images): 5 min
- Step 2 (Generate): 2-3 hours
- Step 3 (Upload): 20 min
- Step 4 (Deploy): 5 min
- **TOTAL: ~2.5-3.5 hours**

---

## 🐛 TROUBLESHOOTING

### "npm run validate:setup says images not found"

**Problem:** Your images aren't in the right folders.

**Solution:**
1. Check `/layers/face/` - should have 26 PNG files
2. Check file names - must be exactly `Face_01.png`, `Face_02.png`, etc.
3. Check case - `Face` not `face`, `Hat` not `hat`, etc.

### "AWS generation fails"

**Problem:** AWS credentials wrong or bucket doesn't exist.

**Solution:**
1. Check you created the bucket at https://console.aws.amazon.com/s3/
2. Check credentials are copy-pasted correctly (no extra spaces)
3. Wait 5 minutes and try again

### "IPFS upload fails"

**Problem:** API key wrong or network issue.

**Solution:**
1. Check API key is correct (go back to nft.storage)
2. Check internet connection
3. Run again: `npm run upload:ipfs`

### "Smart contract won't deploy"

**Problem:** Wrong private key or no ETH.

**Solution:**
1. Make sure you have ETH in your wallet (testnet or mainnet)
2. Check private key is pasted correctly (no spaces, quotes, etc.)
3. Check contract has correct IPFS hash

### "I don't see my NFTs on OpenSea"

**Problem:** Needs time to index.

**Solution:**
1. Wait 5-10 minutes
2. Go to: `https://opensea.io/collection/YOUR_CONTRACT_ADDRESS`
3. Refresh the page

---

## 📚 REFERENCE COMMANDS

```bash
# Check everything is ready
npm run validate:setup

# Generate (pick one)
npm run generate:local          # Free but slow
npm run generate:aws           # Fast but costs money

# Download from AWS
npm run download:aws

# Create metadata
npm run generate:metadata

# Upload to IPFS
npm run upload:ipfs

# Deploy contract
cd smart-contract && npm run deploy

# Show all commands
npm run commands
```

---

## 🎯 NEXT STEPS

1. ✅ Add your 156 images to `/layers/` folders
2. ✅ Run `npm run validate:setup`
3. ✅ Pick AWS or Local generation (Step 2)
4. ✅ Upload to IPFS (Step 3)
5. ✅ Deploy contract (Step 4)

**You're ready to start! Let's go! 🚀**

---

## ❓ QUESTIONS?

Find your issue above in **Troubleshooting** section.

If still stuck:
- Check all file names and paths exactly match
- Try commands again
- Check folder `/output/` for generated files
