pragma circom 2.1.4;

include "circomlib/poseidon.circom";
include "circomlib/comparators.circom";

template StringToNum() {
    signal input str[100];  // Max length 100 chars
    signal output num;
    
    component lt[100];
    component isNum[100];
    var lc = 0;
    
    // Convert string of digits to number
    for (var i = 0; i < 100; i++) {
        lt[i] = LessThan(8);  // 8 bits per char
        lt[i].in[0] = str[i];
        lt[i].in[1] = 58;  // ASCII '9' + 1
        
        isNum[i] = GreaterEqThan(8);
        isNum[i].in[0] = str[i];
        isNum[i].in[1] = 48;  // ASCII '0'
        
        lc = lc + (str[i] - 48) * (lt[i].out * isNum[i].out) * (10 ** i);
    }
    
    num <== lc;
}

template StringCompare(n) {
    signal input a[n];
    signal input b[n];
    signal output out;
    
    var isEqual = 1;
    for (var i = 0; i < n; i++) {
        isEqual = isEqual * (a[i] == b[i] ? 1 : 0);
    }
    
    out <== isEqual;
}

template PassportVerifier() {
    // Input signals for AGE, NATIONALITY, EXPIRY STATUS
    signal input age[100];
    signal input nationality[100];
    signal input expiryStatus[100];
    
    // Output signals
    signal output isAdult;      // Age >= 18
    signal output isIndian;     // Nationality == "INDIAN"
    signal output isNotExpired; // Expiry Status == "NO"
    
    // Convert age string to number
    component ageConverter = StringToNum();
    ageConverter.str <== age;
    
    // Check if age >= 18
    component checkAge = GreaterEqThan(32); // 32 bits for age
    checkAge.in[0] <== ageConverter.num;
    checkAge.in[1] <== 18;
    isAdult <== checkAge.out;
    
    // Check nationality (compare with "INDIAN")
    component checkNationality = StringCompare(6);
    var indian[6] = [73, 78, 68, 73, 65, 78]; // "INDIAN" in ASCII
    checkNationality.a <== nationality;
    checkNationality.b <== indian;
    isIndian <== checkNationality.out;
    
    // Check expiry status (compare with "NO")
    component checkExpiry = StringCompare(2);
    var no[2] = [78, 79]; // "NO" in ASCII
    checkExpiry.a <== expiryStatus;
    checkExpiry.b <== no;
    isNotExpired <== checkExpiry.out;
}
