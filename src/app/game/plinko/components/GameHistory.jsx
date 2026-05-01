"use client";
import React, { useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";

export default function GameHistory({ history }) {
  const [visibleCount, setVisibleCount] = useState(5);
  const [renderKey, setRenderKey] = useState(0);
  
  // Debug: Log history data to see if midnightTxHash is present
  console.log('🎮 GameHistory received history:', history?.map(item => ({
    id: item.id,
    game: item.game,
    midnightTxHash: item.midnightTxHash,
    midnightStatus: item.midnightStatus,
    entropyProof: !!item.entropyProof,
    timestamp: item.timestamp
  })));
  
  // Force re-render when history changes
  React.useEffect(() => {
    console.log('🔄 GameHistory re-rendered, history length:', history?.length);
    console.log('🔍 First item midnight status:', history?.[0]?.midnightTxHash);
    setRenderKey(prev => prev + 1); // Force re-render
  }, [history]);
  
  // Additional debug for midnight tx changes
  React.useEffect(() => {
    const midnightTxHashes = history?.map(item => item.midnightTxHash).filter(Boolean);
    console.log('🔗 Midnight tx hashes in history:', midnightTxHashes);
    if (midnightTxHashes.length > 0) {
      setRenderKey(prev => prev + 1); // Force re-render when midnight tx appears
    }
  }, [history?.map(item => item.midnightTxHash).join(',')]);
  
  // Open Entropy Explorer link
  const openEntropyExplorer = (txHash) => {
    if (txHash) {
      const entropyExplorerUrl = `https://entropy-explorer.pyth.network/?chain=midnight-network&search=${txHash}`;
      window.open(entropyExplorerUrl, '_blank');
    }
  };

  // Open Midnight Explorer link
  const openMidnightExplorer = (txHash) => {
    if (txHash) {
      const midnightExplorerUrl = `https://amoy.midnightscan.com/tx/${txHash}`;
      window.open(midnightExplorerUrl, '_blank');
    }
  };

  // Open Arbiscan link for transaction hash
  const openArbiscan = (hash) => {
    if (hash && hash !== 'unknown') {
      const network = process.env.NEXT_PUBLIC_NETWORK || 'midnight-network';
      let explorerUrl;
      
      if (network === 'midnight-network') {
        explorerUrl = `https://sepolia.arbiscan.io/tx/${hash}`;
      } else if (network === 'midnight-one') {
        explorerUrl = `https://arbiscan.io/tx/${hash}`;
      } else {
        explorerUrl = `https://sepolia.etherscan.io/tx/${hash}`;
      }
      
      window.open(explorerUrl, '_blank');
    }
  };
  
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Game History</h3>
        {history.length > visibleCount && (
          <button
            onClick={() => setVisibleCount((c) => Math.min(c + 5, history.length))}
            className="bg-[#2A0025] border border-[#333947] rounded-lg px-3 py-2 text-sm text-white hover:bg-[#3A0035] transition-colors"
          >
            Show more
          </button>
        )}
      </div>

      {/* Game History Table */}
      <div className="overflow-x-auto" key={renderKey}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#333947]">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                Game
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                Title
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                Bet amount
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                Multiplier
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                Payout
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                Entropy Explorer
              </th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0, visibleCount).map((game) => (
              <tr key={game.id} className="border-b border-[#333947]/30 hover:bg-[#2A0025]/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-midnight-blue to-midnight-blue rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">P</span>
                    </div>
                    <span className="text-white text-sm">Plinko</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-300 text-sm">{game.title}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span className="text-white text-sm">{game.betAmount}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-300 text-sm">{game.multiplier}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span className="text-white text-sm">{game.payout}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    {game.entropyProof ? (
                      <>
                        <div className="text-xs text-gray-300 font-mono">
                          <div className="text-yellow-400 font-bold">{game.entropyProof.sequenceNumber && game.entropyProof.sequenceNumber !== '0' ? String(game.entropyProof.sequenceNumber) : ''}</div>
                        </div>
                        <div className="flex gap-1">
                          {/* Debug: Show midnight tx hash status */}
                          {console.log(`🔍 Game ${game.id} - midnightTxHash:`, game.midnightTxHash, 'Type:', typeof game.midnightTxHash)}
                          
                          {/* Midnight Network Game Log Link - Only show if tx hash exists */}
                          {game.midnightTxHash && game.midnightTxHash !== 'timeout' && game.midnightTxHash !== 'failed' ? (
                            <button
                              onClick={() => {
                                console.log('🔗 Opening Midnight explorer for tx:', game.midnightTxHash);
                                window.open(`https://amoy.midnightscan.com/tx/${game.midnightTxHash}`, '_blank');
                              }}
                              className="flex items-center gap-1 px-2 py-1 bg-[#8B2398]/10 border border-[#8B2398]/30 rounded text-[#8B2398] text-xs hover:bg-[#8B2398]/20 transition-colors"
                            >
                              <FaExternalLinkAlt size={8} />
                              Midnight
                            </button>
                          ) : (
                            <div className="text-xs text-gray-500">
                              {game.midnightTxHash ? `Status: ${game.midnightTxHash}` : 'No Midnight TX'}
                            </div>
                          )}
                          {game.entropyProof.transactionHash && game.entropyProof.transactionHash !== 'timeout' ? (
                            <button
                              onClick={() => openEntropyExplorer(game.entropyProof.transactionHash)}
                              className="flex items-center gap-1 px-2 py-1 bg-[#681DDB]/10 border border-[#681DDB]/30 rounded text-[#681DDB] text-xs hover:bg-[#681DDB]/20 transition-colors"
                            >
                              <FaExternalLinkAlt size={8} />
                              Entropy
                            </button>
                          ) : game.entropyProof.status === 'timeout' ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-500 text-xs" title="Entropy generation timed out">
                              ⏰ Entropy Timeout
                            </div>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEntropyExplorer(game.id)}
                          className="flex items-center gap-1 px-2 py-1 bg-[#681DDB]/10 border border-[#681DDB]/30 rounded text-[#681DDB] text-xs hover:bg-[#681DDB]/20 transition-colors"
                        >
                          <FaExternalLinkAlt size={8} />
                          Entropy
                        </button>
                        <button
                          onClick={() => openMidnightExplorer(game.id)}
                          className="flex items-center gap-1 px-2 py-1 bg-[#8B2398]/10 border border-[#8B2398]/30 rounded text-[#8B2398] text-xs hover:bg-[#8B2398]/20 transition-colors"
                        >
                          <FaExternalLinkAlt size={8} />
                          Midnight
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {history.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#2A0025] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400">📊</span>
          </div>
          <p className="text-gray-400 text-sm">No games played yet</p>
          <p className="text-gray-500 text-xs mt-1">Start playing to see your game history</p>
        </div>
      )}

      <div className="mt-4 text-center text-gray-400 text-sm">
        Showing {Math.min(visibleCount, history.length)} of {history.length} entries
      </div>
    </div>
  );
}
