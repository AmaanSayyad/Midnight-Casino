# Product Proposal

## What is the product, and who uses it?
[I WILL FILL THIS IN]

Midnight Casino is a privacy-first GameFi app: players wager without publishing strategy or bankroll size. Target users: crypto gamers who want fairness proofs without doxxing intent on a public mempool.

## Why Midnight specifically?
[I WILL FILL THIS IN — what does Midnight do that a transparent chain could not do well for this product?]

Transparent L1s force every bet onto a public explorer. Midnight’s dual ledger + Compact witnesses let us commit privately and selectively disclose only settlement outcomes — something a fully transparent chain cannot do without leaking strategy.

## Data Model
| Data Point       | Type           | Disclosed To |
|------------------|----------------|--------------|
| bet choice       | Private witness| No one (until settle prove) |
| bet amount       | Private witness| No one (commitment only) |
| secret key       | Private witness| No one |
| betCommit        | Public ledger  | Everyone |
| ownerHash        | Public ledger  | Everyone |
| gameType         | Public ledger  | Everyone |
| outcome / payout | Public ledger  | Everyone (at settle) |
| houseSeedCommit  | Public ledger  | Everyone |

[I WILL FILL IN THE ROWS]

## Mainnet Feasibility
[I WILL FILL THIS IN — is this realistic to reach Mainnet by Level 6?]

Wave/Buildathon path: Preview → Preprod (Lace/DUST) → Mainnet after audits + dust UX + indexer sync. Feasible if Preprod wallet/dust sponsorship stabilizes in Levels 4–5.
