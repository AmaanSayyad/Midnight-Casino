'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaNetworkWired, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { GiMineExplosion } from 'react-icons/gi';
import usePythEntropy from '../hooks/usePythEntropy.js';

const PythEntropyStatus = ({ network = 'arbitrum-sepolia' }) => {
  const {
    isInitialized,
    isLoading,
    error,
    networkConfig,
    recentRequests,
    getNetworkStats,
    getExplorerUrl,
    formatRequestId,
    formatSequenceNumber,
    getStatusColor,
    getStatusIcon
  } = usePythEntropy(network);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Load network stats
  useEffect(() => {
    if (isInitialized) {
      loadStats();
    }
  }, [isInitialized]);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const networkStats = await getNetworkStats();
      if (networkStats) {
        setStats(networkStats);
      } else {
        console.log('Network stats not available');
      }
    } catch (err) {
      console.error('Failed to load network stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const getStatusIconLocal = (status) => {
    switch (status?.toLowerCase()) {
      case 'complete':
      case 'fulfilled':
        return <FaCheckCircle className="text-green-400" />;
      case 'pending':
        return <FaClock className="text-yellow-400" />;
      case 'failed':
      case 'error':
        return <FaExclamationTriangle className="text-red-400" />;
      default:
        return <FaInfoCircle className="text-gray-400" />;
    }
  };

  const getStatusColorLocal = (status) => {
    switch (status?.toLowerCase()) {
      case 'complete':
      case 'fulfilled':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!isInitialized && !isLoading) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Pyth Entropy not initialized. Please check your network connection.
      </Alert>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 2,
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        mb: 3
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          Pyth Entropy Status
        </Typography>
        
        {isLoading && <CircularProgress size={20} color="primary" />}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {networkConfig && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 1 }}>
            Network: {networkConfig.name} (Chain ID: {networkConfig.chainId})
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={isInitialized ? 'Connected' : 'Disconnected'}
              color={isInitialized ? 'success' : 'default'}
              size="small"
            />
            <Chip
              label="Pyth Entropy"
              color="primary"
              size="small"
            />
          </Box>
        </Box>
      )}

      {stats && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 1 }}>
            Network Statistics
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="white">
                {stats.totalRequests || 0}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                Total Requests
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="white">
                {stats.completedRequests || 0}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                Completed
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="white">
                {stats.pendingRequests || 0}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                Pending
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {recentRequests.length > 0 && (
        <Box>
          <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 1 }}>
            Recent Requests
          </Typography>
          
          <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
            {recentRequests.slice(0, 5).map((request, index) => (
              <Box
                key={request.requestId || index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1,
                  mb: 1,
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: 1,
                  border: '1px solid rgba(59, 130, 246, 0.1)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIconLocal(request.status)}
                  
                  <Box>
                    <Typography variant="caption" color="white" sx={{ fontFamily: 'monospace' }}>
                      {formatRequestId(request.requestId)}
                    </Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.7)" sx={{ display: 'block' }}>
                      {formatSequenceNumber(request.sequenceNumber)}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="caption"
                    className={getStatusColorLocal(request.status)}
                    sx={{ textTransform: 'capitalize' }}
                  >
                    {request.status || 'Unknown'}
                  </Typography>
                  
                  {request.transactionHash && (
                    <Tooltip title="View on Entropy Explorer">
                      <Button
                        size="small"
                        onClick={() => window.open(getExplorerUrl(request.transactionHash), '_blank')}
                        sx={{ 
                          minWidth: 'auto', 
                          p: 0.5,
                          color: 'rgba(59, 130, 246, 0.8)',
                          '&:hover': {
                            backgroundColor: 'rgba(59, 130, 246, 0.1)'
                          }
                        }}
                      >
                        <FaExternalLinkAlt size={12} />
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Button
          variant="outlined"
          size="small"
          onClick={loadStats}
          disabled={statsLoading}
          sx={{
            color: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 0.3)',
            '&:hover': {
              borderColor: 'rgba(59, 130, 246, 0.5)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }
          }}
        >
          {statsLoading ? <CircularProgress size={16} /> : 'Refresh Stats'}
        </Button>
      </Box>
    </Paper>
  );
};

export default PythEntropyStatus;
