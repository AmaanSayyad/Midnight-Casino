# Rise In — Midnight Builder Challenge (same repo)

This repo (**Midnight Casino**) fulfills the Rise In “New Moon → Supermoon” challenge **on top of** the existing Compact GameFi product — not a throwaway hello-world.

| Level | Focus | Status in this repo |
|-------|--------|---------------------|
| L1 New Moon | Compact + tests + README gates | **Done** — compile, 9 tests, `managed/` keys, Preview deploy `50a1cb0c…49f4`, Initial Idea + screenshots in README |
| L2 Waxing Crescent | Wallet + circuit UI + live demo | **Mostly done** — 1AM/Lace + Privacy Wheel + Vercel live |
| L3 First Quarter | CI + PROPOSAL + polish | **Scaffolded** — CI + PROPOSAL.md added; fill placeholders |
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

1. **L1** — Complete on Preview (address + idea + screenshots shipped). Keep ≥5 meaningful challenge commits on `main`.
2. **PROPOSAL.md** — Fill remaining `[I WILL FILL THIS IN]` sections before L4.
3. **Preprod** — Deploy Compact when moving to L4; paste address into README.
4. Connect Midnight docs MCP: https://midnight.mcp.kapa.ai

### Deploy (Lace) — Preview

```bash
export PATH="$HOME/.local/bin:$HOME/.compact/bin:$PATH"
npm run proof:up
cd midnight-contract && npm run compact && npm test
cd .. && npm run midnight:dapp
# Browser: http://localhost:5173 → Connect Lace → Deploy casino.compact
# Paste the printed contract address into README.md
```

## L1 checklist (auto)

- [x] Contract compiles (`cd midnight-contract && npm run compact`)
- [x] `managed/` present (keys for 4 circuits)
- [x] 3+ tests passing (9 in midnight-contract)
- [x] Contract deployed to Preview — `50a1cb0c358c57b52d32eb44d6c1054aa2d0352420fcb76ccd823b81ccac49f4`
- [x] Contract address in README
- [x] README has required Challenge sections
- [x] File structure matches adapted spec (`contracts/`, `managed/`, `tests/`, CI)
