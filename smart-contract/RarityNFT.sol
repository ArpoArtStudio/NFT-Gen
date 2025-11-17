/**
 * Rarity-Based NFT Smart Contract
 * ================================
 * 
 * A sophisticated ERC-721 NFT contract with:
 * - 9-tier rarity system (T1-T9) with bell curve distribution
 * - Point-based scoring (42-270 per NFT)
 * - Tier-based metadata integration
 * - Query functions for rarity information
 * - Efficient storage of rarity data on-chain
 * 
 * Collection Details:
 * - Total Supply: 10,000 NFTs
 * - Tiers: T1 (10), T2 (100), T3 (500), T4 (2390), T5 (4000), T6 (2390), T7 (500), T8 (100), T9 (10)
 * - Point Ranges: 42-270 (T5 = 144-174, center of distribution)
 * - Traits: 6 (socks, shoes, pants, shirt, face, hat)
 */

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract RarityNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // ========================================================================
    // RARITY SYSTEM CONSTANTS
    // ========================================================================

    // Tier definitions
    enum RarityTier { T1, T2, T3, T4, T5, T6, T7, T8, T9 }

    // Tier names for display
    string[9] public tierNames = [
        "Minimal",      // T1
        "Low",          // T2
        "BelowAverage", // T3
        "Moderate",     // T4
        "Common",       // T5
        "AboveAverage", // T6
        "High",         // T7
        "Peak",         // T8
        "Maximal"       // T9
    ];

    // Tier quotas (must sum to 10,000)
    uint16[9] public tierQuotas = [10, 100, 500, 2390, 4000, 2390, 500, 100, 10];

    // Tier score ranges [min, max]
    uint16[9][2] public tierScoreRanges = [
        [42, 42],       // T1
        [60, 60],       // T2
        [78, 84],       // T3
        [102, 132],     // T4
        [144, 174],     // T5
        [186, 216],     // T6
        [228, 234],     // T7
        [252, 252],     // T8
        [270, 270]      // T9
    ];

    // ========================================================================
    // DATA STRUCTURES
    // ========================================================================

    struct RarityData {
        RarityTier tier;           // 3 bits (values 0-8)
        uint16 totalPoints;        // 9 bits (values 42-270)
        uint8 socksPoints;         // 6 bits (values 7-45)
        uint8 shoesPoints;         // 6 bits (values 7-45)
        uint8 pantsPoints;         // 6 bits (values 7-45)
        uint8 shirtPoints;         // 6 bits (values 7-45)
        uint8 facePoints;          // 6 bits (values 7-45)
        uint8 hatPoints;           // 6 bits (values 7-45)
    }

    // ========================================================================
    // STATE VARIABLES
    // ========================================================================

    mapping(uint256 => RarityData) public tokenRarity;
    mapping(RarityTier => uint16) public tierSupply;
    mapping(RarityTier => uint16) public tierMinted;

    uint256 public constant MAX_SUPPLY = 10000;
    string public baseURI;

    /**
     * NOTE: Set baseURI to the METADATA CID directory, not the images CID.
     * Example: baseURI = "ipfs://{METADATA_CID}/" so tokenURI returns
     * ipfs://{METADATA_CID}/{tokenId}.json where each JSON has image pointing to
     * ipfs://{IMAGES_CID}/{tokenId}.png
     */

    // Events
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed to,
        RarityTier tier,
        uint16 totalPoints
    );

    event TierQuotaUpdate(
        RarityTier tier,
        uint16 minted,
        uint16 quota
    );

    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================

    constructor(string memory initialBaseURI) ERC721("RarityNFT", "RNFT") {
        baseURI = initialBaseURI;
        
        // Initialize tier supplies
        for (uint8 i = 0; i < 9; i++) {
            tierSupply[RarityTier(i)] = tierQuotas[i];
        }
    }

    // ========================================================================
    // MINTING FUNCTIONS
    // ========================================================================

    /**
     * Mint a single rarity NFT with all trait data
     * Called by the generation system (off-chain)
     */
    function mintRarityNFT(
        address to,
        RarityTier tier,
        uint16 totalPoints,
        uint8 socksPoints,
        uint8 shoesPoints,
        uint8 pantsPoints,
        uint8 shirtPoints,
        uint8 facePoints,
        uint8 hatPoints,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        require(totalSupply() < MAX_SUPPLY, "Max supply reached");
        require(tierMinted[tier] < tierSupply[tier], "Tier quota exceeded");
        require(
            totalPoints == socksPoints + shoesPoints + pantsPoints + shirtPoints + facePoints + hatPoints,
            "Invalid point total"
        );
        require(
            totalPoints >= tierScoreRanges[uint8(tier)][0] && 
            totalPoints <= tierScoreRanges[uint8(tier)][1],
            "Points not in tier range"
        );

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        tierMinted[tier]++;

        // Store rarity data
        tokenRarity[tokenId] = RarityData({
            tier: tier,
            totalPoints: totalPoints,
            socksPoints: socksPoints,
            shoesPoints: shoesPoints,
            pantsPoints: pantsPoints,
            shirtPoints: shirtPoints,
            facePoints: facePoints,
            hatPoints: hatPoints
        });

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit NFTMinted(tokenId, to, tier, totalPoints);
        emit TierQuotaUpdate(tier, tierMinted[tier], tierSupply[tier]);

        return tokenId;
    }

    /**
     * Batch mint for efficiency (gas optimization)
     */
    function batchMintRarityNFTs(
        address to,
        RarityData[] calldata rarityDataArray,
        string[] calldata tokenURIs
    ) public onlyOwner {
        require(rarityDataArray.length == tokenURIs.length, "Array length mismatch");
        require(totalSupply() + rarityDataArray.length <= MAX_SUPPLY, "Exceeds max supply");

        for (uint256 i = 0; i < rarityDataArray.length; i++) {
            RarityData calldata data = rarityDataArray[i];
            
            require(
                tierMinted[data.tier] < tierSupply[data.tier],
                "Tier quota exceeded"
            );
            require(
                data.totalPoints >= tierScoreRanges[uint8(data.tier)][0] &&
                data.totalPoints <= tierScoreRanges[uint8(data.tier)][1],
                "Points not in tier range"
            );

            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            tierMinted[data.tier]++;

            tokenRarity[tokenId] = data;
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);

            emit NFTMinted(tokenId, to, data.tier, data.totalPoints);
        }
    }

    // ========================================================================
    // RARITY QUERY FUNCTIONS
    // ========================================================================

    /**
     * Get the rarity tier of a token (readable string)
     */
    function getTierName(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        RarityTier tier = tokenRarity[tokenId].tier;
        return tierNames[uint8(tier)];
    }

    /**
     * Get the rarity tier ID (0-8)
     */
    function getTierID(uint256 tokenId) public view returns (uint8) {
        require(_exists(tokenId), "Token does not exist");
        return uint8(tokenRarity[tokenId].tier);
    }

    /**
     * Get total points for a token
     */
    function getTotalPoints(uint256 tokenId) public view returns (uint16) {
        require(_exists(tokenId), "Token does not exist");
        return tokenRarity[tokenId].totalPoints;
    }

    /**
     * Get all trait points for a token
     */
    function getTraitPoints(uint256 tokenId)
        public
        view
        returns (
            uint8 socks,
            uint8 shoes,
            uint8 pants,
            uint8 shirt,
            uint8 face,
            uint8 hat
        )
    {
        require(_exists(tokenId), "Token does not exist");
        RarityData memory data = tokenRarity[tokenId];
        return (
            data.socksPoints,
            data.shoesPoints,
            data.pantsPoints,
            data.shirtPoints,
            data.facePoints,
            data.hatPoints
        );
    }

    /**
     * Get complete rarity data for a token
     */
    function getRarityData(uint256 tokenId) public view returns (RarityData memory) {
        require(_exists(tokenId), "Token does not exist");
        return tokenRarity[tokenId];
    }

    /**
     * Get tier distribution statistics
     */
    function getTierStats(RarityTier tier)
        public
        view
        returns (
            string memory name,
            uint16 quota,
            uint16 minted,
            uint16 remaining,
            uint8 percentOfCollection
        )
    {
        uint8 tierId = uint8(tier);
        uint16 tierQuota = tierQuotas[tierId];
        uint16 tierMintedCount = tierMinted[tier];
        
        return (
            tierNames[tierId],
            tierQuota,
            tierMintedCount,
            tierQuota - tierMintedCount,
            uint8((tierQuota * 100) / 10000)
        );
    }

    /**
     * Get all tier statistics at once
     */
    function getAllTierStats()
        public
        view
        returns (
            string[9] memory names,
            uint16[9] memory quotas,
            uint16[9] memory minted,
            uint16[9] memory remaining
        )
    {
        for (uint8 i = 0; i < 9; i++) {
            RarityTier tier = RarityTier(i);
            names[i] = tierNames[i];
            quotas[i] = tierQuotas[i];
            minted[i] = tierMinted[tier];
            remaining[i] = tierQuotas[i] - tierMinted[tier];
        }
        return (names, quotas, minted, remaining);
    }

    /**
     * Get tokens by rarity tier
     */
    function getTokensByTier(RarityTier tier)
        public
        view
        returns (uint256[] memory)
    {
        uint256 balance = totalSupply();
        uint256[] memory tierTokens = new uint256[](tierMinted[tier]);
        uint256 index = 0;

        for (uint256 i = 0; i < balance; i++) {
            if (_exists(i) && tokenRarity[i].tier == tier) {
                tierTokens[index] = i;
                index++;
            }
        }

        return tierTokens;
    }

    /**
     * Get tokens in a score range (for rarity filters)
     */
    function getTokensByScoreRange(uint16 minScore, uint16 maxScore)
        public
        view
        returns (uint256[] memory)
    {
        uint256 balance = totalSupply();
        uint256[] memory matching = new uint256[](balance);
        uint256 count = 0;

        for (uint256 i = 0; i < balance; i++) {
            if (_exists(i)) {
                uint16 score = tokenRarity[i].totalPoints;
                if (score >= minScore && score <= maxScore) {
                    matching[count] = i;
                    count++;
                }
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = matching[i];
        }

        return result;
    }

    /**
     * Rarity index (normalized 0-10000, useful for sorting)
     * Lower tier numbers get higher rarity indices
     */
    function getRarityIndex(uint256 tokenId) public view returns (uint16) {
        require(_exists(tokenId), "Token does not exist");
        RarityData memory data = tokenRarity[tokenId];
        
        // Tier rarity weights (inverted - lower tier = higher rarity)
        uint16[9] memory tierWeights = [10000, 8000, 6000, 4000, 2000, 4000, 6000, 8000, 10000];
        
        uint16 tierWeight = tierWeights[uint8(data.tier)];
        uint16 pointWeight = (data.totalPoints / 270) * 1000;
        
        return (tierWeight + pointWeight) / 2;
    }

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================

    /**
     * Set base URI for metadata
     */
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
    }

    /**
     * Check if collection is fully minted
     */
    function isMintingComplete() public view returns (bool) {
        return totalSupply() == MAX_SUPPLY;
    }

    /**
     * Get remaining supply
     */
    function remainingSupply() public view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    /**
     * Get remaining supply for a tier
     */
    function remainingTierSupply(RarityTier tier) public view returns (uint16) {
        return tierSupply[tier] - tierMinted[tier];
    }

    // ========================================================================
    // INTERNAL OVERRIDES (Required by ERC721 extensions)
    // ========================================================================

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
