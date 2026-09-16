# Rise In Level 4 — Waxing Gibbous

Mission: MVP live on Preprod, with docs, CI/CD, and a public product X profile.

## MVP surface (live)

| Piece | Link / value |
|-------|----------------|
| Product UI | https://midnight-casino-eta.vercel.app/ |
| Privacy Wheel | https://midnight-casino-eta.vercel.app/game/privacy-wheel |
| Preprod Compact contract | `33d34f168e360498df9b9e08baca1c999cdf50e61642f8af2888eaed7ec4be92` |
| Deploy tx | https://explorer.1am.xyz/tx/7d30659622f8686bf809e0f0530c8611627af4203ccc169a2279c02e9ecc764d?network=preprod |
| Explorer | https://preprod.midnightexplorer.com/ |
| On-chain Lace UI | `npm run midnight:dapp:preprod` → Join prefilled Preprod address |
| CI | ![CI](https://github.com/AmaanSayyad/Midnight-Casino/actions/workflows/ci.yml/badge.svg) |
| Proposal | Sealed-Bid Auction — [`PROPOSAL.md`](../PROPOSAL.md) |
| Demo video | https://youtu.be/DVEq_W_Uzrk |
| Product X | https://x.com/AptCasinofun · [launch](https://x.com/AptCasinofun/status/2100145981979549826) · [MVP](https://x.com/AptCasinofun/status/2100145986362560612) |

## Privacy-critical core (shipped first)

1. `placeBet` — sealed bid (choice + amount as witnesses; public commitment only)
2. `commitHouseSeed` — house entropy commitment
3. `settleWheel` — selective disclosure of outcome / payout / won
4. Lace connect / disconnect on Preprod

## Docs

- README — setup, privacy model, addresses, CI badge
- [`USAGE.md`](USAGE.md) — player steps
- [`LEVEL2.md`](LEVEL2.md) / [`LEVEL3.md`](LEVEL3.md) — prior gates
- [`BUILD_IN_PUBLIC.md`](BUILD_IN_PUBLIC.md) — X profile + launch posts

## Join Preprod MVP (Lace)

```bash
export PATH="$HOME/.local/bin:$HOME/.compact/bin:$PATH"
npm run proof:up
npm run midnight:dapp:preprod
# 1AM → Preprod → proof server http://127.0.0.1:6300
# Connect → Join (prefilled 33d34f16…be92) → placeBet
```
