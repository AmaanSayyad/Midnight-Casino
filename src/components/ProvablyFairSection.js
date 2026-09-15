'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const ProvablyFairSection = () => {
  const [activeTab, setActiveTab] = useState(1);
  
  const steps = [
    {
      id: 1,
      title: 'Private bet (Compact witness)',
      description: 'Your sector choice, amount, and salt stay in local private state. The Compact placeBet circuit only discloses a commitment and ownership hash to the public ledger.',
      icon: 'client-seed',
      code: '// midnight-contract/casino.compact\nexport circuit placeBet(gameType: Uint<8>): [] {\n  const choice = getBetChoice();\n  const amount = getBetAmount();\n  const salt = getBetSalt();\n  const commit = betCommitment(choice, amount, salt);\n  // only commit + ownerHash hit the public ledger\n}'
    },
    {
      id: 2,
      title: 'House commit-reveal',
      description: 'House entropy is committed on-ledger before settlement so neither side can grind outcomes after seeing the private bet.',
      icon: 'server-seed',
      code: 'export circuit commitHouseSeed(commit: Bytes<32>): [] {\n  houseSeedCommit = disclose(commit);\n}'
    },
    {
      id: 3,
      title: 'ZK settlement',
      description: 'settleWheel proves you own the round and that the reveal matches the commitment, then selectively discloses outcome and payout.',
      icon: 'calculation',
      code: 'export circuit settleWheel(roundId: Uint<64>, houseOutcome: Uint<8>): [] {\n  assert(betCommitment(...) == round.betCommit, "bet mismatch");\n  // disclose won + payout only\n}'
    },
    {
      id: 4,
      title: 'Try Privacy Wheel',
      description: 'Open /game/privacy-wheel for an end-to-end dual-ledger demo wired to these Compact semantics.',
      icon: 'verification',
      code: 'npm run compact   # Compiling 4 circuits\nnpm run compact:test\nnpm run dev        # → /game/privacy-wheel'
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
          <h2 className="text-2xl font-display font-bold text-white">Compact ZK Privacy + Fair Settlement</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left explanation column */}
          <div className="lg:col-span-5">
            <div className="p-[1px] bg-gradient-to-r from-red-magic to-blue-magic rounded-xl h-full">
              <div className="bg-[#0A0A0A] rounded-xl p-6 h-full">
                <h3 className="text-white text-xl font-medium mb-4">What is Midnight Compact?</h3>
                <p className="text-white/80 mb-6">
                  Compact is Midnight&apos;s privacy-first smart-contract language. Circuits prove game rules with
                  zero-knowledge while witnesses keep bet intent on your device until selective disclosure.
                </p>
                
                <div className="bg-[#0A0A0A] p-4 rounded-lg mb-6 border-l-2 border-red-magic">
                  <h4 className="text-white font-medium mb-2">Why Compact privacy matters</h4>
                  <ul className="text-white/70 text-sm space-y-2 list-disc pl-4">
                    <li>Private bet choice and amount via witnesses</li>
                    <li>Public commitments on the dual ledger</li>
                    <li>Selective disclosure of outcome and payout</li>
                    <li>Ownership proofs without revealing secret keys</li>
                    <li>Compiler-enforced disclose() boundaries</li>
                  </ul>
                </div>
                
                <Link href="/game/privacy-wheel">
                  <div className="inline-block">
                    <div className="p-[1px] bg-gradient-to-r from-red-magic to-blue-magic rounded-md inline-block">
                      <button className="bg-[#0A0A0A] hover:bg-[#0A0A0A] transition-colors text-white px-6 py-2 rounded-md flex items-center">
                        Open Privacy Wheel
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
              <div className="bg-[#0A0A0A] rounded-xl p-6">
                <h3 className="text-white text-xl font-medium mb-4">How Compact Casino Circuits Work</h3>
                
                {/* Steps tabs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
                  {steps.map((step) => (
                    <button
                      key={step.id}
                      className={`p-2 rounded-md text-sm font-medium transition-all text-center ${
                        activeTab === step.id
                          ? 'bg-gradient-to-r from-red-magic/80 to-blue-magic/80 text-white'
                          : 'bg-[#0A0A0A] text-white/70 hover:text-white'
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