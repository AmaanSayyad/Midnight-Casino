"use client";
import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function EthereumConnectWalletButton() {
  return (
    <div className="relative">
      <ConnectButton 
        chainStatus="icon"
        accountStatus={{
          smallScreen: 'avatar',
          largeScreen: 'full',
        }}
        showBalance={{
          smallScreen: false,
          largeScreen: false,
        }}
        onConnect={() => {
          console.log('🔗 WalletConnect button clicked');
        }}
      />
    </div>
  );
} 