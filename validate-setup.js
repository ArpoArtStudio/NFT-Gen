#!/usr/bin/env node

/**
 * NFT Generation System Setup Validator
 * Checks all prerequisites and configuration for successful NFT generation
 * 
 * Usage:
 *   npm run validate:setup
 *   node validate-setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

/**
 * Helper: Check if file exists
 */
function checkFile(filePath, name) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${name}`);
    checks.passed++;
    return true;
  } else {
    console.log(`❌ ${name} - NOT FOUND`);
    checks.failed++;
    checks.errors.push(`Missing: ${name} at ${filePath}`);
    return false;
  }
}

/**
 * Helper: Check if directory exists
 */
function checkDir(dirPath, name) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    const files = fs.readdirSync(dirPath);
    console.log(`✅ ${name} (${files.length} items)`);
    checks.passed++;
    return true;
  } else {
    console.log(`❌ ${name} - NOT FOUND or not a directory`);
    checks.failed++;
    checks.errors.push(`Missing directory: ${name}`);
    return false;
  }
}

/**
 * Helper: Check file contents
 */
function checkFileContent(filePath, expectedText, name) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(expectedText)) {
      console.log(`✅ ${name}`);
      checks.passed++;
      return true;
    } else {
      console.log(`⚠️  ${name} - content not found`);
      checks.warnings++;
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} - ${error.message}`);
    checks.failed++;
    return false;
  }
}

/**
 * Helper: Check Node.js package
 */
function checkPackage(packageName) {
  try {
    require.resolve(packageName);
    console.log(`✅ ${packageName} installed`);
    checks.passed++;
    return true;
  } catch (error) {
    console.log(`⚠️  ${packageName} not installed`);
    checks.warnings++;
    return false;
  }
}

/**
 * Helper: Check command exists
 */
function checkCommand(command, name) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    console.log(`✅ ${name} available`);
    checks.passed++;
    return true;
  } catch (error) {
    console.log(`⚠️  ${name} not found`);
    checks.warnings++;
    return false;
  }
}

/**
 * Section: Core Files
 */
function validateCoreFiles() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📁 CORE FILES`);
  console.log(`${'='.repeat(60)}\n`);

  checkFile('./package.json', 'package.json');
  checkFile('./config/rarity-config.json', 'Rarity configuration');
  checkFile('./README.md', 'README.md');
  checkFile('./PRODUCTION_SETUP.md', 'PRODUCTION_SETUP.md');
  checkFile('./AWS_IPFS_GUIDE.md', 'AWS_IPFS_GUIDE.md');
  // Removed obsolete CLI_GUIDE.md reference
}

/**
 * Section: Utilities
 */
function validateUtilities() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔧 UTILITY MODULES`);
  console.log(`${'='.repeat(60)}\n`);

  checkFile('./src/utils/rarityEngine.js', 'Rarity Engine');
  checkFile('./src/utils/metadataGenerator.js', 'Metadata Generator');
  checkFile('./src/utils/rarityConfigLoader.js', 'Config Loader');
  checkFile('./src/utils/smartContractHelper.js', 'Smart Contract Helper');
}

/**
 * Section: Scripts
 */
