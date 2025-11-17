// Metadata Generation Utility
// Generates OpenSea/Magic Eden compliant metadata from rarity engine output

class MetadataGenerator {
  constructor(collectionName, collectionDescription, ipfsImageBasePath = null) {
    this.collectionName = collectionName;
    this.collectionDescription = collectionDescription;
    this.ipfsImageBasePath = ipfsImageBasePath || 'ipfs://YOUR_IPFS_HASH/images';
    this.websiteBaseUrl = 'https://yourwebsite.com/nft';
  }

  /**
   * Generate metadata for a single NFT
   * @param {number} tokenId - NFT token ID
   * @param {object} generationResult - Result from rarityEngine.generateNFT()
   * @returns {object} Metadata object compatible with OpenSea/Magic Eden
   */
  generateMetadata(tokenId, generationResult) {
    if (!generationResult.success) {
      throw new Error(`Cannot generate metadata for failed generation: ${generationResult.error}`);
    }

    const attributes = this.generateAttributes(generationResult);
    const overallScore = this.calculateOverallScore(generationResult);

    return {
      name: `${this.collectionName} #${tokenId}`,
      description: this.collectionDescription,
      image: `${this.ipfsImageBasePath}/${tokenId}.png`,
      external_url: `${this.websiteBaseUrl}/${tokenId}`,
      attributes: attributes,
      properties: {
        overall_rarity_score: overallScore,
        overall_tier: generationResult.tierId,
        overall_tier_name: generationResult.tierName,
        generation_batch: 1,
        generated_at: new Date().toISOString()
      }
    };
  }

  /**
   * Generate OpenSea/Magic Eden compatible attributes
   * @param {object} generationResult - Result from rarityEngine.generateNFT()
   * @returns {array} Attributes array
   */
  generateAttributes(generationResult) {
    return generationResult.variants.map(item => {
      const rarityRank = this.getRarityRank(item.variant.tier);

      return {
        trait_type: this.capitalizeFirst(item.trait),
        value: item.variant.name,
        // Optional: Add rarity information (not displayed by OpenSea/Magic Eden but preserved)
        rarity: {
          tier: item.variant.tier,
          tier_name: this.getTierName(item.variant.tier),
          points: item.variant.points,
          rarity_rank: rarityRank
        }
      };
    });
  }

  /**
   * Generate minimal metadata (OpenSea/Magic Eden standard only)
   * Use this for strict compliance
   * @param {number} tokenId - NFT token ID
   * @param {object} generationResult - Result from rarityEngine.generateNFT()
   * @returns {object} Minimal metadata object
   */
  generateMetadataMinimal(tokenId, generationResult) {
    const attributes = generationResult.variants.map(item => ({
      trait_type: this.capitalizeFirst(item.trait),
      value: item.variant.name
    }));

    return {
      name: `${this.collectionName} #${tokenId}`,
      description: this.collectionDescription,
      image: `${this.ipfsImageBasePath}/${tokenId}.png`,
      external_url: `${this.websiteBaseUrl}/${tokenId}`,
      attributes: attributes
    };
  }

  /**
   * Generate extended metadata with rarity scoring
   * Use this for your website/dApp
   * @param {number} tokenId - NFT token ID
   * @param {object} generationResult - Result from rarityEngine.generateNFT()
   * @returns {object} Extended metadata with detailed rarity info
   */
  generateMetadataExtended(tokenId, generationResult) {
    const baseMetadata = this.generateMetadata(tokenId, generationResult);

    // Add rarity scoring details
    baseMetadata.rarity_details = {
      total_score: this.calculateOverallScore(generationResult),
      tier_id: generationResult.tierId,
      tier_name: generationResult.tierName,
      tier_rank: this.getRarityRank(generationResult.tierId),
      score_range: this.getTierScoreRange(generationResult.tierId),
      percentile: this.estimatePercentile(generationResult.tierId),
      traits: generationResult.variants.map(item => ({
        name: item.trait,
        variant: item.variant.name,
        points: item.variant.points,
        tier: item.variant.tier,
        rarity_rank: this.getRarityRank(item.variant.tier)
      }))
    };

    return baseMetadata;
  }

  /**
   * Calculate overall rarity score
   * @param {object} generationResult - Result from rarityEngine.generateNFT()
   * @returns {number} Total score
   */
  calculateOverallScore(generationResult) {
    return generationResult.variants.reduce((sum, item) => sum + item.variant.points, 0);
  }

  /**
   * Map tier ID to display name
   * @param {string} tierId - Tier ID (T1-T9)
   * @returns {string} Tier name
   */
  getTierName(tierId) {
    const tierNames = {
      'T1': 'Minimal',
      'T2': 'Low',
      'T3': 'BelowAverage',
      'T4': 'Moderate',
      'T5': 'Common',
      'T6': 'AboveAverage',
      'T7': 'High',
      'T8': 'Peak',
      'T9': 'Maximal'
    };
    return tierNames[tierId] || 'Unknown';
  }

  /**
   * Map tier ID to rarity rank
   * @param {string} tierId - Tier ID (T1-T9)
   * @returns {string} Rarity rank
   */
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

