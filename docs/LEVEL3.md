# Rise In Level 3 — First Quarter

Mission: polished production-grade dApp with tests, CI/CD, and an approved idea from the provided list.

## Chosen idea

**Sealed-Bid Auction** — private bids, verifiable winner.  
See [`PROPOSAL.md`](../PROPOSAL.md). Mapped onto Midnight Casino’s sealed `placeBet` → public settle flow.

## Gates

| Gate | Evidence |
|------|----------|
| Functional privacy dApp | Live: https://midnight-casino-eta.vercel.app/ · Preprod Compact UI `:5173` |
| ≥3 tests passing | 9 in `midnight-contract` + 4 Rise privacy-gate tests |
| CI/CD | `.github/workflows/ci.yml` + badge in README |
| Privacy model in README | Public vs private + Privacy Claim |
| Product proposal | `PROPOSAL.md` (Sealed-Bid Auction) |
| Demo video | https://youtu.be/DVEq_W_Uzrk |
| ≥10 commits | Repo history on `main` |

## Commands

```bash
export PATH="$HOME/.local/bin:$HOME/.compact/bin:$PATH"
cd midnight-contract && npm test          # 9 passing
cd .. && npx vitest run --config vitest.rise.config.ts   # Rise gates
# CI runs both + compact compile on every push to main
```
