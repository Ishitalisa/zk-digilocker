const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting ZK DigiLocker contract deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  // 1. Deploy PassportProofVerifier first
  console.log("\n📋 Step 1: Deploying PassportProofVerifier...");
  const PassportProofVerifier = await ethers.getContractFactory("PassportProofVerifier");
  const verifier = await PassportProofVerifier.deploy();
  await verifier.deployed();
  
  console.log("✅ PassportProofVerifier deployed to:", verifier.address);
  console.log("   Transaction hash:", verifier.deployTransaction.hash);
  
  deploymentInfo.contracts.PassportProofVerifier = {
    address: verifier.address,
    transactionHash: verifier.deployTransaction.hash
  };

  // 2. Deploy ProfileManager with verifier address
  console.log("\n👤 Step 2: Deploying ProfileManager...");
  const ProfileManager = await ethers.getContractFactory("ProfileManager");
  const profileManager = await ProfileManager.deploy(verifier.address);
  await profileManager.deployed();
  
  console.log("✅ ProfileManager deployed to:", profileManager.address);
  console.log("   Transaction hash:", profileManager.deployTransaction.hash);
  console.log("   Linked to verifier:", verifier.address);
  
  deploymentInfo.contracts.ProfileManager = {
    address: profileManager.address,
    transactionHash: profileManager.deployTransaction.hash,
    verifierAddress: verifier.address
  };

  // 3. Verify contracts on Etherscan (if not localhost)
  if (deploymentInfo.network.chainId !== 31337) {
    console.log("\n🔍 Step 3: Verifying contracts on Etherscan...");
    
    try {
      // Wait a bit for Etherscan to index
      console.log("Waiting 30 seconds for Etherscan indexing...");
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      await hre.run("verify:verify", {
        address: verifier.address,
        constructorArguments: []
      });
      console.log("✅ PassportProofVerifier verified on Etherscan");
      
      await hre.run("verify:verify", {
        address: profileManager.address,
        constructorArguments: [verifier.address]
      });
      console.log("✅ ProfileManager verified on Etherscan");
      
    } catch (error) {
      console.log("⚠️  Etherscan verification failed:", error.message);
      console.log("   You can verify manually later");
    }
  }

  // 4. Save deployment information
  const deploymentPath = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  const filename = `deployment-${deploymentInfo.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentPath, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  
  // Also update the main deployment.json
  const mainDeploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(mainDeploymentPath, JSON.stringify(deploymentInfo, null, 2));

  // 5. Generate frontend config
  const frontendConfig = {
    PROFILE_MANAGER_ADDRESS: profileManager.address,
    PASSPORT_VERIFIER_ADDRESS: verifier.address,
    NETWORK: deploymentInfo.network.name,
    CHAIN_ID: deploymentInfo.network.chainId
  };
  
  const configPath = path.join(__dirname, "..", "..", "frontend", "src", "config", "contracts.json");
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(frontendConfig, null, 2));

  console.log("\n🎉 Deployment Complete!");
  console.log("📋 Summary:");
  console.log(`   Network: ${deploymentInfo.network.name} (Chain ID: ${deploymentInfo.network.chainId})`);
  console.log(`   PassportProofVerifier: ${verifier.address}`);
  console.log(`   ProfileManager: ${profileManager.address}`);
  console.log(`   Deployment info saved: ${filepath}`);
  console.log(`   Frontend config updated: ${configPath}`);
  
  console.log("\n📝 Next Steps:");
  console.log("1. Update subgraph/subgraph.yaml with ProfileManager address");
  console.log("2. Deploy subgraph to The Graph Studio");
  console.log("3. Update frontend environment variables");
  console.log("4. Test the complete flow");
  
  console.log("\n🔗 Update These Files:");
  console.log(`   subgraph/subgraph.yaml: address: "${profileManager.address}"`);
  console.log(`   frontend/.env: VITE_PROFILE_MANAGER_ADDRESS="${profileManager.address}"`);
  
  return {
    verifier: verifier.address,
    profileManager: profileManager.address,
    deploymentInfo
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });