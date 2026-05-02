"use client";

import * as React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletStatusProvider } from '@/hooks/useWalletStatus';
import { NotificationProvider } from '@/components/NotificationSystem';
import WalletConnectionGuard from '@/components/WalletConnectionGuard';
import { ThemeProvider } from 'next-themes';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { midnightNetwork } from '@/config/chains';
import { RainbowKitProvider, getDefaultConfig, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { 
  metaMaskWallet,
  walletConnectWallet,
  injectedWallet,
  rainbowWallet,
  coinbaseWallet,
  trustWallet
} from '@rainbow-me/rainbowkit/wallets';
import '@rainbow-me/rainbowkit/styles.css';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const queryClient = new QueryClient();

// Create Material-UI theme
const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0000FE',
    },
    secondary: {
      main: '#FFFFFF',
    },
    background: {
      default: '#0A0A0A',
      paper: '#0A0A0A',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.9)',
    },
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(10, 10, 10, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
          borderBottom: '1px solid rgba(148, 163, 184, 0.3)',
          background: 'linear-gradient(135deg, rgba(0, 0, 254, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
        },
      },
    },
  },
});

// Create config outside component to avoid SSR issues
let wagmiConfig = null;

function createWagmiConfig() {
  if (wagmiConfig) {
    return wagmiConfig;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  // Debug logging
  console.log('🔧 Creating Wagmi config...');
  console.log('🔧 Project ID: 226b43b703188d269fb70d02c107c34e');

  try {
    wagmiConfig = getDefaultConfig({
      appName: 'Midnight Casino',
      projectId: '226b43b703188d269fb70d02c107c34e',
      chains: [midnightNetwork],
      ssr: true,
    });
    console.log('🔧 Config created with getDefaultConfig:', wagmiConfig);
  } catch (error) {
    console.error('❌ Error creating config with getDefaultConfig:', error);
    
    // Fallback to manual config with MetaMask Smart Accounts support
    const connectors = connectorsForWallets([
      {
        groupName: 'Recommended',
        wallets: [
          metaMaskWallet({
            projectId: '226b43b703188d269fb70d02c107c34e',
            // Enable Smart Accounts support
            options: {
              enableSmartAccounts: true,
            }
          }),
          walletConnectWallet,
          injectedWallet,
        ],
      },
      {
        groupName: 'Other',
        wallets: [
          rainbowWallet,
          coinbaseWallet,
          trustWallet,
        ],
      },
    ], {
      appName: 'Midnight Casino',
      projectId: '226b43b703188d269fb70d02c107c34e',
    });

    wagmiConfig = createConfig({
      connectors,
      chains: [midnightNetwork],
      transports: {
        [midnightNetwork.id]: http(),
      },
      ssr: true,
    });
    console.log('🔧 Config created with manual setup:', wagmiConfig);
  }

  return wagmiConfig;
}

export default function Providers({ children }) {
  const [mounted, setMounted] = React.useState(false);
  const [config, setConfig] = React.useState(null);

  React.useEffect(() => {
    setMounted(true);
    // Create config only after mount
    const wagmiConfig = createWagmiConfig();
    setConfig(wagmiConfig);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted and config is ready
  if (!mounted || !config) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#0A0A0A'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <Provider store={store}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <NotificationProvider>
              <WalletStatusProvider>
                <WalletConnectionGuard>
                  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                    <MuiThemeProvider theme={muiTheme}>
                      <CssBaseline />
                      {children}
                    </MuiThemeProvider>
                  </ThemeProvider>
                </WalletConnectionGuard>
              </WalletStatusProvider>
            </NotificationProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </Provider>
  );
}
