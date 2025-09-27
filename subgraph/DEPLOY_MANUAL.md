# 🚀 Manual Subgraph Deployment Guide

## Prerequisites
1. **The Graph Studio Account**: Create account at https://thegraph.com/studio/
2. **Create Subgraph**: Create a new subgraph named "zk-digilocker"
3. **Get Deploy Key**: Copy your deploy key from The Graph Studio

## Step 1: Authenticate with Deploy Key
```powershell
# Replace YOUR_DEPLOY_KEY with your actual deploy key from The Graph Studio
graph auth YOUR_DEPLOY_KEY
```

## Step 2: Deploy Subgraph
```powershell
# Deploy to your subgraph in The Graph Studio
graph deploy --studio zk-digilocker
```

## Step 3: Follow Interactive Prompts
When prompted:
- **Version Label**: Enter `v0.1.0` (or any version you prefer)
- **Skip migrations**: Select `N` (No)

## Expected Output
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

## Step 4: Save the GraphQL Endpoint
Copy the "Queries (HTTP)" URL - you'll need this for the frontend!

## Alternative: Using Access Token
If you have issues with deploy key, you can also use:
```powershell
graph deploy --access-token YOUR_ACCESS_TOKEN --studio zk-digilocker
```

## Troubleshooting
- Make sure you're in the `subgraph` directory
- Ensure the subgraph builds successfully first: `graph build`
- Check that contract address in `subgraph.yaml` is correct
- Verify you have sufficient balance in The Graph Studio

## Next Steps After Deployment
1. Update frontend GraphQL endpoint
2. Test queries in The Graph Studio playground
3. Run complete end-to-end test