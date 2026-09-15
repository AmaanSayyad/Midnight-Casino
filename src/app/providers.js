'use client';

/**
 * Minimal providers — no WalletConnect, no auto-injected reconnect (Temple/MetaMask).
 * Lace is handled separately via window.midnight.
 */

import * as React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletStatusProvider } from '@/hooks/useWalletStatus';
import { NotificationProvider } from '@/components/NotificationSystem';
import { ThemeProvider } from 'next-themes';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const queryClient = new QueryClient();

const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7c3aed' },
    secondary: { main: '#FFFFFF' },
    background: { default: '#0A0A0A', paper: '#0A0A0A' },
    text: { primary: '#FFFFFF', secondary: 'rgba(255, 255, 255, 0.9)' },
  },
});

export default function Providers({ children }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#0A0A0A',
          color: 'white',
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <WalletStatusProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <MuiThemeProvider theme={muiTheme}>
                <CssBaseline />
                {children}
              </MuiThemeProvider>
            </ThemeProvider>
          </WalletStatusProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </Provider>
  );
}