function validateScripts() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📜 SCRIPTS`);
  console.log(`${'='.repeat(60)}\n`);

  checkFile('./scripts/generate-local.js', 'Local Generation Script');
  checkFile('./scripts/generate-metadata.js', 'Metadata Generation Script');
  checkFile('./scripts/upload-ipfs.js', 'IPFS Upload Script');
  checkFile('./scripts/lambda-handler.js', 'AWS Lambda Handler');
}

/**
 * Section: Layer Directories
 */
function validateLayers() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎨 LAYER DIRECTORIES`);
  console.log(`${'='.repeat(60)}\n`);

  const traits = ['face', 'hat', 'pants', 'shirt', 'shoes', 'socks'];
  let traitsReady = 0;

  traits.forEach(trait => {
    const layerPath = `./layers/${trait}`;
    if (checkDir(layerPath, `${trait.charAt(0).toUpperCase() + trait.slice(1)} layer`)) {
      const files = fs.readdirSync(layerPath);
      const pngFiles = files.filter(f => f.endsWith('.png'));
      
      if (pngFiles.length === 0) {
        console.log(`   ⚠️  No PNG images found - ready for images`);
        checks.warnings++;
      } else if (pngFiles.length === 26) {
        console.log(`   ✅ All 26 variants present`);
        traitsReady++;
      } else {
        console.log(`   ⚠️  ${pngFiles.length}/26 variants found`);
        checks.warnings++;
      }
    }
  });

  if (traitsReady === 6) {
    console.log(`\n✅ All traits ready for generation`);
  } else if (traitsReady === 0) {
    console.log(`\n⚠️  No trait images yet - ready to add your images`);
  } else {
    console.log(`\n⚠️  ${traitsReady}/6 traits have images`);
  }
}

/**
 * Section: Output Directories
 */
function validateOutputDirs() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 OUTPUT DIRECTORIES`);
  console.log(`${'='.repeat(60)}\n`);

  checkDir('./output', 'Output directory');
  checkDir('./output/nfts-final', 'NFTs output directory (cleaned)');
  
  const nftFiles = fs.readdirSync('./output/nfts-final');
  if (nftFiles.length === 0) {
    console.log(`✅ Ready for NFT generation (empty)`);
    checks.passed++;
  } else {
    console.log(`⚠️  ${nftFiles.length} files present`);
    checks.warnings++;
  }
}

/**
 * Section: Smart Contract
 */
function validateSmartContract() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`⛓️  SMART CONTRACT`);
  console.log(`${'='.repeat(60)}\n`);

  checkFile('./smart-contract/RarityNFT.sol', 'RarityNFT.sol');
  checkFile('./smart-contract/package.json', 'Smart contract package.json');
  checkFile('./smart-contract/hardhat.config.js', 'Hardhat configuration');
  checkFile('./smart-contract/DEPLOYMENT_GUIDE.md', 'Deployment guide');
}

/**
 * Section: Configuration
 */
function validateConfiguration() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`⚙️  CONFIGURATION`);
  console.log(`${'='.repeat(60)}\n`);

  // Check rarity config structure
  try {
    const config = JSON.parse(fs.readFileSync('./config/rarity-config.json', 'utf8'));

    // Verify tier structure
    const tiers = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'];
    let allTiersPresent = true;

    tiers.forEach(tierId => {
      const tier = config.tiers && config.tiers.find(t => t.id === tierId);
      if (tier) {
        console.log(`✅ Tier ${tierId}: quota=${tier.quota}, range=${tier.scoreRange.join('-')}`);
        checks.passed++;
      } else {
        console.log(`❌ Tier ${tierId} missing`);
        checks.failed++;
        allTiersPresent = false;
      }
    });

    // Verify total quota
    let totalQuota = 0;
    config.tiers && config.tiers.forEach(tier => {
      totalQuota += tier.quota;
    });

    if (totalQuota === 10000) {
      console.log(`\n✅ Total quota: ${totalQuota} (correct)`);
      checks.passed++;
    } else {
      console.log(`\n❌ Total quota: ${totalQuota} (should be 10,000)`);
      checks.failed++;
    }

    // Verify traits
    const traits = ['socks', 'shoes', 'pants', 'shirt', 'face', 'hat'];
    if (config.traits && Object.keys(config.traits).length === 6) {
      console.log(`✅ All 6 traits defined`);
      checks.passed++;
      
      traits.forEach(trait => {
        if (config.traits[trait] && config.traits[trait].length === 26) {
          console.log(`   ✅ ${trait}: 26 variants`);
          checks.passed++;
        } else {
          console.log(`   ❌ ${trait}: ${config.traits[trait]?.length || 0} variants (should be 26)`);
          checks.failed++;
        }
      });
    } else {
      console.log(`❌ Traits missing`);
      checks.failed++;
    }
  } catch (error) {
    console.log(`❌ Error reading configuration: ${error.message}`);
    checks.failed++;
  }
}

/**
 * Section: Node.js and Dependencies
 */
function validateEnvironment() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🌍 ENVIRONMENT`);
  console.log(`${'='.repeat(60)}\n`);

  // Check Node.js
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    console.log(`✅ Node.js ${nodeVersion}`);
    checks.passed++;
  } catch (error) {
    console.log(`❌ Node.js not found`);
    checks.failed++;
  }

  // Check npm
  try {
    const npmVersion = execSync('npm --version').toString().trim();
    console.log(`✅ npm ${npmVersion}`);
    checks.passed++;
  } catch (error) {
    console.log(`❌ npm not found`);
    checks.failed++;
  }

  // Check package installation
  checkPackage('react');
  checkPackage('electron');
}

