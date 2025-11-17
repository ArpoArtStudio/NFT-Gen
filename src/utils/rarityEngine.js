// Rarity-based NFT generation engine
// Implements tier-based quota system with scoring and weighted selection

class RarityEngine {
  constructor() {
    this.config = null;
    this.remainingTierQuotas = null;
    this.remainingVariantQuotas = null;
    this.rngSeed = 42; // Fixed seed for reproducibility during testing
    this.tierIdToIndex = new Map();
    this.variantNameToTraitIndex = new Map();
  }

  // Load and validate rarity configuration
  loadConfig(configData) {
    this.config = JSON.parse(JSON.stringify(configData)); // Deep clone
    this.validateConfig();
    this.initializeQuotas();
    this.buildLookupMaps();
  }

  validateConfig() {
    if (!this.config || !this.config.tiers || !this.config.traits) {
      throw new Error("Invalid rarity config: missing tiers or traits");
    }

    // Validate tiers
    let totalTierQuota = 0;
    this.config.tiers.forEach((tier, index) => {
      if (!tier.id || !tier.scoreRange || typeof tier.quota !== 'number') {
        throw new Error(`Invalid tier at index ${index}`);
      }
      totalTierQuota += tier.quota;
    });

    if (totalTierQuota !== this.config.collectionSize) {
      console.warn(`Warning: total tier quota = ${totalTierQuota}, expected ${this.config.collectionSize}`);
    }

    // Validate traits
    const expectedTraitNames = ['socks', 'shoes', 'pants', 'shirt', 'face', 'hat'];
    if (this.config.traits.length !== expectedTraitNames.length) {
      throw new Error(`Expected ${expectedTraitNames.length} traits, got ${this.config.traits.length}`);
    }

    this.config.traits.forEach((trait, traitIndex) => {
      if (!expectedTraitNames.includes(trait.trait)) {
        throw new Error(`Unexpected trait name: ${trait.trait}`);
      }

      if (!trait.variants || trait.variants.length !== 26) {
        throw new Error(`Trait ${trait.trait} must have exactly 26 variants`);
      }

      let totalVariantQuota = 0;
      trait.variants.forEach((variant, variantIndex) => {
        if (!variant.name || !variant.tier || typeof variant.points !== 'number' || typeof variant.quota !== 'number') {
          throw new Error(`Invalid variant at trait ${traitIndex}, variant ${variantIndex}`);
        }
        totalVariantQuota += variant.quota;
      });

      if (totalVariantQuota !== this.config.collectionSize) {
        console.warn(`Warning: trait ${trait.trait} total quota = ${totalVariantQuota}, expected ${this.config.collectionSize}`);
      }
    });
  }

  initializeQuotas() {
    // Initialize remaining tier quotas
    this.remainingTierQuotas = this.config.tiers.map(tier => ({ ...tier }));
    
    // Initialize remaining variant quotas
    this.remainingVariantQuotas = this.config.traits.map(trait => ({
      trait: trait.trait,
      variants: trait.variants.map(variant => ({ ...variant }))
    }));
  }

  buildLookupMaps() {
    // Build tier ID to index mapping
    this.config.tiers.forEach((tier, index) => {
      this.tierIdToIndex.set(tier.id, index);
    });

    // Build variant name to trait index mapping
    this.config.traits.forEach((trait, traitIndex) => {
      trait.variants.forEach(variant => {
        this.variantNameToTraitIndex.set(variant.name, traitIndex);
      });
    });
  }

  // Enhanced seeded random number generator for reproducibility
  seededRandom() {
    this.rngSeed = (this.rngSeed * 9301 + 49297) % 233280;
    return this.rngSeed / 233280;
  }

