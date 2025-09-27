# PowerShell script to update frontend with The Graph endpoint after deployment
# Usage: .\update-frontend-endpoint.ps1 <GraphQL_Endpoint_URL>

param(
    [Parameter(Mandatory=$true)]
    [string]$GraphEndpoint
)

$FrontendDir = "..\frontend"

Write-Host "🔄 Updating frontend with The Graph endpoint: $GraphEndpoint" -ForegroundColor Cyan

# Update .env file
$envFile = Join-Path $FrontendDir ".env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $updatedContent = $content -replace 'VITE_GRAPH_ENDPOINT=.*', "VITE_GRAPH_ENDPOINT=$GraphEndpoint"
    Set-Content $envFile $updatedContent
    Write-Host "✅ Updated .env file" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file not found at $envFile" -ForegroundColor Yellow
}

# Update graphClient.js
$graphClientFile = Join-Path $FrontendDir "src\utils\graphClient.js"
if (Test-Path $graphClientFile) {
    $content = Get-Content $graphClientFile -Raw
    $updatedContent = $content -replace "const GRAPH_ENDPOINT = '.*';", "const GRAPH_ENDPOINT = '$GraphEndpoint';"
    Set-Content $graphClientFile $updatedContent
    Write-Host "✅ Updated graphClient.js" -ForegroundColor Green
} else {
    Write-Host "⚠️  graphClient.js not found at $graphClientFile" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Frontend updated with new GraphQL endpoint" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. cd ..\frontend"
Write-Host "2. yarn dev"
Write-Host "3. Test complete workflow!"