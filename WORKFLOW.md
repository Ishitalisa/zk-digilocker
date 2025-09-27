# 🔄 Complete Workflow: ENS Name → Blockchain → The Graph → Query

## Overview
This document explains the complete data flow from ENS name generation to querying verified data through The Graph.

## 📋 Step-by-Step Workflow

### 1. **User Connects Wallet**
```
User clicks "Connect Wallet" → RainbowKit modal → Wallet connected → Address available
```
- Frontend gets user's Ethereum address
- `useAccount()` hook provides `address` and `isConnected`

### 2. **ENS Name Generation**
```javascript
// In frontend/src/utils/ensManager.js
const suggested = ENSManager.generateUniqueEnsName(address, extractedData);
// Example: "ishita-bhardwaj-1a2b3c.zkdigilocker"
```
- Based on wallet address + extracted document data
- User can customize or accept suggestion
- Format: `name-surname-hash.zkdigilocker`

### 3. **Document Processing & ZK Proof**
```
PDF Upload → Extract data → Generate ZK proof → Ready for submission
```
- Personal data stays client-side
- Only verification results (boolean) are prepared for blockchain

### 4. **Blockchain Submission**
```javascript
// Frontend calls ProfileManager.verifyPassport()
await verifyPassport({
  args: [
    zkProof.proof,        // Groth16 proof
    zkProof.publicSignals, // [isAdult, isIndian, hasExpired]
    ensName.trim()        // "user-chosen-name.zkdigilocker"
  ]
});
```

### 5. **Smart Contract Processing**
```solidity
// In ProfileManager.sol
function verifyPassport(
    PassportProofVerifier.Proof memory proof,
    uint256[3] memory publicSignals,
    string memory ensName
) external {
    // 1. Verify ZK proof
    require(verifier.verifyProof(proof, publicSignals), "Invalid proof");
    
    // 2. Extract verification results
    bool isAdult = publicSignals[0] == 1;
    bool isIndian = publicSignals[1] == 1; 
    bool hasExpired = publicSignals[2] == 1;
    
    // 3. Store profile
    profiles[msg.sender] = Profile({
        ensName: ensName,
        isAdult: isAdult,
        isIndian: isIndian,
        hasExpired: hasExpired,
        verifiedAt: block.timestamp
    });
    
    // 4. Create ENS mapping
    ensToAddress[ensName] = msg.sender;
    
    // 5. ✨ EMIT EVENT FOR THE GRAPH ✨
    emit ProfileVerified(
        msg.sender,
        ensName,
        isAdult,
        isIndian,
        hasExpired,
        block.timestamp
    );
}
```

### 6. **The Graph Event Detection**
```yaml
# In subgraph/subgraph.yaml
eventHandlers:
  - event: ProfileVerified(indexed address,string,bool,bool,bool,uint256)
    handler: handleProfileVerified
```
- The Graph monitors ProfileManager contract
- Detects `ProfileVerified` events immediately

### 7. **The Graph Indexing**
```typescript
// In subgraph/src/mapping.ts
export function handleProfileVerified(event: ProfileVerified): void {
  // 1. Create/update User entity
  let user = User.load(event.params.user.toHex());
  if (!user) {
    user = new User(event.params.user.toHex());
    user.createdAt = event.block.timestamp;
  }
  user.ensName = event.params.ensName;
  user.save();

  // 2. Create/update Profile entity  
  let profile = Profile.load(event.params.user.toHex());
  if (!profile) {
    profile = new Profile(event.params.user.toHex());
  }
  profile.user = user.id;
  profile.ensName = event.params.ensName;
  profile.isAdult = event.params.isAdult;
  profile.isIndian = event.params.isIndian;
  profile.hasExpired = event.params.hasExpired;
  profile.verifiedAt = event.params.timestamp;
  profile.lastUpdated = event.block.timestamp;
  profile.save();

  // 3. Create ENSQuery entity for fast lookups
  let ensQuery = ENSQuery.load(event.params.ensName);
  if (!ensQuery) {
    ensQuery = new ENSQuery(event.params.ensName);
    ensQuery.queryCount = BigInt.fromI32(0);
  }
  ensQuery.profile = profile.id;
  ensQuery.save();

  // 4. Create VerificationEvent
  let verification = new VerificationEvent(event.transaction.hash.toHex());
  verification.user = user.id;
  verification.ensName = event.params.ensName;
  verification.isAdult = event.params.isAdult;
  verification.isIndian = event.params.isIndian;
  verification.hasExpired = event.params.hasExpired;
  verification.timestamp = event.params.timestamp;
  verification.blockNumber = event.block.number;
  verification.transactionHash = event.transaction.hash;
  verification.save();
}
```

