import { NextResponse } from 'next/server';
import { makeLocalEntropyProof } from '@/lib/midnight/localEntropy';

export async function GET() {
  return NextResponse.json({
    ok: true,
    entropy: makeLocalEntropyProof('TEST'),
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json(makeLocalEntropyProof(body.gameType || 'TEST'));
}
