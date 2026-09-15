# Wave 1 Progress — Midnight Casino

**Wave:** Midnight Buildathon Wave 1 (Aug 27 – Sep 16, 2026)  
**Focus:** Meaningful Midnight Compact integration + privacy-shaped product surface

## What shipped this Wave

1. **New Compact contract** `midnight-contract/casino.compact`
   - Compiles with Compact 0.30.0 (4 circuits + proving keys)
   - Private-state witnesses for secret key, bet choice, amount, salt
   - Public ledger: rounds map, commitments, selective settlement disclosure
2. **QA:** Vitest simulator covering place / settle / ownership / tamper rejection
3. **UX:** `/game/privacy-wheel` end-to-end flow connected to Compact semantics
4. **Ops:** Proof-server Docker Compose, Apache-2.0 LICENSE, Buildathon README
5. **Clarified architecture:** Midnight Compact is the submission surface; prior EVM/Solidity experiments moved to `legacy-evm/`

## How privacy shapes the product

Players can wager without broadcasting strategy or bankroll size on a public mempool. The house and observers see commitments and later fair outcomes — not raw private inputs — matching Midnight’s selective disclosure model for gaming.

## Demo artifacts

- Repo (this): public GitHub with Compact sources
- Deck: Figma Midnight Casino deck (link in README)
- Interactive demo: `/game/privacy-wheel` + Vercel deployment
- Video pitch: record 2–3 min walkthrough of compile → Privacy Wheel placeBet/settleWheel (attach on AKINDO)

## Next Waves (roadmap)

- Wave 2: Lace wallet deploy to Preprod, shielded balance / DUST sponsorship for gasless UX
- Wave 3: Expand Compact circuits to Mines/Plinko private boards; production indexer sync
