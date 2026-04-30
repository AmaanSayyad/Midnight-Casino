import { GameHistoryService } from '../../../services/GameHistoryService';

/**
 * Game History API
 * Retrieves game history for a user with VRF details
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { 
      userAddress, 
      gameType, 
      limit = '50', 
      offset = '0',
      includeVrfDetails = 'false'
    } = req.query;

    // Validate required parameters
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userAddress'
      });
    }

    // Validate game type if provided
    const validGameTypes = ['ROULETTE', 'MINES', 'PLINKO', 'WHEEL'];
    if (gameType && !validGameTypes.includes(gameType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid game type. Must be one of: ${validGameTypes.join(', ')}`
      });
    }

    // Parse numeric parameters
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Max 100 records
    const offsetNum = parseInt(offset) || 0;
    const includeVrf = includeVrfDetails === 'true';

    console.log(`📊 Fetching game history for ${userAddress}`, {
      gameType: gameType || 'ALL',
      limit: limitNum,
      offset: offsetNum,
      includeVrf
    });

    // Initialize service
    const gameHistoryService = new GameHistoryService();

    // Build query options
    const queryOptions = {
      userAddress,
      gameType: gameType ? gameType.toUpperCase() : null,
      limit: limitNum,
      offset: offsetNum,
      includeVrfDetails: includeVrf,
      orderBy: 'createdAt',
      orderDirection: 'DESC'
    };

    // Fetch game history
    const historyResult = await gameHistoryService.getUserGameHistory(queryOptions);

    if (!historyResult.success) {
      throw new Error(historyResult.error || 'Failed to fetch game history');
    }

    // Calculate summary statistics
    const games = historyResult.data.games || [];
    const summary = {
      totalGames: games.length,
      totalWins: games.filter(game => game.isWin).length,
      totalLosses: games.filter(game => !game.isWin).length,
      totalBetAmount: games.reduce((sum, game) => sum + parseFloat(game.betAmount || 0), 0),
      totalPayoutAmount: games.reduce((sum, game) => sum + parseFloat(game.payoutAmount || 0), 0),
      totalProfitLoss: games.reduce((sum, game) => sum + parseFloat(game.profitLoss || 0), 0),
      winRate: games.length > 0 ? (games.filter(game => game.isWin).length / games.length * 100).toFixed(2) : 0
    };

    // Group by game type if no specific game type requested
    const gameTypeStats = {};
    if (!gameType) {
      validGameTypes.forEach(type => {
        const typeGames = games.filter(game => game.gameType === type);
        gameTypeStats[type] = {
          count: typeGames.length,
          wins: typeGames.filter(game => game.isWin).length,
          losses: typeGames.filter(game => !game.isWin).length,
          totalBet: typeGames.reduce((sum, game) => sum + parseFloat(game.betAmount || 0), 0),
          totalPayout: typeGames.reduce((sum, game) => sum + parseFloat(game.payoutAmount || 0), 0),
          profitLoss: typeGames.reduce((sum, game) => sum + parseFloat(game.profitLoss || 0), 0)
        };
      });
    }

    const responseData = {
      games,
      summary,
      gameTypeStats: Object.keys(gameTypeStats).length > 0 ? gameTypeStats : null,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        hasMore: games.length === limitNum // Simple check, could be more sophisticated
      },
      filters: {
        userAddress,
        gameType: gameType || null,
        includeVrfDetails: includeVrf
      }
    };

    console.log(`✅ Retrieved ${games.length} games for ${userAddress}`);

    return res.status(200).json({
      success: true,
      data: responseData,
      message: `Retrieved ${games.length} game records`
    });

  } catch (error) {
    console.error('❌ Game history fetch error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching game history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * API Route Configuration
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};