#!/usr/bin/env node
/**
 * AWS NFT Generation Runner
 * Assumes aws-setup has stored credentials in .aws-config.json
 * Performs generation and uploads results to S3 bucket.
 * Simplified placeholder implementation.
 */
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const RarityEngine = require('../src/utils/rarityEngine');
const MetadataGenerator = require('../src/utils/metadataGenerator');
const rarityConfig = require('../config/rarity-config.json');

const configPath = path.join(__dirname, '../.aws-config.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ AWS config not found. Run: npm run aws:setup');
  process.exit(1);
}
const { accessKey, secretKey, region, bucketName } = JSON.parse(fs.readFileSync(configPath));

AWS.config.update({ accessKeyId: accessKey, secretAccessKey: secretKey, region });
const s3 = new AWS.S3();

const TOTAL = 10000;
const BATCH_SIZE = 1000; // 10 batches

async function uploadToS3(key, body) {
  await s3.putObject({ Bucket: bucketName, Key: key, Body: body, ContentType: 'application/json' }).promise();
}

async function main() {
  console.log(`\n🚀 AWS Generation started -> bucket: ${bucketName}`);
  const engine = new RarityEngine();
  engine.loadConfig(rarityConfig);
  const metadataGen = new MetadataGenerator('NFT Collection', 'A 10,000 piece collection with 9-tier rarity system', 'ipfs://{IMAGES_CID}/images');

  let generated = 0;
  let batchIndex = 0;

  while (generated < TOTAL) {
    const batchStart = generated + 1;
    const batchEnd = Math.min(generated + BATCH_SIZE, TOTAL);
    console.log(`\n📦 Batch ${++batchIndex}: IDs ${batchStart} - ${batchEnd}`);

    for (let tokenId = batchStart; tokenId <= batchEnd; tokenId++) {
      const result = engine.generateNFT();
      if (!result.success) {
        console.error(`❌ Failed token ${tokenId}: ${result.error}`);
        continue;
      }
      const metadata = metadataGen.generateMetadata(tokenId, result);
      await uploadToS3(`metadata/${tokenId}.json`, JSON.stringify(metadata));
      if (tokenId % 200 === 0) console.log(`✅ Uploaded ${tokenId}.json`);
    }

    generated = batchEnd;
  }

  console.log(`\n🎉 AWS Generation complete. Metadata stored under s3://${bucketName}/metadata/`);
  console.log('➡️  Next: Run npm run download:aws to pull metadata locally then npm run upload:ipfs');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
