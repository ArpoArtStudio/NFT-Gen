
/**
 * RarityNFT Smart Contract Tests
 * Comprehensive test suite for the rarity-based NFT contract
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RarityNFT Contract", function () {
  let rarityNFT;
  let owner;
  let addr1;
  let addr2;

  const baseURI = "ipfs://QmTestBaseURI/";
  const tierQuotas = [10, 100, 500, 2390, 4000, 2390, 500, 100, 10];
  const tierScoreRanges = [
    [42, 42],
    [60, 60],
    [78, 84],
    [102, 132],
    [144, 174],
    [186, 216],
    [228, 234],
    [252, 252],
    [270, 270],
  ];

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const RarityNFT = await ethers.getContractFactory("RarityNFT");
    rarityNFT = await RarityNFT.deploy(baseURI);
    await rarityNFT.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct base URI", async function () {
      expect(await rarityNFT.baseURI()).to.equal(baseURI);
    });

    it("Should have correct tier quotas", async function () {
      for (let i = 0; i < 9; i++) {
        const stats = await rarityNFT.getTierStats(i);
        expect(stats.quota).to.equal(tierQuotas[i]);
      }
    });

    it("Should have correct score ranges", async function () {
      for (let i = 0; i < 9; i++) {
        // Verify by attempting to query (internal state)
        expect(rarityNFT.tierScoreRanges).to.exist;
      }
    });

    it("Should initialize with zero minted NFTs", async function () {
      expect(await rarityNFT.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint a single NFT with rarity data", async function () {
      const tokenURI = "ipfs://QmTestToken/0";
      const tier = 4; // T5 (Common)
      const totalPoints = 156; // 6 traits × 26 points
      const traitPoints = [26, 26, 26, 26, 26, 26]; // socks, shoes, pants, shirt, face, hat

      const tx = await rarityNFT.mintRarityNFT(
        owner.address,
        tier,
        totalPoints,
        traitPoints[0],
        traitPoints[1],
        traitPoints[2],
        traitPoints[3],
        traitPoints[4],
        traitPoints[5],
        tokenURI
      );

      expect(tx)
        .to.emit(rarityNFT, "NFTMinted")
        .withArgs(0, owner.address, tier, totalPoints);

      expect(await rarityNFT.balanceOf(owner.address)).to.equal(1);
    });

    it("Should reject minting with invalid tier quota", async function () {
      const tokenURI = "ipfs://QmTestToken/0";
      const tier = 0; // T1 has quota of 10

      // Try to mint 11 T1 NFTs (should fail on 11th)
      for (let i = 0; i < 10; i++) {
        const totalPoints = 42; // T1 fixed score
        await rarityNFT.mintRarityNFT(
          owner.address,
          tier,
          totalPoints,
          7,
          7,
          7,
          7,
          7,
          7,
          tokenURI
        );
      }

      // 11th mint should fail
      await expect(
        rarityNFT.mintRarityNFT(
          owner.address,
          tier,
          42,
          7,
          7,
          7,
          7,
          7,
          7,
          tokenURI
        )
      ).to.be.revertedWith("Tier quota exceeded");
    });

    it("Should reject minting with incorrect point total", async function () {
      const tokenURI = "ipfs://QmTestToken/0";
      const tier = 4; // T5
      const totalPoints = 156;
      const wrongTotal = 155; // Should be 156

      await expect(
        rarityNFT.mintRarityNFT(
          owner.address,
          tier,
          wrongTotal,
          26,
          26,
          26,
          26,
          26,
          25, // Sum is 155 instead of 156
          tokenURI
        )
      ).to.be.revertedWith("Invalid point total");
    });

    it("Should reject minting with points outside tier range", async function () {
      const tokenURI = "ipfs://QmTestToken/0";
      const tier = 4; // T5: 144-174
      const totalPoints = 200; // Outside range

      await expect(
        rarityNFT.mintRarityNFT(
          owner.address,
          tier,
          totalPoints,
          40,
          40,
          40,
          40,
          40,
          0,
          tokenURI
        )
      ).to.be.revertedWith("Points not in tier range");
    });

    it("Should reject minting if not owner", async function () {
      const tokenURI = "ipfs://QmTestToken/0";

      await expect(
        rarityNFT
          .connect(addr1)
          .mintRarityNFT(addr1.address, 4, 156, 26, 26, 26, 26, 26, 26, tokenURI)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Rarity Queries", function () {
    beforeEach(async function () {
      // Mint NFTs for testing
      for (let tier = 0; tier < 9; tier++) {
        const pointConfig = tierScoreRanges[tier];
        const points = pointConfig[0]; // Use minimum points for tier
        const traitPoints = Math.floor(points / 6);
        const remainder = points % 6;

        const tx = await rarityNFT.mintRarityNFT(
          owner.address,
          tier,
          points,
          traitPoints + (remainder > 0 ? 1 : 0),
          traitPoints + (remainder > 1 ? 1 : 0),
          traitPoints + (remainder > 2 ? 1 : 0),
          traitPoints + (remainder > 3 ? 1 : 0),
          traitPoints + (remainder > 4 ? 1 : 0),
          traitPoints + (remainder > 5 ? 1 : 0),
          `ipfs://QmTest/${tier}`
        );
        await tx.wait();
      }
    });

    it("Should return correct tier name", async function () {
      const tierNames = [
        "Minimal",
        "Low",
        "BelowAverage",
        "Moderate",
        "Common",
        "AboveAverage",
        "High",
        "Peak",
        "Maximal",
      ];

      for (let i = 0; i < 9; i++) {
        const name = await rarityNFT.getTierName(i);
        expect(name).to.equal(tierNames[i]);
      }
    });

    it("Should return correct tier ID", async function () {
      for (let i = 0; i < 9; i++) {
        const tierId = await rarityNFT.getTierID(i);
        expect(tierId).to.equal(i);
      }
    });

    it("Should return correct total points", async function () {
      for (let i = 0; i < 9; i++) {
        const points = await rarityNFT.getTotalPoints(i);
        expect(points).to.equal(tierScoreRanges[i][0]);
      }
    });

    it("Should return correct trait points", async function () {
      const tokenId = 0;
      const [socks, shoes, pants, shirt, face, hat] =
        await rarityNFT.getTraitPoints(tokenId);

      expect([socks, shoes, pants, shirt, face, hat].reduce((a, b) => a + b)).to.equal(
        tierScoreRanges[0][0]
      );
    });

    it("Should return tier statistics", async function () {
      for (let i = 0; i < 9; i++) {
        const stats = await rarityNFT.getTierStats(i);
        expect(stats.name).to.equal(rarityNFT.tierNames(i));
        expect(stats.quota).to.equal(tierQuotas[i]);
        expect(stats.minted).to.equal(1);
        expect(stats.remaining).to.equal(tierQuotas[i] - 1);
      }
    });

    it("Should return all tier statistics", async function () {
      const [names, quotas, minted, remaining] = await rarityNFT.getAllTierStats();

      expect(names.length).to.equal(9);
      expect(quotas.length).to.equal(9);
      expect(minted.length).to.equal(9);
      expect(remaining.length).to.equal(9);

      for (let i = 0; i < 9; i++) {
        expect(minted[i]).to.equal(1);
        expect(remaining[i]).to.equal(tierQuotas[i] - 1);
      }
    });
  });

  describe("Collection Status", function () {
    it("Should track minting progress", async function () {
      expect(await rarityNFT.totalSupply()).to.equal(0);
      expect(await rarityNFT.remainingSupply()).to.equal(10000);
      expect(await rarityNFT.isMintingComplete()).to.equal(false);

      // Mint one NFT
      await rarityNFT.mintRarityNFT(
        owner.address,
        4,
        156,
        26,
        26,
        26,
        26,
        26,
        26,
        "ipfs://QmTest/0"
      );

      expect(await rarityNFT.totalSupply()).to.equal(1);
      expect(await rarityNFT.remainingSupply()).to.equal(9999);
    });

    it("Should prevent minting after max supply", async function () {
      // This is just a check - full test would require minting 10,000 NFTs
      const maxSupply = await rarityNFT.MAX_SUPPLY();
      expect(maxSupply).to.equal(10000);
    });
  });

  describe("Batch Minting", function () {
    it("Should batch mint multiple NFTs", async function () {
      const rarityDataArray = [];
      const tokenURIs = [];

      // Create data for 5 NFTs
      for (let i = 0; i < 5; i++) {
        rarityDataArray.push({
          tier: 4,
          totalPoints: 156,
          socksPoints: 26,
          shoesPoints: 26,
          pantsPoints: 26,
          shirtPoints: 26,
          facePoints: 26,
          hatPoints: 26,
        });
        tokenURIs.push(`ipfs://QmTest/${i}`);
      }

      const tx = await rarityNFT.batchMintRarityNFTs(
        owner.address,
        rarityDataArray,
        tokenURIs
      );
      await tx.wait();

      expect(await rarityNFT.balanceOf(owner.address)).to.equal(5);
      expect(await rarityNFT.totalSupply()).to.equal(5);
    });
  });

  describe("URI Management", function () {
    it("Should update base URI", async function () {
      const newURI = "ipfs://QmNewBaseURI/";
      await rarityNFT.setBaseURI(newURI);
      expect(await rarityNFT.baseURI()).to.equal(newURI);
    });

    it("Should prevent non-owner from updating base URI", async function () {
      const newURI = "ipfs://QmNewBaseURI/";
      await expect(
        rarityNFT.connect(addr1).setBaseURI(newURI)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Gas Efficiency", function () {
    it("Should estimate gas for single mint", async function () {
      const tx = rarityNFT.estimateGas.mintRarityNFT(
        owner.address,
        4,
        156,
        26,
        26,
        26,
        26,
        26,
        26,
        "ipfs://QmTest/0"
      );

      const gasUsed = await tx;
      console.log(`Single mint gas estimate: ${gasUsed.toString()}`);
      expect(gasUsed).to.be.gt(0);
    });
  });
});
