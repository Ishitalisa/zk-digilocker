# 🚀 ZK DigiLocker Deployment Guide

## 📋 Prerequisites Checklist

- ✅ Circom circuits compiled (`build-circuit.ps1` completed)
- ✅ Node.js and Yarn installed
- ✅ Graph CLI installed (`npm install -g @graphprotocol/graph-cli`)
- ✅ Sepolia testnet ETH in your wallet
- ✅ Environment variables configured

## 🎯 Deployment Strategy: **2 Separate Contracts**

We'll deploy:
1. **PassportProofVerifier** - ZK proof verification
2. **ProfileManager** - ENS mapping and profile storage

**Why separate?** Better modularity, easier upgrades, gas optimization.

## 📝 Step-by-Step Deployment

### Step 1: Deploy Smart Contracts

```powershell
# Navigate to contracts directory
cd contracts

# Install dependencies (if not done)
npm install

# Deploy both contracts to Sepolia
npx hardhat run scripts/deploy-separate.js --network sepolia
```

**Expected Output:**
```
🚀 Starting ZK DigiLocker contract deployment...
Deploying with account: 0xYourAddress
Account balance: 1000000000000000000

📋 Step 1: Deploying PassportProofVerifier...
✅ PassportProofVerifier deployed to: 0xABC123...
   Transaction hash: 0xDEF456...

👤 Step 2: Deploying ProfileManager...
✅ ProfileManager deployed to: 0xGHI789...
   Transaction hash: 0xJKL012...
   Linked to verifier: 0xABC123...

🔍 Step 3: Verifying contracts on Etherscan...
✅ PassportProofVerifier verified on Etherscan
✅ ProfileManager verified on Etherscan

🎉 Deployment Complete!
📋 Summary:
   Network: sepolia (Chain ID: 11155111)
   PassportProofVerifier: 0xABC123...
   ProfileManager: 0xGHI789...

📝 Next Steps:
1. Update subgraph/subgraph.yaml with ProfileManager address
2. Deploy subgraph to The Graph Studio
3. Update frontend environment variables
4. Test the complete flow

🔗 Update These Files:
   subgraph/subgraph.yaml: address: "0xGHI789..."
   frontend/.env: VITE_PROFILE_MANAGER_ADDRESS="0xGHI789..."
```

**Save these addresses!** You'll need them for the next steps.

### Step 2: Update Subgraph Configuration

```powershell
# Navigate to subgraph directory
cd ..\subgraph

# Auto-update subgraph.yaml with contract address
.\update-subgraph.ps1 0xGHI789...  # Use your ProfileManager address
```

**Expected Output:**
```
🔄 Updating subgraph with ProfileManager address: 0xGHI789...
✅ Updated subgraph.yaml with contract address
📦 Generating subgraph types...
✅ Types generated successfully
🔨 Building subgraph...
✅ Subgraph built successfully

🎉 Subgraph updated and built successfully!

📝 Next steps:
1. Deploy to The Graph Studio: graph deploy --studio zk-digilocker
2. Update frontend GraphQL endpoint
3. Test queries in GraphiQL playground
```

### Step 3: Deploy Subgraph to The Graph Studio

```powershell
# Authenticate with The Graph (first time only)
graph auth --studio YOUR_GRAPH_API_KEY

# Deploy subgraph
graph deploy --studio zk-digilocker
```

**Expected Output:**
```
✔ Version Label (e.g. v0.0.1) · v0.1.0
  Skip migration: N
✔ Apply migrations
✔ Load subgraph from subgraph.yaml
  Compile data source: ProfileManager => build/ProfileManager/ProfileManager.wasm
✔ Compile subgraph
  Copy schema file build/schema.graphql
  Write subgraph file build/subgraph.yaml
  Write subgraph manifest build/subgraph.yaml
✔ Write compiled subgraph to build/
  Add file to IPFS build/schema.graphql
                .. QmWhatever...
  Add file to IPFS build/ProfileManager/ProfileManager.wasm
                .. QmAnother...
✔ Upload subgraph to IPFS

Build completed: QmYourSubgraphHash...

Deployed to https://thegraph.com/studio/subgraph/zk-digilocker

Subgraph endpoints:
Queries (HTTP):     https://api.studio.thegraph.com/query/XXXXX/zk-digilocker/v0.1.0
```

**Save the query endpoint!** You'll need it for the frontend.

### Step 4: Update Frontend Configuration

