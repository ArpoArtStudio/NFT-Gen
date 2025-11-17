// Utility functions for loading and validating rarity configuration

const fs = require('fs');
const path = require('path');

class RarityConfigLoader {
  static loadRarityConfig(configPath = null) {
    const defaultPath = path.join(process.cwd(), 'config', 'rarity-config.json');
    const finalPath = configPath || defaultPath;
    
    try {
      if (!fs.existsSync(finalPath)) {
        throw new Error(`Rarity config file not found: ${finalPath}`);
      }
      
      const rawData = fs.readFileSync(finalPath, 'utf8');
      const config = JSON.parse(rawData);
      
      this.validateBasicStructure(config);
      return config;
    } catch (error) {
      console.error('Error loading rarity config:', error.message);
      throw error;
    }
  }

  static validateBasicStructure(config) {
    if (!config.collectionSize || typeof config.collectionSize !== 'number') {
      throw new Error('Invalid collectionSize in rarity config');
    }
    
    if (!Array.isArray(config.tiers) || config.tiers.length === 0) {
      throw new Error('Invalid or missing tiers in rarity config');
    }
    
    if (!Array.isArray(config.traits) || config.traits.length === 0) {
      throw new Error('Invalid or missing traits in rarity config');
    }
  }

  static logConfigSummary(config) {
    console.log('=== Rarity Configuration Summary ===');
    console.log(`Collection Size: ${config.collectionSize}`);
    console.log(`Number of Tiers: ${config.tiers.length}`);
    console.log(`Number of Traits: ${config.traits.length}`);
    
    console.log('\nTier Distribution:');
    config.tiers.forEach(tier => {
      const percentage = ((tier.quota / config.collectionSize) * 100).toFixed(2);
      console.log(`  ${tier.id} (${tier.name}): ${tier.quota} NFTs (${percentage}%) - Score ${tier.scoreRange[0]}-${tier.scoreRange[1]}`);
    });

    console.log('\nTrait Summary:');
    config.traits.forEach(trait => {
      console.log(`  ${trait.trait}: ${trait.variants.length} variants`);
    });
  }

  static createExampleMapping() {
    return {
      "socks": ["01_Socks", "1_Socks", "socks", "Socks"],
      "shoes": ["02_Shoes", "2_Shoes", "shoes", "Shoes"],  
      "pants": ["03_Pants", "3_Pants", "pants", "Pants"],
      "shirt": ["04_Shirt", "4_Shirt", "shirt", "Shirt"],
      "face": ["05_Face", "5_Face", "face", "Face"],
      "hat": ["06_Hat", "6_Hat", "hat", "Hat"]
    };
  }

  static logTraitMapping(folderNames) {
    console.log('\n=== Current Layer Structure ===');
    folderNames.forEach((folder, index) => {
      console.log(`Layer ${index + 1}: ${folder.name} (${folder.elements.length} elements)`);
      folder.elements.forEach(element => {
        console.log(`  - ${element.name} (weight: ${element.weight})`);
      });
    });
  }
}

module.exports = RarityConfigLoader;
