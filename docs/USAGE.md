# How to Use Midnight Casino

## What You Need

- A modern browser
- [1AM](https://1am.xyz/) or Lace wallet with a Midnight Preview account
- Optional: local proof server (`npm run proof:up`) for on-chain Compact proving

## Step-by-Step Guide

1. Open the live demo: https://midnight-casino-eta.vercel.app/
2. Connect your Midnight wallet from the navbar (1AM / Lace).
3. Open **Privacy Wheel**: https://midnight-casino-eta.vercel.app/game/privacy-wheel
4. Set a private sector choice and amount (these stay local witnesses).
5. Run **placeBet** — only a commitment + ownership hash go public.
6. Run **commitHouseSeed**, then **settleWheel** — outcome/payout are selectively disclosed.
7. Optional: deposit/withdraw tNIGHT via Manage balance (treasury flow).

For full on-chain Lace deploy UI locally:

```bash
npm run proof:up
npm run midnight:dapp:preprod   # http://localhost:5173 (Lace on Preprod)
```

## What Gets Proved (and What Stays Private)

| Proved | Stays private |
|--------|----------------|
| You own the round | Secret key |
| Reveal matches prior bet commitment | Raw choice & amount (until you settle) |
| Fair settle against house outcome | Strategy history of unsettled bets |

## Troubleshooting

- **Wallet won’t connect** — Install 1AM/Lace; switch to Midnight Preprod (L2) or Preview (L1).
- **Proving hangs** — Start proof server: `npm run proof:up` → `http://127.0.0.1:6300`.
- **Withdraw stuck** — Treasury needs tDUST for fees; wait or retry a small amount.
- **Compile fails** — `export PATH="$HOME/.local/bin:$HOME/.compact/bin:$PATH"` then `cd midnight-contract && npm run compact`.

## Rise In Level 3

Product proposal: **Sealed-Bid Auction** — see [`PROPOSAL.md`](../PROPOSAL.md). Run `npm run test:all` before pushing; CI compiles Compact and runs Vitest on `main`.
