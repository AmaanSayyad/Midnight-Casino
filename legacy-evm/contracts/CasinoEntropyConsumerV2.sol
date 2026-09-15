// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@pythnetwork/entropy-sdk-solidity/EntropyStructs.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropy.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CasinoEntropyConsumerV2
 * @dev Pyth Entropy consumer contract for casino games
 * Generates random numbers for Mines, Plinko, Roulette, and Wheel games using Pyth Entropy
 */
contract CasinoEntropyConsumerV2 is Ownable, IEntropyConsumer {
    event EntropyRequested(bytes32 indexed requestId, GameType gameType, string gameSubType, address requester);
    event EntropyFulfilled(bytes32 indexed requestId, bytes32 randomValue);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    enum GameType {
        MINES,
        PLINKO, 
        ROULETTE,
        WHEEL
    }

    struct EntropyRequest {
        address requester;
        GameType gameType;
        string gameSubType;
        bool fulfilled;
        bytes32 randomValue;
        uint256 timestamp;
        uint64 sequenceNumber;
        bytes32 commitment;
    }

    // Pyth Entropy contract
    IEntropy public entropy;
    
    // Pyth Entropy provider address
    address public provider;
    
    // Treasury wallet that can request entropy
    address public treasury;

    // Request tracking
    mapping(bytes32 => EntropyRequest) public requests;
    bytes32[] public requestIds;

    // Game type counters for analytics
    mapping(GameType => uint256) public gameTypeRequests;
    mapping(GameType => uint256) public gameTypeFulfilled;

    // Fee for entropy requests (in wei)
    uint256 public entropyFee = 0.001 ether;

    modifier onlyTreasury() {
        require(msg.sender == treasury, "Only treasury can call this function");
        _;
    }

    constructor(
        address _entropy,
        address _provider,
        address _treasury
    ) {
        entropy = IEntropy(_entropy);
        provider = _provider;
        treasury = _treasury;
    }

    /**
     * @dev Request random entropy using Pyth Entropy
     * @param userRandomNumber The user's random number for the request
     * @return sequenceNumber The sequence number for the entropy request
     */
    function request(
        bytes32 userRandomNumber
    ) external payable onlyTreasury returns (uint64 sequenceNumber) {
        // Use a fixed fee for now (0.001 ETH)
        uint128 requestFee = 1000000000000000; // 0.001 ETH in wei
        require(msg.value >= requestFee, "Insufficient fee for entropy request");

        // Call the actual Pyth Entropy contract with correct interface
        sequenceNumber = entropy.requestWithCallback{value: requestFee}(
            provider,
            userRandomNumber
        );

        // Store request using sequence number as key
        bytes32 requestId = keccak256(abi.encodePacked(sequenceNumber));
        requests[requestId] = EntropyRequest({
            requester: msg.sender,
            gameType: GameType.MINES, // Default, will be updated by frontend
            gameSubType: "",
            fulfilled: false,
            randomValue: bytes32(0),
            timestamp: block.timestamp,
            sequenceNumber: sequenceNumber,
            commitment: userRandomNumber
        });

        requestIds.push(requestId);
        gameTypeRequests[GameType.MINES]++;

        emit EntropyRequested(requestId, GameType.MINES, "", msg.sender);
    }

    /**
     * @dev Callback function called by Pyth Entropy when random value is ready
     * @param sequenceNumber The sequence number of the request
     * @param randomValue The random value from Pyth Entropy
     */
    function entropyCallback(
        uint64 sequenceNumber,
        address,
        bytes32 randomValue
    ) internal override {
        bytes32 requestId = keccak256(abi.encodePacked(sequenceNumber));
        require(requests[requestId].requester != address(0), "Request not found");
        require(!requests[requestId].fulfilled, "Request already fulfilled");

        requests[requestId].fulfilled = true;
        requests[requestId].randomValue = randomValue;
        gameTypeFulfilled[requests[requestId].gameType]++;

        emit EntropyFulfilled(requestId, randomValue);
    }

    /**
     * @dev Get the entropy contract address (required by IEntropyConsumer)
     * @return The entropy contract address
     */
    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    /**
     * @dev Get entropy request details
     * @param requestId The ID of the entropy request
     * @return Entropy request details
     */
    function getRequest(bytes32 requestId) external view returns (EntropyRequest memory) {
        return requests[requestId];
    }

    /**
     * @dev Get all request IDs
     * @return Array of all request IDs
     */
    function getAllRequestIds() external view returns (bytes32[] memory) {
        return requestIds;
    }

    /**
     * @dev Get request IDs for a specific game type
     * @param gameType The game type to filter by
     * @return Array of request IDs for the specified game type
     */
    function getRequestIdsByGameType(GameType gameType) external view returns (bytes32[] memory) {
        uint256 count = 0;
        
        // Count matching requests
        for (uint256 i = 0; i < requestIds.length; i++) {
            if (requests[requestIds[i]].gameType == gameType) {
                count++;
            }
        }

        // Create result array
        bytes32[] memory result = new bytes32[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < requestIds.length; i++) {
            if (requests[requestIds[i]].gameType == gameType) {
                result[index] = requestIds[i];
                index++;
            }
        }

        return result;
    }

    /**
     * @dev Get statistics for all game types
     * @return gameTypes Arrays of game types
     * @return requestCounts Request counts for each game type
     * @return fulfilledCounts Fulfilled counts for each game type
     */
    function getGameTypeStats() external view returns (
        GameType[] memory gameTypes,
        uint256[] memory requestCounts,
        uint256[] memory fulfilledCounts
    ) {
        gameTypes = new GameType[](4);
        requestCounts = new uint256[](4);
        fulfilledCounts = new uint256[](4);

        gameTypes[0] = GameType.MINES;
        gameTypes[1] = GameType.PLINKO;
        gameTypes[2] = GameType.ROULETTE;
        gameTypes[3] = GameType.WHEEL;

        for (uint256 i = 0; i < 4; i++) {
            requestCounts[i] = gameTypeRequests[gameTypes[i]];
            fulfilledCounts[i] = gameTypeFulfilled[gameTypes[i]];
        }
    }

    /**
     * @dev Update treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Update entropy fee (only owner)
     * @param newFee New fee in wei
     */
    function updateEntropyFee(uint256 newFee) external onlyOwner {
        entropyFee = newFee;
    }

    /**
     * @dev Withdraw accumulated fees (only owner)
     * @param to Address to send fees to
     */
    function withdrawFees(address to) external onlyOwner {
        require(to != address(0), "Invalid recipient address");
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(to).transfer(balance);
    }

    /**
     * @dev Get contract balance and other info
     * @return contractAddress Contract address
     * @return treasuryAddress Treasury address
     * @return totalRequests Total request count
     * @return totalFulfilled Total fulfilled count
     * @return contractBalance Contract balance
     */
    function getContractInfo() external view returns (
        address contractAddress,
        address treasuryAddress,
        uint256 totalRequests,
        uint256 totalFulfilled,
        uint256 contractBalance
    ) {
        contractAddress = address(this);
        treasuryAddress = treasury;
        totalRequests = requestIds.length;
        contractBalance = address(this).balance;
        
        // Count fulfilled requests
        uint256 fulfilled = 0;
        for (uint256 i = 0; i < requestIds.length; i++) {
            if (requests[requestIds[i]].fulfilled) {
                fulfilled++;
            }
        }
        totalFulfilled = fulfilled;
    }

    /**
     * @dev Check if a request is fulfilled
     * @param requestId The request ID to check
     * @return True if fulfilled
     */
    function isRequestFulfilled(bytes32 requestId) external view returns (bool) {
        return requests[requestId].fulfilled;
    }

    /**
     * @dev Get random value for a fulfilled request
     * @param requestId The request ID
     * @return Random value (0 if not fulfilled)
     */
    function getRandomValue(bytes32 requestId) external view returns (bytes32) {
        if (!requests[requestId].fulfilled) {
            return bytes32(0);
        }
        return requests[requestId].randomValue;
    }

    /**
     * @dev Generate a commitment hash for a request
     * @param randomNumber The random number to commit to
     * @return The commitment hash
     */
    function generateCommitment(bytes32 randomNumber) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(randomNumber));
    }

    /**
     * @dev Verify a commitment
     * @param commitment The commitment hash
     * @param randomNumber The random number to verify
     * @return True if the commitment is valid
     */
    function verifyCommitment(bytes32 commitment, bytes32 randomNumber) external pure returns (bool) {
        return commitment == keccak256(abi.encodePacked(randomNumber));
    }
}
