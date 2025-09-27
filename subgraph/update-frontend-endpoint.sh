#!/bin/bash
# Quick script to update frontend with The Graph endpoint after deployment
# Usage: ./update-frontend-endpoint.sh <GraphQL_Endpoint_URL>

if [ -z "$1" ]; then
    echo "Usage: ./update-frontend-endpoint.sh <GraphQL_Endpoint_URL>"
    echo "Example: ./update-frontend-endpoint.sh https://api.studio.thegraph.com/query/12345/zk-digilocker/v0.1.0"
    exit 1
fi

GRAPH_ENDPOINT=$1
FRONTEND_DIR="../frontend"

echo "🔄 Updating frontend with The Graph endpoint: $GRAPH_ENDPOINT"

# Update .env file
sed -i "s|VITE_GRAPH_ENDPOINT=.*|VITE_GRAPH_ENDPOINT=$GRAPH_ENDPOINT|" "$FRONTEND_DIR/.env"

# Update graphClient.js
sed -i "s|const GRAPH_ENDPOINT = '.*';|const GRAPH_ENDPOINT = '$GRAPH_ENDPOINT';|" "$FRONTEND_DIR/src/utils/graphClient.js"

echo "✅ Frontend updated with new GraphQL endpoint"
echo "📝 Next steps:"
echo "1. cd ../frontend"
echo "2. yarn dev"
echo "3. Test complete workflow!"