# Lace + Compact E2E (Preview)

Never paste seed phrases into the app, chat, or git.

**No Lace / CI alternative:** see [`HEADLESS_E2E.md`](./HEADLESS_E2E.md) — local Docker + genesis wallet deploys and settles `casino.compact` from the terminal.

## Prerequisites

1. Lace with a Midnight **Preview** account funded (unshielded faucet + DUST registered)
2. Compact keys compiled: `npm run compact`
3. Docker proof server (Lace needs it): start Docker Desktop, then `npm run proof:up`
4. In Lace Midnight settings, proof server = `http://127.0.0.1:6300`

## Run

```bash
# terminal A — Next marketing UI + Lace connect panel
npm run dev

# terminal B — on-chain Compact DApp
npm run midnight:dapp
```

- Privacy Wheel (local demo + Lace panel): http://localhost:3000/game/privacy-wheel
- Lace on-chain DApp: http://localhost:5173/

## On-chain flow (in your Chrome with Lace)

1. Open http://localhost:5173/
2. **Connect Lace** → approve Preview
3. **Deploy casino.compact** → approve prove/submit in Lace
4. **placeBet** → **commitHouseSeed** → **settleWheel**
5. Confirm rounds appear in Public ledger table

Automated Cursor browser cannot click Lace popups; you must approve in the extension.
