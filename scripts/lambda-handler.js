/**
 * AWS Lambda Handler for Parallel NFT Generation
 * Deploy this to AWS Lambda for fast generation of large collections
 * 
 * Configuration:
 * - Memory: 3008 MB (max CPU allocation)
 * - Timeout: 300 seconds (5 minutes)
 * - Environment Variables:
 *   - BATCH_SIZE: 100 (NFTs per Lambda invocation)
 *   - COLLECTION_NAME: NFT Collection
 *   - S3_BUCKET: your-nft-bucket
 *   - S3_REGION: us-east-1
 * 
 * Deployment:
 * 1. Package: zip -r lambda-handler.zip . node_modules/
 * 2. Upload to Lambda console or AWS CLI:
 *    aws lambda update-function-code --function-name nft-generator --zip-file fileb://lambda-handler.zip
 * 3. Invoke with:
 *    aws lambda invoke --function-name nft-generator \
 *      --payload '{"startId":1,"endId":1000,"bucket":"nft-metadata","prefix":"batch-1"}' \
 *      response.json
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// AWS clients
const s3 = new AWS.S3({
  region: process.env.S3_REGION || 'us-east-1'
});

const lambda = new AWS.Lambda({
  region: process.env.S3_REGION || 'us-east-1'
});

// Import utilities
let RarityEngine, MetadataGenerator, rarityConfig;

/**
 * Initialize utilities (lazy load to avoid Lambda cold start issues)
 */
function initializeUtilities() {
  if (!RarityEngine) {
    RarityEngine = require('../src/utils/rarityEngine');
    MetadataGenerator = require('../src/utils/metadataGenerator');
    rarityConfig = require('../config/rarity-config.json');
  }
}

/**
 * Generate a batch of NFTs
 */
async function generateNFTBatch(startId, endId) {
  initializeUtilities();
  
  const engine = new RarityEngine();
  engine.loadConfig(rarityConfig);

  const metadataGen = new MetadataGenerator(
    process.env.COLLECTION_NAME || 'NFT Collection',
    'A 10,000 piece collection with 9-tier rarity system',
    process.env.IPFS_HASH || 'ipfs://YOUR_IPFS_HASH/images'
  );

  const batch = [];
  const stats = {
    success: 0,
    failed: 0,
    tierDistribution: {}
  };

  for (let tokenId = startId; tokenId <= endId; tokenId++) {
    try {
      const generationResult = engine.generateNFT();

      if (!generationResult.success) {
        stats.failed++;
        continue;
      }

      // Update tier distribution
      const tier = generationResult.tierId;
      stats.tierDistribution[tier] = (stats.tierDistribution[tier] || 0) + 1;

      // Generate metadata
      const metadata = metadataGen.generateMetadata(tokenId, generationResult);
      
      batch.push({
        tokenId,
        metadata
      });

      stats.success++;
    } catch (error) {
      console.error(`Failed to generate NFT #${tokenId}:`, error.message);
      stats.failed++;
    }
  }

  return { batch, stats };
}

/**
 * Upload batch to S3
 */
async function uploadBatchToS3(batch, bucket, prefix) {
  const uploads = batch.map(item => {
    const key = `${prefix}/${item.tokenId}.json`;
    const body = JSON.stringify(item.metadata, null, 2);

    return s3.putObject({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'application/json',
      Metadata: {
        'tokenId': item.tokenId.toString(),
        'generatedAt': new Date().toISOString()
      }
    }).promise();
  });

  await Promise.all(uploads);
  console.log(`✅ Uploaded ${batch.length} NFTs to s3://${bucket}/${prefix}`);
}

/**
 * Invoke additional Lambda functions in parallel
 */
async function invokeParallelGenerations(config) {
  const { totalNFTs = 10000, batchesPerLambda = 100, lambdaFunctionName } = config;
  const batchSize = batchesPerLambda;
  const totalBatches = Math.ceil(totalNFTs / batchSize);
  
  const invocations = [];
  
  for (let i = 0; i < totalBatches; i++) {
    const startId = i * batchSize + 1;
    const endId = Math.min((i + 1) * batchSize, totalNFTs);

    const params = {
      FunctionName: lambdaFunctionName,
      InvocationType: 'Event', // Asynchronous
      Payload: JSON.stringify({
        startId,
        endId,
        bucket: config.bucket,
        prefix: config.prefix,
        isParallel: true
      })
    };

    invocations.push(lambda.invoke(params).promise());
  }

  const results = await Promise.all(invocations);
  return results.map(r => JSON.parse(r.Payload));
}

/**
 * Main Lambda handler
 */
exports.handler = async (event, context) => {
  console.log('🚀 Starting NFT Generation Lambda');
  console.log('📊 Event:', JSON.stringify(event, null, 2));

  try {
    // Parse input parameters
    const startId = parseInt(event.startId) || 1;
    const endId = parseInt(event.endId) || 1000;
    const bucket = event.bucket || process.env.S3_BUCKET || 'nft-metadata';
    const prefix = event.prefix || 'nft-metadata';
    const isParallel = event.isParallel || false;

    console.log(`📋 Generating NFTs #${startId} - #${endId}`);
    console.log(`📦 Output: s3://${bucket}/${prefix}`);

    // Generate batch
    const { batch, stats } = await generateNFTBatch(startId, endId);

    console.log(`✅ Generated ${stats.success} NFTs`);
    console.log(`📊 Tier distribution:`, stats.tierDistribution);

    // Upload to S3
    await uploadBatchToS3(batch, bucket, prefix);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        generated: stats.success,
        failed: stats.failed,
        startId: startId,
        endId: endId,
        bucket: bucket,
        prefix: prefix,
        tierDistribution: stats.tierDistribution,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('❌ Lambda execution failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

/**
 * Helper function to coordinate parallel generation
 * Can be called from another Lambda or Step Function
 */
exports.coordinateGeneration = async (event, context) => {
  console.log('🎯 Coordinating parallel generation');

  const totalNFTs = event.totalNFTs || 10000;
  const nftsPerLambda = event.nftsPerLambda || 1000;
  const lambdaFunctionName = event.lambdaFunctionName || context.functionName;
  const bucket = event.bucket || process.env.S3_BUCKET;
  const prefix = event.prefix || 'nft-metadata';

  try {
    const results = await invokeParallelGenerations({
      totalNFTs,
      batchesPerLambda: nftsPerLambda,
      lambdaFunctionName,
      bucket,
      prefix
    });

    console.log(`✅ Invoked ${results.length} parallel Lambda functions`);

    return {
      statusCode: 202,
      body: JSON.stringify({
        success: true,
        message: 'Generation started in parallel',
        parallelInvocations: results.length,
        totalNFTs: totalNFTs,
        nftsPerLambda: nftsPerLambda,
        bucket: bucket,
        prefix: prefix
      })
    };
  } catch (error) {
    console.error('❌ Parallel coordination failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
