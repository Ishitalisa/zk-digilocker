#!/bin/bash

# ZK DigiLocker Subgraph Deployment Script

echo "🚀 Deploying ZK DigiLocker Subgraph..."

# Check if contract addresses are set
if grep -q "PROFILE_MANAGER_CONTRACT_ADDRESS" subgraph.yaml; then
    echo "❌ Please update contract addresses in subgraph.yaml first!"
    echo "   Replace PROFILE_MANAGER_CONTRACT_ADDRESS with actual deployed address"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate code from schema and ABI
echo "🔧 Generating code..."
npx graph codegen

# Build subgraph
echo "🏗️  Building subgraph..."
npx graph build

# Deploy to hosted service
echo "🌐 Deploying to The Graph hosted service..."
echo "   Using deploy key: $GRAPH_DEPLOY_KEY"

npx graph deploy \
  --product hosted-service \
  --deploy-key $GRAPH_DEPLOY_KEY \
  ishitalisa/zk-digilocker

echo "✅ Subgraph deployed successfully!"
echo "📊 GraphQL endpoint: https://api.thegraph.com/subgraphs/name/ishitalisa/zk-digilocker"