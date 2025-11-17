#!/usr/bin/env node

/**
 * IPFS Upload Script (nft.storage only)
 * Uploads metadata and images directories to IPFS using nft.storage as a single directory each.
 * 
 * Usage:
 *   npm run upload:ipfs
 *   npm run upload:ipfs -- --token=YOUR_NFT_STORAGE_TOKEN --metadata-dir=./output/metadata --images-dir=./output/images
 * 
 * Environment Variables (optional):
 *   NFT_STORAGE_TOKEN: API token from https://nft.storage/
 *   METADATA_DIR: Metadata directory (default: ./output/metadata)
 *   IMAGES_DIR: Images directory (default: ./output/images)
 */

const fs = require('fs');
const path = require('path');

// Lazy import ESM package inside async function
async function getNftStorageClient(token) {
  // @ts-ignore - dynamic import for ESM module
  const mod = await import('nft.storage');
  const { NFTStorage, File } = mod;
  return { NFTStorage, File, client: new NFTStorage({ token }) };
}

// Parse command-line arguments
const parseArgs = () => {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const [key, value] = arg.split('=');
    args[key.replace('--', '')] = value || true;
  });
  return args;
};

const args = parseArgs();
const token = args.token || process.env.NFT_STORAGE_TOKEN;
const metadataDir = args['metadata-dir'] || process.env.METADATA_DIR || './output/metadata';
const imagesDir = args['images-dir'] || process.env.IMAGES_DIR || './output/images';

class IPFSUploader {
  constructor(token) {
    this.token = token;
    this.stats = { uploaded: 0, failed: 0, errors: [] };
  }

  validateConfig() {
    if (!this.token) {
      console.error('❌ nft.storage API token not provided');
      console.error('\n   Get a token at https://nft.storage/ (Account -> API Keys)');
      console.error('\n   Then run one of:');
      console.error('   npm run upload:ipfs -- --token=YOUR_TOKEN');
      console.error('   export NFT_STORAGE_TOKEN=YOUR_TOKEN && npm run upload:ipfs');
      process.exit(1);
    }
  }

  async dirToFilesArray(rootDir, FileCtor) {
    if (!fs.existsSync(rootDir)) return [];

    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const filePath = path.join(rootDir, entry.name);
      const data = fs.readFileSync(filePath);
      files.push(new FileCtor([data], entry.name));
    }

    return files;
  }

  async uploadDirectory(client, files, label) {
    if (!files || files.length === 0) return null;
    console.log(`📤 Uploading ${files.length} ${label} files to nft.storage as a directory...`);
    const cid = await client.storeDirectory(files);
    this.stats.uploaded += files.length;
    return cid;
  }

  generateReport(metadataCid, imagesCid) {
    console.log(`\n${'='.repeat(70)}`);
    console.log('📤 IPFS UPLOAD REPORT (nft.storage)');
    console.log(`${'='.repeat(70)}\n`);

    console.log(`✅ Successfully uploaded files: ${this.stats.uploaded}`);
    console.log(`❌ Failed: ${this.stats.failed}`);

    const showCid = (title, cid) => {
      if (!cid) return;
      console.log(`\n${title}:`);
      console.log(`   ipfs://${cid}/`);
      console.log(`   https://nftstorage.link/ipfs/${cid}/`);
      console.log(`   https://ipfs.io/ipfs/${cid}/`);
    };

    showCid('📋 Metadata Directory CID', metadataCid);
    showCid('🖼️  Images Directory CID', imagesCid);

    if (this.stats.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      this.stats.errors.slice(0, 10).forEach(err => console.log(`   ${err.file || ''} ${err.error}`));
      if (this.stats.errors.length > 10) console.log(`   ...and ${this.stats.errors.length - 10} more`);
    }

    console.log('\n📝 Next Steps:');
    console.log('   1) Use Images CID as baseURI if metadata image fields reference ipfs://IMAGES_CID/{id}.png');
    console.log('   2) If you uploaded processed metadata (./output/metadata), you can set baseURI to metadata CID');
    console.log('   3) Update RarityNFT.sol and deploy (e.g., npm run deploy-sepolia)');
    console.log(`\n${'='.repeat(70)}\n`);
  }

  async run() {
    try {
      this.validateConfig();
      const { NFTStorage, File, client } = await getNftStorageClient(this.token);

      // Metadata
      let metadataCid = null;
      if (fs.existsSync(metadataDir)) {
        const metadataFiles = await this.dirToFilesArray(metadataDir, File);
        metadataCid = await this.uploadDirectory(client, metadataFiles, 'metadata');
      } else {
        console.log(`⚠️  Metadata directory not found: ${metadataDir}`);
      }

      // Images
      let imagesCid = null;
      if (fs.existsSync(imagesDir)) {
        const imageFiles = await this.dirToFilesArray(imagesDir, File);
        imagesCid = await this.uploadDirectory(client, imageFiles, 'image');
      } else {
        console.log(`⚠️  Images directory not found: ${imagesDir}`);
      }

      this.generateReport(metadataCid, imagesCid);
      process.exit(0);
    } catch (error) {
      console.error(`\n❌ IPFS upload failed: ${error.message}`);
      this.stats.failed++;
      this.stats.errors.push({ error: error.message });
      process.exit(1);
    }
  }
}

new IPFSUploader(token).run();
