# Create build directory if it doesn't exist
$buildDir = Join-Path $PSScriptRoot "..\build"
if (!(Test-Path $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir | Out-Null
}

Write-Host "Compiling circuit..."
$circuitPath = Join-Path $PSScriptRoot "..\passportVerifier.circom"
circom $circuitPath --r1cs --wasm --sym -o $buildDir

Write-Host "Downloading Powers of Tau file..."
$ptauFile = Join-Path $buildDir "pot12_final.ptau"
if (!(Test-Path $ptauFile)) {
    Invoke-WebRequest -Uri "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau" -OutFile $ptauFile
}

Write-Host "Generating witness..."
$inputFile = Join-Path $PSScriptRoot "..\input.json"
$witnessFile = Join-Path $buildDir "witness.wtns"
node "$buildDir\passportVerifier_js\generate_witness.js" "$buildDir\passportVerifier_js\passportVerifier.wasm" $inputFile $witnessFile

Write-Host "Generating zkey..."
$r1csFile = Join-Path $buildDir "passportVerifier.r1cs"
$zkeyFile = Join-Path $buildDir "circuit_0000.zkey"
snarkjs groth16 setup $r1csFile $ptauFile $zkeyFile

Write-Host "Exporting verification key..."
$vkeyFile = Join-Path $buildDir "verification_key.json"
snarkjs zkey export verificationkey $zkeyFile $vkeyFile

Write-Host "Generating Solidity verifier..."
$verifierFile = Join-Path $PSScriptRoot "..\..\contracts\contracts\PassportVerifier.sol"
snarkjs zkey export solidityverifier $zkeyFile $verifierFile