/**
 * Section: Package.json Scripts
 */
function validateScriptsInPackage() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 NPM SCRIPTS`);
  console.log(`${'='.repeat(60)}\n`);

  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  const requiredScripts = [
    'generate:local',
    'generate:metadata',
    'upload:ipfs',
    'generate:full',
    'workflow:local'
  ];

  requiredScripts.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
      console.log(`✅ npm run ${script}`);
      checks.passed++;
    } else {
      console.log(`❌ npm run ${script} not defined`);
      checks.failed++;
    }
  });
}

/**
 * Generate final report
 */
function generateReport() {
  const total = checks.passed + checks.failed;
  const passRate = ((checks.passed / total) * 100).toFixed(1);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 VALIDATION SUMMARY`);
  console.log(`${'='.repeat(60)}\n`);

  console.log(`✅ Passed: ${checks.passed}`);
  console.log(`❌ Failed: ${checks.failed}`);
  console.log(`⚠️  Warnings: ${checks.warnings}`);
  console.log(`📊 Pass rate: ${passRate}%\n`);

  if (checks.failed > 0) {
    console.log(`🚨 ERRORS:`);
    checks.errors.slice(0, 10).forEach(error => {
      console.log(`   - ${error}`);
    });
    if (checks.errors.length > 10) {
      console.log(`   ... and ${checks.errors.length - 10} more`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 NEXT STEPS`);
  console.log(`${'='.repeat(60)}\n`);

  if (checks.failed === 0) {
    console.log(`✅ System is ready for NFT generation!\n`);
    console.log(`1. Add trait images to /layers/{trait}/ (26 each, PNG format)`);
    console.log(`2. Run: npm run generate:local`);
    console.log(`3. Run: npm run generate:metadata`);
    console.log(`3. Run: npm run upload:ipfs -- --token=YOUR_NFT_STORAGE_TOKEN`);
    console.log(`5. Deploy smart contract with IPFS hash\n`);
  } else {
    console.log(`⚠️  Please fix the errors above before proceeding\n`);
    console.log(`Missing files or configuration issues detected.\n`);
  }

  console.log(`\n📖 Documentation:`);
  console.log(`   - START_HERE.md - Where to begin`);
  console.log(`   - SETUP_GUIDE.md - Full step-by-step guide`);
  console.log(`   - QUICKSTART.md - 4 essential commands`);
  console.log(`   - AWS_IPFS_GUIDE.md - AWS generation + IPFS`);
  console.log(`   - METADATA_TEMPLATE.md - Metadata format\n`);
}

/**
 * Main validation flow
 */
function runValidation() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 NFT GENERATION SYSTEM VALIDATOR`);
  console.log(`${'='.repeat(60)}`);

  validateCoreFiles();
  validateUtilities();
  validateScripts();
  validateLayers();
  validateOutputDirs();
  validateSmartContract();
  validateConfiguration();
  validateEnvironment();
  validateScriptsInPackage();
  generateReport();

  process.exit(checks.failed > 0 ? 1 : 0);
}

// Run validation
runValidation();
