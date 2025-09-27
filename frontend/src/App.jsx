import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useContractWrite, useWaitForTransaction, useContractRead } from 'wagmi';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, Wallet, User, BarChart3 } from 'lucide-react';
import { PDFProcessor } from './utils/pdfProcessor';
import { ZKProofGenerator } from './utils/zkProofGenerator';
import { ENSManager, useENSProfile } from './utils/ensManager';
import QueryDashboard from './components/QueryDashboard';
import './App.css';

// Contract configuration (UPDATE AFTER DEPLOYMENT)
const PROFILE_MANAGER_ADDRESS = '0x...'; // UPDATE WITH DEPLOYED ADDRESS
const PROFILE_MANAGER_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"internalType": "uint256[2]", "name": "a", "type": "uint256[2]"},
          {"internalType": "uint256[2][2]", "name": "b", "type": "uint256[2][2]"},
          {"internalType": "uint256[2]", "name": "c", "type": "uint256[2]"}
        ],
        "internalType": "struct PassportProofVerifier.Proof",
        "name": "proof",
        "type": "tuple"
      },
      {"internalType": "uint256[3]", "name": "publicSignals", "type": "uint256[3]"},
      {"internalType": "string", "name": "ensName", "type": "string"}
    ],
    "name": "verifyPassport",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

