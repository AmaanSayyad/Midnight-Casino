import pythEntropyService from '@/services/PythEntropyService';

export async function GET(request) {
  try {
    // Initialize Pyth Entropy service
    await pythEntropyService.initialize();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'create') {
      const gameType = (searchParams.get('gameType') || 'MINES').toString();
      const randomData = await pythEntropyService.generateRandom(gameType, {});
      return new Response(
        JSON.stringify({
          ok: true,
          action: 'create',
          requestId: randomData.entropyProof.requestId,
          sequenceNumber: randomData.entropyProof.sequenceNumber,
          randomValue: randomData.randomValue,
          entropyProof: randomData.entropyProof,
          explorerUrl: randomData.entropyProof.explorerUrl,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        initialized: pythEntropyService.isInitialized,
        network: pythEntropyService.network,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const gameType = (body?.gameType || 'MINES').toString();
    const gameConfig = body?.gameConfig || {};

    await pythEntropyService.initialize();
    const randomData = await pythEntropyService.generateRandom(gameType, gameConfig);

    return new Response(
      JSON.stringify({
        ok: true,
        requestId: randomData.entropyProof.requestId,
        sequenceNumber: randomData.entropyProof.sequenceNumber,
        randomValue: randomData.randomValue,
        entropyProof: randomData.entropyProof,
        explorerUrl: randomData.entropyProof.explorerUrl,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