  // Bell curve weighted tier selection - prioritizes center tiers (T4, T5, T6)
  selectTierWeighted() {
    const availableTiers = this.remainingTierQuotas.filter(tier => tier.quota > 0);
    
    if (availableTiers.length === 0) {
      throw new Error("No available tiers with remaining quota");
    }

    // Calculate weights with bell curve bias
    let weightedTiers = availableTiers.map(tier => {
      let baseWeight = tier.quota;
      
      // Apply bell curve multiplier - higher for center tiers
      let bellCurveMultiplier = 1.0;
      switch(tier.id) {
        case 'T1': case 'T9': bellCurveMultiplier = 0.5; break;  // Ultra rare
        case 'T2': case 'T8': bellCurveMultiplier = 0.7; break;  // Very rare
        case 'T3': case 'T7': bellCurveMultiplier = 1.2; break;  // Rare
        case 'T4': case 'T6': bellCurveMultiplier = 1.8; break;  // Uncommon
        case 'T5': bellCurveMultiplier = 2.5; break;             // Common (peak)
      }
      
      return {
        ...tier,
        weight: Math.floor(baseWeight * bellCurveMultiplier)
      };
    });

    const totalWeight = weightedTiers.reduce((sum, tier) => sum + tier.weight, 0);
    let random = this.seededRandom() * totalWeight;

    for (const tier of weightedTiers) {
      random -= tier.weight;
      if (random <= 0) {
        return tier.id;
      }
    }

    // Fallback to first available tier
    return availableTiers[0].id;
  }

  // Get tier by ID
  getTierById(tierId) {
    const tier = this.config.tiers.find(t => t.id === tierId);
    if (!tier) {
      throw new Error(`Unknown tier ID: ${tierId}`);
    }
    return tier;
  }

  // Select variants for a given tier
  selectVariantsForTier(targetTierId) {
    const selectedVariants = [];
    
    for (const traitConfig of this.remainingVariantQuotas) {
      // Filter variants that match the target tier and have remaining quota
      const availableVariants = traitConfig.variants.filter(
        variant => variant.tier === targetTierId && variant.quota > 0
      );

      if (availableVariants.length === 0) {
        throw new Error(`No available variants for trait ${traitConfig.trait} in tier ${targetTierId}`);
      }

      // Select variant weighted by remaining quota
      const totalWeight = availableVariants.reduce((sum, variant) => sum + variant.quota, 0);
      let random = this.seededRandom() * totalWeight;

      let selectedVariant = null;
      for (const variant of availableVariants) {
        random -= variant.quota;
        if (random <= 0) {
          selectedVariant = variant;
          break;
        }
      }

      if (!selectedVariant) {
        selectedVariant = availableVariants[0]; // Fallback
      }

      selectedVariants.push({
        trait: traitConfig.trait,
        variant: selectedVariant
      });
    }

    return selectedVariants;
  }

  // Calculate total score for selected variants
  calculateScore(selectedVariants) {
    return selectedVariants.reduce((sum, item) => sum + item.variant.points, 0);
  }

  // Check if score is within tier range
  isScoreInTierRange(score, tierId) {
    const tier = this.getTierById(tierId);
    const [min, max] = tier.scoreRange;
    return score >= min && score <= max;
  }

  // Decrement quotas after successful generation
  decrementQuotas(tierId, selectedVariants) {
    // Decrement tier quota
    const tierIndex = this.tierIdToIndex.get(tierId);
    this.remainingTierQuotas[tierIndex].quota--;

    // Decrement variant quotas
    selectedVariants.forEach(item => {
      const traitIndex = this.variantNameToTraitIndex.get(item.variant.name);
      const variantIndex = this.remainingVariantQuotas[traitIndex].variants.findIndex(
        v => v.name === item.variant.name
      );
      this.remainingVariantQuotas[traitIndex].variants[variantIndex].quota--;
    });
  }

