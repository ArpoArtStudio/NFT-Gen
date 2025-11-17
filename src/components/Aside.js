import { FiX } from "react-icons/fi";
import mask from "../assets/mask.png";
import { SortableItem, swapArrayPositions } from "react-sort-list";
import "./Aside.css";
import { useState } from "react";
const { createCanvas, loadImage } = require(`canvas`);

const { dialog } = window.require("@electron/remote");
const fs = window.require("fs");
const path = window.require("path");

// Import rarity engine components
const RarityEngine = require("../utils/rarityEngine");
const RarityConfigLoader = require("../utils/rarityConfigLoader");
const SmartContractHelper = require("../utils/smartContractHelper");

function Aside(props) {
  const canvas = createCanvas(props.config.width, props.config.height);
  const ctx = canvas.getContext("2d");
  var metadataList = [];
  var attributesList = [];
  var dnaList = new Set();

  const buildFolders = () => {
    if (fs.existsSync(path.join(props.config.outputPath, "build"))) {
      fs.rmdirSync(path.join(props.config.outputPath, "build"), {
        recursive: true,
      });
    }
    fs.mkdirSync(path.join(props.config.outputPath, "build"));
    fs.mkdirSync(path.join(props.config.outputPath, "build", "json"));
    fs.mkdirSync(path.join(props.config.outputPath, "build", "images"));
  };

  const swap = (dragIndex, dropIndex) => {
    let swappedFolders = swapArrayPositions(
      props.folderNames,
      dragIndex,
      dropIndex
    );

    props.setFolderNames([...swappedFolders]);
  };

  const input = (_label, _name, _initialValue, _type) => {
    return (
      <>
        <p className="aside_list_item_input_label">{_label}</p>
        <input
          type={_type || "text"}
          name={_name}
          className="aside_list_item_input"
          onChange={props.handleConfigChange}
          value={_initialValue}
        />
      </>
    );
  };

  const setPath = async (_field) => {
    let path = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (path.filePaths[0]) {
      props.setConfig({
        ...props.config,
        [_field]: path.filePaths[0],
      });
    }
  };

  const filterDNAOptions = (_dna) => {
    const dnaItems = _dna.split("-");
    const filteredDNA = dnaItems.filter((element) => {
      const query = /(\?.*$)/;
      const querystring = query.exec(element);
      if (!querystring) {
        return true;
      }
      const options = querystring[1].split("&").reduce((r, setting) => {
        const keyPairs = setting.split("=");
        return { ...r, [keyPairs[0]]: keyPairs[1] };
      }, []);

      return options.bypassDNA;
    });
    return filteredDNA.join("-");
  };

  const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
    const _filteredDNA = filterDNAOptions(_dna);
    return !_DnaList.has(_filteredDNA);
  };

  const createDna = (_layers) => {
    let randNum = [];
    _layers.forEach((layer) => {
      var totalWeight = 0;
      layer.elements.forEach((element) => {
        totalWeight += element.weight;
      });
      // number between 0 - totalWeight
      let random = Math.floor(Math.random() * totalWeight);
      for (var i = 0; i < layer.elements.length; i++) {
        // subtract the current weight from the random weight until we reach a sub zero value.
        random -= layer.elements[i].weight;
        if (random < 0) {
          return randNum.push(
            `${layer.elements[i].id}:${layer.elements[i].filename}`
          );
        }
      }
    });
    return randNum.join("-");
  };

  const removeQueryStrings = (_dna) => {
    const query = /(\?.*$)/;
    return _dna.replace(query, "");
  };

  const cleanDna = (_str) => {
    const withoutOptions = removeQueryStrings(_str);
    var dna = Number(withoutOptions.split(":").shift());
    return dna;
  };

  const constructLayerToDna = (_dna = "", _layers = []) => {
    let mappedDnaToLayers = _layers.map((layer, index) => {
      let selectedElement = layer.elements.find(
        (e) => e.id == cleanDna(_dna.split("-")[index])
      );
      return {
        name: layer.name,
        selectedElement: selectedElement,
      };
    });
    return mappedDnaToLayers;
  };

  const loadLayerImg = async (_layer) => {
    try {
      return new Promise(async (resolve) => {
        const image = await loadImage(`file://${_layer.selectedElement.path}`);
        resolve({ layer: _layer, loadedImage: image });
      });
    } catch (error) {
      console.error("Error loading image:", error);
    }
  };

  const addAttributes = (_element) => {
    let selectedElement = _element.layer.selectedElement;
    attributesList.push({
      trait_type: _element.layer.name,
      value: selectedElement.name,
    });
  };

  const drawElement = (_renderObject, _index) => {
    ctx.drawImage(
      _renderObject.loadedImage,
      0,
      0,
      props.config.width,
      props.config.height
    );

    addAttributes(_renderObject);
  };

  const saveImage = (_editionCount) => {
    const url = canvas.toDataURL("image/png");
    const base64Data = url.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(
      path.join(
        props.config.outputPath,
        "build",
        "images",
        `${_editionCount}.png`
      ),
      base64Data,
      "base64"
    );
  };

  const addMetadata = (_dna, _edition) => {
    let dateTime = Date.now();
    let tempMetadata = {
      name: `${props.config.name} #${_edition}`,
      description: props.config.description,
      image: `REPLACE/${_edition}.png`,
      edition: _edition,
      date: dateTime,
      attributes: attributesList,
      compiler: "HashLips Art Engine",
    };
    metadataList.push(tempMetadata);
    attributesList = [];
  };

  const saveMetaDataSingleFile = (_editionCount) => {
    let metadata = metadataList.find((meta) => meta.edition == _editionCount);
    fs.writeFileSync(
      path.join(
        props.config.outputPath,
        "build",
        "json",
        `${_editionCount}.json`
      ),
      JSON.stringify(metadata, null, 2)
    );
  };

  const writeMetaData = (_data) => {
    fs.writeFileSync(
      path.join(props.config.outputPath, "build", "json", `_metadata.json`),
      _data
    );
  };

  const startCreating = async () => {
    props.setProgress(0);
    let editionCount = 1;
    let failedCount = 0;
    while (editionCount <= props.config.supply) {
      let newDna = createDna(props.folderNames);
      if (isDnaUnique(dnaList, newDna)) {
        let results = constructLayerToDna(newDna, props.folderNames);
        let loadedElements = [];

        results.forEach((layer) => {
          loadedElements.push(loadLayerImg(layer));
        });

        await Promise.all(loadedElements).then((renderObjectArray) => {
          ctx.clearRect(0, 0, props.config.width, props.config.height);
          renderObjectArray.forEach((renderObject, index) => {
            drawElement(renderObject, index);
          });

          saveImage(editionCount);
          addMetadata(newDna, editionCount);
          saveMetaDataSingleFile(editionCount);
          console.log(`Created edition: ${editionCount}`);
        });
        dnaList.add(filterDNAOptions(newDna));
        editionCount++;
        props.setProgress(editionCount - 1);
      } else {
        console.log("DNA exists!");
        failedCount++;
        if (failedCount >= 1000) {
          console.log(
            `You need more layers or elements to grow your edition to ${props.config.supply} artworks!`
          );
          process.exit();
        }
      }
    }
    writeMetaData(JSON.stringify(metadataList, null, 2));
  };

  // Metadata ====================

  const updateMetadata = () => {
    let rawdata = fs.readFileSync(
      path.join(props.config.outputPath, "build", "json", `_metadata.json`)
    );
    let data = JSON.parse(rawdata);

    data.forEach((item) => {
      item.name = `${props.config.name} #${item.edition}`;
      item.description = props.config.description;
      item.image = `${props.config.baseUri}/${item.edition}.png`;

      fs.writeFileSync(
        path.join(
          props.config.outputPath,
          "build",
          "json",
          `${item.edition}.json`
        ),
        JSON.stringify(item, null, 2)
      );
    });

    fs.writeFileSync(
      path.join(props.config.outputPath, "build", "json", `_metadata.json`),
      JSON.stringify(data, null, 2)
    );

    console.log(`Updated baseUri for images to ===> ${props.config.baseUri}`);
    console.log(
      `Updated description for images to ===> ${props.config.description}`
    );
    console.log(`Updated name prefix for images to ===> ${props.config.name}`);
  };

  // New rarity-based generation system
  const startRarityBasedCreating = async () => {
    try {
      props.setProgress(0);
      props.setStatus("Loading rarity configuration...");
      
      // Load rarity configuration
      const configPath = path.join(process.cwd(), 'config', 'rarity-config.json');
      let rarityConfig;
      
      // Try multiple possible locations for the config file
      const possiblePaths = [
        configPath,
        path.join(props.config.outputPath, 'config', 'rarity-config.json'),
        path.join(__dirname, '..', '..', 'config', 'rarity-config.json'),
        path.join(process.resourcesPath, 'config', 'rarity-config.json')
      ];
      
      let configFound = false;
      for (const tryPath of possiblePaths) {
        try {
          if (fs.existsSync(tryPath)) {
            rarityConfig = RarityConfigLoader.loadRarityConfig(tryPath);
            console.log(`✅ Loaded rarity config from: ${tryPath}`);
            configFound = true;
            break;
          }
        } catch (error) {
          console.warn(`Failed to load config from ${tryPath}:`, error.message);
        }
      }
      
      if (!configFound) {
        throw new Error(`Rarity configuration file not found. Tried locations: ${possiblePaths.join(', ')}`);
      }
      
      // Initialize rarity engine
      const rarityEngine = new RarityEngine();
      rarityEngine.loadConfig(rarityConfig);
      
      // Log configuration summary
      RarityConfigLoader.logConfigSummary(rarityConfig);
      RarityConfigLoader.logTraitMapping(props.folderNames);
      
      props.setStatus("Generating NFTs with rarity constraints...");
      
      let editionCount = 1;
      let totalFailedAttempts = 0;
      const maxGlobalRetries = 10000;
      
      while (editionCount <= props.config.supply && totalFailedAttempts < maxGlobalRetries) {
        const generationResult = rarityEngine.generateNFT();
        
        if (generationResult.success) {
          try {
            // Map rarity variants to actual layer elements
            const mappedLayers = rarityEngine.mapVariantsToLayers(
              generationResult.variants,
              props.folderNames
            );
            
            // Load and render images
            let loadedElements = [];
            mappedLayers.forEach((layer) => {
              loadedElements.push(loadLayerImg(layer));
            });

            await Promise.all(loadedElements).then((renderObjectArray) => {
              ctx.clearRect(0, 0, props.config.width, props.config.height);
              renderObjectArray.forEach((renderObject, index) => {
                drawElement(renderObject, index);
              });

              saveImage(editionCount);
              
              // Enhanced metadata with rarity information
              addRarityMetadata(generationResult, editionCount);
              saveMetaDataSingleFile(editionCount);
              
              console.log(`Created edition: ${editionCount} (${generationResult.tierName}, Score: ${generationResult.score})`);
            });
            
            editionCount++;
            props.setProgress(editionCount - 1);
            
            // Log progress every 100 NFTs
            if ((editionCount - 1) % 100 === 0) {
              const status = rarityEngine.getGenerationStatus();
              console.log(`Progress: ${status.totalGenerated}/${status.collectionSize} (${status.progress.toFixed(1)}%)`);
              console.log('Tier status:', status.tierStatus.map(t => `${t.id}: ${t.remaining}/${t.originalQuota}`).join(', '));
            }
            
          } catch (renderError) {
            console.error(`Error rendering edition ${editionCount}:`, renderError);
            totalFailedAttempts++;
          }
        } else {
          console.warn(`Generation failed for edition ${editionCount}:`, generationResult.error);
          totalFailedAttempts++;
          
          if (totalFailedAttempts >= maxGlobalRetries) {
            props.setStatus(`Generation failed after ${maxGlobalRetries} attempts. Check tier quotas and variant availability.`);
            return;
          }
        }
      }
      
      // Validate final generation
      try {
        rarityEngine.validateFinalGeneration();
        console.log("✅ Generation completed successfully!");
        console.log("✅ All tier and variant quotas satisfied!");
        
        // Write final metadata
        writeMetaData(JSON.stringify(metadataList, null, 2));
        
        // Generate smart contract integration data
        console.log("🔗 Generating smart contract integration files...");
        SmartContractHelper.generateContractData(metadataList, props.config.outputPath);
        SmartContractHelper.generateCSV(metadataList, props.config.outputPath);
        
        // Final success message
        props.setStatus(`Successfully generated ${props.config.supply} NFTs with rarity constraints and smart contract data!`);
        
        // Log distribution summary
        const finalStatus = rarityEngine.getGenerationStatus();
        console.log("\n🎉 GENERATION COMPLETE!");
        console.log("📊 Final Distribution:");
        finalStatus.tierStatus.forEach(tier => {
          console.log(`  ${tier.id}: ${tier.originalQuota - tier.remaining}/${tier.originalQuota} NFTs`);
        });
        
      } catch (validationError) {
        console.error("❌ Generation validation failed:", validationError.message);
        props.setStatus(`Generation completed but validation failed: ${validationError.message}`);
      }
      
    } catch (error) {
      console.error("Error in rarity-based generation:", error);
      props.setStatus(`Rarity generation failed: ${error.message}`);
    }
  };

  // Enhanced metadata with rarity information and smart contract integration
  const addRarityMetadata = (generationResult, edition) => {
    let dateTime = Date.now();
    
    // Calculate total points for smart contract
    const totalPoints = generationResult.score;
    
    // Create contract-ready metadata
    let tempMetadata = {
      name: `${props.config.name} #${edition}`,
      description: props.config.description,
      image: `REPLACE/${edition}.png`,
      edition: edition,
      date: dateTime,
      attributes: [
        ...attributesList,
        {
          trait_type: "Rarity Tier",
          value: generationResult.tierName
        },
        {
          trait_type: "Rarity Score", 
          value: generationResult.score
        },
        {
          trait_type: "Tier ID",
          value: generationResult.tierId
        },
        {
          trait_type: "Total Points",
          value: totalPoints
        }
      ],
      // Smart contract integration fields
      rarityScore: generationResult.score,
      rarityTier: generationResult.tierName,
      tierId: generationResult.tierId,
      totalPoints: totalPoints, // Key field for smart contract
      
      // Individual trait points for verification
      traitPoints: generationResult.variants.reduce((acc, variant) => {
        acc[variant.trait] = variant.variant.points;
        return acc;
      }, {}),
      
      // Distribution weight (higher points = more distribution)
      distributionWeight: totalPoints,
      
      compiler: "HashLips Art Engine with Advanced Rarity System",
    };
    
    metadataList.push(tempMetadata);
    attributesList = [];
  };

  // Helper function to create example layer structure
  const createExampleLayerStructure = () => {
    try {
      const examplePath = path.join(props.config.inputPath, 'example_layers');
      
      if (!fs.existsSync(examplePath)) {
        fs.mkdirSync(examplePath, { recursive: true });
      }

      const traitFolders = ['01_Socks', '02_Shoes', '03_Pants', '04_Shirt', '05_Face', '06_Hat'];
      
      traitFolders.forEach(folderName => {
        const folderPath = path.join(examplePath, folderName);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath);
        }

        // Create example files (you would replace these with actual images)
        const traitName = folderName.split('_')[1];
        for (let i = 1; i <= 26; i++) {
          const fileName = `${traitName}_${String(i).padStart(2, '0')}.png`;
          const filePath = path.join(folderPath, fileName);
          
          if (!fs.existsSync(filePath)) {
            // Create a placeholder file (in real use, you'd have actual image files)
            fs.writeFileSync(filePath, 'placeholder');
          }
        }
      });

      props.setStatus(`Created example layer structure at: ${examplePath}`);
      console.log(`✅ Created example layer structure with 6 traits and 26 variants each`);
      
    } catch (error) {
      props.setStatus(`Error creating example structure: ${error.message}`);
      console.error('Error creating example layer structure:', error);
    }
  };

  const generate = () => {
    props.setStatus("");
    if (props.config.supply <= 0) {
      props.setStatus("Your need to increase the supply.");
      return;
    }
    console.log(props.folderNames);
    if (props.folderNames.length == 0) {
      props.setStatus(
        "Make sure to get the folder with only image files in them."
      );
      return;
    }
    buildFolders();
    
    // Choose generation method based on configuration
    if (props.config.useRarityEngine) {
      startRarityBasedCreating();
    } else {
      startCreating(); // Original generation method
    }
  };

  return (
    <aside className={`aside ${props.sideBarOpen && "active"}`}>
      <div className="aside_close-icon">
        <FiX onClick={() => props.toggleSideBar()} />
      </div>
      <div className="aside_list_title">
        <a
          className="aside_img_link"
          target="_blank"
          href="https://hashlips.online/HashLips"
        >
          <img src={mask} width="25" height="25" />
        </a>
        <p>Art Engine</p>
      </div>
      <ul className="aside_list">
        <details className="aside_list_item">
          <summary>Configuration</summary>
          <div>
            {input("Supply", "supply", props.config.supply, "number")}
            {input("Name", "name", props.config.name)}
            {input("Symbol", "symbol", props.config.symbol)}
            {input("Description", "description", props.config.description)}
            {input("Width", "width", props.config.width, "number")}
            {input("Height", "height", props.config.height, "number")}
            <p className="aside_list_item_input_label">Use Rarity Engine</p>
            <input
              type="checkbox"
              name="useRarityEngine"
              checked={props.config.useRarityEngine}
              onChange={(e) => props.setConfig({
                ...props.config,
                useRarityEngine: e.target.checked
              })}
              style={{ marginTop: 5 }}
            />
            <label style={{ marginLeft: 5, fontSize: '12px' }}>
              Enable tier-based rarity generation (requires rarity-config.json)
            </label>
          </div>
        </details>
        <details className="aside_list_item">
          <summary>Paths</summary>
          {input("Input Path", "inputPath", props.config.inputPath)}
          <button
            className="aside_list_item_button"
            onClick={() => setPath("inputPath")}
          >
            Set Input Path
          </button>
          {input("Output Path", "outputPath", props.config.outputPath)}
          <button
            className="aside_list_item_button"
            onClick={() => setPath("outputPath")}
          >
            Set Output Path
          </button>
        </details>
        <details className="aside_list_item">
          <summary>Layer order</summary>
          <p className="aside_list_item_input_label">Input folders</p>
          <button className="aside_list_item_button" onClick={props.getFolders}>
            Get Folders
          </button>
          {props.config.useRarityEngine && (
            <button 
              className="aside_list_item_button" 
              onClick={() => createExampleLayerStructure()}
              style={{marginTop: 5, backgroundColor: '#4CAF50'}}
            >
              Create Example Layer Structure
            </button>
          )}
          {props.folderNames.map((folder, index) => {
            return (
              <SortableItem
                items={props.folderNames}
                id={folder.id}
                key={folder.id}
                swap={swap}
              >
                <div className="aside_list_item_filename_container">
                  <p>{folder.name}</p>
                </div>
              </SortableItem>
            );
          })}
        </details>
        <details className="aside_list_item">
          <summary>Create</summary>
          <p className="aside_list_item_input_label">Images & Metadata</p>
          <button
            className="aside_list_item_button"
            onClick={async () => {
              generate();
            }}
          >
            Generate
          </button>
          {input("IPFS", "baseUri", props.config.baseUri)}
          <button
            className="aside_list_item_button"
            onClick={async () => {
              updateMetadata();
            }}
          >
            Update Metadata
          </button>
        </details>
      </ul>
    </aside>
  );
}

export default Aside;
