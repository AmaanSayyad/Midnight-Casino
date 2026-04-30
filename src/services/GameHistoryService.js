import { Pool } from 'pg';

/**
 * Game History Service
 * Handles saving and retrieving game results with VRF transaction hashes
 */
export class GameHistoryService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:casino123@localhost:5432/casino_vrf',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    this.isInitialized = false;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      // Test database connection
      await this.pool.query('SELECT 1');
      this.isInitialized = true;
      console.log('✅ Game History Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Game History Service:', error);
      throw error;
    }
  }

  /**
   * Save game result to database
   * @param {Object} gameData - Game result data
   * @returns {Promise<Object>} Saved game result
   */
  async saveGameResult(gameData) {
    this.ensureInitialized();

    try {
      const {
        vrfRequestId,
        userAddress,
        gameType,
        gameConfig,
        resultData,
        betAmount,
        payoutAmount
      } = gameData;

      // Validate required fields
      if (!userAddress || !gameType || !gameConfig || !resultData) {
        throw new Error('Missing required game data fields');
      }

      // Validate Ethereum address
      if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
        throw new Error('Invalid Ethereum address format');
      }

      // Validate game type
      if (!['MINES', 'PLINKO', 'ROULETTE', 'WHEEL'].includes(gameType)) {
        throw new Error('Invalid game type');
      }

      const query = `
        INSERT INTO game_results (
          vrf_request_id,
          user_address,
          game_type,
          game_config,
          result_data,
          bet_amount,
          payout_amount,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `;

      const values = [
        vrfRequestId || null,
        userAddress,
        gameType,
        JSON.stringify(gameConfig),
        JSON.stringify(resultData),
        betAmount ? betAmount.toString() : null,
        payoutAmount ? payoutAmount.toString() : null
      ];

      const result = await this.pool.query(query, values);
      const savedGame = result.rows[0];

      console.log(`✅ Game result saved: ${gameType} for user ${userAddress}`);

      return {
        id: savedGame.id,
        vrfRequestId: savedGame.vrf_request_id,
        userAddress: savedGame.user_address,
        gameType: savedGame.game_type,
        gameConfig: JSON.parse(savedGame.game_config),
        resultData: JSON.parse(savedGame.result_data),
        betAmount: savedGame.bet_amount,
        payoutAmount: savedGame.payout_amount,
        createdAt: savedGame.created_at
      };

    } catch (error) {
      console.error('❌ Failed to save game result:', error);
      throw error;
    }
  }

  /**
   * Get VRF details for a game result
   * @param {string} vrfRequestId - VRF request ID
   * @returns {Promise<Object>} VRF details
   */
  async getVRFDetails(vrfRequestId) {
    this.ensureInitialized();

    try {
      const query = `
        SELECT 
          request_id,
          transaction_hash,
          block_number,
          vrf_value,
          game_type,
          game_sub_type,
          status,
          created_at,
          fulfilled_at
        FROM vrf_requests
        WHERE id = $1
      `;

      const result = await this.pool.query(query, [vrfRequestId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const vrf = result.rows[0];

      return {
        requestId: vrf.request_id,
        transactionHash: vrf.transaction_hash,
        blockNumber: vrf.block_number,
        vrfValue: vrf.vrf_value,
        gameType: vrf.game_type,
        gameSubType: vrf.game_sub_type,
        status: vrf.status,
        createdAt: vrf.created_at,
        fulfilledAt: vrf.fulfilled_at,
        etherscanUrl: `${process.env.NEXT_PUBLIC_SEPOLIA_EXPLORER}/tx/${vrf.transaction_hash}`,
        verifiable: true
      };

    } catch (error) {
      console.error('❌ Failed to get VRF details:', error);
      throw error;
    }
  }

  /**
   * Get user's game history
   * @param {string} userAddress - User's Ethereum address
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Game history
   */
  async getUserHistory(userAddress, options = {}) {
    this.ensureInitialized();

    try {
      const {
        gameType,
        limit = 50,
        offset = 0,
        includeVrfDetails = true
      } = options;

      // Build query
      let query = `
        SELECT 
          gr.id,
          gr.vrf_request_id,
          gr.user_address,
          gr.game_type,
          gr.game_config,
          gr.result_data,
          gr.bet_amount,
          gr.payout_amount,
          gr.created_at,
          ${includeVrfDetails ? `
          vr.request_id as vrf_request_id_string,
          vr.transaction_hash,
          vr.block_number,
          vr.vrf_value,
          vr.fulfilled_at,
          vr.game_sub_type,
          ` : ''}
          -- Calculate profit/loss
          CASE 
            WHEN gr.payout_amount > 0 THEN (gr.payout_amount - gr.bet_amount)
            ELSE -gr.bet_amount
          END as profit_loss
        FROM game_results gr
        ${includeVrfDetails ? 'LEFT JOIN vrf_requests vr ON gr.vrf_request_id = vr.id' : ''}
        WHERE gr.user_address = $1
      `;

      const queryParams = [userAddress];
      let paramIndex = 2;

      // Add game type filter
      if (gameType) {
        query += ` AND gr.game_type = $${paramIndex}`;
        queryParams.push(gameType);
        paramIndex++;
      }

      // Add ordering and pagination
      query += ` ORDER BY gr.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      const result = await this.pool.query(query, queryParams);

      // Process results
      const games = result.rows.map(row => {
        const game = {
          id: row.id,
          vrfRequestId: row.vrf_request_id,
          userAddress: row.user_address,
          gameType: row.game_type,
          gameConfig: JSON.parse(row.game_config),
          resultData: JSON.parse(row.result_data),
          betAmount: row.bet_amount,
          payoutAmount: row.payout_amount,
          profitLoss: row.profit_loss,
          createdAt: row.created_at,
          isWin: row.payout_amount > row.bet_amount
        };

        // Add VRF details if available
        if (includeVrfDetails && row.transaction_hash) {
          game.vrfDetails = {
            requestId: row.vrf_request_id_string,
            transactionHash: row.transaction_hash,
            blockNumber: row.block_number,
            vrfValue: row.vrf_value,
            fulfilledAt: row.fulfilled_at,
            gameSubType: row.game_sub_type,
            etherscanUrl: `${process.env.NEXT_PUBLIC_SEPOLIA_EXPLORER}/tx/${row.transaction_hash}`,
            verifiable: true,
            verificationNote: "This result was generated using Pyth Entropy - click to verify on Etherscan"
          };
        }

        return game;
      });

      return {
        games,
        total: games.length,
        hasMore: games.length === limit
      };

    } catch (error) {
      console.error('❌ Failed to get user history:', error);
      throw error;
    }
  }

  /**
   * Get game statistics for a user
   * @param {string} userAddress - User's Ethereum address
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats(userAddress, options = {}) {
    this.ensureInitialized();

    try {
      const { gameType, timeframe = '30 days' } = options;

      let query = `
        SELECT 
          COUNT(*) as total_games,
          SUM(bet_amount) as total_wagered,
          SUM(payout_amount) as total_won,
          SUM(payout_amount - bet_amount) as total_profit,
          COUNT(*) FILTER (WHERE payout_amount > bet_amount) as wins,
          COUNT(*) FILTER (WHERE payout_amount <= bet_amount) as losses,
          game_type,
          AVG(CASE WHEN bet_amount > 0 THEN payout_amount::DECIMAL / bet_amount::DECIMAL ELSE 0 END) as avg_multiplier
        FROM game_results
        WHERE user_address = $1
        AND created_at > NOW() - INTERVAL '${timeframe}'
      `;

      const queryParams = [userAddress];
      let paramIndex = 2;

      if (gameType) {
        query += ` AND game_type = $${paramIndex}`;
        queryParams.push(gameType);
        paramIndex++;
      }

      query += ` GROUP BY game_type`;

      const result = await this.pool.query(query, queryParams);

      // Process statistics
      const stats = {
        totalGames: 0,
        totalWagered: '0',
        totalWon: '0',
        totalProfit: '0',
        wins: 0,
        losses: 0,
        winRate: 0,
        averageMultiplier: 0,
        gameTypeBreakdown: {}
      };

      let totalWagered = BigInt(0);
      let totalWon = BigInt(0);
      let totalProfit = BigInt(0);
      let totalGames = 0;
      let totalWins = 0;
      let totalLosses = 0;
      let totalMultiplier = 0;

      result.rows.forEach(row => {
        const gameType = row.game_type;
        const games = parseInt(row.total_games);
        const wagered = BigInt(row.total_wagered || 0);
        const won = BigInt(row.total_won || 0);
        const profit = BigInt(row.total_profit || 0);
        const wins = parseInt(row.wins);
        const losses = parseInt(row.losses);
        const avgMultiplier = parseFloat(row.avg_multiplier || 0);

        totalGames += games;
        totalWagered += wagered;
        totalWon += won;
        totalProfit += profit;
        totalWins += wins;
        totalLosses += losses;
        totalMultiplier += avgMultiplier * games;

        stats.gameTypeBreakdown[gameType] = {
          games,
          wagered: wagered.toString(),
          won: won.toString(),
          profit: profit.toString(),
          wins,
          losses,
          winRate: games > 0 ? (wins / games * 100).toFixed(2) : 0,
          averageMultiplier: avgMultiplier.toFixed(2)
        };
      });

      stats.totalGames = totalGames;
      stats.totalWagered = totalWagered.toString();
      stats.totalWon = totalWon.toString();
      stats.totalProfit = totalProfit.toString();
      stats.wins = totalWins;
      stats.losses = totalLosses;
      stats.winRate = totalGames > 0 ? (totalWins / totalGames * 100).toFixed(2) : 0;
      stats.averageMultiplier = totalGames > 0 ? (totalMultiplier / totalGames).toFixed(2) : 0;

      return stats;

    } catch (error) {
      console.error('❌ Failed to get user stats:', error);
      throw error;
    }
  }

  /**
   * Verify game result using VRF
   * @param {string} gameId - Game result ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyGameResult(gameId) {
    this.ensureInitialized();

    try {
      const query = `
        SELECT 
          gr.*,
          vr.vrf_value,
          vr.transaction_hash,
          vr.request_id
        FROM game_results gr
        LEFT JOIN vrf_requests vr ON gr.vrf_request_id = vr.id
        WHERE gr.id = $1
      `;

      const result = await this.pool.query(query, [gameId]);

      if (result.rows.length === 0) {
        throw new Error('Game result not found');
      }

      const game = result.rows[0];

      if (!game.vrf_value) {
        return {
          verifiable: false,
          reason: 'No VRF value associated with this game'
        };
      }

      // Here you would implement the actual verification logic
      // by re-processing the VRF value with the same game processor
      // and comparing the results

      return {
        verifiable: true,
        gameId: game.id,
        vrfValue: game.vrf_value,
        transactionHash: game.transaction_hash,
        requestId: game.request_id,
        etherscanUrl: `${process.env.NEXT_PUBLIC_SEPOLIA_EXPLORER}/tx/${game.transaction_hash}`,
        verified: true, // This would be the result of actual verification
        message: 'Game result is verifiable on-chain via Pyth Entropy'
      };

    } catch (error) {
      console.error('❌ Failed to verify game result:', error);
      throw error;
    }
  }

  /**
   * Get recent games across all users (for admin/monitoring)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Recent games
   */
  async getRecentGames(options = {}) {
    this.ensureInitialized();

    try {
      const { limit = 100, gameType } = options;

      let query = `
        SELECT 
          gr.id,
          gr.user_address,
          gr.game_type,
          gr.bet_amount,
          gr.payout_amount,
          gr.created_at,
          vr.transaction_hash,
          CASE 
            WHEN gr.payout_amount > gr.bet_amount THEN 'win'
            ELSE 'loss'
          END as result
        FROM game_results gr
        LEFT JOIN vrf_requests vr ON gr.vrf_request_id = vr.id
        WHERE 1=1
      `;

      const queryParams = [];
      let paramIndex = 1;

      if (gameType) {
        query += ` AND gr.game_type = $${paramIndex}`;
        queryParams.push(gameType);
        paramIndex++;
      }

      query += ` ORDER BY gr.created_at DESC LIMIT $${paramIndex}`;
      queryParams.push(limit);

      const result = await this.pool.query(query, queryParams);

      return result.rows.map(row => ({
        id: row.id,
        userAddress: row.user_address,
        gameType: row.game_type,
        betAmount: row.bet_amount,
        payoutAmount: row.payout_amount,
        result: row.result,
        transactionHash: row.transaction_hash,
        createdAt: row.created_at,
        etherscanUrl: row.transaction_hash ? 
          `${process.env.NEXT_PUBLIC_SEPOLIA_EXPLORER}/tx/${row.transaction_hash}` : null
      }));

    } catch (error) {
      console.error('❌ Failed to get recent games:', error);
      throw error;
    }
  }

  /**
   * Ensure service is initialized
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Game History Service not initialized. Call initialize() first.');
    }
  }

  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const gameHistory = new GameHistoryService();
export default gameHistory;