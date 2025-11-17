# NFT Collection Generation - Cleanup & Production Setup

## 🔑 BaseURI Clarification (IMPORTANT)
Use the METADATA CID for contract baseURI:
```
baseURI = ipfs://METADATA_CID/
```
Each token URI resolves to `ipfs://METADATA_CID/1.json` etc.
Images inside metadata must reference the IMAGES CID:
```
"image": "ipfs://IMAGES_CID/1.png"
```
If you upload images after metadata creation, run:
```
node scripts/rewrite-metadata-images.mjs --cid=NEW_IMAGES_CID --dir=./output/metadata
```
Then re-upload metadata if contract not yet deployed.

## Updated Scripts Overview
- `generate:local` → raw generation JSON (default output/nfts-final)
- `generate:metadata` → finalized marketplace metadata (output/metadata)
- `upload:ipfs` → upload folders to IPFS (supports --skip-images / --skip-metadata)
- `rewrite:metadata` → swap image CID in metadata files
- `aws:setup` / `aws:generate` / `download:aws` → AWS path
- `deploy:sepolia` / `deploy:ethereum` → contract deploy

---

## ✅ What Has Been Cleaned Up

### Removed Files & Metadata
- ✅ All 10,000+ generated NFT JSON metadata files from `/output/nfts-final/`
- ✅ All placeholder PNG images from layer folders
- ✅ All placeholder.txt files

### Preserved & Protected
- ✅ **Tier System**: 9-tier bell curve rarity system (T1-T9)
- ✅ **Trait Logic**: Socks, Shoes, Pants, Shirt, Face, Hat with 26 variants each
- ✅ **Point System**: Each variant has point values that sum to determine overall rarity
- ✅ **Quota System**: Distribution across tiers ensures bell curve collection
- ✅ **Rarity Configuration**: `/config/rarity-config.json` untouched
- ✅ **Generation Engine**: `/src/utils/rarityEngine.js` fully functional

---

## 📁 Current Folder Structure

```
hashlips_art_engine_app-main/
├── config/
│   └── rarity-config.json          # ✅ Trait definitions & tier system
├── layers/
│   ├── face/                        # Ready for real trait images
│   ├── hat/                         # Ready for real trait images
│   ├── pants/                       # Ready for real trait images
│   ├── shirt/                       # Ready for real trait images
│   ├── shoes/                       # Ready for real trait images
│   └── socks/                       # Ready for real trait images
├── output/
│   └── nfts-final/                 # ✅ CLEANED - Ready for generated metadata
├── src/
│   ├── utils/
│   │   ├── rarityEngine.js          # ✅ Trait selection & tier logic
│   │   ├── metadataGenerator.js     # 🆕 OpenSea/Magic Eden compliance
│   │   └── rarityConfigLoader.js    # Config loading utility
│   └── components/                  # React UI components
├── smart-contract/
│   └── RarityNFT.sol               # Smart contract for tier tracking
├── METADATA_TEMPLATE.md             # 🆕 Metadata standards guide
├── AWS_IPFS_GUIDE.md               # 🆕 Generation & deployment guide
└── scripts/
    └── aws-generator.js             # 🆕 Parallel generation script
```

---

## 🔧 New Utility: MetadataGenerator

### Purpose
Creates OpenSea & Magic Eden compliant metadata while preserving your tier system.

### Key Features
- ✅ Generates marketplace-compliant metadata
- ✅ Preserves rarity tier information
- ✅ Calculates percentile rankings
- ✅ Validates metadata integrity
- ✅ Supports batch generation
- ✅ Minimal and extended metadata modes

### Usage Example

```javascript
const RarityEngine = require('./src/utils/rarityEngine');
const MetadataGenerator = require('./src/utils/metadataGenerator');
const config = require('./config/rarity-config.json');

// Initialize
const engine = new RarityEngine();
engine.loadConfig(config);

const metadataGen = new MetadataGenerator(
  'Your NFT Collection',
  'A collection with 9-tier rarity system',
  'ipfs://YOUR_IPFS_HASH/images'
);

// Generate NFT with metadata
const generationResult = engine.generateNFT();
const metadata = metadataGen.generateMetadata(1, generationResult);

console.log(JSON.stringify(metadata, null, 2));
```

