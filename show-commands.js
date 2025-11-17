#!/usr/bin/env node

/**
 * NPM Commands Reference
 * Run this to see all available commands
 * 
 * Usage: npm run
 * or: node show-commands.js
 */

const fs = require('fs');
const path = require('path');

console.log(`
╔════════════════════════════════════════════════════════════╗
║     NFT COLLECTION GENERATOR - AVAILABLE COMMANDS          ║
╚════════════════════════════════════════════════════════════╝

📋 SYSTEM COMMANDS
─────────────────────────────────────────────────────────────
npm run validate:setup
  ✅ Validates entire system setup
  📊 Checks files, configuration, and dependencies
  ⏱️ Time: 30 seconds
  💡 RUN THIS FIRST

npm run test-rarity
  ✅ Tests the rarity generation system
  📊 Verifies tier distribution and scoring
  ⏱️ Time: 1 minute
  💡 Ensure rarity system works before generating

npm run test-rarity-system
  ✅ Alternative rarity test command
  📊 Deep validation of rarity mechanics
  ⏱️ Time: 1 minute

npm run validate-rarity
  ✅ Validates rarity configuration
  📊 Checks rarity-config.json structure
  ⏱️ Time: 30 seconds

─────────────────────────────────────────────────────────────

🎨 GENERATION COMMANDS
─────────────────────────────────────────────────────────────
npm run generate:local
  ✅ Generate 10,000 NFTs with metadata locally
  📊 Applies tier-based rarity system
  ⏱️ Time: 1-2 hours
  💾 Output: ./output/nfts-final/ (10,000 JSON files)
  🔧 Options:
    --start=1          Starting token ID (default: 1)
    --end=10000        Ending token ID (default: 10000)
    --batch=1          Batch number for tracking
    --output=PATH      Custom output directory
    --images=false     Generate placeholder images

  EXAMPLES:
    npm run generate:local
    npm run generate:local -- --start=1 --end=100
    npm run generate:local -- --batch=1 --output=./my-output

npm run generate:metadata
  ✅ Generate OpenSea/Magic Eden compatible metadata
  📊 Converts generated NFTs to marketplace format
  ⏱️ Time: 5 minutes
  💾 Output: ./output/metadata/ (10,000 JSON files)
  🔧 Options:
    --collection=NAME  Collection name
    --description=TEXT Collection description
    --ipfs-hash=HASH   IPFS path to images
    --format=FORMAT    Metadata format (minimal, standard, extended)

  EXAMPLES:
    npm run generate:metadata
    npm run generate:metadata -- --collection="My Dragons"
    npm run generate:metadata -- --format=minimal

npm run generate:full
  ✅ Run both generation and metadata commands
  📊 Complete local generation in one command
  ⏱️ Time: 1-2 hours
  💾 Output: Both nfts-final/ and metadata/ directories
  
  Runs:
    1. generate:local
    2. generate:metadata

─────────────────────────────────────────────────────────────

📤 IPFS & DEPLOYMENT COMMANDS
─────────────────────────────────────────────────────────────
npm run upload:ipfs
  ✅ Upload metadata and images to IPFS (nft.storage only)
  ⏱️ Time: 10-30 minutes (depends on file sizes)
  💾 Output: Directory CIDs (images + metadata)
  🔧 Options:
    --token=TOKEN        nft.storage API token
    --metadata-dir=PATH  Metadata directory (default: ./output/metadata)
    --images-dir=PATH    Images directory (default: ./output/images)

  EXAMPLES:
    npm run upload:ipfs -- --token=YOUR_NFT_STORAGE_TOKEN
    npm run upload:ipfs -- --token=YOUR_NFT_STORAGE_TOKEN --metadata-dir=./output/nfts-final

  ENVIRONMENT VARIABLES:
    export NFT_STORAGE_TOKEN=YOUR_NFT_STORAGE_TOKEN
    npm run upload:ipfs

npm run workflow:local
  ✅ Complete local workflow in one command
  📊 Generate → Metadata → Upload to IPFS
  ⏱️ Time: 1-2.5 hours (depends on generation time)
  
  Runs:
    1. generate:local
    2. generate:metadata
    3. upload:ipfs (requires NFT_STORAGE_TOKEN)

─────────────────────────────────────────────────────────────

🔧 CONFIGURATION COMMANDS
─────────────────────────────────────────────────────────────
npm start
  ✅ Start React development server
  📊 For GUI interface
  🌐 http://localhost:3000

npm run build
  ✅ Build React production bundle
  📊 For deployment
  💾 Output: build/ directory

npm run electron-dev
  ✅ Start Electron desktop app
  📊 For standalone application
  💻 Cross-platform support

npm run electron-pack
  ✅ Build Electron package
  📊 Create distributable app

npm run electron-pack-mac
  ✅ Build macOS Electron package
  🍎 macOS only

npm run electron-pack-win
  ✅ Build Windows Electron package
  💻 Windows only

─────────────────────────────────────────────────────────────

📚 HELP & INFO
─────────────────────────────────────────────────────────────
• npm run          List all available scripts
• node show-commands.js  Show this reference

📖 DOCUMENTATION:
  
  Getting Started:
  • START_HERE.md      - Simple index of docs
  • SETUP_GUIDE.md     - Full dumbed-down guide
  • QUICKSTART.md      - 4 essential steps
  
  Reference:
  • AWS_IPFS_GUIDE.md  - AWS generation + nft.storage upload
  • PRODUCTION_SETUP.md - Production checklist
  
  Standards:
  • METADATA_TEMPLATE.md - Metadata JSON structure
  • README.md            - Project overview

═════════════════════════════════════════════════════════════

⚡ QUICK WORKFLOWS
─────────────────────────────────────────────────────────────

1️⃣  TEST SYSTEM (5 minutes)
   npm run validate:setup

2️⃣  VERIFY RARITY (1 minute)
   npm run test-rarity

3️⃣  QUICK TEST GENERATION (5 minutes)
   npm run generate:local -- --start=1 --end=100

4️⃣  FULL PRODUCTION RUN (2-3 hours)
   npm run generate:local
   npm run generate:metadata
   npm run upload:ipfs -- --token=YOUR_NFT_STORAGE_TOKEN

5️⃣  ALL IN ONE (requires NFT_STORAGE_TOKEN)
   export NFT_STORAGE_TOKEN=YOUR_TOKEN
   npm run workflow:local

═════════════════════════════════════════════════════════════

💡 TIPS & TRICKS
─────────────────────────────────────────────────────────────

💾 Save API token as environment variable:
   export NFT_STORAGE_TOKEN=YOUR_TOKEN
   npm run upload:ipfs

🎯 Generate in batches for large collections:
   npm run generate:local -- --start=1 --end=2500 --batch=1
   npm run generate:local -- --start=2501 --end=5000 --batch=2

📊 Monitor generation progress:
   tail -f output/nfts-final/_generation-summary.json

✅ Verify metadata structure:
   cat output/metadata/1.json | jq '.'

🚀 Use AWS for faster generation:
   See: AWS_IPFS_GUIDE.md

═════════════════════════════════════════════════════════════

📞 TROUBLESHOOTING
─────────────────────────────────────────────────────────────

❌ "Command not found"
   ✅ Run: npm install

❌ "Out of memory"
   ✅ Run: npm run generate:local -- --end=1000

❌ "Module not found"
   ✅ Run: npm install

❌ "Validation failed"
   ✅ Run: npm run validate:setup

❌ "IPFS upload failed"
   ✅ Ensure NFT_STORAGE_TOKEN is set

❌ "Gateway not loading image"
   ✅ Wait for IPFS propagation (a few minutes)

═════════════════════════════════════════════════════════════

🚀 GET STARTED
─────────────────────────────────────────────────────────────

1. npm install
2. npm run validate:setup
3. Add 156 trait PNG images to layers/
4. npm run generate:local
5. npm run generate:metadata
6. npm run upload:ipfs -- --token=YOUR_NFT_STORAGE_TOKEN
7. Deploy smart contract

Full guide: SETUP_GUIDE.md
Quick start: QUICKSTART.md

═════════════════════════════════════════════════════════════
`);
