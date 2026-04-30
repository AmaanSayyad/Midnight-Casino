"use client";
import React from 'react';
import { Box, Typography, Paper, Chip, IconButton, Tooltip } from '@mui/material';
import { OpenInNew, Verified, Security } from '@mui/icons-material';

const BettingHistory = ({ history }) => {
  const openMonadExplorer = (txHash) => {
    if (txHash) {
      const network = process.env.NEXT_PUBLIC_NETWORK || 'monad-testnet';
      let explorerUrl;
      
      if (network === 'monad-testnet') {
        explorerUrl = `https://testnet.monadexplorer.com/tx/${txHash}`;
      } else {
        explorerUrl = `https://testnet.monadexplorer.com/tx/${txHash}`;
      }
      
      window.open(explorerUrl, '_blank');
    }
  };

  const formatTxHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        maxHeight: '300px',
        overflowY: 'auto'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="primary">
          Betting History
        </Typography>
        <Chip
          icon={<Security />}
          label="VRF Verified"
          color="success"
          size="small"
          variant="outlined"
        />
      </Box>
      {history.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography color="text.secondary">
            No betting history yet
          </Typography>
        </Box>
      ) : (
        history.map((bet, index) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
              p: 1.5,
              borderRadius: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              },
              borderLeft: bet.won ? '4px solid #4caf50' : '4px solid #f44336'
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                {bet.type}
              </Typography>
              <Typography variant="body1" color="text.primary">
                {bet.amount} MATIC
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(bet.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography 
                variant="body1" 
                fontWeight="bold"
                color={bet.won ? 'success.main' : 'error.main'}
              >
                {bet.won ? '+' : '-'}{bet.payout} MATIC
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                  Result:
                </Typography>
                <Tooltip title={bet.vrfDetails?.transactionHash ? 'VRF Verified - Click to view' : 'Result'}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      color: 'white',
                      fontWeight: 'bold',
                      backgroundColor: bet.roll === 0 ? '#14D854' : 
                        [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(bet.roll) ? '#d82633' : '#333',
                      cursor: bet.vrfDetails?.transactionHash ? 'pointer' : 'default',
                      '&:hover': {
                        transform: bet.vrfDetails?.transactionHash ? 'scale(1.1)' : 'none'
                      }
                    }}
                    onClick={() => bet.vrfDetails?.transactionHash && openMonadExplorer(bet.vrfDetails.transactionHash)}
                  >
                    {bet.roll}
                    {bet.vrfDetails?.transactionHash && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -2,
                          right: -2,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#4CAF50',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Verified sx={{ fontSize: 6, color: 'white' }} />
                      </Box>
                    )}
                  </Box>
                </Tooltip>
              </Box>
              
              {/* VRF Transaction Details */}
              {bet.vrfDetails?.transactionHash && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                    VRF:
                  </Typography>
                  <Tooltip title="Click to verify on Monad Explorer">
                    <Chip
                      label={formatTxHash(bet.vrfDetails.transactionHash)}
                      size="small"
                      variant="outlined"
                      color="success"
                      icon={<Verified />}
                      onClick={() => openMonadExplorer(bet.vrfDetails.transactionHash)}
                      sx={{ 
                        fontSize: '0.6rem', 
                        height: 20,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(76, 175, 80, 0.1)'
                        }
                      }}
                    />
                  </Tooltip>
                </Box>
              )}
            </Box>
          </Box>
        ))
      )}
    </Paper>
  );
};

export default BettingHistory; 