'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const ProvablyFairSection = () => {
  const [activeTab, setActiveTab] = useState(1);
  
  const steps = [
    {
      id: 1,
      title: 'Pyth Entropy Request',
      description: 'When you start a game, a randomness request is sent to Pyth Network Entropy on Arbitrum Sepolia. The request includes a custom gas limit and required fee.',
      icon: 'client-seed',
      code: 'import pythEntropyService from \'@/services/PythEntropyService\';\n\nconst result = await pythEntropyService.generateRandom(\'ROULETTE\', {\n  purpose: \'roulette_spin\',\n  gameType: \'ROULETTE\',\n  betAmount: 0.1\n});'
    },
    {
      id: 2,
      title: 'Decentralized Randomness',
      description: 'Pyth Network provides cryptographically secure randomness derived from multiple data sources, ensuring provably fair results with on-chain verification.',
      icon: 'server-seed',
      code: 'const requestId = result.entropyProof.requestId;\nconst randomValue = result.randomValue;\nconst sequenceNumber = result.entropyProof.sequenceNumber;\nconst transactionHash = result.entropyProof.transactionHash;\nconst explorerUrl = result.entropyProof.explorerUrl;'
    },
    {
      id: 3,
      title: 'On-Chain Verification',
      description: 'All randomness requests and results are recorded on Arbitrum Sepolia blockchain, providing complete transparency and verifiability.',
      icon: 'calculation',
      code: '// Verify randomness via Pyth Entropy Explorer\nconsole.log(\'Transaction:\', transactionHash);\nconsole.log(\'Explorer:\', explorerUrl);\nconsole.log(\'Arbiscan:\', `https://sepolia.arbiscan.io/tx/${transactionHash}`);'
    },
    {
      id: 4,
      title: 'Transparent Results',
      description: 'Each game result includes request ID, sequence number, and transaction hash for complete transparency and verifiability.',
      icon: 'verification',
      code: '// Game result with Pyth Entropy proof\nconst gameResult = {\n  randomValue: result.randomValue,\n  entropyProof: {\n    requestId: result.entropyProof.requestId,\n    sequenceNumber: result.entropyProof.sequenceNumber,\n    transactionHash: result.entropyProof.transactionHash,\n    explorerUrl: result.entropyProof.explorerUrl,\n    timestamp: result.entropyProof.timestamp\n  }\n};'
    },
  ];
  
  return (
    <section className="py-16 px-4 md:px-8 lg:px-16 relative">
      {/* Background accents */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-red-magic/5 blur-[100px] z-0"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-magic/5 blur-[100px] z-0"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center mb-8">
          <div className="w-1 h-6 bg-gradient-to-r from-red-magic to-blue-magic rounded-full mr-3"></div>
          <h2 className="text-2xl font-display font-bold text-white">Pyth Entropy Powered Fairness</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left explanation column */}
          <div className="lg:col-span-5">
            <div className="p-[1px] bg-gradient-to-r from-red-magic to-blue-magic rounded-xl h-full">
              <div className="bg-[#1A0015] rounded-xl p-6 h-full">
                <h3 className="text-white text-xl font-medium mb-4">What is Pyth Entropy?</h3>
                <p className="text-white/80 mb-6">
                  Pyth Entropy is a decentralized randomness service that provides cryptographically secure random numbers on-chain.
                  It aggregates randomness from multiple sources and makes it available to smart contracts on Arbitrum Sepolia.
                </p>
                
                <div className="bg-[#250020] p-4 rounded-lg mb-6 border-l-2 border-red-magic">
                  <h4 className="text-white font-medium mb-2">Why Pyth Entropy matters</h4>
                  <ul className="text-white/70 text-sm space-y-2 list-disc pl-4">
                    <li>Cryptographically secure randomness from multiple sources</li>
                    <li>On-chain verification and transparency</li>
                    <li>High throughput suitable for gaming applications</li>
                    <li>Immune to manipulation by players, casino, or validators</li>
                    <li>Complete audit trail from request to result</li>
                  </ul>
                </div>
                
                <Link href="/provably-fair">
                  <div className="inline-block">
                    <div className="p-[1px] bg-gradient-to-r from-red-magic to-blue-magic rounded-md inline-block">
                      <button className="bg-[#1A0015] hover:bg-[#250020] transition-colors text-white px-6 py-2 rounded-md flex items-center">
                        Verify On-Chain
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right steps column */}
          <div className="lg:col-span-7">
            <div className="p-[1px] bg-gradient-to-r from-red-magic/40 to-blue-magic/40 rounded-xl">
              <div className="bg-[#1A0015] rounded-xl p-6">
                <h3 className="text-white text-xl font-medium mb-4">How Pyth Entropy Works</h3>
                
                {/* Steps tabs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
                  {steps.map((step) => (
                    <button
                      key={step.id}
                      className={`p-2 rounded-md text-sm font-medium transition-all text-center ${
                        activeTab === step.id
                          ? 'bg-gradient-to-r from-red-magic/80 to-blue-magic/80 text-white'
                          : 'bg-[#250020] text-white/70 hover:text-white'
                      }`}
                      onClick={() => setActiveTab(step.id)}
                    >
                      Step {step.id}
                    </button>
                  ))}
                </div>
                
                {/* Active tab content */}
                <div className="min-h-[250px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center mb-4">
                      {/* Step icon placeholder - would be actual icons in production */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-magic/60 to-blue-magic/60 flex items-center justify-center mr-4">
                        <span className="text-white font-bold">{activeTab}</span>
                      </div>
                      <h4 className="text-white text-lg font-medium">{steps[activeTab-1].title}</h4>
                    </div>
                    
                    <p className="text-white/80 leading-relaxed mb-8">
                      {steps[activeTab-1].description}
                    </p>
                  </div>
                  
                  {/* Pyth Entropy */}
                  <div className="bg-[#0D0D0D] rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-green-400 font-mono">
                      {steps[activeTab-1].code}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProvablyFairSection; 