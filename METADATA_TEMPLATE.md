# NFT Metadata Structure & Standards

## OpenSea & Magic Eden Compliant Metadata Format

This document defines the metadata structure for your NFT collection that complies with both OpenSea and Magic Eden standards.

### Standard Metadata JSON Structure

Each NFT will have a corresponding JSON metadata file following this structure:

```json
{
  "name": "NFT #1",
  "description": "Your collection description here",
  "image": "ipfs://YOUR_IPFS_HASH/images/1.png",
  "external_url": "https://yourwebsite.com/nft/1",
  "attributes": [
    {
      "trait_type": "socks",
      "value": "Socks_01",
      "rarity": {
        "tier": "T1",
        "tier_name": "Minimal",
        "rarity_score": 7,
        "rarity_rank": "Ultra Rare"
      }
    },
    {
      "trait_type": "shoes",
      "value": "Shoes_02",
      "rarity": {
        "tier": "T2",
        "tier_name": "Low",
        "rarity_score": 10,
        "rarity_rank": "Very Rare"
      }
    },
    {
      "trait_type": "pants",
      "value": "Pants_05",
      "rarity": {
        "tier": "T4",
        "tier_name": "Moderate",
        "rarity_score": 17,
        "rarity_rank": "Uncommon"
      }
    },
    {
      "trait_type": "shirt",
      "value": "Shirt_10",
      "rarity": {
        "tier": "T5",
        "tier_name": "Common",
        "rarity_score": 24,
        "rarity_rank": "Common"
      }
    },
    {
      "trait_type": "face",
      "value": "Face_15",
      "rarity": {
        "tier": "T5",
        "tier_name": "Common",
        "rarity_score": 24,
        "rarity_rank": "Common"
      }
    },
    {
      "trait_type": "hat",
      "value": "Hat_22",
      "rarity": {
        "tier": "T6",
        "tier_name": "AboveAverage",
        "rarity_score": 31,
        "rarity_rank": "Uncommon"
      }
    }
  ],
  "properties": {
    "overall_rarity_score": 113,
    "overall_tier": "T5",
    "overall_tier_name": "Common",
    "generation_number": 1,
    "generated_at": "2025-11-16T12:00:00Z"
  }
}
```

### Metadata Fields Explained

#### Core Fields (Required)
- **name**: Display name of the NFT (e.g., "NFT #1")
- **description**: Collection description visible on marketplaces
- **image**: IPFS URL pointing to the generated image
- **external_url**: Link to your project website or detail page
- **attributes**: Array of trait objects

#### Attributes Object (Per Trait)
- **trait_type**: The trait category (socks, shoes, pants, shirt, face, hat)
- **value**: The specific variant selected (e.g., "Socks_01")
- **rarity**: Optional rarity metadata object containing:
  - **tier**: Tier ID (T1-T9)
  - **tier_name**: Human-readable tier name
  - **rarity_score**: Individual trait point value
  - **rarity_rank**: Display rank for collectors

#### Properties Object (Collection-Wide Metadata)
- **overall_rarity_score**: Sum of all trait points (42-270)
- **overall_tier**: Which tier this NFT belongs to
- **overall_tier_name**: Human-readable tier name
- **generation_number**: Sequential generation batch number
- **generated_at**: ISO 8601 timestamp of generation

### Bell Curve Tier System Reference

```
T1: Minimal         (Score: 42)      - Ultra Rare    - 10 NFTs
T2: Low             (Score: 60)      - Very Rare     - 100 NFTs
T3: BelowAverage    (Score: 78-84)   - Rare          - 500 NFTs
T4: Moderate        (Score: 102-132) - Uncommon      - 2,390 NFTs
T5: Common          (Score: 144-174) - Common        - 4,000 NFTs (Peak)
T6: AboveAverage    (Score: 186-216) - Uncommon      - 2,390 NFTs
T7: High            (Score: 228-234) - Rare          - 500 NFTs
T8: Peak            (Score: 252)     - Very Rare     - 100 NFTs
T9: Maximal         (Score: 270)     - Ultra Rare    - 10 NFTs
```

### File Naming Convention

- **Metadata files**: `1.json`, `2.json`, `3.json` ... `10000.json`
- **Image files**: `1.png`, `2.png`, `3.png` ... `10000.png`
- **Collection summary**: `collection.json`

### Collection Summary File (Optional)

```json
{
  "name": "Your NFT Collection Name",
  "description": "Your collection description",
  "image": "ipfs://YOUR_IPFS_HASH/collection.png",
  "external_url": "https://yourwebsite.com",
  "total_supply": 10000,
  "tiers": [
    {
      "tier_id": "T1",
      "tier_name": "Minimal",
      "total_count": 10,
      "score_range": [42, 42]
    },
    ...
  ],
  "traits": [
    {
      "name": "socks",
      "variants_count": 26
    },
    ...
  ],
  "generated_at": "2025-11-16T12:00:00Z"
}
```

### Integration with Smart Contract

Metadata should be accessible at:
```
https://ipfs.io/ipfs/YOUR_IPFS_HASH/metadata/{tokenId}.json
```

Your smart contract should point to this base URI.

### Marketplace Compatibility

✅ **OpenSea** - Fully compliant
- Reads attributes array
- Supports external_url
- Displays image from IPFS

✅ **Magic Eden** - Fully compliant
- Reads attributes array
- Supports custom metadata fields
- Displays image from IPFS

✅ **Other Marketplaces** - Generally compatible
- Standard metadata follows ERC-1155/721 conventions
- Custom rarity fields are preserved but may not be displayed

---

**Note**: Do NOT store metadata in /output/nfts-final/ until ready for IPFS upload. Keep the generation logic and configuration files separate from generated metadata.
