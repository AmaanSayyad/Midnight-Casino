import { NextResponse } from 'next/server';
import { TREASURY_CONFIG, getTreasuryUnshieldedAddress } from '@/config/treasury.js';

/** Treasury status for Midnight unshielded treasury (Midnight-native). */
export async function GET() {
  try {
    const address =
      getTreasuryUnshieldedAddress?.() ||
      process.env.NEXT_PUBLIC_MIDNIGHT_TREASURY_UNSHIELDED ||
      TREASURY_CONFIG?.UNSHIELDED_ADDRESS ||
      null;

    return NextResponse.json({
      success: true,
      treasury: {
        address,
        network: process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK || 'preview',
        note: 'On-chain tNIGHT balance is read from the wallet / indexer, not an EVM RPC.',
      },
      entropy: {
        arcade: 'local',
        privacyWheel: 'compact-commitHouseSeed',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || 'Treasury status failed' },
      { status: 500 },
    );
  }
}