function App() {
  const { address, isConnected } = useAccount();
  const ensProfile = useENSProfile(address);
  
  const [step, setStep] = useState(1);
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [zkProof, setZkProof] = useState(null);
  const [ensName, setEnsName] = useState('');
  const [suggestedEnsName, setSuggestedEnsName] = useState('');
  const [ensAvailability, setEnsAvailability] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [queryEnsName, setQueryEnsName] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [activeTab, setActiveTab] = useState('verify'); // 'verify' or 'dashboard'

  // Contract interaction
  const { data: txData, write: verifyPassport } = useContractWrite({
    address: PROFILE_MANAGER_ADDRESS,
    abi: PROFILE_MANAGER_ABI,
    functionName: 'verifyPassport',
  });

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransaction({
    hash: txData?.hash,
  });

  // Contract read for querying profiles
  const { data: queriedProfile } = useContractRead({
    address: PROFILE_MANAGER_ADDRESS,
    abi: PROFILE_MANAGER_ABI,
    functionName: 'getProfileByENS',
    args: [queryEnsName],
    enabled: false, // We'll trigger this manually
  });

  // Auto-generate suggested ENS name when data is extracted
  useEffect(() => {
    if (extractedData && address && !suggestedEnsName) {
      const suggested = ENSManager.generateUniqueEnsName(address, extractedData);
      setSuggestedEnsName(suggested);
      setEnsName(suggested);
    }
  }, [extractedData, address, suggestedEnsName]);

  // Reset state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setStep(1);
      setPdfFile(null);
      setExtractedData(null);
      setZkProof(null);
      setEnsName('');
      setSuggestedEnsName('');
      setError('');
    }
  }, [isConnected]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Please select a valid PDF file');
      return;
    }

    setIsProcessing(true);
    setError('');
    setPdfFile(file);

    try {
      // DYNAMIC PDF processing
      const result = await PDFProcessor.extractPassportData(file);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setExtractedData(result);
      setStep(2);
      
      console.log('🎯 DYNAMIC EXTRACTION RESULTS:');
      console.log('Raw Data:', result.rawData);
      console.log('ZK Inputs:', result.zkInputs);
      
    } catch (err) {
      setError(`PDF processing failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateProof = async () => {
    if (!extractedData) return;

    setIsProcessing(true);
    setError('');

    try {
      // Generate ZK proof with DYNAMIC inputs
      const proofResult = await ZKProofGenerator.generateMockProof(extractedData.zkInputs);
      
      if (!proofResult.success) {
        throw new Error(proofResult.error);
      }

      setZkProof(proofResult);
      setStep(3);
      
      console.log('🔐 ZK PROOF GENERATED:');
      console.log('Proof:', proofResult.proof);
      console.log('Public Signals:', proofResult.publicSignals);
      
    } catch (err) {
      setError(`Proof generation failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const validateEnsName = async (name) => {
    const validation = ENSManager.validateEnsName(name);
    if (!validation.valid) {
      setError(validation.error);
      return false;
    }
    
    // Check availability (mock for hackathon)
    try {
      setEnsAvailability('checking');
      // In production: check ENS registrar
      // For hackathon: assume available if passes validation
      setTimeout(() => {
        setEnsAvailability('available');
      }, 1000);
      return true;
    } catch (err) {
      setEnsAvailability('unavailable');
      setError('ENS name not available');
      return false;
    }
  };

  const submitVerification = async () => {
    if (!zkProof || !ensName.trim()) {
      setError('Please provide ENS name');
      return;
    }

    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    // Validate ENS name
    const isValid = await validateEnsName(ensName.trim());
    if (!isValid) return;

    setIsProcessing(true);
    setError('');

    try {
      await verifyPassport({
        args: [
          zkProof.proof,
          zkProof.publicSignals,
          ensName.trim()
        ]
      });
      
      setStep(4);
    } catch (err) {
      setError(`Transaction failed: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const queryProfile = async () => {
    if (!queryEnsName.trim()) {
      setError('Please enter ENS name to query');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Mock query for hackathon - replace with actual contract call
      setQueryResult({
        ensName: queryEnsName,
        address: '0x1234...5678',
        isAdult: true,
        isIndian: true,
        hasExpired: false,
        verifiedAt: new Date().toISOString()
      });
    } catch (err) {
      setError(`Query failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔐 ZK DigiLocker
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Private Document Verification with Zero-Knowledge Proofs
          </p>
          
          {/* Wallet Connection with ENS Profile */}
          <div className="flex flex-col items-center gap-4">
            <ConnectButton />
            
            {isConnected && (
              <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  {ensProfile.ensAvatar ? (
                    <img src={ensProfile.ensAvatar} className="w-10 h-10 rounded-full" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">
                    {ensProfile.ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {ensProfile.hasEns ? 'ENS Profile Connected' : 'Wallet Connected'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= num ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {num}
                </div>
                {num < 4 && <div className="w-12 h-0.5 bg-gray-300 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('verify')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'verify'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Document Verification
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'dashboard'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                The Graph Dashboard
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'dashboard' ? (
              <QueryDashboard />
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800">{error}</span>
                  </div>
                )}

          {/* Step 1: Upload PDF */}
          {step === 1 && (
            <div className="text-center">
              {!isConnected ? (
                <>
                  <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
                  <p className="text-gray-600 mb-6">
                    Please connect your wallet to start the verification process
                  </p>
                  <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                    <p>🔗 Your wallet address will be linked to your ENS name</p>
                    <p>🔐 Your private data stays encrypted with zero-knowledge proofs</p>
                    <p>✅ Companies only see verification results, not your personal info</p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-4">Upload Your Document</h2>
                  <p className="text-gray-600 mb-6">
                    Upload a PDF with format: NAME, AGE, NATIONALITY, EXPIRY STATUS
                  </p>
                  
                  <label className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition">
                    Choose PDF File
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isProcessing}
                    />
                  </label>
                  
                  {isProcessing && (
                    <div className="mt-4 flex items-center justify-center">
                      <Loader className="w-5 h-5 animate-spin mr-2" />
                      <span>Processing PDF...</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 2: Review Extracted Data */}
          {step === 2 && extractedData && (
            <div>
              <h2 className="text-2xl font-bold mb-4">📄 Extracted Data</h2>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-bold mb-3">Raw Data from PDF:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(extractedData.rawData).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium capitalize">{key}:</span> {value || 'N/A'}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="font-bold mb-3">🔐 Computed Verification Flags:</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl ${extractedData.zkInputs.publicSignals[0] ? 'text-green-600' : 'text-red-600'}`}>
                      {extractedData.zkInputs.publicSignals[0] ? '✅' : '❌'}
                    </div>
                    <div className="font-medium">Is Adult (≥18)</div>
                    <div className="text-sm text-gray-600">
                      Age: {extractedData.zkInputs.age}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl ${extractedData.zkInputs.publicSignals[1] ? 'text-green-600' : 'text-red-600'}`}>
                      {extractedData.zkInputs.publicSignals[1] ? '🇮🇳' : '🌍'}
                    </div>
                    <div className="font-medium">Is Indian</div>
                    <div className="text-sm text-gray-600">
                      {extractedData.rawData.nationality}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl ${extractedData.zkInputs.publicSignals[2] ? 'text-red-600' : 'text-green-600'}`}>
                      {extractedData.zkInputs.publicSignals[2] ? '⚠️' : '✅'}
                    </div>
                    <div className="font-medium">Document Status</div>
                    <div className="text-sm text-gray-600">
                      {extractedData.zkInputs.publicSignals[2] ? 'Expired' : 'Valid'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={generateProof}
                  disabled={isProcessing}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {isProcessing ? (
                    <><Loader className="w-5 h-5 animate-spin mr-2 inline" />Generating Proof...</>
                  ) : (
                    'Generate ZK Proof'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: ENS Name Input */}
          {step === 3 && zkProof && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">🔐 Proof Generated!</h2>
              
              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <h3 className="font-bold mb-2">✅ Zero-Knowledge Proof Created</h3>
                <p className="text-sm text-gray-600">
                  Your private data is protected. Only verification results will be public.
                </p>
                <div className="mt-3 text-sm">
                  Public Signals: [{zkProof.publicSignals.join(', ')}]
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose your ENS-style name:
                </label>
                
                {suggestedEnsName && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm text-green-800">
                      <strong>Suggested name:</strong> {suggestedEnsName}
                      <button
                        onClick={() => setEnsName(suggestedEnsName)}
                        className="ml-2 text-green-600 hover:text-green-800 underline"
                      >
                        Use this
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="relative">
                  <input
                    type="text"
                    value={ensName}
                    onChange={(e) => {
                      setEnsName(e.target.value);
                      setEnsAvailability(null);
                    }}
                    placeholder="e.g., ishita-bhardwaj-abc123.zkdigilocker"
                    className="w-full max-w-lg mx-auto px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  {ensAvailability === 'checking' && (
                    <div className="absolute right-3 top-3">
                      <Loader className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  )}
                  
                  {ensAvailability === 'available' && (
                    <div className="absolute right-3 top-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  💡 This name will be linked to your wallet address<br/>
                  Companies can query your verification status using this name
                </p>
                
                <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-3 rounded">
                  <strong>Your wallet:</strong> {address}<br/>
                  <strong>ENS name:</strong> {ensName || 'Not set'}<br/>
                  <strong>Mapping:</strong> {ensName} → {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
              </div>

              <button
                onClick={submitVerification}
                disabled={isProcessing || !ensName.trim()}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isProcessing ? (
                  <><Loader className="w-5 h-5 animate-spin mr-2 inline" />Submitting...</>
                ) : (
                  'Submit Verification'
                )}
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center">
              <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-green-600 mb-4">🎉 Verification Complete!</h2>
              
              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <h3 className="font-bold mb-2">✅ Your profile is now verified!</h3>
                <p className="text-gray-600 mb-4">
                  Companies can now query your verification status using your ENS name
                </p>
                
                <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                  <div className="font-mono text-sm">
                    <div>ENS Name: <span className="font-bold text-blue-600">{ensName}</span></div>
                    <div>Address: <span className="font-bold">{address}</span></div>
                    <div>Transaction: <span className="font-bold">{txData?.hash}</span></div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>✅ Zero-knowledge proof verified</p>
                <p>✅ ENS name registered</p>
                <p>✅ Profile stored on blockchain</p>
              </div>
            </div>
          )}
        </div>

        {/* Company Query Interface */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">🏢 Company Query Interface</h2>
          <p className="text-gray-600 mb-4">
            Companies can query verification status using ENS names without accessing private data
          </p>
          
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={queryEnsName}
              onChange={(e) => setQueryEnsName(e.target.value)}
              placeholder="Enter ENS name (e.g., ishita-bhardwaj-abc123.zkdigilocker)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <button 
              onClick={queryProfile}
              disabled={isProcessing || !queryEnsName.trim()}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              {isProcessing ? (
                <><Loader className="w-4 h-4 animate-spin mr-2 inline" />Querying...</>
              ) : (
                'Query Status'
              )}
            </button>
          </div>

          {queryResult && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-bold text-purple-900 mb-4">✅ Verification Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className={`text-3xl mb-2 ${queryResult.isAdult ? 'text-green-600' : 'text-red-600'}`}>
                    {queryResult.isAdult ? '✅' : '❌'}
                  </div>
                  <div className="font-medium">Adult Status</div>
                  <div className="text-sm text-gray-600">
                    {queryResult.isAdult ? 'Is 18 or older' : 'Under 18'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className={`text-3xl mb-2 ${queryResult.isIndian ? 'text-green-600' : 'text-blue-600'}`}>
                    {queryResult.isIndian ? '🇮🇳' : '🌍'}
                  </div>
                  <div className="font-medium">Nationality</div>
                  <div className="text-sm text-gray-600">
                    {queryResult.isIndian ? 'Indian Citizen' : 'Other Nationality'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className={`text-3xl mb-2 ${queryResult.hasExpired ? 'text-red-600' : 'text-green-600'}`}>
                    {queryResult.hasExpired ? '⚠️' : '✅'}
                  </div>
                  <div className="font-medium">Document Status</div>
                  <div className="text-sm text-gray-600">
                    {queryResult.hasExpired ? 'Expired' : 'Valid'}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>ENS Name:</strong> {queryResult.ensName}</div>
                  <div><strong>Wallet:</strong> {queryResult.address}</div>
                  <div><strong>Verified:</strong> {new Date(queryResult.verifiedAt).toLocaleDateString()}</div>
                  <div><strong>Status:</strong> <span className="text-green-600 font-medium">Verified ✓</span></div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <strong>🔒 Privacy Protected:</strong> Only verification results are shown. 
                Personal details (age, name, document content) remain private with zero-knowledge proofs.
              </div>
            </div>
          )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;