const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ZK DigiLocker contracts to Sepolia...");
  
  // Deploy PassportProofVerifier
  const PassportProofVerifier = await ethers.getContractFactory("PassportProofVerifier");
  const verifier = await PassportProofVerifier.deploy();
  await verifier.deployed();
  
  console.log("PassportProofVerifier deployed to:", verifier.address);
  
  // Deploy ProfileManager
  const ProfileManager = await ethers.getContractFactory("ProfileManager");
  const profileManager = await ProfileManager.deploy(verifier.address);
  await profileManager.deployed();
  
  console.log("ProfileManager deployed to:", profileManager.address);
  
  // Save deployment addresses
  const fs = require("fs");
  const deploymentInfo = {
    verifier: verifier.address,
    profileManager: profileManager.address,
    network: "sepolia",
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    "./deployments.json", 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("✅ Deployment complete!");
  console.log("Deployment info saved to deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });