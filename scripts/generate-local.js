#!/usr/bin/env node

/**
 * Local NFT Generation Script
 * Generates 10,000 NFTs with metadata, tier distribution, and IPFS structure
 * 
 * Usage:
 *   npm run generate:local
 *   npm run generate:local -- --start=1 --end=1000 --batch=1
 * 
 * Options:
 *   --start: Starting token ID (default: 1)
 *   --end: Ending token ID (default: 10000)
 *   --batch: Batch number for tracking (default: 1)
 *   --output: Output directory (default: ./output/nfts-final)
 *   --images: Whether to generate placeholder images (default: false)
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Import utilities
const RarityEngine = require('../src/utils/rarityEngine');
const MetadataGenerator = require('../src/utils/metadataGenerator');
const rarityConfig = require('../config/rarity-config.json');

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
const startId = parseInt(args.start) || 1;
const endId = parseInt(args.end) || 10000;
const batchNumber = parseInt(args.batch) || 1;
const outputDir = args.output || './output/nfts-final';
const generateImages = args.images === 'true' || args.images === true;
const totalNFTs = endId - startId + 1;

class LocalNFTGenerator {
  constructor(config, outputPath) {
    this.engine = new RarityEngine();
    this.engine.loadConfig(config);
    this.outputPath = outputPath;
    this.metadataGen = new MetadataGenerator(
      'NFT Collection',
      'A 10,000 piece collection with 9-tier rarity system',
      'ipfs://{IMAGES_CID}'
    );
    this.stats = {
      success: 0,
      failed: 0,
      tierDistribution: {},
      totalPoints: 0,
      avgScore: 0,
      minScore: Infinity,
      maxScore: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDir() {
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
      console.log(`📁 Created output directory: ${this.outputPath}`);
    }
  }

  /**
   * Generate a batch of NFTs with metadata
   */
  async generateBatch(startId, endId) {
    console.log(`\n🚀 Starting NFT Generation`);
    console.log(`📊 Generating NFTs #${startId} - #${endId} (${totalNFTs} total)`);
    console.log(`📦 Batch: ${batchNumber}`);
    console.log(`💾 Output: ${this.outputPath}\n`);

    this.stats.startTime = performance.now();
    let lastReportTime = this.stats.startTime;

    for (let tokenId = startId; tokenId <= endId; tokenId++) {
      try {
        // Generate NFT
        const generationResult = this.engine.generateNFT();

        if (!generationResult.success) {
          this.stats.failed++;
          console.error(`❌ Token #${tokenId}: ${generationResult.error}`);
          continue;
        }

        // Update tier distribution
        const tier = generationResult.tierId;
        if (!this.stats.tierDistribution[tier]) {
          this.stats.tierDistribution[tier] = 0;
        }
        this.stats.tierDistribution[tier]++;

        // Calculate overall score
        const overallScore = generationResult.variants.reduce((sum, item) => {
          return sum + item.variant.points;
        }, 0);

        this.stats.totalPoints += overallScore;
        this.stats.minScore = Math.min(this.stats.minScore, overallScore);
        this.stats.maxScore = Math.max(this.stats.maxScore, overallScore);

        // Generate metadata
        const metadata = this.metadataGen.generateMetadata(tokenId, generationResult);

        // Save metadata JSON
        const metadataPath = path.join(this.outputPath, `${tokenId}.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

        this.stats.success++;

        // Progress reporting every 100 NFTs
        if (tokenId % 100 === 0) {
          const currentTime = performance.now();
          const elapsed = (currentTime - lastReportTime) / 1000;
          const rate = (100 / elapsed).toFixed(1);
          const remaining = ((endId - tokenId) / 100) * elapsed;
          const remainingMin = (remaining / 60).toFixed(1);

          console.log(
            `✅ ${tokenId}/${endId} NFTs | ` +
            `${rate} NFTs/s | ` +
            `ETA: ${remainingMin}m | ` +
            `Success: ${this.stats.success}, Failed: ${this.stats.failed}`
          );
          lastReportTime = currentTime;
        }
      } catch (error) {
        this.stats.failed++;
        console.error(`❌ Token #${tokenId}: ${error.message}`);
      }
    }

    this.stats.endTime = performance.now();
  }

  /**
   * Generate placeholder images if requested
   */
  generatePlaceholderImages(startId, endId) {
    console.log(`\n🖼️  Generating placeholder images...`);
    // Placeholder implementation - real implementation would use sharp/canvas
    console.log(`📸 Placeholder generation not implemented in this version`);
    console.log(`   Use your own image composition library or AWS Lambda`);
  }

  /**
   * Generate summary report
   */
  generateReport() {
    const duration = (this.stats.endTime - this.stats.startTime) / 1000;
    const durationMin = (duration / 60).toFixed(2);
    const avgScore = (this.stats.totalPoints / this.stats.success).toFixed(2);
    const nftsPerSec = (this.stats.success / duration).toFixed(1);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📈 GENERATION REPORT`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(`⏱️  Duration: ${durationMin}s (${nftsPerSec} NFTs/second)`);
    console.log(`✅ Successful: ${this.stats.success}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`📊 Average Score: ${avgScore}`);
    console.log(`📉 Min Score: ${this.stats.minScore}`);
    console.log(`📈 Max Score: ${this.stats.maxScore}`);

    console.log(`\n🎯 Tier Distribution:`);
    const tierNames = {
      T1: 'Minimal (Ultra Rare)',
      T2: 'Low (Very Rare)',
      T3: 'BelowAverage (Rare)',
      T4: 'Moderate (Uncommon)',
      T5: 'Common',
      T6: 'AboveAverage (Uncommon)',
      T7: 'High (Rare)',
      T8: 'Peak (Very Rare)',
      T9: 'Maximal (Ultra Rare)'
    };

    for (const tier of ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9']) {
      const count = this.stats.tierDistribution[tier] || 0;
      const percentage = ((count / this.stats.success) * 100).toFixed(2);
      const bar = '█'.repeat(Math.round(count / (this.stats.success / 50)));
      console.log(`  ${tier} ${tierNames[tier].padEnd(30)} ${count.toString().padStart(5)} (${percentage.padStart(5)}%) ${bar}`);
    }

    console.log(`\n💾 Metadata Files: ${this.stats.success} JSON files saved to:`);
    console.log(`   ${path.resolve(this.outputPath)}`);

    console.log(`\n📋 Next Steps:`);
    console.log(`   1. Review metadata in ${this.outputPath}`);
    console.log(`   2. Generate composite images (use canvas/sharp or AWS Lambda)`);
    console.log(`   3. Run: npm run upload:ipfs`);
    console.log(`   4. Deploy smart contract with IPFS hash`);

    console.log(`\n${'='.repeat(60)}\n`);
  }

  /**
   * Save generation summary
   */
  saveSummary() {
    const summaryPath = path.join(this.outputPath, '_generation-summary.json');
    const summary = {
      batch: batchNumber,
      startId: startId,
      endId: endId,
      totalGenerated: this.stats.success,
      totalFailed: this.stats.failed,
      duration: ((this.stats.endTime - this.stats.startTime) / 1000).toFixed(2),
      averageScore: (this.stats.totalPoints / this.stats.success).toFixed(2),
      minScore: this.stats.minScore,
      maxScore: this.stats.maxScore,
      tierDistribution: this.stats.tierDistribution,
      generatedAt: new Date().toISOString(),
      ipfsImagePath: 'ipfs://{IMAGES_CID}',
      instructions: [
        'Replace {IMAGES_CID} after uploading images',
        'Validate all 10000 metadata files are present',
        'Check tier distribution matches expected bell curve'
      ]
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📄 Summary saved to: ${path.resolve(summaryPath)}`);
  }

  /**
   * Run the full generation pipeline
   */
  async run() {
    try {
      this.ensureOutputDir();
      await this.generateBatch(startId, endId);

      if (generateImages) {
        this.generatePlaceholderImages(startId, endId);
      }

      this.generateReport();
      this.saveSummary();

      if (this.stats.failed === 0) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    } catch (error) {
      console.error(`\n❌ Generation failed: ${error.message}`);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Run the generator
const generator = new LocalNFTGenerator(rarityConfig, outputDir);
generator.run();
