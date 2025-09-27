// ENS Integration utilities
import { useEnsName, useEnsAvatar } from 'wagmi';

export class ENSManager {
  // Generate unique ENS-style name for user
  static generateUniqueEnsName(address, userData) {
    if (!address || !userData) return '';
    
    // Create a unique name based on address and user data
    const shortAddress = address.slice(2, 8).toLowerCase();
    const baseName = userData.rawData?.name 
      ? userData.rawData.name.toLowerCase().replace(/\s+/g, '-')
      : 'user';
    
    // Generate format: ishita-bhardwaj-abc123.zkdigilocker
    const uniqueName = `${baseName}-${shortAddress}.zkdigilocker`;
    
    console.log('Generated ENS name:', uniqueName);
    return uniqueName;
  }
  
  // Validate ENS name format
  static validateEnsName(ensName) {
    if (!ensName || ensName.length < 3) {
      return { valid: false, error: 'ENS name too short' };
    }
    
    if (ensName.length > 50) {
      return { valid: false, error: 'ENS name too long' };
    }
    
    // Allow alphanumeric, hyphens, and dots
    const validPattern = /^[a-z0-9-\.]+$/;
    if (!validPattern.test(ensName)) {
      return { valid: false, error: 'Invalid characters in ENS name' };
    }
    
    return { valid: true };
  }
  
  // Check if ENS name is available (mock for hackathon)
  static async checkAvailability(ensName, contract) {
    try {
      // In production: check against ENS registrar
      // For hackathon: check against our contract
      const existingProfile = await contract.read.getProfileByENS([ensName]);
      return { available: false, reason: 'Name already taken' };
    } catch (error) {
      // If error (name not found), it's available
      return { available: true };
    }
  }
}

// Hook for ENS profile display
export function useENSProfile(address) {
  const { data: ensName } = useEnsName({ 
    address, 
    chainId: 1 // Always resolve from mainnet
  });
  
  const { data: ensAvatar } = useEnsAvatar({ 
    name: ensName, 
    chainId: 1 
  });
  
  return {
    ensName,
    ensAvatar,
    hasEns: !!ensName
  };
}