### 8. **Frontend Query**
```javascript
// User searches ENS name in query box
const result = await GraphService.getProfileByENS("ishita-bhardwaj-1a2b3c.zkdigilocker");
```

### 9. **GraphQL Query Execution**
```graphql
query GetProfileByENS($ensName: String!) {
  profiles(where: { ensName: $ensName }) {
    id
    ensName
    isAdult      # ✅ true/false
    isIndian     # ✅ true/false  
    hasExpired   # ✅ true/false
    verifiedAt   # ✅ timestamp
    user {
      id         # ✅ wallet address
    }
  }
}
```

### 10. **Results Display**
```javascript
// Frontend displays verification results
{
  ensName: "ishita-bhardwaj-1a2b3c.zkdigilocker",
  isAdult: true,     // ✅ 18+ verified
  isIndian: true,    // ✅ Indian citizen
  hasExpired: false, // ✅ Document valid
  verifiedAt: "2024-01-15T10:30:00Z",
  walletAddress: "0xabc...def"
}
```

## 🔗 Data Flow Diagram

```
📱 Frontend              🔗 Blockchain              📊 The Graph
─────────────────────    ──────────────────────    ─────────────────
                                                   
1. Connect Wallet   ──┐                            
                     │                            
2. Generate ENS     ──┤                            
   "user.zkdigi"     │                            
                     │                            
3. Upload PDF       ──┤                            
   Extract data      │                            
                     │                            
4. Generate ZK      ──┤                            
   Proof             │                            
                     │                            
5. Submit TX        ──┼──► verifyPassport()        
                     │      │                     
                     │      ├─ Verify proof       
                     │      ├─ Store profile      
                     │      ├─ Map ENS→Address    
                     │      └─ Emit Event ────────┼──► Event Detected
                     │                            │      │
6. Query ENS ◄───────┼────────────────────────────┼──────┤
   "user.zkdigi"     │                            │      │
                     │                            │   ┌──▼──────────┐
7. Display Results ◄─┼────────────────────────────┼───┤ Index Event │
   • Age: 18+        │                            │   │ Create:     │
   • Nationality: IN │                            │   │ • User      │
   • Status: Valid   │                            │   │ • Profile   │
   • Verified: ✅    │                            │   │ • ENSQuery  │
                                                  │   │ • Verification
                                                  │   └─────────────┘
                                                  │          │
                                                  │     ┌────▼────┐
                                                  │     │ GraphQL │
                                                  │     │ Query   │
                                                  │     │ Engine  │
                                                  │     └─────────┘
```

## 🎯 Key Points

### ENS Name Linking
- **Creation**: ENS name is chosen during verification process
- **Storage**: Stored in smart contract with `ensToAddress` mapping
- **Indexing**: The Graph creates `ENSQuery` entity for fast lookups
- **Querying**: Direct lookup by ENS name returns profile data

### Privacy Preservation
- **Personal Data**: Never stored on blockchain or The Graph
- **Verification Results**: Only boolean claims are indexed
- **Zero-Knowledge**: Cryptographic proofs ensure data privacy

### Real-Time Updates
- **Event Emission**: Immediate when transaction confirms
- **The Graph Sync**: Near real-time indexing (< 1 minute)
- **Frontend Updates**: Instant query results

## 🚀 Deployment Checklist

### 1. Deploy Contracts
```bash
cd contracts
npx hardhat run scripts/deploy-separate.js --network sepolia
```

### 2. Update Subgraph
```bash
cd subgraph
# Use contract address from deployment
./update-subgraph.ps1 <ProfileManager_Address>
```

### 3. Deploy Subgraph
```bash
graph deploy --studio zk-digilocker
```

### 4. Update Frontend
```bash
# Update frontend/.env with contract addresses
# Update GraphQL endpoint URL
```

### 5. Test Complete Flow
```bash
# 1. Connect wallet
# 2. Upload PDF  
# 3. Verify document
# 4. Search ENS name
# 5. Verify results match
```

## 🔍 Testing the Workflow

### Test ENS Names
After deployment, test with these patterns:
- `test-user-123.zkdigilocker`
- `alice-smith-abc.zkdigilocker`
- `john-doe-xyz.zkdigilocker`

### Verification
1. Complete verification flow
2. Check transaction on Etherscan
3. Confirm event emission
4. Query The Graph endpoint
5. Search ENS name in frontend
6. Verify data consistency

This workflow ensures seamless connection between ENS names, blockchain verification, and queryable data through The Graph! 🔐✨