# ZK DigiLocker Subgraph

This subgraph indexes verification events from the ZK DigiLocker smart contracts on Ethereum Sepolia testnet.

## Overview

The ZK DigiLocker subgraph tracks:
- User registrations and profiles
- Document verification events
- ENS name mappings
- Daily statistics and analytics

## Entities

### User
- **id**: Ethereum address (bytes)
- **ensName**: ENS-style name chosen by user
- **profile**: Reference to user's verification profile
- **verifications**: List of all verification events
- **createdAt**: Timestamp of first verification

### Profile
- **id**: Composite ID (user address)
- **user**: Reference to User entity
- **ensName**: ENS-style name for easy querying
- **isAdult**: Boolean (age >= 18)
- **isIndian**: Boolean (nationality check)
- **hasExpired**: Boolean (document expiry status)
- **verifiedAt**: Timestamp of latest verification
- **lastUpdated**: Timestamp of last profile update

### VerificationEvent
- **id**: Transaction hash
- **user**: Reference to User entity
- **ensName**: ENS name used in verification
- **isAdult**: Adult status at time of verification
- **isIndian**: Nationality status at time of verification
- **hasExpired**: Document expiry status at time of verification
- **timestamp**: Block timestamp
- **blockNumber**: Block number
- **transactionHash**: Transaction hash

### ENSQuery
- **id**: ENS name (string)
- **profile**: Reference to associated Profile
- **queryCount**: Number of times this profile was queried
- **lastQueried**: Timestamp of last query

### DailyStats
- **id**: Date string (YYYY-MM-DD)
- **date**: Date string
- **totalVerifications**: Total verifications on this day
- **totalUsers**: Total unique users on this day
- **adultUsers**: Number of adult users verified on this day
- **indianUsers**: Number of Indian users verified on this day
- **expiredDocuments**: Number of expired documents on this day

## Sample Queries

### Get Profile by ENS Name
```graphql
query GetProfileByENS($ensName: String!) {
  profiles(where: { ensName: $ensName }) {
    id
    ensName
    isAdult
    isIndian
    hasExpired
    verifiedAt
    lastUpdated
    user {
      id
      createdAt
    }
  }
}
```

### Get User by Address
```graphql
query GetUserByAddress($address: String!) {
  user(id: $address) {
    id
    ensName
    profile {
      isAdult
      isIndian
      hasExpired
      verifiedAt
    }
    verifications {
      id
      timestamp
      transactionHash
    }
  }
}
```

### Get Recent Verifications
```graphql
query GetRecentVerifications($limit: Int = 10) {
  verifications(
    orderBy: timestamp
    orderDirection: desc
    first: $limit
  ) {
    id
    ensName
    user {
      id
    }
    isAdult
    isIndian
    hasExpired
    timestamp
    transactionHash
  }
}
```

### Get Daily Statistics
```graphql
query GetDailyStats($from: String!, $to: String!) {
  dailyStats(
    where: { 
      date_gte: $from, 
      date_lte: $to 
    }
    orderBy: date
    orderDirection: asc
  ) {
    id
    date
    totalVerifications
    totalUsers
    adultUsers
    indianUsers
    expiredDocuments
  }
}
```

## Deployment

### Prerequisites
1. Graph CLI installed: `npm install -g @graphprotocol/graph-cli`
2. The Graph account and API key
3. Deployed ProfileManager contract address

### Steps

1. **Update contract address** in `subgraph.yaml`:
   ```yaml
   dataSources:
     - kind: ethereum/contract
       name: ProfileManager
       network: sepolia
       source:
         address: "YOUR_DEPLOYED_CONTRACT_ADDRESS"
   ```

2. **Generate types**:
   ```bash
   graph codegen
   ```

3. **Build subgraph**:
   ```bash
   graph build
   ```

4. **Deploy to The Graph Studio**:
   ```bash
   graph deploy --studio zk-digilocker
   ```

### Environment Variables
Set these in your deployment environment:
- `GRAPH_API_KEY`: Your Graph API key
- `CONTRACT_ADDRESS`: Deployed ProfileManager contract address

## Development

### Local Testing
1. Run a local Graph node (optional)
2. Deploy to local node for testing
3. Use GraphiQL playground for query testing

### Schema Changes
When modifying the schema:
1. Update `schema.graphql`
2. Update mapping functions in `src/mapping.ts`
3. Regenerate types with `graph codegen`
4. Test queries in playground

## Integration

### Frontend Integration
The frontend uses URQL client to query the subgraph:

```javascript
import { createClient } from '@urql/core';

const client = createClient({
  url: 'https://api.thegraph.com/subgraphs/name/ishitalisa/zk-digilocker'
});
```

### Privacy Considerations
- Only verification results are indexed (age status, nationality, expiry)
- Personal identifying information is never stored
- Zero-knowledge proofs ensure privacy preservation
- ENS names are user-chosen pseudonyms

## Monitoring

### Health Checks
- Monitor subgraph sync status
- Check for failed transactions
- Verify entity counts match expected values

### Performance
- Query response times
- Index lag behind chain head
- Error rates and patterns

## Support

For issues with the subgraph:
1. Check The Graph Studio dashboard
2. Verify contract address and ABI
3. Review mapping function logs
4. Test queries in GraphiQL playground

## License

This subgraph is part of the ZK DigiLocker project for ETHGlobal New Delhi Hackathon.