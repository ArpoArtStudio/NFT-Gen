# AWS Generation & IPFS Deployment Guide (nft.storage)

## Overview

This guide explains how to use AWS for faster NFT generation and then deploy to IPFS using nft.storage only.

### Why AWS for Generation?

**Advantages:**
- ✅ **Parallel Processing**: Generate multiple NFTs simultaneously across multiple Lambda functions or EC2 instances
- ✅ **Scalability**: Handle large collections (10,000+ NFTs) without local resource constraints
- ✅ **Faster Execution**: Process time reduced from hours to minutes
- ✅ **Reliability**: AWS handles infrastructure, backups, and monitoring
- ✅ **Cost Efficient**: Pay only for what you use (Lambda, S3, Compute)

**Estimated Speed Improvement:**
- Local machine: ~1-2 NFTs per second = 2-3 hours for 10,000 NFTs
- AWS Lambda (100 parallel): ~30-50 NFTs per second = 3-5 minutes for 10,000 NFTs
- AWS EC2 (8 vCPU): ~5-10 NFTs per second = 15-30 minutes for 10,000 NFTs

---

## Phase 1: Prepare Codebase for AWS

### Step 1: Create AWS Node.js Generator Script

Create a new file: `scripts/aws-generator.js`

```javascript
// AWS Lambda-compatible NFT generation script
// Usage: node aws-generator.js --start=1 --end=1000 --output=s3://bucket/generation-batch-1

const fs = require('fs');
const path = require('path');
const RarityEngine = require('../src/utils/rarityEngine');
const rarityConfig = require('../config/rarity-config.json');

// Parse command-line arguments
const args = require('minimist')(process.argv.slice(2));
const startId = args.start || 1;
const endId = args.end || 10000;
const outputType = args.output || 'local'; // 'local' or 's3://bucket-name/prefix'
const layersPath = args.layers || './layers';

class AwsNFTGenerator {
  constructor(rarityConfig, layersPath) {
    this.engine = new RarityEngine();
    this.engine.loadConfig(rarityConfig);
    this.layersPath = layersPath;
    this.loadLayerNames();
  }

  // Load trait variant names from layer directories
  loadLayerNames() {
    this.traitVariants = {};
    const traits = ['socks', 'shoes', 'pants', 'shirt', 'face', 'hat'];
    
    traits.forEach(trait => {
      const traitPath = path.join(this.layersPath, trait);
      if (fs.existsSync(traitPath)) {
        this.traitVariants[trait] = fs.readdirSync(traitPath)
          .filter(f => f.endsWith('.png'))
          .map(f => f.replace('.png', ''));
      }
    });
  }

  // Generate a batch of NFTs
  async generateBatch(startId, endId) {
    const results = [];
    const errors = [];

    for (let tokenId = startId; tokenId <= endId; tokenId++) {
      try {
        const result = this.engine.generateNFT();
        
        if (!result.success) {
          errors.push({
            tokenId,
            error: result.error,
            attempts: result.attempts
          });
          continue;
        }

        // Generate metadata
        const metadata = this.generateMetadata(tokenId, result);
        results.push({
          tokenId,
          metadata,
          success: true
        });

        // Log progress every 100 NFTs
        if (tokenId % 100 === 0) {
          console.log(`Generated ${tokenId - startId + 1}/${endId - startId + 1} NFTs`);
        }
      } catch (error) {
        errors.push({
          tokenId,
          error: error.message
        });
      }
    }

    return { results, errors };
  }

  // Create metadata object following OpenSea/Magic Eden standards
  generateMetadata(tokenId, generationResult) {
    const attributes = generationResult.variants.map(item => ({
      trait_type: item.trait,
      value: item.variant.name,
      rarity: {
        tier: generationResult.tierId,
        tier_name: generationResult.tierName,
        rarity_score: item.variant.points,
        rarity_rank: this.getRarityRank(generationResult.tierId)
      }
    }));

    return {
      name: `NFT #${tokenId}`,
      description: "Your collection description here",
      image: `ipfs://YOUR_IPFS_HASH/images/${tokenId}.png`,
      external_url: `https://yourwebsite.com/nft/${tokenId}`,
      attributes: attributes,
      properties: {
        overall_rarity_score: generationResult.score,
        overall_tier: generationResult.tierId,
        overall_tier_name: generationResult.tierName,
        generation_number: 1,
        generated_at: new Date().toISOString()
      }
    };
  }

  getRarityRank(tierId) {
    const ranks = {
      'T1': 'Ultra Rare',
      'T2': 'Very Rare',
      'T3': 'Rare',
      'T4': 'Uncommon',
      'T5': 'Common',
      'T6': 'Uncommon',
      'T7': 'Rare',
      'T8': 'Very Rare',
      'T9': 'Ultra Rare'
    };
    return ranks[tierId] || 'Unknown';
  }

  // Save metadata to file system
  async saveToLocal(results, outputDir) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const result of results) {
      const filename = `${result.tokenId}.json`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(result.metadata, null, 2));
    }
  }

  // Save metadata to AWS S3
  async saveToS3(results, s3Bucket, s3Prefix) {
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3();

    for (const result of results) {
      const key = `${s3Prefix}/${result.tokenId}.json`;
      await s3.putObject({
        Bucket: s3Bucket,
        Key: key,
        Body: JSON.stringify(result.metadata),
        ContentType: 'application/json'
      }).promise();
    }

    console.log(`Uploaded ${results.length} metadata files to S3`);
  }
}

