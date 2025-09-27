
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Generated Groth16 Verifier - Mock for hackathon
contract PassportProofVerifier {
    struct Proof {
        uint[2] a;
        uint[2][2] b;
        uint[2] c;
    }
    
    function verifyProof(
        Proof memory proof,
        uint[3] memory publicSignals
    ) public pure returns (bool) {
        // Mock verification for hackathon demo
        // In production: actual Groth16 verification
        require(publicSignals[0] <= 1, "Invalid isAdult");
        require(publicSignals[1] <= 1, "Invalid isIndian");
        require(publicSignals[2] <= 1, "Invalid hasExpired");
        return true;
    }
}

// Main ProfileManager Contract
contract ProfileManager {
    PassportProofVerifier public immutable verifier;
    
    struct Profile {
        bool isAdult;
        bool isIndian;
        bool hasExpired;
        uint256 verifiedAt;
        string ensName;
        bool exists;
    }
    
    mapping(address => Profile) public profiles;
    mapping(string => address) public ensToAddress;
    
    event ProfileVerified(
        address indexed user,
        bool isAdult,
        bool isIndian,
        bool hasExpired,
        string ensName,
        uint256 timestamp
    );
    
    constructor(address _verifier) {
        verifier = PassportProofVerifier(_verifier);
    }
    
    function verifyPassport(
        PassportProofVerifier.Proof memory proof,
        uint[3] memory publicSignals,
        string memory ensName
    ) external {
        require(verifier.verifyProof(proof, publicSignals), "Invalid proof");
        require(bytes(ensName).length > 0, "ENS name required");
        
        profiles[msg.sender] = Profile({
            isAdult: publicSignals[0] == 1,
            isIndian: publicSignals[1] == 1,
            hasExpired: publicSignals[2] == 1,
            verifiedAt: block.timestamp,
            ensName: ensName,
            exists: true
        });
        
        ensToAddress[ensName] = msg.sender;
        
        emit ProfileVerified(
            msg.sender,
            publicSignals[0] == 1,
            publicSignals[1] == 1,
            publicSignals[2] == 1,
            ensName,
            block.timestamp
        );
    }
    
    function getProfileByENS(string memory ensName) external view returns (Profile memory) {
        address user = ensToAddress[ensName];
        require(user != address(0), "ENS not found");
        return profiles[user];
    }
    
    function isUserAdult(string memory ensName) external view returns (bool) {
        address user = ensToAddress[ensName];
        require(user != address(0), "ENS not found");
        require(!profiles[user].hasExpired, "Document expired");
        return profiles[user].isAdult;
    }
}
