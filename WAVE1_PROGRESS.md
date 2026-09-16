# Wave 1 Progress — Midnight Casino

**Wave:** Midnight Buildathon Wave 1 (Aug 27 – Sep 16, 2026)  
**Focus:** Meaningful Midnight Compact integration + privacy-shaped product surface

## What shipped this Wave

1. **New Compact contract** `midnight-contract/casino.compact`
   - Compiles with Compact 0.31.1 (4 circuits + proving keys, runtime 0.16.0)
   - Private-state witnesses for secret key, bet choice, amount, salt
   - Public ledger: rounds map, commitments, selective settlement disclosure
2. **QA:** Vitest simulator covering place / settle / ownership / tamper rejection
3. **UX:** `/game/privacy-wheel` end-to-end flow connected to Compact semantics
4. **Ops:** Proof-server Docker Compose, Apache-2.0 LICENSE, Buildathon README
5. **Clarified architecture:** Midnight Compact is the submission surface; prior EVM/Solidity experiments moved to `legacy-evm/`

## How privacy shapes the product

Players can wager without broadcasting strategy or bankroll size on a public mempool. The house and observers see commitments and later fair outcomes — not raw private inputs — matching Midnight’s selective disclosure model for gaming.

## Demo artifacts

- **GitHub:** https://github.com/AmaanSayyad/Midnight-Casino/
- **Live:** https://midnight-casino-eta.vercel.app/ (Privacy Wheel: `/game/privacy-wheel`)
- **Deck:** [Figma — Midnight Casino](https://www.figma.com/deck/fIrY9l7XwfGovD0G5lSGiV/Mignight-Casino?node-id=1-1812&t=W8Z7T69GDhVJM4H9-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1)
- **Demo video:** https://youtu.be/DVEq_W_Uzrk

## Next Waves (roadmap)

- Wave 2: Lace wallet deploy to Preprod, shielded balance / DUST sponsorship for gasless UX
- Wave 3: Expand Compact circuits to Mines/Plinko private boards; production indexer sync

## Rise In L2 (2026-09-15)
- Compact dapp defaults to Preprod; Lace connect/disconnect + placeBet UI ready.
- Headless `npm run deploy:preprod` available; address pending funded wallet sync.

## Rise In L4 (2026-09-15)
- Preprod MVP live: `33d34f168e360498df9b9e08baca1c999cdf50e61642f8af2888eaed7ec4be92`
- Docs/CI complete; Product X: https://x.com/AptCasinofun · https://x.com/AptCasinofun/status/2100145981979549826 · https://x.com/AptCasinofun/status/2100145986362560612

## Rise In L6 (2026-09-16)
- Target **70 Preprod** wallet addresses — **all 70 funded on-chain** via `/l5-fund`
- Lists: [`USERS.md`](USERS.md) · [`docs/funded-all-70.json`](docs/funded-all-70.json)
- Remaining: none for L1–L6 (optional: more build-in-public posts from `@AptCasinofun`)
- Runbook: [`docs/LEVEL6.md`](docs/LEVEL6.md)
