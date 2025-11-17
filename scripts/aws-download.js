#!/usr/bin/env node

/**
 * AWS S3 Download Script
 * 
 * Downloads generated NFTs from AWS S3 to your local computer
 * 
 * Usage: npm run download:aws
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('\n📥 AWS S3 Download\n');
  console.log('This downloads your generated NFTs from AWS to your computer\n');

  try {
    const { execSync } = require('child_process');
    
    // Check if AWS CLI is installed
    try {
      execSync('aws --version', { stdio: 'ignore' });
    } catch {
      console.log('❌ AWS CLI not found!\n');
      console.log('Install it from: https://aws.amazon.com/cli/\n');
      process.exit(1);
    }

    // Get AWS config
    const configPath = path.join(__dirname, '../.aws-config.json');
    if (!fs.existsSync(configPath)) {
      console.log('❌ AWS credentials not configured!\n');
      console.log('Run: npm run generate:aws\n');
      process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Create output directories
    const outputDir = path.join(__dirname, '../output/aws-generated');
    const imagesDir = path.join(outputDir, 'images');
    const metadataDir = path.join(outputDir, 'metadata');

    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir, { recursive: true });
    }

    console.log('📂 Output directories created\n');
    console.log('Images folder: ' + imagesDir);
    console.log('Metadata folder: ' + metadataDir + '\n');

    // Set AWS credentials as environment variables
    process.env.AWS_ACCESS_KEY_ID = config.accessKey;
    process.env.AWS_SECRET_ACCESS_KEY = config.secretKey;
    process.env.AWS_DEFAULT_REGION = config.region;

    console.log('⏳ Downloading images from S3...\n');
    console.log('Bucket: ' + config.bucketName);
    console.log('Region: ' + config.region + '\n');

    try {
      // Download images
      execSync(
        `aws s3 sync s3://${config.bucketName}/images/ ${imagesDir}/ --no-progress`,
        { stdio: 'inherit' }
      );
      console.log('\n✅ Images downloaded\n');
    } catch (error) {
      console.log('\n⚠️  Could not download images');
      console.log('Make sure AWS generation completed first\n');
    }

    try {
      // Download metadata
      execSync(
        `aws s3 sync s3://${config.bucketName}/metadata/ ${metadataDir}/ --no-progress`,
        { stdio: 'inherit' }
      );
      console.log('\n✅ Metadata downloaded\n');
    } catch (error) {
      console.log('\n⚠️  Could not download metadata\n');
    }

    // Count files
    const imageFiles = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png')).length;
    const metadataFiles = fs.readdirSync(metadataDir).filter(f => f.endsWith('.json')).length;

    console.log('📊 Download Summary:\n');
    console.log(`   Images: ${imageFiles} files`);
    console.log(`   Metadata: ${metadataFiles} files\n`);

    if (imageFiles === 10000 && metadataFiles === 10000) {
      console.log('✅ Complete! All 10,000 NFTs downloaded\n');
      console.log('Next steps:');
      console.log('1. Check your NFTs in: output/aws-generated/images/');
      console.log('2. Review metadata in: output/aws-generated/metadata/');
      console.log('3. Run: npm run upload:ipfs (to upload to IPFS)\n');
    } else if (imageFiles > 0 || metadataFiles > 0) {
      console.log('⚠️  Partial download\n');
      console.log('Expected: 10,000 files each');
      console.log(`Got: ${imageFiles} images, ${metadataFiles} metadata\n`);
    } else {
      console.log('❌ No files downloaded!\n');
      console.log('Check that AWS generation completed successfully\n');
    }

    rl.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    process.exit(1);
  }
}

main();
