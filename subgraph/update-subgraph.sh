#!/bin/bash

# Auto-update subgraph after contract deployment
# Usage: ./update-subgraph.sh <ProfileManager_Address>

if [ -z "$1" ]; then
    echo "Usage: ./update-subgraph.sh <ProfileManager_Address>"
    exit 1
fi

PROFILE_MANAGER_ADDRESS=$1
SUBGRAPH_DIR="$(dirname "$0")"

echo "🔄 Updating subgraph with ProfileManager address: $PROFILE_MANAGER_ADDRESS"

# Update subgraph.yaml with new contract address
sed -i "s/address: \".*\"/address: \"$PROFILE_MANAGER_ADDRESS\"/" "$SUBGRAPH_DIR/subgraph.yaml"

echo "✅ Updated subgraph.yaml with contract address"

# Generate types
echo "📦 Generating subgraph types..."
graph codegen

# Build subgraph
echo "🔨 Building subgraph..."
graph build

echo "🎉 Subgraph updated and built successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Deploy to The Graph Studio: graph deploy --studio zk-digilocker"
echo "2. Update frontend GraphQL endpoint"
echo "3. Test queries in GraphiQL playground"