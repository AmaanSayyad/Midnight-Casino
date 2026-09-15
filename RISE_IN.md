# Rise In — Midnight Builder Challenge (same repo)

This repo (**Midnight Casino**) fulfills the Rise In “New Moon → Supermoon” challenge **on top of** the existing Compact GameFi product — not a throwaway hello-world.

| Level | Focus | Status in this repo |
|-------|--------|---------------------|
| L1 New Moon | Compact + tests + README gates | **Done** — compile, 9 tests, `managed/` keys, Preview deploy `50a1cb0c…49f4`, Initial Idea + screenshots in README |
| L2 Waxing Crescent | Wallet + circuit UI + Preprod | **Done** — Lace connect/disconnect + placeBet UI; Preprod `33d34f16…be92` ([tx](https://explorer.1am.xyz/tx/7d30659622f8686bf809e0f0530c8611627af4203ccc169a2279c02e9ecc764d?network=preprod)) |
| L3 First Quarter | CI + PROPOSAL + polish | **Done** — Sealed-Bid Auction proposal, fixed CI Compact install, test screenshot, privacy model |
| L4 Waxing Gibbous | Preprod MVP | Pending proposal approval + Preprod deploy |
| L5 Full Moon | 50 users + feedback | Scaffold later |
| L6 Supermoon | Mainnet path | Later |

## Canonical links

- GitHub: https://github.com/AmaanSayyad/Midnight-Casino/
- Live: https://midnight-casino-eta.vercel.app/
- Privacy Wheel: https://midnight-casino-eta.vercel.app/game/privacy-wheel
- Deck: https://www.figma.com/deck/fIrY9l7XwfGovD0G5lSGiV/Mignight-Casino?node-id=1-1812&t=W8Z7T69GDhVJM4H9-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1
- Demo video: https://youtu.be/DVEq_W_Uzrk

## Challenge layout mapping

| Challenge path | This repo |
|----------------|-----------|
| `contracts/*.compact` | `contracts/casino.compact` (+ `midnight-contract/casino.compact`) |
| `managed/` | symlink → `midnight-contract/managed/` |
| `tests/` | `tests/casino.test.ts` + `midnight-contract/test/` (9 tests) |
| Frontend wallet | `src/components/MidnightConnectWalletButton.js` |
| Circuit UX | `/game/privacy-wheel` + `midnight-dapp/` |
| CI | `.github/workflows/ci.yml` |

## Manual steps (remaining)

1. **L3** — Sealed-Bid Auction proposal shipped (`PROPOSAL.md`). Confirm CI badge green after this push.
2. **L4** — After proposal approval, deepen Preprod MVP polish.
3. Connect Midnight docs MCP: https://midnight.mcp.kapa.ai

### Deploy (Lace) — Preprod

```bash
export PATH="$HOME/.local/bin:$HOME/.compact/bin:$PATH"
npm run proof:up
npm run midnight:dapp:preprod
# 1AM/Lace → Network Preprod → proof server http://127.0.0.1:6300
# Fund: https://midnight-tmnight-preprod.nethermind.dev/
# Browser: http://localhost:5173 → Connect → Deploy → placeBet
# Paste Active 64-hex into README Contract Address (Preprod)
```

### Deploy (CLI) — Preprod

```bash
npm run proof:up
NODE_OPTIONS='--max-old-space-size=8192' npm run deploy:preprod
```

## L1 checklist (auto)

- [x] Contract compiles (`cd midnight-contract && npm run compact`)
- [x] `managed/` present (keys for 4 circuits)
- [x] 3+ tests passing (9 in midnight-contract)
- [x] Contract deployed to Preview — `50a1cb0c358c57b52d32eb44d6c1054aa2d0352420fcb76ccd823b81ccac49f4`
- [x] Contract address in README
- [x] README has required Challenge sections
- [x] File structure matches adapted spec (`contracts/`, `managed/`, `tests/`, CI)

## L2 checklist

- [x] Lace connect / disconnect in frontend (`midnight-dapp` + navbar)
- [x] Circuit call path from frontend (`placeBet` in `midnight-dapp`)
- [x] Observable privacy behavior documented (README Privacy Claim)
- [x] Live demo link (Vercel)
- [x] Demo video link
- [x] Preprod contract address recorded in README — `33d34f168e360498df9b9e08baca1c999cdf50e61642f8af2888eaed7ec4be92`
- [x] ≥8 meaningful commits on repo history
- [x] Preprod dapp default (`VITE_NETWORK_ID=preprod`) + [`docs/LEVEL2.md`](docs/LEVEL2.md)

## L3 checklist

- [x] Functional privacy dApp (Privacy Wheel + Lace Preprod Compact UI)
- [x] ≥3 tests passing (9 simulator + 4 Rise gates)
- [x] CI/CD workflow with Compact install + compile + test (`.github/workflows/ci.yml`)
- [x] Chosen idea from list: **Sealed-Bid Auction** (`PROPOSAL.md`)
- [x] README Privacy Model / Privacy Claim
- [x] Test output screenshot (`docs/screenshots/vitest-passing.png`)
- [x] Live demo + demo video links
- [x] ≥10 meaningful commits
- [x] [`docs/LEVEL3.md`](docs/LEVEL3.md)
