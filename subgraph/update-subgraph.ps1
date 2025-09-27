# Auto-update subgraph after contract deployment (PowerShell)
# Usage: .\update-subgraph.ps1 <ProfileManager_Address>

param(
    [Parameter(Mandatory=$true)]
    [string]$ProfileManagerAddress
)

$SubgraphDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "🔄 Updating subgraph with ProfileManager address: $ProfileManagerAddress" -ForegroundColor Cyan

# Update subgraph.yaml with new contract address
$subgraphYaml = Join-Path $SubgraphDir "subgraph.yaml"
$content = Get-Content $subgraphYaml -Raw
$updatedContent = $content -replace 'address: ".*"', "address: `"$ProfileManagerAddress`""
Set-Content $subgraphYaml $updatedContent

Write-Host "✅ Updated subgraph.yaml with contract address" -ForegroundColor Green

# Generate types
Write-Host "📦 Generating subgraph types..." -ForegroundColor Yellow
& graph codegen

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Types generated successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to generate types" -ForegroundColor Red
    exit 1
}

# Build subgraph
Write-Host "🔨 Building subgraph..." -ForegroundColor Yellow
& graph build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Subgraph built successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to build subgraph" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Subgraph updated and built successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Deploy to The Graph Studio: graph deploy --studio zk-digilocker"
Write-Host "2. Update frontend GraphQL endpoint"
Write-Host "3. Test queries in GraphiQL playground"