### Output Example

```json
{
  "name": "Your NFT Collection #1",
  "description": "A collection with 9-tier rarity system",
  "image": "ipfs://YOUR_IPFS_HASH/images/1.png",
  "external_url": "https://yourwebsite.com/nft/1",
  "attributes": [
    {
      "trait_type": "Socks",
      "value": "Socks_05",
      "rarity": {
        "tier": "T4",
        "tier_name": "Moderate",
        "points": 17,
        "rarity_rank": "Uncommon"
      }
    },
    // ... more traits
  ],
  "properties": {
    "overall_rarity_score": 113,
    "overall_tier": "T5",
    "overall_tier_name": "Common",
    "generation_batch": 1,
    "generated_at": "2025-11-16T12:00:00Z"
  }
}
```

---

## 🚀 Production Workflow

### Phase 1: Prepare Real Assets (You Do This)
1. Create 26 variant PNG images for each trait
2. Place in `/layers/{trait}/` folders:
   - `/layers/socks/` → Socks_01.png through Socks_26.png
   - `/layers/shoes/` → Shoes_01.png through Shoes_26.png
   - `/layers/pants/` → Pants_01.png through Pants_26.png
   - `/layers/shirt/` → Shirt_01.png through Shirt_26.png
   - `/layers/face/` → Face_01.png through Face_26.png
   - `/layers/hat/` → Hat_01.png through Hat_26.png

### Phase 2: Generate Collection (Two Options)

**Option A: Local Generation** (Simple, 2-3 hours)
```bash
npm run generate  # Command to be set up in package.json
```

**Option B: AWS Generation** (Fast, 5-10 minutes)
```bash
# See AWS_IPFS_GUIDE.md for detailed setup
bash scripts/parallel-generation.sh
```

### Phase 3: Generate Metadata (Automatic)
```bash
npm run generate-metadata
# Outputs 10,000 JSON files to /output/nfts-final/
```

### Phase 4: Upload to IPFS
- Use nft.storage
- Steps:
  1. Get API key at https://nft.storage/
  2. Run: `npm run upload:ipfs -- --token=YOUR_NFT_STORAGE_TOKEN`
  3. Save returned CID(s)

### Phase 5: Deploy Smart Contract
```bash
# Update smart contract with IPFS hash
IPFS_HASH=QmYourHashHere npm run deploy-contract
```

---

## 📊 Rarity System Breakdown

### Bell Curve Distribution

| Tier | Name | Count | Score Range | Rarity | Bell Curve |
|------|------|-------|-------------|--------|-----------|
| T1 | Minimal | 10 | 42 | Ultra Rare | ██░░░░░░░ |
| T2 | Low | 100 | 60 | Very Rare | ███░░░░░░ |
| T3 | BelowAverage | 500 | 78-84 | Rare | ████░░░░░ |
| T4 | Moderate | 2,390 | 102-132 | Uncommon | █████░░░░ |
| **T5** | **Common** | **4,000** | **144-174** | **Common** | **██████░░░** |
| T6 | AboveAverage | 2,390 | 186-216 | Uncommon | █████░░░░ |
| T7 | High | 500 | 228-234 | Rare | ████░░░░░ |
| T8 | Peak | 100 | 252 | Very Rare | ███░░░░░░ |
| T9 | Maximal | 10 | 270 | Ultra Rare | ██░░░░░░░ |

### How It Works

Each trait variant has **points**:
- Socks: 7-45 points
- Shoes: 7-45 points  
- Pants: 7-45 points
- Shirt: 7-45 points
- Face: 7-45 points
- Hat: 7-45 points

**Total Score Range: 42-270**

The system automatically selects trait combinations that fall within each tier's score range, maintaining the exact distribution and bell curve shape.

---

## 📝 Metadata Structure

