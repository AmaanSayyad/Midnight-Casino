# Product Proposal — Rise In Level 3

**Chosen idea (from provided list):** Sealed-Bid Auction — private bids, verifiable winner.

Midnight Casino implements that pattern as a **sealed private wager**: the player’s choice and stake are Compact private witnesses (the sealed bid); the public ledger only stores a commitment + ownership hash; settlement selectively discloses outcome and payout so anyone can verify the winner without ever learning unsettled strategy or bankroll size.

---

## What is the product, and who uses it?

**Midnight Casino (Privacy Wheel)** is a privacy-first GameFi dApp on Midnight. Players place sealed bets whose **choice and amount stay private**, then settle against a house outcome with ZK proofs. Target users: crypto gamers and privacy-native players who want fairness proofs without doxxing intent on a public mempool — the same audience that wants sealed-bid auctions rather than open-order books.

## Why Midnight specifically?

Transparent L1s force every bid onto a public explorer (front-running, copy-trading, bankroll doxxing). Midnight’s dual ledger + Compact witnesses let us:

1. **Commit privately** (`placeBet`) — sealed bid as a hash, not plaintext.
2. **Prove ownership** without revealing the secret key.
3. **Selectively disclose** only win/loss + payout at settle — the auction’s public verifiable result.

A fully transparent chain cannot deliver sealed bids without an off-chain trusted operator. Midnight makes the sealed phase cryptographically enforceable on-chain.

## Data Model

| Data Point        | Type            | Disclosed To                          |
|-------------------|-----------------|---------------------------------------|
| bet choice        | Private witness | No one (sealed until settle prove)    |
| bet amount        | Private witness | No one (commitment only publicly)     |
| bet salt          | Private witness | No one                                |
| secret key        | Private witness | No one                                |
| betCommit         | Public ledger   | Everyone (sealed-bid commitment)      |
| ownerHash         | Public ledger   | Everyone (anonymous ownership token)  |
| gameType          | Public ledger   | Everyone                              |
| round status      | Public ledger   | Everyone                              |
| houseSeedCommit   | Public ledger   | Everyone                              |
| outcome / payout / won | Public ledger | Everyone (at settle — auction result) |

## Mainnet Feasibility

Yes — realistic by Level 6 if Preprod dust/wallet UX stays stable:

| Stage    | Network  | Gate                                      |
|----------|----------|-------------------------------------------|
| Done     | Preview  | Compact deploy + Lace path                |
| Done     | Preprod  | Address `33d34f16…be92` live              |
| L4–L5    | Preprod  | MVP polish, users, feedback               |
| L6       | Mainnet  | Audits, dust sponsorship, indexer ops     |

The sealed-bid / private-wager circuits already compile and run on Preprod; Mainnet is an ops + audit climb, not a redesign.

## Scope for approval

We submit **Sealed-Bid Auction** as the Level 3 product proposal. The shipped surface (`casino.compact` + Privacy Wheel + Lace Preprod dapp) is the concrete implementation of sealed private bids with a publicly verifiable settlement.