```powershell
# Navigate to frontend directory
cd ..\frontend

# Update environment variables
# Edit .env file with your deployed addresses
```

**Update `frontend/.env`:**
```env
# Contract addresses from deployment
VITE_PROFILE_MANAGER_ADDRESS=0xGHI789...
VITE_PASSPORT_VERIFIER_ADDRESS=0xABC123...

# The Graph endpoint from subgraph deployment
VITE_GRAPH_ENDPOINT=https://api.studio.thegraph.com/query/XXXXX/zk-digilocker/v0.1.0

# Your existing API keys
VITE_ALCHEMY_API_KEY=your_alchemy_key
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
VITE_ETHERSCAN_API_KEY=your_etherscan_key
```

**Update `frontend/src/utils/graphClient.js`:**
```javascript
// Update the endpoint with your deployed subgraph
const GRAPH_ENDPOINT = 'https://api.studio.thegraph.com/query/XXXXX/zk-digilocker/v0.1.0';
```

### Step 5: Install Frontend Dependencies

```powershell
# Install new GraphQL dependencies
yarn install

# Start development server
yarn dev
```

### Step 6: Test Complete Workflow

1. **Open frontend** (usually http://localhost:5173)
2. **Connect wallet** with Sepolia network
3. **Upload a test PDF** (any PDF file for testing)
4. **Complete verification flow**:
   - Extract data (will be mocked for testing)
   - Generate ZK proof (will be mocked for testing)
   - Choose ENS name
   - Submit to blockchain (**this will cost real Sepolia ETH**)
5. **Check transaction** on Sepolia Etherscan
6. **Wait 1-2 minutes** for The Graph indexing
7. **Test query** in The Graph Dashboard tab
8. **Search your ENS name** to verify data

## 🔍 Verification Checklist

### ✅ Contracts Deployed Successfully
- [ ] PassportProofVerifier deployed and verified
- [ ] ProfileManager deployed and verified  
- [ ] Both contracts appear on Sepolia Etherscan
- [ ] ProfileManager correctly linked to verifier

### ✅ Subgraph Deployed Successfully
- [ ] Subgraph.yaml updated with correct contract address
- [ ] Subgraph built without errors
- [ ] Subgraph deployed to The Graph Studio
- [ ] Query endpoint accessible

### ✅ Frontend Integration Working
- [ ] Contract addresses updated in environment
- [ ] The Graph endpoint updated
- [ ] Frontend starts without errors
- [ ] Wallet connection works on Sepolia

### ✅ Complete Flow Testing
- [ ] Document upload and processing works
- [ ] ZK proof generation completes
- [ ] Transaction submits to blockchain successfully
- [ ] Event is emitted and indexed by The Graph
- [ ] ENS name search returns correct verification data
- [ ] Privacy is preserved (no personal data exposed)

## 🚨 Troubleshooting

### Contract Deployment Issues
```powershell
# Check your Sepolia balance
npx hardhat run scripts/check-balance.js --network sepolia

# Verify network configuration in hardhat.config.js
# Ensure you have enough Sepolia ETH for deployment
```

### Subgraph Issues
```powershell
# Check subgraph logs in The Graph Studio
# Verify contract address in subgraph.yaml matches deployed address
# Ensure ABI matches deployed contract

# Re-build and redeploy if needed
graph codegen
graph build
graph deploy --studio zk-digilocker --version-label v0.1.1
```

### Frontend Issues
```powershell
# Clear build cache
yarn clean
yarn install

# Check environment variables are loaded
# Verify contract addresses match deployed contracts
# Check browser console for errors
```

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **Successful transaction** on Sepolia Etherscan
2. **Event emission** in transaction logs
3. **Subgraph indexing** in The Graph Studio dashboard
4. **Query results** in The Graph Dashboard tab
5. **ENS name search** returning verification data

## 📞 Support

If you encounter issues:
1. Check console logs and error messages
2. Verify all addresses and endpoints are correct
3. Ensure sufficient Sepolia ETH for transactions
4. Check The Graph Studio for subgraph status
5. Test individual components before full integration

## 🎯 Ready for Demo!

Once all steps are complete, your ZK DigiLocker is fully deployed and ready for:
- **Live demonstrations**
- **End-to-end testing**
- **Hackathon presentation**
- **Real user interactions**

The complete privacy-preserving document verification system is now live on Ethereum Sepolia with The Graph indexing! 🔐✨