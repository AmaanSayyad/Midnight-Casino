import { NextResponse } from 'next/server';
import { makeLocalEntropyProof } from '@/lib/midnight/localEntropy';

/** Arcade RNG — local entropy only (no external oracle). */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const gameType = body.gameType || 'GAME';
    return NextResponse.json(makeLocalEntropyProof(gameType));
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || 'Entropy generation failed' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    source: 'Midnight local entropy',
    note: 'Arcade games use local entropy. Privacy Wheel uses Compact commitHouseSeed.',
  });
}