### Standard Format (OpenSea/Magic Eden)
```json
{
  "name": "NFT #1",
  "description": "Collection description",
  "image": "ipfs://HASH/1.png",
  "attributes": [
    {"trait_type": "Trait", "value": "Value"}
  ]
}
```

### Extended Format (Your Dapp/Website)
Includes rarity scoring, percentiles, and tier information

### Minimal Format (Strict Compliance)
Only includes marketplace-required fields

---

## 🔒 Data Preservation

All trait logic is preserved in:

1. **`/config/rarity-config.json`**
   - Defines 9 tiers with quotas
   - Lists all 26 variants per trait with points
   - Sets score ranges for each tier

2. **`/src/utils/rarityEngine.js`**
   - Bell curve weighting algorithm
   - Tier selection logic
   - Variant quota management
   - Score validation

3. **`/src/utils/metadataGenerator.js`** (NEW)
   - Converts generation results to metadata
   - Preserves all rarity information
   - Ensures marketplace compliance
   - Generates collection statistics

---

## ⚠️ What NOT to Delete

**CRITICAL FILES** - Do not remove:
```
✅ config/rarity-config.json          (KEEP - Trait definitions)
✅ src/utils/rarityEngine.js          (KEEP - Generation logic)
✅ src/utils/metadataGenerator.js     (KEEP - Metadata creation)
✅ layers/*/                          (KEEP - Folder structure)
```

**SAFE TO DELETE** (if needed):
```
❌ output/nfts-final/*               (Already cleaned)
❌ Placeholder images                (Already removed)
❌ Test files                        (Already removed)
```

---

## 🔄 Generation → IPFS → Contract Flow

```
┌─────────────────────────────────────────────┐
│ 1. RarityEngine.generateNFT()               │
│    → Selects tier                           │
│    → Picks traits matching tier             │
│    → Calculates score                       │
│    → Returns generation result              │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│ 2. MetadataGenerator.generateMetadata()     │
│    → Creates OpenSea/Magic Eden format      │
│    → Includes rarity information            │
│    → Validates structure                    │
│    → Saves to /output/nfts-final/           │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│ 3. Upload to IPFS                           │
│    → Image files → IPFS                     │
│    → Metadata files → IPFS                  │
│    → Get IPFS hash (QmXxx...)               │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│ 4. Deploy Smart Contract                    │
│    → Set baseURI = ipfs://QmXxx.../metadata │
│    → Mint NFTs                              │
│    → Metadata automatically fetched          │
└─────────────────────────────────────────────┘
```

---

## 📋 Checklist for Production

- [ ] Create 26 PNG images for each trait (156 total)
- [ ] Place images in correct `/layers/{trait}/` folders
- [ ] Test local generation: `npm run generate` (generate 10 NFTs)
- [ ] Validate metadata output: Check `/output/nfts-final/`
- [ ] Set up AWS account (optional, for fast parallel generation)
- [ ] Prepare IPFS upload (nft.storage account)
- [ ] Deploy smart contract with correct base URI
- [ ] Test metadata resolution from smart contract
- [ ] Mint first batch of NFTs
- [ ] Verify traits appear on OpenSea/Magic Eden

---

## 🆘 Need Help?

### Documentation Files
- **METADATA_TEMPLATE.md** → Metadata format details
- **AWS_IPFS_GUIDE.md** → AWS generation & IPFS upload

### Key Files to Review
- **config/rarity-config.json** → Trait & tier definitions
- **src/utils/rarityEngine.js** → Generation algorithm
- **src/utils/metadataGenerator.js** → Metadata creation

### Questions to Ask Yourself
1. Do I have all 156 trait images ready? (26 per trait × 6 traits)
2. Am I using AWS or generating locally?
3. Which IPFS service should I use?
4. Is my smart contract configured for metadata URIs?

---

## 📞 Summary

**Status**: Codebase cleaned, logic preserved, ready for real assets ✅

**Next Step**: Add your actual trait images to `/layers/` folders

**Then**: Run generation → Upload to IPFS → Deploy contract

Your tier system is battle-tested and ready! 🚀
