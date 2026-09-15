# Rise In Level 2 — Waxing Crescent

Mission: Compact contract wired to a frontend, Lace/1AM connected on **Preprod**, circuit call from the UI.

## What this repo ships

| Gate | Where |
|------|--------|
| Lace connect / disconnect | `midnight-dapp` (default `VITE_NETWORK_ID=preprod`) + navbar `MidnightConnectWalletButton` |
| Circuit from frontend | `midnight-dapp` → `placeBet` / `commitHouseSeed` / `settleWheel` |
| Observable privacy | Choice/amount stay witnesses; public ledger shows commitments only until settle — see README **Privacy Claim** |
| Live demo | https://midnight-casino-eta.vercel.app/ (+ local on-chain UI `:5173`) |
| Demo video | https://youtu.be/DVEq_W_Uzrk |
| Preprod address | README **Contract Address** table (filled after deploy) |

## Lace / 1AM on Preprod (required)

1. Install [1AM](https://1am.xyz/) or Lace; create/select a **Preprod** Midnight account (`mn_addr_preprod1…`).
2. Set proof server to `http://127.0.0.1:6300`.
3. Fund unshielded address at the [Preprod faucet](https://midnight-tmnight-preprod.nethermind.dev/).
4. In wallet: **Generate tDUST** / register NIGHT for dust.
5. Local stack:

```bash
export PATH="$HOME/.local/bin:$HOME/.compact/bin:$PATH"
npm run proof:up
npm run midnight:dapp:preprod   # http://localhost:5173
```

6. Connect → **Deploy casino.compact** (or Join existing 64-hex) → **placeBet**.
7. Paste the Active contract address into README Preprod row.

## Headless Preprod deploy (optional)

```bash
npm run proof:up
# Fund the printed mn_addr_preprod1… via faucet, then:
NODE_OPTIONS='--max-old-space-size=8192' npm run deploy:preprod
# Writes docs/PREPROD_DEPLOY.json when done
```

Seed lives in `.env.preprod` (gitignored). Never commit it.

## Explorer

- https://preprod.midnightexplorer.com/
- https://midnight-preprod.subscan.io/
- https://explorer.1am.xyz/?network=preprod
