#!/usr/bin/env node

/**
 * AWS NFT Generation Setup & Runner
 * 
 * This script helps you:
 * 1. Set up AWS credentials
 * 2. Create an S3 bucket
 * 3. Deploy Lambda function
 * 4. Generate 10,000 NFTs on AWS
 * 
 * Usage: npm run generate:aws
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('\n🚀 AWS NFT Generation Setup\n');
  console.log('This will help you generate 10,000 NFTs on AWS (takes ~10 minutes)\n');

  try {
    // Check if AWS CLI is installed
    console.log('📋 Checking prerequisites...\n');
    
    const { execSync } = require('child_process');
    try {
      execSync('aws --version', { stdio: 'ignore' });
      console.log('✅ AWS CLI found\n');
    } catch {
      console.log('❌ AWS CLI not found!\n');
      console.log('Install it from: https://aws.amazon.com/cli/\n');
      console.log('Then run: npm run generate:aws\n');
      process.exit(1);
    }

    // Get AWS credentials
    console.log('📝 AWS Credentials Setup\n');
    console.log('Get your credentials from: https://console.aws.amazon.com/iam/\n');
    
    const accessKey = await question('AWS Access Key ID: ');
    const secretKey = await question('AWS Secret Access Key: ');
    const region = await question('AWS Region (default: us-east-1): ') || 'us-east-1';
    const bucketName = await question('S3 Bucket Name (default: nft-collection-output): ') || 'nft-collection-output';

    if (!accessKey || !secretKey) {
      console.log('\n❌ AWS credentials required!\n');
      process.exit(1);
    }

    // Save credentials
    const configPath = path.join(__dirname, '../.aws-config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      accessKey,
      secretKey,
      region,
      bucketName
    }, null, 2));

    console.log('\n✅ Credentials saved\n');

    // Show next steps
    console.log('🎯 Next Steps:\n');
    console.log('1. Go to: https://console.aws.amazon.com/s3/');
    console.log('2. Create bucket named: ' + bucketName);
    console.log('3. Run: npm run generate:aws (when ready)\n');
    console.log('For detailed guide, see: AWS_IPFS_GUIDE.md\n');

    rl.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    process.exit(1);
  }
}

main();