// Main execution
async function main() {
  try {
    console.log(`Starting generation for tokens ${startId}-${endId}`);
    
    const generator = new AwsNFTGenerator(rarityConfig, layersPath);
    const { results, errors } = await generator.generateBatch(startId, endId);

    console.log(`\nGeneration complete!`);
    console.log(`Successfully generated: ${results.length}`);
    console.log(`Failed: ${errors.length}`);

    if (outputType.startsWith('s3://')) {
      const [, bucket, ...prefixParts] = outputType.replace('s3://', '').split('/');
      const prefix = prefixParts.join('/');
      await generator.saveToS3(results, bucket, prefix);
    } else {
      await generator.saveToLocal(results, outputType || './output/metadata');
    }

    // Save error log
    if (errors.length > 0) {
      fs.writeFileSync(
        './generation-errors.log',
        JSON.stringify(errors, null, 2)
      );
      console.log(`Errors logged to generation-errors.log`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Generation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AwsNFTGenerator;
```

### Step 2: Create AWS Lambda Handler

Create file: `scripts/lambda-handler.js`

```javascript
// AWS Lambda handler for parallel NFT generation
const AwsNFTGenerator = require('./aws-generator');
const rarityConfig = require('../config/rarity-config.json');

exports.handler = async (event) => {
  try {
    const { startId, endId, s3Bucket, s3Prefix } = event;

    if (!startId || !endId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'startId and endId required' })
      };
    }

    const generator = new AwsNFTGenerator(rarityConfig, '/opt/layers');
    const { results, errors } = await generator.generateBatch(startId, endId);

    // Upload to S3
    if (s3Bucket) {
      await generator.saveToS3(results, s3Bucket, s3Prefix);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        generated: results.length,
        failed: errors.length,
        batchRange: `${startId}-${endId}`
      })
    };
  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### Step 3: Add AWS dependencies

Update `package.json`:

```json
{
  "devDependencies": {
    "aws-sdk": "^2.1400.0",
    "minimist": "^1.2.8"
  }
}
```

---

## Phase 2: AWS Setup & Configuration

### AWS Resources Needed

1. **S3 Bucket**: Store generated metadata and images
2. **Lambda Functions**: Run generation in parallel
3. **EC2 Instance** (optional): For heavy lifting
4. **IAM Roles**: Permissions for Lambda/EC2 to access S3

### Step 1: Create S3 Bucket

```bash
# AWS CLI command
aws s3 mb s3://your-nft-generation-bucket --region us-east-1

# Create folders
aws s3api put-object --bucket your-nft-generation-bucket --key metadata/
aws s3api put-object --bucket your-nft-generation-bucket --key images/
```

### Step 2: Create IAM Role for Lambda

```bash
# Create role
aws iam create-role --role-name nft-generation-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Add S3 permissions
aws iam put-role-policy --role-name nft-generation-lambda-role \
  --policy-name s3-access --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:*"],
      "Resource": "*"
    }]
  }'

# Add CloudWatch logs permissions
aws iam attach-role-policy --role-name nft-generation-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

### Step 3: Deploy Lambda Function

```bash
# Create deployment package
cd scripts
npm install
zip -r lambda-package.zip . ../config ../src

# Deploy to Lambda
aws lambda create-function \
  --function-name nft-generation \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/nft-generation-lambda-role \
  --handler lambda-handler.handler \
  --zip-file fileb://lambda-package.zip \
  --timeout 900 \
  --memory-size 3008
```

---

## Phase 3: Parallel Generation

### Option A: Invoke Lambda in Parallel (Recommended)

```bash
#!/bin/bash
# parallel-generation.sh

BATCH_SIZE=100  # NFTs per Lambda invocation
TOTAL=10000
BUCKET="your-nft-generation-bucket"

for ((i=1; i<=TOTAL; i+=BATCH_SIZE)); do
  END=$((i + BATCH_SIZE - 1))
  if [ $END -gt $TOTAL ]; then
    END=$TOTAL
  fi

  echo "Invoking Lambda for tokens $i-$END"
  
  aws lambda invoke \
    --function-name nft-generation \
    --payload "{\"startId\": $i, \"endId\": $END, \"s3Bucket\": \"$BUCKET\", \"s3Prefix\": \"metadata\"}" \
    /tmp/response-$i.json &

  # Limit to 100 concurrent invocations
  if (( i % 10000 == 0 )); then
    wait
  fi
done

wait
echo "All Lambda invocations completed!"
```

### Option B: EC2 Instance (Higher Throughput)

```bash
#!/bin/bash
# Launch EC2 instance with generation script

# User data script (runs on instance startup)
#!/bin/bash
cd /home/ec2-user
git clone https://github.com/yourrepo/hashlips-nft-engine.git
cd hashlips-nft-engine
npm install

# Generate all 10,000 NFTs
node scripts/aws-generator.js \
  --start=1 \
  --end=10000 \
  --output=s3://your-nft-generation-bucket/metadata \
  --layers=/opt/layers
```

---

## Phase 4: Upload to IPFS (nft.storage)

### Get an API Key
- Go to https://nft.storage/
- Create an account → API Keys → Create new key

### Upload from this project
```bash
npm run upload:ipfs -- --token=YOUR_NFT_STORAGE_TOKEN \
  --metadata-dir=./output/metadata \
  --images-dir=./output/images
```

Outputs CIDs you can open in a browser:
- https://nftstorage.link/ipfs/CID/
- https://ipfs.io/ipfs/CID/

---

## Timeline Comparison

### Local Generation (Current)
```
Time: 2-3 hours
Cost: $0 (local electricity)
Complexity: Simple
```

### AWS Lambda (Parallel)
```
Time: 5-10 minutes
Cost: ~$5-15 (Lambda + S3)
Complexity: Medium
Setup time: 1 hour
```

### AWS EC2 (Continuous)
```
Time: 20-30 minutes
Cost: ~$1-3 (t3.large for 30 mins)
Complexity: Medium
Setup time: 30 mins
```

### IPFS Upload
```
Time: 10-30 minutes (depends on file size)
Cost: Free (nft.storage fair-use policy)
Complexity: Simple
```

---

## Troubleshooting

### Lambda Timeout
- Increase timeout to 900 seconds (max)
- Reduce batch size (generate 50 NFTs per Lambda instead of 100)
- Use Lambda layers for dependencies

### S3 Upload Limits
- Enable S3 Transfer Acceleration
- Use multipart uploads
- Consider CloudFront distribution

### IPFS Upload Speed
- Upload metadata and images separately
- Use CAR files for batch uploads
- Consider using Arweave as alternative

---

## Security Considerations

✅ Use environment variables for sensitive data
✅ Enable S3 versioning and lifecycle policies
✅ Use VPC endpoints for Lambda-S3 communication
✅ Enable CloudTrail for audit logging
✅ Consider S3 encryption (SSE-S3 or SSE-KMS)

---

**Next Steps:**
1. Set up AWS account and resources
2. Test generation locally first
3. Deploy to Lambda
4. Run parallel generation
5. Upload to IPFS
6. Deploy smart contract with base URI
