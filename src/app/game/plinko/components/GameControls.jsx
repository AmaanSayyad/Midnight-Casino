"use client";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";
import { useSelector } from 'react-redux';
import useWalletStatus from '@/hooks/useWalletStatus';
import pythEntropyService from '@/services/PythEntropyService';

export default function GameControls({ onBet, onRowChange, onRiskLevelChange, onBetAmountChange, initialRows = 16, initialRiskLevel = "Medium" }) {
  const userBalance = useSelector((state) => state.balance.userBalance);
  const { isConnected } = useWalletStatus();
  
  const [gameMode, setGameMode] = useState("manual");
  const [betAmount, setBetAmount] = useState("0.001");
  const [numberOfBets, setNumberOfBets] = useState("1");
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [riskLevel, setRiskLevel] = useState(initialRiskLevel);
  const [rows, setRows] = useState(initialRows);
  const [showRiskDropdown, setShowRiskDropdown] = useState(false);
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);
  const [autoBetInterval, setAutoBetInterval] = useState(null);

  const riskLevels = ["Low", "Medium", "High"];
  const rowOptions = [8, 9, 10, 11, 12, 13, 14, 15, 16];


  // Update local state when props change
  useEffect(() => {
    setRiskLevel(initialRiskLevel);
    setRows(initialRows);
  }, [initialRiskLevel, initialRows]);

  // Notify parent component when bet amount changes
  useEffect(() => {
    if (onBetAmountChange) {
      const numericBetAmount = parseFloat(betAmount) || 0;
      onBetAmountChange(numericBetAmount);
      console.log('GameControls: Bet amount changed, notifying parent:', numericBetAmount);
    }
  }, [betAmount, onBetAmountChange]);

  // Cleanup auto betting interval when component unmounts or game mode changes
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting/mode changing, cleaning up all auto betting intervals');
      
      // Clear main interval
      if (autoBetInterval) {
        console.log('🧹 Clearing main auto betting interval:', autoBetInterval);
        clearInterval(autoBetInterval);
      }
      
      // Clear all window intervals
      if (window.autoBetIntervals && window.autoBetIntervals.length > 0) {
        console.log('🧹 Clearing all window intervals:', window.autoBetIntervals);
        window.autoBetIntervals.forEach(intervalId => {
          console.log('🧹 Clearing interval:', intervalId);
          clearInterval(intervalId);
        });
        window.autoBetIntervals = [];
      }
      
      // Force stop auto playing
      setIsAutoPlaying(false);
    };
  }, [autoBetInterval, gameMode]);

  const handleBetAmountChange = (value) => {
    // Allow user to type freely
    if (typeof value === 'string') {
      // If it's a string (from input), just set it as is
      setBetAmount(value);
      
      // Also notify parent with parsed value
      const numValue = parseFloat(value) || 0;
      if (onBetAmountChange) {
        onBetAmountChange(numValue);
      }
      return;
    }
    
    // If it's a number (from buttons), format it
    const numValue = parseFloat(value) || 0.001;
    setBetAmount(numValue.toFixed(3));
    
    // Notify parent component about bet amount change
    if (onBetAmountChange) {
      onBetAmountChange(numValue);
    }
  };

  const handleHalfBet = () => {
    const currentBet = parseFloat(betAmount) || 0.001;
    const newBet = Math.max((currentBet / 2), 0.001).toFixed(3);
    setBetAmount(newBet);
    
    // Notify parent component
    if (onBetAmountChange) {
      onBetAmountChange(parseFloat(newBet));
    }
  };

  const handleDoubleBet = () => {
    const currentBet = parseFloat(betAmount) || 0.001;
    const newBet = (currentBet * 2).toFixed(3);
    setBetAmount(newBet);
    
    // Notify parent component
    if (onBetAmountChange) {
      onBetAmountChange(parseFloat(newBet));
    }
  };

  const handleBet = () => {
    // Check if wallet is connected
    console.log('🔌 Plinko Bet - Wallet Status:', { 
      isConnected, 
      userBalance,
      windowEthereum: !!window.ethereum,
      windowEthereumConnected: window.ethereum?.isConnected?.(),
      windowEthereumAccount: window.ethereum?.selectedAddress
    });
    if (!isConnected) {
      alert("Please connect your Ethereum wallet first to play Plinko!");
      return;
    }
    
    const betValue = parseFloat(betAmount);
    const currentBalance = parseFloat(userBalance);
    
    console.log('handleBet called with betValue:', betValue, 'currentBalance (ETH):', currentBalance);
    
    if (betValue < 0.001) {
      alert("Minimum bet amount is 0.001 MATIC");
      return;
    }
    
    if (betValue > currentBalance) {
      alert(`Insufficient balance! You have ${currentBalance.toFixed(5)} MATIC but need ${betValue} MATIC`);
      return;
    }
    
    if (onBetAmountChange) {
      onBetAmountChange(betValue);
    }
    
    if (gameMode === "auto") {
      console.log('Starting auto betting...');
      startAutoBetting();
    } else if (onBet) {
      console.log('Manual bet...');
      onBet();
    }
  };

  const startAutoBetting = () => {
    console.log('🚀 Starting auto betting...');
    
    // Set auto playing to true immediately
    setIsAutoPlaying(true);
    
    // Clear any existing intervals first
    if (autoBetInterval) {
      console.log('🧹 Clearing existing auto bet interval:', autoBetInterval);
      clearInterval(autoBetInterval);
      setAutoBetInterval(null);
    }
    
    // Clear window intervals
    if (window.autoBetIntervals && window.autoBetIntervals.length > 0) {
      console.log('🧹 Clearing existing window intervals:', window.autoBetIntervals);
      window.autoBetIntervals.forEach(intervalId => clearInterval(intervalId));
      window.autoBetIntervals = [];
    }
    
    const totalBets = parseInt(numberOfBets) || 1;
    let currentBet = 0;
    let localCurrentBet = 0; // Local variable for interval
    
    // Check if we have enough balance for all bets
    const totalBetAmount = totalBets * parseFloat(betAmount);
    const currentBalance = parseFloat(userBalance);
    
    console.log('Auto betting balance check:', {
      totalBets,
      betAmount,
      totalBetAmount,
      currentBalance,
      balanceInETH: currentBalance.toFixed(5)
    });
    
    if (totalBetAmount > currentBalance) {
      alert(`Insufficient balance for ${totalBets} bets of ${betAmount} MATIC each. You need ${totalBetAmount.toFixed(3)} MATIC but have ${currentBalance.toFixed(5)} MATIC`);
      setIsAutoPlaying(false);
      return;
    }

    
    console.log('Auto betting started with', totalBets, 'bets');
    console.log('onBet function exists:', !!onBet);
    
    // Start first bet immediately
    if (onBet) {
      console.log('First bet starting...');
      // Notify parent that auto betting has started
      if (onBetAmountChange) {
        onBetAmountChange(parseFloat(betAmount));
      }
      onBet();
      currentBet++;
      localCurrentBet++;
      setNumberOfBets((totalBets - localCurrentBet).toString());
      console.log('First bet completed, currentBet:', currentBet, 'localCurrentBet:', localCurrentBet, 'remaining:', totalBets - localCurrentBet);
    }
    
    // Then continue with recursive setTimeout instead of setInterval
    let shouldContinue = true;
    
    const scheduleNextBet = async () => {
      console.log('🔄 Scheduling next bet, localCurrentBet:', localCurrentBet, 'totalBets:', totalBets, 'shouldContinue:', shouldContinue);
      
      // Check if auto betting was stopped
      if (!shouldContinue) {
        console.log('🛑 Auto betting was stopped, stopping recursive calls');
        setIsAutoPlaying(false);
        setAutoBetInterval(null);
        
        // Reset to original value when auto betting is stopped
        setNumberOfBets("1");
        return;
      }
      
      if (localCurrentBet >= totalBets) {
        console.log('✅ Auto betting finished - all bets completed');
        setIsAutoPlaying(false);
        setAutoBetInterval(null);
        
        // Reset to original value when all bets are completed
        setNumberOfBets("1");
        return;
      }
      
      
      if (onBet) {
        console.log('🎲 Auto bet', localCurrentBet + 1, 'starting...');
        // Notify parent about each auto bet
        if (onBetAmountChange) {
          onBetAmountChange(parseFloat(betAmount));
        }
        onBet();
        localCurrentBet++;
        // Update the remaining bets count
        setNumberOfBets((totalBets - localCurrentBet).toString());
        console.log('🎯 Auto bet completed, localCurrentBet:', localCurrentBet, 'remaining:', totalBets - localCurrentBet);
        
        // Schedule next bet after 1 second
        setTimeout(() => scheduleNextBet(), 1000);
      }
    };
    
    // Schedule the first recursive bet
    setTimeout(() => scheduleNextBet(), 1000);
    
    // Store the shouldContinue reference in window for stopAutoBetting to access
    if (!window.autoBetShouldContinue) {
      window.autoBetShouldContinue = {};
    }
    window.autoBetShouldContinue['current'] = { shouldContinue, setShouldContinue: (value) => { shouldContinue = value; } };
    
    console.log('✅ Auto bet recursive scheduling started');
  };

  const stopAutoBetting = () => {
    console.log('🛑 Stop auto betting called');
    
    // Force stop auto playing first
    setIsAutoPlaying(false);
    
    // Set shouldContinue to false for all active auto betting
    if (window.autoBetShouldContinue) {
      Object.values(window.autoBetShouldContinue).forEach(({ setShouldContinue }) => {
        setShouldContinue(false);
      });
    }
    
    // Clear shouldContinue references
    if (window.autoBetShouldContinue) {
      window.autoBetShouldContinue = {};
    }
    
    // Reset numberOfBets to original value when stopping
    setNumberOfBets("1");
    
    console.log('✅ Auto betting stopped successfully');
  };

  const handleRowChange = (newRows) => {
    setRows(newRows);
    setShowRowsDropdown(false);
    
    // Don't reset bet amount, keep it for consistency
    console.log('GameControls: Row changed, keeping bet amount:', betAmount);
    
    // Notify parent component about row change
    if (onRowChange) {
      onRowChange(newRows);
    }
  };

  const handleRiskLevelChange = (newRiskLevel) => {
    setRiskLevel(newRiskLevel);
    setShowRiskDropdown(false);
    
    // Don't reset bet amount, keep it for consistency
    console.log('GameControls: Risk level changed, keeping bet amount:', betAmount);
    
    // Notify parent component about risk level change
    if (onRiskLevelChange) {
      onRiskLevelChange(newRiskLevel);
    }
  };

  // Check if user has sufficient balance for current bet
  const hasSufficientBalance = () => {
    if (!isConnected) return false;
    const betValue = parseFloat(betAmount);
    const currentBalance = parseFloat(userBalance);
    return betValue <= currentBalance && betValue >= 0.001;
  };

  // Check if user has sufficient balance for auto betting
  const hasSufficientBalanceForAutoBet = () => {
    if (!isConnected) return false;
    const betValue = parseFloat(betAmount);
    const totalBets = parseInt(numberOfBets) || 1;
    const totalBetAmount = totalBets * betValue;
    const currentBalance = parseFloat(userBalance);
    return totalBetAmount <= currentBalance && betValue >= 0.001;
  };

  // Get current balance in MATIC for display
  const getCurrentBalanceInMATIC = () => {
    return parseFloat(userBalance || '0').toFixed(5);
  };

  return (
    <div className="bg-[#1A0015] rounded-xl border border-[#333947] p-6">

      {/* Mode Toggle */}
      <div className="mb-6">
        <div className="flex bg-[#2A0025] rounded-lg p-1">
          <button
            onClick={() => setGameMode("manual")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              gameMode === "manual"
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setGameMode("auto")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              gameMode === "auto"
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Auto
          </button>
        </div>
      </div>

      {/* Bet Amount */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Bet Amount
        </label>
        <div className="mb-2">
          <span className="text-2xl font-bold text-white">{betAmount} MATIC</span>
        </div>
        <div className="relative">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => handleBetAmountChange(e.target.value)}
            onBlur={(e) => {
              const numValue = parseFloat(e.target.value) || 0.001;
              // Use more decimal places to handle small values like 0.001
              setBetAmount(numValue.toFixed(3));
              if (onBetAmountChange) {
                onBetAmountChange(numValue);
              }
            }}
            className="w-full bg-[#2A0025] border border-[#333947] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            placeholder="0.001"
            step="0.001"
            min="0.001"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex flex-col">
            <button
              onClick={() => handleBetAmountChange(parseFloat(betAmount || 0) + 0.001)}
              className="text-gray-400 hover:text-white p-1"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleBetAmountChange(parseFloat(betAmount || 0) - 0.001)}
              className="text-gray-400 hover:text-white p-1"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleHalfBet}
            className="flex-1 bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-sm text-white hover:bg-[#3A0035] transition-colors"
          >
            1/2
          </button>
          <button
            onClick={handleDoubleBet}
            className="flex-1 bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-sm text-white hover:bg-[#3A0035] transition-colors"
          >
            2x
          </button>
        </div>
        
        {/* Quick Bet Amounts */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button
            onClick={() => handleBetAmountChange(0.001)}
            className="bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-xs text-white hover:bg-[#3A0035] transition-colors"
          >
            0.001 MATIC
          </button>
          <button
            onClick={() => handleBetAmountChange(0.01)}
            className="bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-xs text-white hover:bg-[#3A0035] transition-colors"
          >
            0.01 MATIC
          </button>
          <button
            onClick={() => handleBetAmountChange(0.1)}
            className="bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-xs text-white hover:bg-[#3A0035] transition-colors"
          >
            0.1 MATIC
          </button>
          <button
            onClick={() => handleBetAmountChange(1)}
            className="bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-xs text-white hover:bg-[#3A0035] transition-colors"
          >
            1.0 MATIC
          </button>
          <button
            onClick={() => handleBetAmountChange(5)}
            className="bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-xs text-white hover:bg-[#3A0035] transition-colors"
          >
            5.0 MATIC
          </button>
          <button
            onClick={() => handleBetAmountChange(10)}
            className="bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-xs text-white hover:bg-[#3A0035] transition-colors"
          >
            10.0 MATIC
          </button>
        </div>
      </div>

      {/* Number of Bets - Only show in Auto mode */}
      {gameMode === "auto" && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {isAutoPlaying ? 'Remaining Bets' : 'Number of Bets'}
          </label>
          <input
            type="number"
            value={numberOfBets}
            onChange={(e) => setNumberOfBets(e.target.value)}
            className={`w-full border border-[#333947] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 ${
              isAutoPlaying ? 'bg-[#1A0015] cursor-not-allowed' : 'bg-[#2A0025]'
            }`}
            placeholder="1"
            step="1"
            min="1"
            max="100"
            readOnly={isAutoPlaying}
          />
          <div className="text-xs text-gray-400 mt-1">
            How many bets to place automatically
          </div>
        </div>
      )}

      {/* Risk Level */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Risk
        </label>
        <div className="relative">
          <button
            onClick={() => setShowRiskDropdown(!showRiskDropdown)}
            className="w-full bg-[#2A0025] border border-[#333947] rounded-lg px-4 py-3 text-white text-left flex items-center justify-between hover:bg-[#3A0035] transition-colors"
          >
            <span>{riskLevel}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showRiskDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2A0025] border border-[#333947] rounded-lg overflow-hidden z-10">
              {riskLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => handleRiskLevelChange(level)}
                  className="w-full px-4 py-2 text-left text-white hover:bg-[#3A0035] transition-colors"
                >
                  {level}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rows */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Rows (8-16)
        </label>
        <div className="relative">
          <button
            onClick={() => setShowRowsDropdown(!showRowsDropdown)}
            className="w-full bg-[#2A0025] border border-[#333947] rounded-lg px-4 py-3 text-white text-left flex items-center justify-between hover:bg-[#3A0035] transition-colors"
          >
            <span>{rows}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showRowsDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2A0025] border border-[#333947] rounded-lg overflow-hidden z-10 max-h-40 overflow-y-auto">
              {rowOptions.map((row) => (
                <button
                  key={row}
                  onClick={() => handleRowChange(row)}
                  className="w-full px-4 py-2 text-left text-white hover:bg-[#3A0035] transition-colors"
                >
                  {row}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          More rows = more complex gameplay
        </div>
      </div>

      {/* Bet Button */}
      {gameMode === "auto" && isAutoPlaying ? (
        <button 
          onClick={stopAutoBetting}
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-4 px-6 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105"
        >
          Stop Auto Betting ({numberOfBets} bets remaining)
        </button>
      ) : (
        <div className="space-y-3">
          {/* Current Balance Display */}
          <div className="text-center p-3 bg-[#2A0025] rounded-lg border border-[#333947]">
            <span className="text-sm text-gray-400">Current Balance:</span>
            {isConnected ? (
              <div className="text-lg font-bold text-green-400">{getCurrentBalanceInMATIC()} MATIC</div>
            ) : (
              <div className="text-lg font-bold text-red-400">Connect Wallet</div>
            )}
          </div>
          
          {/* Bet Button */}
          <button 
            onClick={gameMode === "auto" ? startAutoBetting : handleBet}
            disabled={gameMode === "auto" ? !hasSufficientBalanceForAutoBet() : !hasSufficientBalance()}
            className={`w-full font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 ${
              (gameMode === "auto" ? hasSufficientBalanceForAutoBet() : hasSufficientBalance())
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {gameMode === "auto" ? `Start Auto Betting (${numberOfBets} bets)` : "Bet"}
          </button>
          
          {/* Insufficient Balance Warning */}
          {((gameMode === "auto" && !hasSufficientBalanceForAutoBet()) || (!gameMode === "auto" && !hasSufficientBalance())) && parseFloat(betAmount) > 0 && (
            <div className="text-center text-red-400 text-sm">
              {gameMode === "auto" 
                ? `Insufficient balance MATIC each` 
                : `Insufficient balance MATIC bet`
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}
