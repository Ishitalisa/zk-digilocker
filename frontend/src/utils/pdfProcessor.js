// PDF Processing with DYNAMIC data extraction
import pdfParse from 'pdf-parse';

export class PDFProcessor {
  static async extractPassportData(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = await pdfParse(Buffer.from(arrayBuffer));
      const text = data.text;
      
      console.log('Extracted PDF Text:', text);
      
      // DYNAMIC extraction using regex patterns
      const extractedData = this.parsePassportText(text);
      
      // DYNAMIC computation of verification flags
      const computedFlags = this.computeVerificationFlags(extractedData);
      
      return {
        rawData: extractedData,
        zkInputs: computedFlags,
        success: true
      };
    } catch (error) {
      console.error('PDF processing error:', error);
      return {
        error: error.message,
        success: false
      };
    }
  }
  
  static parsePassportText(text) {
    // DYNAMIC regex patterns for any PDF with this format
    const patterns = {
      name: /NAME:\s*([^\n\r]+)/i,
      age: /AGE:\s*(\d+)/i,
      dob: /DOB:\s*([^\n\r]+)/i,
      college: /COLLEGE:\s*([^\n\r]+)/i,
      pob: /POB:\s*([^\n\r]+)/i,
      nationality: /NATIONALITY:\s*([^\n\r]+)/i,
      job: /JOB:\s*([^\n\r]+)/i,
      work: /WORK:\s*([^\n\r]+)/i,
      income: /INCOME:\s*([^\n\r]+)/i,
      expiryStatus: /EXPIRY STATUS:\s*([^\n\r]+)/i
    };
    
    const extracted = {};
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      extracted[key] = match ? match[1].trim() : null;
    }
    
    console.log('Parsed Data:', extracted);
    return extracted;
  }
  
  static computeVerificationFlags(data) {
    // DYNAMIC computation based on extracted data
    const age = parseInt(data.age) || 0;
    const nationality = (data.nationality || '').toUpperCase();
    const expiryStatus = (data.expiryStatus || '').toUpperCase();
    
    // DYNAMIC calculations
    const isAdult = age >= 18 ? 1 : 0;
    const isIndian = nationality === 'INDIAN' ? 1 : 0;
    const hasExpired = expiryStatus === 'YES' ? 1 : 0;
    
    console.log('Computed Flags:', {
      age,
      nationality,
      expiryStatus,
      '→ isAdult': isAdult,
      '→ isIndian': isIndian, 
      '→ hasExpired': hasExpired
    });
    
    return {
      // Private inputs for ZK circuit
      age: age,
      nationality: isIndian,
      expiryStatus: hasExpired,
      
      // Public outputs (for verification)
      publicSignals: [isAdult, isIndian, hasExpired]
    };
  }
  
  // Test with sample data
  static testWithSampleData() {
    const sampleText = `
NAME: ISHITA BHARDWAJ
AGE: 10
DOB: 23/11/2006
COLLEGE: IIT DELHI
POB: ARA,BIHAR
NATIONALITY: INDIAN
JOB: STUDENT
WORK: STUDYING
INCOME: NA
EXPIRY STATUS: NO
    `;
    
    const parsed = this.parsePassportText(sampleText);
    const computed = this.computeVerificationFlags(parsed);
    
    console.log('Test Results:', {
      parsed,
      computed,
      'Expected': {
        isAdult: 0, // age 10 < 18
        isIndian: 1, // INDIAN nationality
        hasExpired: 0 // NO expiry
      }
    });
    
    return computed;
  }
}

// For different test cases:
export const testCases = {
  adult: `NAME: JOHN DOE\nAGE: 25\nNATIONALITY: INDIAN\nEXPIRY STATUS: NO`,
  expired: `NAME: JANE DOE\nAGE: 30\nNATIONALITY: INDIAN\nEXPIRY STATUS: YES`,
  nonIndian: `NAME: SMITH\nAGE: 22\nNATIONALITY: AMERICAN\nEXPIRY STATUS: NO`,
  minor: `NAME: KID\nAGE: 16\nNATIONALITY: INDIAN\nEXPIRY STATUS: NO`
};