  // Generate a single NFT with rarity constraints
  generateNFT(maxRetries = 100) {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        // 1. Select target tier weighted by remaining quotas
        const targetTierId = this.selectTierWeighted();
        
        // 2. Select variants for each trait matching the target tier
        const selectedVariants = this.selectVariantsForTier(targetTierId);
        
        // 3. Calculate total score
        const totalScore = this.calculateScore(selectedVariants);
        
        // 4. Verify score is within tier range
        if (this.isScoreInTierRange(totalScore, targetTierId)) {
          // 5. Decrement quotas
          this.decrementQuotas(targetTierId, selectedVariants);
          
          // 6. Return successful generation result
          const tierInfo = this.getTierById(targetTierId);
          return {
            success: true,
            tierId: targetTierId,
            tierName: tierInfo.name,
            score: totalScore,
            variants: selectedVariants,
            attempts: attempts + 1
          };
        }
      } catch (error) {
        console.warn(`Generation attempt ${attempts + 1} failed:`, error.message);
      }
      
      attempts++;
    }

    return {
      success: false,
      error: `Failed to generate NFT after ${maxRetries} attempts`,
      attempts
    };
  }

  // Map variant names to layer elements for rendering
  mapVariantsToLayers(selectedVariants, layerData) {
    const mappedLayers = [];
    
    selectedVariants.forEach(item => {
      const traitName = item.trait;
      const variantName = item.variant.name;
      
      // Find matching layer by trait name
      const layer = layerData.find(l => {
        // Try exact match first
        if (l.name.toLowerCase() === traitName.toLowerCase()) {
          return true;
        }
        // Try partial match (e.g., "socks" matches "01_Socks")
        return l.name.toLowerCase().includes(traitName.toLowerCase());
      });

      if (!layer) {
        throw new Error(`Could not find layer for trait: ${traitName}`);
      }

      // Find matching element by variant name
      const element = layer.elements.find(el => {
        // Try exact match first
        if (el.name === variantName) {
          return true;
        }
        // Try partial match for compatibility
        const cleanElementName = el.name.replace(/[_\s-]/g, '').toLowerCase();
        const cleanVariantName = variantName.replace(/[_\s-]/g, '').toLowerCase();
        return cleanElementName.includes(cleanVariantName.replace(/^[a-z]+/i, ''));
      });

      if (!element) {
        console.warn(`Could not find element for variant ${variantName} in layer ${layer.name}, using first element`);
        mappedLayers.push({
          name: layer.name,
          selectedElement: layer.elements[0] // Fallback to first element
        });
      } else {
        mappedLayers.push({
          name: layer.name,
          selectedElement: element
        });
      }
    });

    return mappedLayers;
  }

  // Get generation status and statistics
  getGenerationStatus() {
    const totalRemaining = this.remainingTierQuotas.reduce((sum, tier) => sum + tier.quota, 0);
    const totalGenerated = this.config.collectionSize - totalRemaining;
    
    return {
      totalGenerated,
      totalRemaining,
      collectionSize: this.config.collectionSize,
      progress: (totalGenerated / this.config.collectionSize) * 100,
      tierStatus: this.remainingTierQuotas.map(tier => ({
        id: tier.id,
        name: tier.name,
        remaining: tier.quota,
        originalQuota: this.config.tiers.find(t => t.id === tier.id).quota
      }))
    };
  }

  // Validate final generation
  validateFinalGeneration() {
    const status = this.getGenerationStatus();
    
    if (status.totalRemaining !== 0) {
      throw new Error(`Generation incomplete: ${status.totalRemaining} NFTs remaining`);
    }

    // Validate all tier quotas are zero
    const nonZeroTiers = this.remainingTierQuotas.filter(tier => tier.quota > 0);
    if (nonZeroTiers.length > 0) {
      throw new Error(`Tiers with remaining quota: ${nonZeroTiers.map(t => t.id).join(', ')}`);
    }

    // Validate all variant quotas are zero
    for (const trait of this.remainingVariantQuotas) {
      const nonZeroVariants = trait.variants.filter(v => v.quota > 0);
      if (nonZeroVariants.length > 0) {
        throw new Error(`Trait ${trait.trait} has variants with remaining quota: ${nonZeroVariants.map(v => v.name).join(', ')}`);
      }
    }

    return true;
  }
}

module.exports = RarityEngine;
