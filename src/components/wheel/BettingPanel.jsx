"use client";

import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import Image from "next/image";
// Using Next.js public asset reference instead of import
import useWalletStatus from '@/hooks/useWalletStatus';
import { Shield } from "lucide-react";
import pythEntropyService from '@/services/PythEntropyService';
// VRF removed in Pyth Entropy mode
// import { wheelDataByRisk } from "./GameWheel"; // Make sure this is exported

const BettingPanel = ({
  betAmount,
  setBetAmount,
  balance,
  gameMode,
  setGameMode,
  risk,
  setRisk,
  noOfSegments,
  setSegments,
  manulBet,
  autoBet,
  isSpinning
}) => {
  
  const { isConnected } = useWalletStatus();
  const [inputValue, setInputValue] = useState('0');
  const [pythReady, setPythReady] = useState(false);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setBetAmount(parseFloat(value) || 0);
  };

  const handleMultiplier = (multiplier) => {
    const newAmount = Math.min(balance, Math.max(0, betAmount * multiplier));
    setBetAmount(newAmount);
    setInputValue(newAmount.toString());
  };

  const [numberOfBets, setNumberOfBets] = useState(10);
  const [winIncrease, setWinIncrease] = useState(0);
  const [lossIncrease, setLossIncrease] = useState(0);
  const [stopProfit, setStopProfit] = useState(0);
  const [stopLoss, setStopLoss] = useState(0);

  // Check Pyth Entropy readiness periodically
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const ready = await pythEntropyService.isInitialized();
        if (!cancelled) setPythReady(!!ready);
      } catch {
        if (!cancelled) setPythReady(false);
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="bg-[#290023] border border-[#333947] rounded-3xl p-4 flex flex-col h-full">
      {/* Balance Display */}
      <div className="mb-4 p-3 bg-gradient-to-r from-green-900/20 to-green-800/10 rounded-lg border border-green-800/30">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Balance:</span>
          {isConnected ? (
            <span className="text-sm text-green-300 font-medium">
              {parseFloat(balance || 0).toFixed(5)} MATIC
            </span>
          ) : (
            <span className="text-sm text-red-300 font-medium">
              Connect Wallet
            </span>
          )}
        </div>
      </div>

      {/* Pyth Entropy Status */}
      <div className="mb-4 p-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-800/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-purple-300" />
            <span className="text-sm font-medium text-purple-300">Pyth Entropy</span>
          </div>
          {isConnected && (
            <div className={`w-2 h-2 rounded-full ${pythReady ? 'bg-green-400' : 'bg-red-400'}`}></div>
          )}
        </div>
        
        {!isConnected ? (
          <div className="text-center py-2">
            <div className="text-sm text-gray-400 mb-2">Connect wallet to view VRF proofs</div>
            <button
              onClick={() => {
                // Trigger wallet connection
                if (window.ethereum) {
                  window.ethereum.request({ method: 'eth_requestAccounts' });
                }
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
          </div>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="flex mb-4 bg-[#120521] border border-[#333947] rounded-3xl p-2 gap-2 overflow-hidden">
        <div className={cn("w-1/2", gameMode === "manual" && "gradient-borderb")}>
          <button 
            className={cn(
              "flex-1 py-3 px-4 w-full text-center rounded-2xl transition-colors",
              gameMode === "manual" ? "bg-[#290023] text-white" : "text-[#333947]"
            )}
            onClick={() => setGameMode("manual")}
          >
            Manual
          </button>
        </div>
        <div className={cn("w-1/2", gameMode === "auto" && "gradient-borderb")}>
          <button 
            className={cn(
              "flex-1 py-3 px-4 w-full text-center rounded-2xl transition-colors",
              gameMode === "auto" ? "bg-[#290023] text-white" : "text-[#333947]"
            )}
            onClick={() => setGameMode("auto")}
          >
            Auto
          </button>
        </div>
      </div>

      
      {/* Bet Amount */}
      <div className="mb-4">
        <div className="flex justify-between p-1 mb-1">
          <label className="text-sm text-white">Bet Amount</label>
          <div className="text-sm">{betAmount.toFixed(5)} MATIC</div>
        </div>
        <div className="flex w-full gradient-border">
        <div className="flex items-center w-[60%]">
          <div className="bg-[#120521] rounded-l-sm flex-1 flex items-center p-1 py-2 ">
            <input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              className="bg-transparent border-none outline-none w-full text-white p-1"
              placeholder="0.00100"
              step="0.001"
              min="0.001"
            />
            <Image
                  src="/coin.png"
                  width={20}
                  height={20}
                  alt="coin"
                  className=""
            />  
          </div>
        </div>
        <div className="flex w-[40%]">
          <button onClick={() => handleMultiplier(1 / 2)} className="flex-1 bg-[#420039] py-1 px-2 text-sm transition-colors">1/2</button>
          <button onClick={() => handleMultiplier(2)} className="flex-1 bg-[#420039] py-1 px-2 rounded-r-sm text-sm transition-colors">2x</button>
        </div>
        </div>
      </div>

      {/* Risk */}
      <div className="mb-4">
        <label className="block text-sm text-white mb-1">Risk</label>
        <div className="relative gradient-border">
          <select value={risk} onChange={(e) => setRisk(e.target.value)} className="w-full bg-[#120521] p-2 py-3 rounded-sm appearance-none text-white pr-8 outline-none">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Segments */}
      <div className="mb-4">
        <label className="block text-sm text-white mb-1">Segments</label>
        <div className="relative gradient-border">
          <select value={noOfSegments} onChange={(e) => setSegments(parseInt(e.target.value))} className="w-full bg-[#120521] p-2 py-3 rounded-sm appearance-none text-white pr-8 outline-none">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="40">40</option>
            <option value="50">50</option>

          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {gameMode === "auto" && (
        <>
          {/* Number of Bets */}
          <div className="mb-4">
            <label className="block text-sm text-white mb-1">Numbers of bet</label>
            <div className="gradient-border">
            <input type="number" className="w-full bg-[#120521] text-white p-2 py-3 rounded-sm outline-none" value={numberOfBets} onChange={(e) => setNumberOfBets(Number(e.target.value))} />
            </div>
          </div>

          {/* On Win */}
          <div className="mb-4">
            <label className="block text-sm text-white mb-1">On win</label>
            <div className="flex gradient-border">
              <div className="bg-[#09011C] p-1 rounded-sm flex w-full">
                <div className="bg-[#420039] p-1 flex items-center rounded-sm w-[60vw]">
                  <button
                    onClick={() => setWinIncrease(0)}
                    className="w-full bg-gradient-to-r from-[#F1324D] to-[#2414E3] rounded-sm py-2 text-white text-sm"
                  >
                    Reset
                  </button>
                  <span className="w-full items-center justify-center text-white text-right pr-3 text-sm">Increase by:</span>
                </div>
                <div className="flex items-center px-2 w-[40vw]">
                  <input type="number" className="bg-transparent outline-none border-none text-white w-full text-sm" value={winIncrease} onChange={(e) => setWinIncrease(e.target.value)} />
                  <span className="text-xs text-gray-400">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* On Loss */}
          <div className="mb-4">
            <label className="block text-sm text-white mb-1">On Loss</label>
            <div className="flex gradient-border">
              <div className="bg-[#09011C] p-1 rounded-sm flex w-full">
                <div className="bg-[#420039] p-1 flex items-center rounded-sm w-[60vw]">
                  <button
                    onClick={() => setLossIncrease(0)}
                    className="w-full bg-gradient-to-r from-[#F1324D] to-[#2414E3] rounded-sm py-2 text-white text-sm"
                  >
                    Reset
                  </button>
                  <span className="w-full items-center justify-center text-white text-right pr-3 text-sm">Increase by:</span>
                </div>
                <div className="flex items-center px-2 w-[40vw]">
                  <input type="number" className="bg-transparent outline-none border-none text-white w-full text-sm" value={lossIncrease} onChange={(e) => setLossIncrease(e.target.value)} />
                  <span className="text-xs text-gray-400">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stop on Profit */}
          <div className="mb-4">
            <label className="block text-sm text-white mb-1">Stop on profit</label>
            <div className="gradient-border">
            <div className="flex items-center bg-[#120521] p-2 py-3 rounded-sm">
              <input type="number" className="bg-transparent outline-none border-none text-white w-full" value={stopProfit} onChange={(e) => setStopProfit(e.target.value)} />
              <Image
                  src="/coin.png"
                  width={20}
                  height={20}
                  alt="coin"
                  className=""
                />  
            </div>
            </div>
          </div>

          {/* Stop on Loss */}
          <div className="mb-4">
            <label className="block text-sm text-white mb-1">Stop on Loss</label>
            <div className="gradient-border">
            <div className="flex items-center bg-[#120521] p-2 py-3 rounded-sm">
              <input type="number" className="bg-transparent outline-none border-none text-white w-full" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
              <Image
                  src="/coin.png"
                  width={20}
                  height={20}
                  alt="coin"
                  className=""
                />  
            </div>
            </div>
          </div>
        </>
      )}

      {/* Start AutoBet Button */}
      <button
        onClick={() => {
          if (gameMode === "auto") {
            autoBet({
              numberOfBets,
              winIncrease: winIncrease / 100,
              lossIncrease: lossIncrease / 100,
              stopProfit,
              stopLoss,
              betAmount,
              risk,
              noOfSegments,
            });
          } else {
            manulBet();
          }
        }}
        disabled={isSpinning || betAmount <= 0 || betAmount > balance || balance <= 0}
        className={`py-3 mt-4 rounded-lg text-center font-semibold transition-all w-full border-2 ${
          isSpinning || betAmount <= 0 || betAmount > balance || balance <= 0
            ? "bg-gray-700 text-gray-500 cursor-not-allowed border-gray-500"
            : "bg-gradient-to-r from-[#F1324E3] to-[#2414E3] text-white hover:from-[#e82f49] hover:to-[#2112e1] border-white shadow-lg hover:border-yellow-300 hover:shadow-yellow-300/25"
        }`}
      >
        <span className="font-bold text-lg">
          {gameMode === "auto" ? "Start Autobet" : "Start Bet"}
        </span>
      </button>

    </div>
  );
};

export default BettingPanel;