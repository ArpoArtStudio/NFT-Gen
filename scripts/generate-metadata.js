#!/usr/bin/env node

/**
 * Metadata Generation Script
 * Converts generated NFT data into OpenSea/Magic Eden compliant metadata
 * 
 * Usage:
 *   npm run generate:metadata
 *   npm run generate:metadata -- --input=./output/nfts-final --output=./output/metadata
 * 
 * Options:
 *   --input: Input directory with generated NFT data (default: ./output/nfts-final)
 *   --output: Output directory for metadata (default: ./output/metadata)
 *   --collection: Collection name (default: NFT Collection)
 *   --description: Collection description
 *   --ipfs-hash: IPFS hash for images (default: ipfs://YOUR_IPFS_HASH/images)
 *   --format: Metadata format - standard, minimal, or extended (default: standard)
 */

const fs = require('fs');
const path = require('path');

// Import utilities
const MetadataGenerator = require('../src/utils/metadataGenerator');

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
const inputDir = args.input || './output/nfts-final';
const outputDir = args.output || './output/metadata';
const collectionName = args.collection || 'NFT Collection';
const collectionDescription = args.description || 'A 10,000 piece collection with 9-tier rarity system';
const ipfsHash = args['ipfs-hash'] || 'ipfs://YOUR_IPFS_HASH/images';
const format = args.format || 'standard';

class MetadataProcessor {
  constructor(inputPath, outputPath, collectionName, collectionDescription, ipfsHash) {
    this.inputPath = inputPath;
    this.outputPath = outputPath;
    this.metadataGen = new MetadataGenerator(collectionName, collectionDescription, ipfsHash);
    this.stats = {
      processed: 0,
      failed: 0,
      errors: []
    };
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDir() {
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
      console.log(`📁 Created metadata output directory: ${this.outputPath}`);
    }
  }

  /**
   * Validate metadata file
   */
  validateMetadata(metadata) {
    const required = ['name', 'description', 'image', 'attributes'];
    for (const field of required) {
      if (!metadata[field]) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    if (!Array.isArray(metadata.attributes) || metadata.attributes.length === 0) {
      return { valid: false, error: 'Attributes must be non-empty array' };
    }

    return { valid: true };
  }

  /**
   * Process all metadata files
   */
  processMetadata() {
    if (!fs.existsSync(this.inputPath)) {
      console.error(`❌ Input directory not found: ${this.inputPath}`);
      console.error(`   Run 'npm run generate:local' first to generate NFTs`);
      process.exit(1);
    }

    const files = fs.readdirSync(this.inputPath).filter(f => f.endsWith('.json'));
    console.log(`\n📋 Processing ${files.length} metadata files from: ${this.inputPath}`);
    console.log(`💾 Output format: ${format}`);
    console.log(`🖼️  IPFS path: ${this.metadataGen.ipfsImageBasePath}\n`);

    files.forEach((file, index) => {
      try {
        const filePath = path.join(this.inputPath, file);
        const rawData = fs.readFileSync(filePath, 'utf8');
        const metadata = JSON.parse(rawData);

        // Validate
        const validation = this.validateMetadata(metadata);
        if (!validation.valid) {
          this.stats.errors.push({
            file: file,
            error: validation.error
          });
          this.stats.failed++;
          return;
        }

        // Output metadata
        const outputPath = path.join(this.outputPath, file);
        fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
        this.stats.processed++;

        // Progress reporting every 500
        if ((index + 1) % 500 === 0) {
          console.log(`✅ Processed ${index + 1}/${files.length} metadata files`);
        }
      } catch (error) {
        this.stats.errors.push({
          file: file,
          error: error.message
        });
        this.stats.failed++;
      }
    });
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 METADATA PROCESSING REPORT`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(`✅ Successfully processed: ${this.stats.processed}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`📁 Output directory: ${path.resolve(this.outputPath)}`);

    if (this.stats.errors.length > 0 && this.stats.errors.length <= 10) {
      console.log(`\n⚠️  Errors:`);
      this.stats.errors.forEach(err => {
        console.log(`   ${err.file}: ${err.error}`);
      });
    } else if (this.stats.errors.length > 10) {
      console.log(`\n⚠️  ${this.stats.errors.length} errors (first 10 shown):`);
      this.stats.errors.slice(0, 10).forEach(err => {
        console.log(`   ${err.file}: ${err.error}`);
      });
    }

    console.log(`\n📋 Next Steps:`);
    console.log(`   1. Verify metadata files in ${path.resolve(this.outputPath)}`);
    console.log(`   2. Run: npm run upload:ipfs`);
    console.log(`   3. Update contract baseURI with returned IPFS hash`);

    console.log(`\n${'='.repeat(60)}\n`);
  }

  /**
   * Run the metadata processor
   */
  run() {
    try {
      this.ensureOutputDir();
      this.processMetadata();
      this.generateReport();

      process.exit(this.stats.failed === 0 ? 0 : 1);
    } catch (error) {
      console.error(`\n❌ Metadata processing failed: ${error.message}`);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Run the processor
const processor = new MetadataProcessor(
  inputDir,
  outputDir,
  collectionName,
  collectionDescription,
  ipfsHash
);
processor.run();
