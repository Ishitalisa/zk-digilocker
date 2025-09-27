// ZK Proof generation with DYNAMIC inputs
import * as snarkjs from 'snarkjs';

export class ZKProofGenerator {
  static circuitWasm = '/circuits/passportVerifier.wasm';
  static circuitZkey = '/circuits/circuit_0000.zkey';
  
  static async generateProof(zkInputs) {
    try {
      console.log('Generating ZK proof with inputs:', zkInputs);
      
      // DYNAMIC inputs from PDF processing
      const input = {
        age: zkInputs.age,
        nationality: zkInputs.nationality,
        expiryStatus: zkInputs.expiryStatus
      };
      
      console.log('Circuit inputs:', input);
      
      // Generate witness and proof
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        this.circuitWasm,
        this.circuitZkey
      );
      
      console.log('Generated proof:', proof);
      console.log('Public signals:', publicSignals);
      
      // Format proof for smart contract
      const solidityProof = this.formatProofForSolidity(proof);
      
      return {
        proof: solidityProof,
        publicSignals: zkInputs.publicSignals, // Use computed public signals
        success: true
      };
      
    } catch (error) {
      console.error('Proof generation error:', error);
      return {
        error: error.message,
        success: false
      };
    }
  }
  
  static formatProofForSolidity(proof) {
    return {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
      c: [proof.pi_c[0], proof.pi_c[1]]
    };
  }
  
  // Mock proof generation for development
  static async generateMockProof(zkInputs) {
    console.log('Generating MOCK proof for development:', zkInputs);
    
    // Return mock proof structure
    return {
      proof: {
        a: ["0", "0"],
        b: [["0", "0"], ["0", "0"]],
        c: ["0", "0"]
      },
      publicSignals: zkInputs.publicSignals,
      success: true,
      isMock: true
    };
  }
}