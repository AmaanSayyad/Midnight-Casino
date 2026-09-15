import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import path from 'node:path';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MIN = parseFloat(process.env.MIN_WITHDRAW || '0.001');
const MAX = parseFloat(process.env.MAX_WITHDRAW || '100');

function runWithdraw({ to, amount }) {
  const cliRoot = path.join(process.cwd(), 'midnight-cli');
  const script = path.join(cliRoot, 'scripts', 'withdraw-unshielded.mjs');
  const node = process.execPath;

  return new Promise((resolve, reject) => {
    const child = spawn(node, [script, '--to', to, '--amount', String(amount)], {
      cwd: cliRoot,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 2000);
      reject(
        new Error(
          'Withdraw timed out (~90s). Usually treasury tDUST is still generating — wait a few minutes and retry. Keep proof server up: npm run proof:up',
        ),
      );
    }, 90_000);

    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
      console.log('[treasury-withdraw]', d.toString().trim());
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const lines = stdout
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      let parsed = null;
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          parsed = JSON.parse(lines[i]);
          break;
        } catch {
          // continue
        }
      }
      if (code === 0 && parsed?.success) {
        resolve(parsed);
        return;
      }
      let errMsg = parsed?.error;
      if (!errMsg) {
        try {
          const errLine = stderr
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.startsWith('{'))
            .pop();
          if (errLine) errMsg = JSON.parse(errLine).error;
        } catch {
          // ignore
        }
      }
      reject(
        new Error(
          errMsg ||
            `Withdraw failed (exit ${code}). Check proof server (npm run proof:up) and treasury balance/dust. ${stderr
              .split('\n')
              .filter((l) => /error|Error|insufficient|dust|sync/i.test(l))
              .slice(-3)
              .join(' ')
              .slice(0, 400)}`,
        ),
      );
    });
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const recipient = String(body.recipient || body.userAddress || '').trim();
    const amount = parseFloat(body.amount);

    if (!recipient || !/^mn_addr/i.test(recipient)) {
      return NextResponse.json(
        { error: 'recipient must be a Midnight Bech32 address (mn_addr…)' },
        { status: 400 },
      );
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (amount < MIN) {
      return NextResponse.json({ error: `Minimum withdraw is ${MIN} tNIGHT` }, { status: 400 });
    }
    if (amount > MAX) {
      return NextResponse.json({ error: `Maximum withdraw is ${MAX} tNIGHT` }, { status: 400 });
    }
    if (!process.env.MIDNIGHT_TREASURY_SEED) {
      return NextResponse.json(
        {
          error:
            'Treasury signer not configured. Set MIDNIGHT_TREASURY_SEED in .env.local (must match NEXT_PUBLIC_MIDNIGHT_TREASURY_UNSHIELDED).',
        },
        { status: 500 },
      );
    }

    const result = await runWithdraw({ to: recipient, amount });
    return NextResponse.json({
      success: true,
      ...result,
      message: `Sent ${amount} tNIGHT from treasury to your wallet.`,
    });
  } catch (error) {
    console.error('midnight-withdraw error:', error);
    return NextResponse.json(
      { error: error?.message || 'Withdraw failed' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.MIDNIGHT_TREASURY_SEED),
    treasury:
      process.env.NEXT_PUBLIC_MIDNIGHT_TREASURY_UNSHIELDED ||
      process.env.MIDNIGHT_TREASURY_UNSHIELDED ||
      null,
    network: process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK || 'preview',
    proofServer:
      process.env.PROOF_SERVER_URL ||
      process.env.MIDNIGHT_PROOF_SERVER ||
      'http://127.0.0.1:6300',
    limits: { min: MIN, max: MAX },
  });
}
