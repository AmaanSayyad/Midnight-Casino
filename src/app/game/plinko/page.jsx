"use client";
import { useState, useRef, useEffect } from "react";
import PlinkoGame from "./components/PlinkoGame";
import GameHistory from "./components/GameHistory";
import GameControls from "./components/GameControls";
import PlinkoStrategyGuide from "./components/PlinkoStrategyGuide";
import PlinkoWinProbabilities from "./components/PlinkoWinProbabilities";
import PlinkoPayouts from "./components/PlinkoPayouts";
import PlinkoLeaderboard from "./components/PlinkoLeaderboard";
import { gameData, bettingTableData } from "./config/gameDetail";
import { useSelector } from 'react-redux';
import { motion } from "framer-motion";
import { Typography } from "@mui/material";
import { GiRollingDices, GiCardRandom, GiPokerHand } from "react-icons/gi";
import { FaPercentage, FaBalanceScale, FaChartLine, FaCoins, FaTrophy, FaPlay, FaExternalLinkAlt } from "react-icons/fa";
import pythEntropyService from '../../../services/PythEntropyService';
import { generateEntropyWithFallback } from '@/lib/midnight/localEntropy';

export default function Plinko() {
  const userBalance = useSelector((state) => state.balance.userBalance);
  
  const [currentRows, setCurrentRows] = useState(15);
  const [currentRiskLevel, setCurrentRiskLevel] = useState("Medium");
  const [currentBetAmount, setCurrentBetAmount] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  const plinkoGameRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('plinkoHistory');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) setGameHistory(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('plinkoHistory', JSON.stringify(gameHistory.slice(0, 100)));
    } catch {
      // ignore
    }
  }, [gameHistory]);

  // Smooth scroll helper
  const scrollToElement = (elementId) => {
    if (typeof window === 'undefined') return;
    const element = document.getElementById(elementId);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Show mobile warning on first load if device is mobile-sized
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (isMobile) {
        setShowMobileWarning(true);
      }
    }
  }, []);

  // Header component adapted from Roulette header
  const PlinkoHeader = () => {
    const gameStatistics = {
      totalBets: '1,234,567',
      totalVolume: '5.2M tNIGHT',
      maxWin: '120,000 tNIGHT'
    };
    return (
      <div className="relative text-white px-4 md:px-8 lg:px-20 mb-8 pt-28 md:pt-32 lg:pt-36 mt-6">
        <div className="absolute top-6 -right-24 w-64 h-64 bg-midnight-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute top-24 left-1/3 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-20 left-1/4 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl"></div>

        <div className="relative">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            {/* Left Column - Game Info */}
            <div className="md:w-1/2">
              <div className="flex items-center">
                <div className="mr-3 p-3 bg-gradient-to-br from-midnight-black/40 to-fuchsia-700/10 rounded-lg shadow-lg shadow-midnight-blue/10 border border-midnight-blue/15">
                  <GiRollingDices className="text-3xl text-fuchsia-300" />
                </div>
                <div>
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm text-gray-400 font-sans">Games / Plinko</p>
                    <span className="text-xs px-2 py-0.5 bg-midnight-blue/20 rounded-full text-blue-300 font-display">Classic</span>
                    <span className="text-xs px-2 py-0.5 bg-green-900/30 rounded-full text-green-300 font-display">Live</span>
                  </motion.div>
                  <motion.h1
                    className="text-3xl md:text-4xl font-bold font-display bg-gradient-to-r from-pink-300 to-amber-300 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    Plinko
                  </motion.h1>
                </div>
              </div>
              <motion.p
                className="text-white/70 mt-2 max-w-xl font-sans"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Choose your bet, risk level and rows, then drop the ball and watch it bounce through the pegs to a multiplier slot.
              </motion.p>

              {/* Game highlights */}
              <motion.div
                className="flex flex-wrap gap-4 mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center text-sm bg-gradient-to-r from-midnight-blue/20 to-fuchsia-800/10 px-3 py-1.5 rounded-full">
                  <FaPercentage className="mr-1.5 text-amber-400" />
                  <span className="font-sans">Configurable risk</span>
                </div>
                <div className="flex items-center text-sm bg-gradient-to-r from-midnight-blue/20 to-fuchsia-800/10 px-3 py-1.5 rounded-full">
                  <GiPokerHand className="mr-1.5 text-blue-400" />
                  <span className="font-sans">8–16 rows</span>
                </div>
                <div className="flex items-center text-sm bg-gradient-to-r from-midnight-blue/20 to-fuchsia-800/10 px-3 py-1.5 rounded-full">
                  <FaBalanceScale className="mr-1.5 text-green-400" />
                  <span className="font-sans">Provably fair</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Stats and Quick links */}
            <div className="md:w-1/2">
              <div className="bg-gradient-to-br from-midnight-blue/15 to-fuchsia-800/5 rounded-xl p-4 border border-midnight-blue/15 shadow-lg shadow-midnight-blue/10">
                <motion.div
                  className="grid grid-cols-3 gap-2 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20 mb-1">
                      <FaChartLine className="text-blue-400" />
                    </div>
                    <div className="text-xs text-white/50 font-sans text-center">Total Bets</div>
                    <div className="text-white font-display text-sm md:text-base">{gameStatistics.totalBets}</div>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600/20 mb-1">
                      <FaCoins className="text-yellow-400" />
                    </div>
                    <div className="text-xs text-white/50 font-sans text-center">Volume</div>
                    <div className="text-white font-display text-sm md:text-base">{gameStatistics.totalVolume}</div>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600/20 mb-1">
                      <FaTrophy className="text-yellow-500" />
                    </div>
                    <div className="text-xs text-white/50 font-sans text-center">Max Win</div>
                    <div className="text-white font-display text-sm md:text-base">{gameStatistics.maxWin}</div>
                  </div>
                </motion.div>

                <motion.div
                  className="flex flex-wrap justify-between gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <button onClick={() => scrollToElement('strategy')} className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-midnight-blue/20 to-fuchsia-900/20 rounded-lg text-white font-medium text-sm hover:from-midnight-blue/20 hover:to-fuchsia-800/20 transition-all duration-300">
                    <GiCardRandom className="mr-2" />
                    Strategy Guide
                  </button>
                  <button onClick={() => scrollToElement('payouts')} className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-800/40 to-blue-900/20 rounded-lg text-white font-medium text-sm hover:from-blue-700/40 hover:to-blue-800/20 transition-all duration-300">
                    <FaCoins className="mr-2" />
                    Payout Tables
                  </button>
                  <button onClick={() => scrollToElement('history')} className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-midnight-blue/20 to-midnight-blue/15 rounded-lg text-white font-medium text-sm hover:from-midnight-blue/20 hover:to-midnight-blue/15 transition-all duration-300">
                    <FaChartLine className="mr-2" />
                    Game History
                  </button>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="w-full h-0.5 bg-gradient-to-r from-midnight-blue via-blue-500/30 to-transparent mt-6"></div>
        </div>
      </div>
    );
  };

  const handleBetAmountChange = (amount) => {
    console.log('Main page received bet amount:', amount);
    setCurrentBetAmount(amount);
  };

  const handleBet = () => {
    // Trigger the ball dropping animation in PlinkoGame. balance tNIGHT
    console.log('Main page handleBet called');
    if (plinkoGameRef.current && plinkoGameRef.current.dropBall) {
      plinkoGameRef.current.dropBall();
    }
  };

  const handleBetHistoryChange = async (newBetResult) => {
    const startTime = Date.now();
    console.log('🔍 handleBetHistoryChange called with:', newBetResult);
    console.log('⏱️ Start time:', new Date(startTime).toISOString());
    
    // Check if this is an update with Midnight transaction hash
    if (newBetResult.midnightTxHash) {
      console.log('📝 Updating existing game history with Midnight tx:', newBetResult.midnightTxHash);
      console.log('🔍 Looking for entry with ID:', newBetResult.id);
      setGameHistory(prev => {
        console.log('📊 Current history length:', prev.length);
        console.log('📊 Current history IDs:', prev.map(item => item.id));
        
        const updatedHistory = [...prev];
        // Find the matching entry by ID and update it
        const index = updatedHistory.findIndex(item => item.id === newBetResult.id);
        console.log('🔍 Found entry at index:', index);
        
        if (index >= 0) {
          updatedHistory[index] = {
            ...updatedHistory[index],
            midnightTxHash: newBetResult.midnightTxHash,
            midnightExplorerUrl: newBetResult.midnightExplorerUrl,
            midnightStatus: 'completed'
          };
          console.log('✅ Updated game history entry with Midnight tx:', updatedHistory[index]);
        } else {
          console.warn('⚠️ Could not find entry to update with Midnight tx');
          // If we can't find the entry, add it as a new entry with Midnight tx
          console.log('📝 Adding new entry with Midnight tx since original not found');
          const newEntry = {
            ...newBetResult,
            midnightStatus: 'completed'
          };
          updatedHistory.unshift(newEntry);
        }
        return updatedHistory;
      });
      return; // Don't process Pyth Entropy again for updates
    }
    
    // Store the bet result immediately to ensure it exists for Midnight updates
    const immediateResult = {
      ...newBetResult,
      timestamp: new Date().toISOString(),
      midnightTxHash: null, // Will be updated later
      midnightStatus: 'pending'
    };
    
    // Add to history immediately so Midnight updates can find it
    setGameHistory(prev => [immediateResult, ...prev].slice(0, 100));
    
    // Use entropy with fast local fallback (no more Entropy Timeout badges)
    try {
      console.log('🎯 Generating Plinko entropy…');
      const randomData = await generateEntropyWithFallback(
        pythEntropyService,
        'PLINKO',
        { purpose: 'plinko_ball_path', gameType: 'PLINKO' },
        4000,
      );

      setGameHistory(prev => {
        const updatedHistory = [...prev];
        const index = updatedHistory.findIndex(item => item.id === newBetResult.id);
        if (index >= 0) {
          updatedHistory[index] = {
            ...updatedHistory[index],
            entropyProof: {
              requestId: randomData.entropyProof?.requestId,
              sequenceNumber: randomData.entropyProof?.sequenceNumber,
              randomValue: randomData.randomValue,
              transactionHash: randomData.entropyProof?.transactionHash,
              timestamp: randomData.entropyProof?.timestamp,
              status: randomData.entropyProof?.status || 'ok',
              source: randomData.entropyProof?.source,
            }
          };
        }
        return updatedHistory;
      });
    } catch (error) {
      console.error('❌ Entropy for Plinko:', error);
    }
  };

  const handleRowChange = (newRows) => {
    console.log('Main page: Row change requested to:', newRows);
    setCurrentRows(newRows);
    // Don't reset bet amount, let GameControls handle it
    console.log('Main page: Row changed, keeping bet amount:', currentBetAmount);
    // The PlinkoGame component will automatically update when the rowCount prop changes
  };

  const handleRiskLevelChange = (newRiskLevel) => {
    console.log('Main page: Risk level change requested to:', newRiskLevel);
    setCurrentRiskLevel(newRiskLevel);
    // Don't reset bet amount, let GameControls handle it
    console.log('Main page: Risk level changed, keeping bet amount:', currentBetAmount);
    // The PlinkoGame component will automatically update when the riskLevel prop changes
  };

  return (
    <div className="min-h-screen bg-[#070005] text-white game-page-container">
      {showMobileWarning && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4">
          <div className="bg-[#0A0A0A] border border-[#333947] rounded-xl p-6 max-w-md w-full text-center">
            <h3 className="text-xl font-semibold text-white mb-3">Desktop Mode Recommended</h3>
            <p className="text-gray-300 text-sm mb-4">
              For the best experience, please switch your mobile browser to Desktop Mode. The Plinko board and physics may not work correctly on small screens.
            </p>
            <button
              onClick={() => setShowMobileWarning(false)}
              className="w-full bg-gradient-to-r from-midnight-blue to-midnight-blue hover:from-midnight-blue hover:to-midnight-blue text-white font-medium py-3 rounded-lg"
            >
              I understand, continue
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <PlinkoHeader />

      {/* Main Game Area */}
      <div className="px-4 md:px-8 lg:px-20 pb-12">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Left Panel - Game Controls */}
          <div className="w-full xl:w-1/4">
            <GameControls 
              onBet={handleBet} 
              onRowChange={handleRowChange}
              onRiskLevelChange={handleRiskLevelChange}
              onBetAmountChange={handleBetAmountChange}
              initialRows={currentRows}
              initialRiskLevel={currentRiskLevel}
            />
          </div>

          {/* Right Panel - Plinko Board */}
          <div className="w-full xl:w-3/4" id="payouts">
            <PlinkoGame 
              key={`plinko-${currentRows}-${currentRiskLevel}`}
              ref={plinkoGameRef} 
              rowCount={currentRows}
              riskLevel={currentRiskLevel}
              onRowChange={handleRowChange}
              betAmount={currentBetAmount}
              onBetHistoryChange={handleBetHistoryChange}
            />
          </div>
        </div>
      </div>

      {/* Game Description with Video */}
      <div className="px-4 md:px-8 lg:px-20 pb-12">
        <Typography 
          variant="h4" 
          color="white" 
          sx={{ 
            mb: 6, 
            textAlign: 'center',
            background: 'linear-gradient(45deg, #d82633, #681DDB)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}
        >
          Master {gameData.title}
        </Typography>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Video on left */}
          <div>
            
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-midnight-blue/40 transition-all duration-300 hover:scale-[1.02] hover:border-midnight-blue/60"
              style={{
                background: 'linear-gradient(135deg, rgba(104, 29, 219, 0.1), rgba(216, 38, 51, 0.05))',
                border: '2px solid rgba(104, 29, 219, 0.4)'
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${gameData.youtube}?si=${gameData.youtube}`}
                title={`${gameData.title} Tutorial`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
          
          {/* Description on right */}
          <div className="bg-[#0A0A0A] rounded-xl border border-[#333947] p-6 text-gray-300">
            <h3 className="text-lg font-semibold text-white mb-4">How to Play {gameData.title}</h3>
            {gameData.paragraphs.map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Game History Section */}
      <div className="px-4 md:px-8 lg:px-20 pb-12" id="history">
        <div className="bg-[#0A0A0A] rounded-xl border border-[#333947] overflow-hidden">
          <div className="p-6">
            <GameHistory 
              key={gameHistory.length + '-' + (gameHistory[0]?.midnightTxHash || 'none')} 
              history={gameHistory} 
            />
          </div>
        </div>
      </div>

      {/* Strategy + Probabilities + (side-by-side) Payouts & Leaderboard */}
      <div className="px-4 md:px-8 lg:px-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <PlinkoStrategyGuide />
          </div>
          <div className="lg:col-span-1">
            <PlinkoWinProbabilities risk={currentRiskLevel} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlinkoPayouts />
          <PlinkoLeaderboard />
        </div>
      </div>
    </div>
  );
}