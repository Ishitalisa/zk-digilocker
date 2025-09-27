// GraphQL client for The Graph integration
import { createClient } from '@urql/core';

// The Graph endpoint (update after subgraph deployment)
const GRAPH_ENDPOINT = 'https://api.studio.thegraph.com/query/121741/zk-digi-locker/v0.0.1';

export const graphClient = createClient({
  url: GRAPH_ENDPOINT,
});

// GraphQL queries
export const GET_PROFILE_BY_ENS = `
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
`;

export const GET_USER_BY_ADDRESS = `
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
`;

export const GET_RECENT_VERIFICATIONS = `
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
`;

export const GET_DAILY_STATS = `
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
`;

// GraphQL client functions
export class GraphService {
  static async getProfileByENS(ensName) {
    try {
      const result = await graphClient.query(GET_PROFILE_BY_ENS, { ensName }).toPromise();
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      const profiles = result.data?.profiles || [];
      return profiles.length > 0 ? profiles[0] : null;
    } catch (error) {
      console.error('GraphQL query error:', error);
      throw error;
    }
  }
  
  static async getUserByAddress(address) {
    try {
      const result = await graphClient.query(GET_USER_BY_ADDRESS, { 
        address: address.toLowerCase() 
      }).toPromise();
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return result.data?.user || null;
    } catch (error) {
      console.error('GraphQL query error:', error);
      throw error;
    }
  }
  
  static async getRecentVerifications(limit = 10) {
    try {
      const result = await graphClient.query(GET_RECENT_VERIFICATIONS, { limit }).toPromise();
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return result.data?.verifications || [];
    } catch (error) {
      console.error('GraphQL query error:', error);
      throw error;
    }
  }
  
  static async getDailyStats(fromDate, toDate) {
    try {
      const result = await graphClient.query(GET_DAILY_STATS, { 
        from: fromDate, 
        to: toDate 
      }).toPromise();
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return result.data?.dailyStats || [];
    } catch (error) {
      console.error('GraphQL query error:', error);
      throw error;
    }
  }
  
  // Mock data for development/demo
  static async getProfileByENSMock(ensName) {
    console.log('Using mock GraphQL data for:', ensName);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock profile data
    return {
      id: '0x1234567890abcdef',
      ensName: ensName,
      isAdult: ensName.includes('adult') || Math.random() > 0.5,
      isIndian: ensName.includes('indian') || Math.random() > 0.3,
      hasExpired: ensName.includes('expired') || Math.random() > 0.8,
      verifiedAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Within last week
      lastUpdated: Date.now(),
      user: {
        id: '0x1234567890abcdef',
        createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000 // Within last month
      }
    };
  }
}