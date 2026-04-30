# MetaMask Smart Accounts Integration Guide

## 🔷 What are MetaMask Smart Accounts?

MetaMask Smart Accounts (based on EIP-4337 Account Abstraction) enable you to use smart contract-based accounts instead of traditional Externally Owned Accounts (EOA). These accounts offer advanced features and enhanced functionality:

> **Note**: Smart Accounts are currently in beta and may not be available on all networks. This implementation provides detection and graceful fallbacks.

### ✨ Features:
- **Batch Transactions**: Execute multiple operations in a single transaction
- **Sponsored Transactions**: Gas fees paid by another account
- **Session Keys**: Temporary permission delegation
- **Social Recovery**: Account recovery mechanisms
- **Custom Logic**: Add custom business logic to your account

## 🚀 Usage in APT Casino

### 1. Smart Account Detection
Check if you're using a Smart Account in the application:

```javascript
import { useSmartAccount } from '@/hooks/useSmartAccount';

const { 
  isSmartAccount, 
  smartAccountInfo, 
  capabilities,
  hasSmartAccountSupport 
} = useSmartAccount();
```

### 2. Smart Account Information
```javascript
// Check if Smart Account is active
if (isSmartAccount) {
  console.log('🔷 Smart Account active');
  console.log('Supported features:', smartAccountInfo.features);
} else {
  console.log('👤 Traditional EOA account');
}
```

### 3. Batch Transactions
For placing multiple bets in casino games:

```javascript
const { batchTransactions } = useSmartAccount();

// Send multiple bet transactions in batch
const transactions = [
  { to: casinoContract, data: betData1, value: betAmount1 },
  { to: casinoContract, data: betData2, value: betAmount2 },
  { to: casinoContract, data: betData3, value: betAmount3 }
];

const result = await batchTransactions(transactions);
```

## 🛠 Configuration

### 1. Enable in Providers.js
```javascript
metaMaskWallet({
  projectId: 'your-project-id',
  options: {
    enableSmartAccounts: true,
  }
})
```

### 2. Using Smart Account Hook
```javascript
const MyComponent = () => {
  const { 
    isSmartAccount,
    smartAccountInfo,
    enableSmartAccountFeatures,
    batchTransactions 
  } = useSmartAccount();

  return (
    <div>
      {isSmartAccount ? (
        <div className="text-blue-400">
          🔷 Smart Account: {smartAccountInfo.address}
        </div>
      ) : (
        <div className="text-green-400">
          👤 EOA Account: {smartAccountInfo.address}
        </div>
      )}
    </div>
  );
};
```

## 🎮 Casino Game Advantages

### 1. Plinko Game
- **Auto-betting**: Drop multiple balls simultaneously
- **Batch bets**: Multiple bets in single transaction

### 2. Roulette
- **Multiple bets**: Bet on different numbers simultaneously
- **Strategy execution**: Automatically execute complex betting strategies

### 3. Wheel
- **Continuous play**: Uninterrupted gaming experience
- **Risk management**: Automatic stop-loss and take-profit

### 4. Mines
- **Pattern betting**: Automatic bets following specific patterns
- **Progressive strategies**: Automatically apply strategies like Martingale

## 🔧 Technical Details

### Smart Account Detection
```javascript
// Check if account is a smart contract
const code = await walletClient.getBytecode({ address });
const isSmartAccount = code && code !== '0x';
```

### Capabilities Check
```javascript
// Check MetaMask supported features
const capabilities = await window.ethereum.request({
  method: 'wallet_getCapabilities',
  params: [address]
});
```

### Batch Transaction Submission
```javascript
// Send batch transaction
const result = await window.ethereum.request({
  method: 'eth_sendTransactionBatch',
  params: [transactions]
});
```

## 🎯 Use Cases

### 1. Enhanced Gaming Experience
Smart Accounts make games faster and more efficient:
- Multi-bet with single click
- Automated gaming strategies
- Gas optimization

### 2. Advanced Strategy Implementation
- Automatically execute complex betting algorithms
- Automatically apply risk management rules
- Automatically monitor profit/loss limits

### 3. Social Features
- Group betting with friends
- Tournament participation
- Leaderboard competitions

## 🔒 Security

Smart Accounts provide additional security layers:
- **Multi-signature**: Multiple signature requirements
- **Time locks**: Time-locked transactions
- **Spending limits**: Spending limitations
- **Recovery mechanisms**: Account recovery methods

## 📱 Mobile Experience

Smart Accounts on MetaMask Mobile:
- Faster transaction confirmations
- Enhanced user experience
- Automatic gas optimization

## 🚨 Important Notes

1. **Beta Status**: Smart Accounts are currently in beta and not widely available
2. **Network Support**: Limited to specific networks and providers
3. **Feature Availability**: Most advanced features are not yet implemented
4. **Compatibility**: Not all dApps support Smart Accounts
5. **Detection Only**: This implementation primarily detects Smart Accounts rather than creating them
6. **Fallback**: The app gracefully falls back to standard EOA functionality

## 🔍 Current Implementation Status

### ✅ Implemented
- Smart Account detection via bytecode analysis
- EOA vs Smart Account differentiation
- Graceful fallback to standard accounts
- User interface indicators

### ⏳ Future Features (When Available)
- Batch transaction execution
- Sponsored transactions
- Session key management
- Social recovery mechanisms

### 🚫 Not Yet Available
- Smart Account creation
- Most EIP-4337 features
- Cross-chain Smart Account support

## 🔗 Useful Links

- [MetaMask Smart Accounts Documentation](https://docs.metamask.io/wallet/concepts/smart-accounts/)
- [EIP-4337 Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)
- [Monad Network Documentation](https://docs.monad.xyz/)

---

**Note**: These features are still in beta and are continuously being developed. Follow MetaMask documentation for the latest updates.