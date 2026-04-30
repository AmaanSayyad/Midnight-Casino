import WheelResultProcessor from '../WheelResultProcessor.js';

describe('WheelResultProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new WheelResultProcessor();
  });

  describe('processVRF', () => {
    test('should generate valid wheel segment', () => {
      const vrfValue = '12345678901234567890123456789012345678901234567890123456789012345678901234567890';
      const gameConfig = { segments: 54 };

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.segment).toBeGreaterThanOrEqual(0);
      expect(result.segment).toBeLessThan(54);
      expect(result.gameType).toBe('WHEEL');
      expect(result.segments).toBe(54);
    });

    test('should use default segments when not specified', () => {
      const vrfValue = BigInt('98765432109876543210987654321098765432109876543210987654321098765432109876543210');
      const gameConfig = {};

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.segments).toBe(54); // Default segments
      expect(result.segment).toBeGreaterThanOrEqual(0);
      expect(result.segment).toBeLessThan(54);
    });

    test('should include payout multiplier', () => {
      const vrfValue = '55555555555555555555555555555555555555555555555555555555555555555555555555555555';
      const gameConfig = { segments: 30 };

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.payoutMultiplier).toBeGreaterThan(0);
      expect(typeof result.payoutMultiplier).toBe('number');
    });

    test('should throw error for invalid segment count', () => {
      const vrfValue = '12345';
      const gameConfig = { segments: 15 }; // Invalid - not in supported segments

      expect(() => {
        processor.processVRF(vrfValue, gameConfig);
      }).toThrow('Invalid segment count');
    });

    test('should generate consistent results for same VRF value', () => {
      const vrfValue = '77777777777777777777777777777777777777777777777777777777777777777777777777777777';
      const gameConfig = { segments: 40 };

      const result1 = processor.processVRF(vrfValue, gameConfig);
      const result2 = processor.processVRF(vrfValue, gameConfig);

      expect(result1.segment).toBe(result2.segment);
      expect(result1.payoutMultiplier).toBe(result2.payoutMultiplier);
    });

    test('should include segment data', () => {
      const vrfValue = '33333333333333333333333333333333333333333333333333333333333333333333333333333333';
      const gameConfig = { segments: 20 };

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.segmentData).toBeDefined();
      expect(result.segmentData.segment).toBe(result.segment);
      expect(result.segmentData.startAngle).toBeDefined();
      expect(result.segmentData.endAngle).toBeDefined();
      expect(result.segmentData.position).toBeDefined();
      expect(result.segmentData.riskLevel).toBeDefined();
    });

    test('should include wheel visualization', () => {
      const vrfValue = '11111111111111111111111111111111111111111111111111111111111111111111111111111111';
      const gameConfig = { segments: 10 };

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.wheelVisualization).toBeDefined();
      expect(typeof result.wheelVisualization).toBe('string');
      expect(result.wheelVisualization).toContain('★');
    });
  });

  describe('generateWheelSegment', () => {
    test('should generate segment in valid range', () => {
      const vrfValue = BigInt('123456789012345678901234567890');
      const segments = 30;

      const segment = processor.generateWheelSegment(vrfValue, segments);

      expect(segment).toBeGreaterThanOrEqual(0);
      expect(segment).toBeLessThan(segments);
    });

    test('should handle zero VRF value', () => {
      const vrfValue = BigInt('0');
      const segments = 20;

      const segment = processor.generateWheelSegment(vrfValue, segments);

      expect(segment).toBe(0);
    });

    test('should handle large VRF values', () => {
      const vrfValue = BigInt('999999999999999999999999999999999999999999999999999999999999999999999999999999');
      const segments = 54;

      const segment = processor.generateWheelSegment(vrfValue, segments);

      expect(segment).toBeGreaterThanOrEqual(0);
      expect(segment).toBeLessThan(segments);
    });
  });

  describe('getSegmentData', () => {
    test('should calculate correct angles for segment', () => {
      const segment = 0;
      const totalSegments = 10;

      const data = processor.getSegmentData(segment, totalSegments);

      expect(parseFloat(data.startAngle)).toBe(0);
      expect(parseFloat(data.endAngle)).toBe(36); // 360/10
      expect(parseFloat(data.centerAngle)).toBe(18); // 36/2
      expect(parseFloat(data.angleWidth)).toBe(36);
    });

    test('should calculate correct angles for middle segment', () => {
      const segment = 5;
      const totalSegments = 10;

      const data = processor.getSegmentData(segment, totalSegments);

      expect(parseFloat(data.startAngle)).toBe(180); // 5 * 36
      expect(parseFloat(data.endAngle)).toBe(216); // 6 * 36
      expect(parseFloat(data.centerAngle)).toBe(198); // 180 + 18
    });

    test('should include position and risk level', () => {
      const segment = 0;
      const totalSegments = 8;

      const data = processor.getSegmentData(segment, totalSegments);

      expect(data.position).toBeDefined();
      expect(data.riskLevel).toBeDefined();
      expect(['safe', 'low', 'medium', 'high', 'extreme']).toContain(data.riskLevel);
    });
  });

  describe('getSegmentPosition', () => {
    test('should return correct position for top', () => {
      const position = processor.getSegmentPosition(0);
      expect(position).toBe('top');
    });

    test('should return correct position for right', () => {
      const position = processor.getSegmentPosition(90);
      expect(position).toBe('right');
    });

    test('should return correct position for bottom', () => {
      const position = processor.getSegmentPosition(180);
      expect(position).toBe('bottom');
    });

    test('should return correct position for left', () => {
      const position = processor.getSegmentPosition(270);
      expect(position).toBe('left');
    });

    test('should handle angle normalization', () => {
      const position = processor.getSegmentPosition(450); // 450 - 360 = 90
      expect(position).toBe('right');
    });
  });

  describe('getMultipliers', () => {
    test('should return correct number of multipliers', () => {
      processor.getSupportedSegments().forEach(segments => {
        const multipliers = processor.getMultipliers(segments);
        expect(multipliers).toHaveLength(segments);
      });
    });

    test('should have jackpot segment for larger wheels', () => {
      const multipliers54 = processor.getMultipliers(54);
      const multipliers30 = processor.getMultipliers(30);

      expect(multipliers54[0]).toBe(54.0); // Jackpot at segment 0
      expect(multipliers30[0]).toBe(50.0); // Jackpot at segment 0
    });

    test('should have reasonable multiplier distribution', () => {
      const multipliers = processor.getMultipliers(20);

      // Should have mix of low and high multipliers
      const lowMultipliers = multipliers.filter(mult => mult < 2).length;
      const highMultipliers = multipliers.filter(mult => mult >= 5).length;

      expect(lowMultipliers).toBeGreaterThan(0);
      expect(highMultipliers).toBeGreaterThan(0);
    });
  });

  describe('validateWheelSegment', () => {
    test('should validate correct wheel segment', () => {
      const vrfValue = '12345678901234567890123456789012345678901234567890123456789012345678901234567890';
      const segments = 40;
      
      const result = processor.processVRF(vrfValue, { segments });
      const isValid = processor.validateWheelSegment(vrfValue, result.segment, segments);

      expect(isValid).toBe(true);
    });

    test('should reject incorrect wheel segment', () => {
      const vrfValue = '98765432109876543210987654321098765432109876543210987654321098765432109876543210';
      const segments = 30;
      const fakeSegment = 99; // Invalid segment

      const isValid = processor.validateWheelSegment(vrfValue, fakeSegment, segments);

      expect(isValid).toBe(false);
    });
  });

  describe('calculateProbabilities', () => {
    test('should calculate uniform probabilities', () => {
      const segments = 20;
      const probabilities = processor.calculateProbabilities(segments);

      expect(probabilities.uniform).toBe(true);
      expect(probabilities.probabilityPerSegment).toBe(1 / segments);
      expect(probabilities.percentagePerSegment).toBe('5.00%'); // 100/20
      expect(Object.keys(probabilities.segments)).toHaveLength(segments);
    });

    test('should have correct odds format', () => {
      const segments = 10;
      const probabilities = processor.calculateProbabilities(segments);

      Object.values(probabilities.segments).forEach(segmentProb => {
        expect(segmentProb.odds).toBe('1:9'); // 1:(10-1)
        expect(segmentProb.percentage).toBe('10.00%');
      });
    });
  });

  describe('simulateGameRound', () => {
    test('should calculate correct payout', () => {
      const gameResult = {
        segment: 0,
        payoutMultiplier: 10.0,
        segments: 20,
        segmentData: { riskLevel: 'high', position: 'top' }
      };
      const betAmount = 100;

      const roundResult = processor.simulateGameRound(gameResult, betAmount);

      expect(roundResult.betAmount).toBe(100);
      expect(roundResult.payout).toBe(1000); // 100 * 10.0
      expect(roundResult.profit).toBe(900); // 1000 - 100
      expect(roundResult.isWin).toBe(true);
      expect(roundResult.riskLevel).toBe('high');
      expect(roundResult.position).toBe('top');
    });

    test('should handle losing outcome', () => {
      const gameResult = {
        segment: 5,
        payoutMultiplier: 0.5,
        segments: 10,
        segmentData: { riskLevel: 'safe', position: 'right' }
      };
      const betAmount = 100;

      const roundResult = processor.simulateGameRound(gameResult, betAmount);

      expect(roundResult.payout).toBe(50); // 100 * 0.5
      expect(roundResult.profit).toBe(-50); // 50 - 100
      expect(roundResult.isWin).toBe(false);
    });

    test('should include win probability', () => {
      const gameResult = {
        segment: 0,
        payoutMultiplier: 5.0,
        segments: 20,
        segmentData: { riskLevel: 'medium', position: 'top' }
      };
      const betAmount = 50;

      const roundResult = processor.simulateGameRound(gameResult, betAmount);

      expect(roundResult.winProbability).toBe('5.00%'); // 1/20 * 100
    });
  });

  describe('getWheelStats', () => {
    test('should return correct statistics', () => {
      const segments = 30;
      const stats = processor.getWheelStats(segments);

      expect(stats.segments).toBe(segments);
      expect(stats.maxMultiplier).toBeGreaterThan(0);
      expect(stats.minMultiplier).toBeGreaterThan(0);
      expect(parseFloat(stats.averageMultiplier)).toBeGreaterThan(0);
      expect(parseFloat(stats.expectedValue)).toBeGreaterThan(0);
      expect(stats.houseEdge).toContain('%');
      expect(stats.uniformProbability).toContain('%');
    });

    test('should have reasonable house edge', () => {
      const segments = 20;
      const stats = processor.getWheelStats(segments);

      const houseEdgePercent = parseFloat(stats.houseEdge);
      expect(houseEdgePercent).toBeGreaterThan(0);
      expect(houseEdgePercent).toBeLessThan(50); // Reasonable house edge
    });

    test('should count risk distribution correctly', () => {
      const segments = 54;
      const stats = processor.getWheelStats(segments);

      const totalRiskSegments = Object.values(stats.riskDistribution)
        .reduce((sum, count) => sum + count, 0);
      
      expect(totalRiskSegments).toBe(segments);
    });
  });

  describe('getAdjacentSegments', () => {
    test('should return correct adjacent segments', () => {
      const segment = 5;
      const totalSegments = 10;
      const range = 1;

      const adjacent = processor.getAdjacentSegments(segment, totalSegments, range);

      expect(adjacent).toEqual([4, 5, 6]);
    });

    test('should handle wrap-around for segment 0', () => {
      const segment = 0;
      const totalSegments = 10;
      const range = 1;

      const adjacent = processor.getAdjacentSegments(segment, totalSegments, range);

      expect(adjacent).toEqual([9, 0, 1]); // Wraps around
    });

    test('should handle wrap-around for last segment', () => {
      const segment = 9;
      const totalSegments = 10;
      const range = 1;

      const adjacent = processor.getAdjacentSegments(segment, totalSegments, range);

      expect(adjacent).toEqual([8, 9, 0]); // Wraps around
    });

    test('should handle larger ranges', () => {
      const segment = 5;
      const totalSegments = 10;
      const range = 2;

      const adjacent = processor.getAdjacentSegments(segment, totalSegments, range);

      expect(adjacent).toEqual([3, 4, 5, 6, 7]);
      expect(adjacent).toHaveLength(5); // range * 2 + 1
    });
  });

  describe('analyzeWheelBalance', () => {
    test('should analyze wheel balance', () => {
      const segments = 20;
      const analysis = processor.analyzeWheelBalance(segments);

      expect(parseFloat(analysis.expectedValue)).toBeGreaterThan(0);
      expect(parseFloat(analysis.variance)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(analysis.standardDeviation)).toBeGreaterThanOrEqual(0);
      expect(analysis.highValueSegments).toBeGreaterThanOrEqual(0);
      expect(analysis.lowValueSegments).toBeGreaterThanOrEqual(0);
      expect(analysis.balanceScore).toContain('%');
      expect(typeof analysis.isBalanced).toBe('boolean');
    });

    test('should identify unbalanced wheels', () => {
      // Test with a wheel that has extreme multipliers
      const segments = 10;
      const analysis = processor.analyzeWheelBalance(segments);

      // The analysis should detect if the wheel is balanced or not
      expect(analysis.isBalanced).toBeDefined();
    });
  });

  describe('generateBettingStrategies', () => {
    test('should generate betting strategies', () => {
      const gameResult = {
        segment: 10,
        segments: 30,
        payoutMultiplier: 5.0
      };

      const strategies = processor.generateBettingStrategies(gameResult);

      expect(strategies.singleSegment).toBeDefined();
      expect(strategies.adjacent).toBeDefined();
      expect(strategies.highValue).toBeDefined();
      expect(strategies.safe).toBeDefined();

      expect(strategies.singleSegment.segments).toEqual([10]);
      expect(strategies.adjacent.segments).toContain(10);
      expect(strategies.adjacent.segments.length).toBeGreaterThan(1);
    });

    test('should include probability calculations', () => {
      const gameResult = {
        segment: 5,
        segments: 20,
        payoutMultiplier: 2.0
      };

      const strategies = processor.generateBettingStrategies(gameResult);

      expect(strategies.singleSegment.probability).toBe('5.00%'); // 1/20 * 100
      expect(strategies.adjacent.probability).toContain('%');
    });
  });

  describe('validateGameConfig', () => {
    test('should validate correct game config', () => {
      const gameConfig = { segments: 30 };
      const validation = processor.validateGameConfig(gameConfig);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should use default segments for empty config', () => {
      const gameConfig = {};
      const validation = processor.validateGameConfig(gameConfig);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject invalid segment count', () => {
      const gameConfig = { segments: 15 }; // Not in supported segments
      const validation = processor.validateGameConfig(gameConfig);

      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('Segment count must be one of');
    });

    test('should reject non-numeric segment count', () => {
      const gameConfig = { segments: '30' };
      const validation = processor.validateGameConfig(gameConfig);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Segment count must be a number');
    });

    test('should reject null game config', () => {
      const validation = processor.validateGameConfig(null);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Game configuration is required');
    });
  });

  describe('getSupportedSegments', () => {
    test('should return array of supported segment counts', () => {
      const supportedSegments = processor.getSupportedSegments();

      expect(supportedSegments).toEqual([10, 20, 30, 40, 50, 54]);
      expect(supportedSegments).toHaveLength(6);
    });
  });

  describe('generateWheelVisualization', () => {
    test('should generate ASCII wheel visualization', () => {
      const winningSegment = 0;
      const totalSegments = 10;

      const visualization = processor.generateWheelVisualization(winningSegment, totalSegments);

      expect(visualization).toContain('★'); // Winning segment marker
      expect(visualization).toContain('●'); // Center point
      expect(visualization).toContain('○'); // Wheel outline
      expect(visualization).toContain(`Segment ${winningSegment}`);
    });

    test('should handle different segment counts', () => {
      processor.getSupportedSegments().forEach(segments => {
        const visualization = processor.generateWheelVisualization(0, segments);
        expect(visualization).toContain(`${segments} segments`);
      });
    });
  });

  describe('generateTestScenarios', () => {
    test('should generate test scenarios for all supported segments', () => {
      const scenarios = processor.generateTestScenarios();

      expect(scenarios.length).toBe(18); // 6 segments * 3 scenarios each
      
      scenarios.forEach(scenario => {
        expect(scenario.name).toBeDefined();
        expect(scenario.vrfValue).toBeDefined();
        expect(scenario.gameConfig).toBeDefined();
        expect(scenario.expectedSegment).toBeDefined();
      });
    });

    test('should include first, last, and middle segments for each configuration', () => {
      const scenarios = processor.generateTestScenarios();
      
      // Check that we have scenarios for different segment positions
      const firstSegmentScenarios = scenarios.filter(s => s.name.includes('First Segment'));
      const lastSegmentScenarios = scenarios.filter(s => s.name.includes('Last Segment'));
      const middleSegmentScenarios = scenarios.filter(s => s.name.includes('Middle Segment'));

      expect(firstSegmentScenarios.length).toBe(6); // One for each supported segment count
      expect(lastSegmentScenarios.length).toBe(6);
      expect(middleSegmentScenarios.length).toBe(6);
    });
  });

  describe('getSegmentRiskLevel', () => {
    test('should classify risk levels correctly', () => {
      const segments = 20;
      
      // Mock multipliers for testing
      const originalGetMultipliers = processor.getMultipliers;
      processor.getMultipliers = jest.fn().mockReturnValue([
        100, // extreme
        25,  // high
        8,   // medium
        3,   // low
        1.2  // safe
      ]);

      expect(processor.getSegmentRiskLevel(0, segments)).toBe('extreme');
      expect(processor.getSegmentRiskLevel(1, segments)).toBe('high');
      expect(processor.getSegmentRiskLevel(2, segments)).toBe('medium');
      expect(processor.getSegmentRiskLevel(3, segments)).toBe('low');
      expect(processor.getSegmentRiskLevel(4, segments)).toBe('safe');

      // Restore original method
      processor.getMultipliers = originalGetMultipliers;
    });
  });
});