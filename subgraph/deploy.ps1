# PowerShell deployment script for Windows

Write-Host "🚀 Deploying ZK DigiLocker Subgraph..." -ForegroundColor Green

# Check if contract addresses are set
$subgraphContent = Get-Content "subgraph.yaml" -Raw
if ($subgraphContent -match "PROFILE_MANAGER_CONTRACT_ADDRESS") {
    Write-Host "❌ Please update contract addresses in subgraph.yaml first!" -ForegroundColor Red
    Write-Host "   Replace PROFILE_MANAGER_CONTRACT_ADDRESS with actual deployed address" -ForegroundColor Yellow
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

# Generate code from schema and ABI
Write-Host "🔧 Generating code..." -ForegroundColor Cyan
npx graph codegen

# Build subgraph
Write-Host "🏗️  Building subgraph..." -ForegroundColor Cyan
npx graph build

# Deploy to hosted service
Write-Host "🌐 Deploying to The Graph hosted service..." -ForegroundColor Cyan
Write-Host "   Using deploy key from environment" -ForegroundColor Gray

npx graph deploy --product hosted-service --deploy-key $env:GRAPH_DEPLOY_KEY ishitalisa/zk-digilocker

Write-Host "✅ Subgraph deployed successfully!" -ForegroundColor Green
Write-Host "📊 GraphQL endpoint: https://api.thegraph.com/subgraphs/name/ishitalisa/zk-digilocker" -ForegroundColor Blue