  /**
   * Get score range for a tier
   * @param {string} tierId - Tier ID (T1-T9)
   * @returns {array} [min, max] score range
   */
  getTierScoreRange(tierId) {
    const ranges = {
      'T1': [42, 42],
      'T2': [60, 60],
      'T3': [78, 84],
      'T4': [102, 132],
      'T5': [144, 174],
      'T6': [186, 216],
      'T7': [228, 234],
      'T8': [252, 252],
      'T9': [270, 270]
    };
    return ranges[tierId] || [0, 0];
  }

  /**
   * Estimate collector percentile based on tier
   * @param {string} tierId - Tier ID (T1-T9)
   * @returns {number} Percentile (0-100)
   */
  estimatePercentile(tierId) {
    const percentiles = {
      'T1': 99.9,   // Top 0.1% (10 of 10,000)
      'T2': 99.0,   // Top 1% (100 of 10,000)
      'T3': 95.0,   // Top 5% (500 of 10,000)
      'T4': 76.1,   // Top 24% (2,390 of 10,000)
      'T5': 50.0,   // Middle 40% (4,000 of 10,000)
      'T6': 23.9,   // Next 24% (2,390 of 10,000)
      'T7': 5.0,    // Top 5% again (500 of 10,000)
      'T8': 1.0,    // Top 1% again (100 of 10,000)
      'T9': 0.1     // Top 0.1% again (10 of 10,000)
    };
    return percentiles[tierId] || 50.0;
  }

  /**
   * Helper: Capitalize first letter of string
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Generate collection-level metadata
   * @param {number} totalSupply - Total NFTs in collection
   * @param {string} collectionImageHash - IPFS hash of collection image
   * @returns {object} Collection metadata
   */
  generateCollectionMetadata(totalSupply, collectionImageHash) {
    return {
      name: this.collectionName,
      description: this.collectionDescription,
      image: `ipfs://${collectionImageHash}`,
      external_url: 'https://yourwebsite.com',
      total_supply: totalSupply,
      tiers: this.generateTierSummary(),
      traits: this.generateTraitSummary(),
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Generate tier summary for collection metadata
   * @returns {array} Tier information
   */
  generateTierSummary() {
    const tiers = [
      { id: 'T1', name: 'Minimal', count: 10, range: [42, 42] },
      { id: 'T2', name: 'Low', count: 100, range: [60, 60] },
      { id: 'T3', name: 'BelowAverage', count: 500, range: [78, 84] },
      { id: 'T4', name: 'Moderate', count: 2390, range: [102, 132] },
      { id: 'T5', name: 'Common', count: 4000, range: [144, 174] },
      { id: 'T6', name: 'AboveAverage', count: 2390, range: [186, 216] },
      { id: 'T7', name: 'High', count: 500, range: [228, 234] },
      { id: 'T8', name: 'Peak', count: 100, range: [252, 252] },
      { id: 'T9', name: 'Maximal', count: 10, range: [270, 270] }
    ];

    return tiers.map(tier => ({
      tier_id: tier.id,
      tier_name: tier.name,
      total_count: tier.count,
      percentage: ((tier.count / 10000) * 100).toFixed(2) + '%',
      score_range: tier.range,
      rarity_rank: this.getRarityRank(tier.id)
    }));
  }

  /**
   * Generate trait summary for collection metadata
   * @returns {array} Trait information
   */
  generateTraitSummary() {
    return [
      { name: 'Socks', variants_count: 26 },
      { name: 'Shoes', variants_count: 26 },
      { name: 'Pants', variants_count: 26 },
      { name: 'Shirt', variants_count: 26 },
      { name: 'Face', variants_count: 26 },
      { name: 'Hat', variants_count: 26 }
    ];
  }

  /**
   * Batch generate metadata for multiple NFTs
   * @param {array} generationResults - Array of results from rarityEngine.generateNFT()
   * @param {number} startTokenId - Starting token ID
   * @returns {array} Array of metadata objects with tokenIds
   */
  generateBatch(generationResults, startTokenId = 1) {
    return generationResults.map((result, index) => ({
      tokenId: startTokenId + index,
      metadata: this.generateMetadata(startTokenId + index, result)
    }));
  }

  /**
   * Validate metadata against OpenSea/Magic Eden standards
   * @param {object} metadata - Metadata object to validate
   * @returns {object} { valid: boolean, errors: array }
   */
  validateMetadata(metadata) {
    const errors = [];

    // Required fields
    if (!metadata.name) errors.push('Missing required field: name');
    if (!metadata.description) errors.push('Missing required field: description');
    if (!metadata.image) errors.push('Missing required field: image');
    if (!metadata.attributes || !Array.isArray(metadata.attributes)) {
      errors.push('Missing required field: attributes (must be array)');
    }

    // Validate image URL format
    if (metadata.image && !metadata.image.startsWith('ipfs://') && !metadata.image.startsWith('http')) {
      errors.push('Image URL should start with ipfs:// or http(s)://');
    }

    // Validate attributes
    if (metadata.attributes) {
      metadata.attributes.forEach((attr, index) => {
        if (!attr.trait_type) errors.push(`Attribute ${index}: missing trait_type`);
        if (attr.value === undefined) errors.push(`Attribute ${index}: missing value`);
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetadataGenerator;
}
