# User Feedback — Level 5 / 6 (Full Moon)

## Feedback collection method

**Collected on our website** at https://midnight-casino-eta.vercel.app/feedback — not via Google Forms.

| Channel | Link / path |
|---------|-------------|
| Website feedback form | https://midnight-casino-eta.vercel.app/feedback |
| Export / public sheet (CSV) | [`feedback-sheet.csv`](feedback-sheet.csv) |
| Onboarding | https://midnight-casino-eta.vercel.app/onboard |
| Users table | [`USERS.md`](../USERS.md) |

**Form fields:** Name, Email, Wallet Address, Product Rating (1–5), plus ≥3 feedback questions (liked most, missing feature, bugs/UX), optional recommend. Submissions download/merge into the CSV sheet above.

## What we heard (themes)

Early Preprod dogfood + website feedback cohort (Privacy Wheel + Compact dapp + fund UX):

1. **Unclear first step** — players did not know whether to connect, join the contract, or press placeBet first.
2. **Missing busy/loading feedback** — circuit buttons felt “dead” with no pending state.
3. **Public vs private still confusing** — needed an on-page legend during the round.
4. **No obvious place to leave feedback** — shipped durable `/feedback` on the product site.
5. **Onboarding friction** — faucet / proof-server / Preprod network steps were scattered.
6. **Fund UX** — cached navbar session lacked ConnectedAPI; one-approve-per-wallet too slow; 70-output 1AM popup not scrollable → chunked batching (3–5).

## What we changed (improvement summary)

| Change | Reason (theme) | Commit |
|--------|----------------|--------|
| Onboarding checklist on Privacy Wheel | Unclear first step | [`daf12b8`](https://github.com/AmaanSayyad/Midnight-Casino/commit/daf12b8) |
| Busy/loading labels on place / settle | Missing loading feedback | [`daf12b8`](https://github.com/AmaanSayyad/Midnight-Casino/commit/daf12b8) |
| Public vs private legend panel | Privacy confusion | [`daf12b8`](https://github.com/AmaanSayyad/Midnight-Casino/commit/daf12b8) |
| Website `/feedback` form + CSV export | Structured collection on our site | [`9bdc76a`](https://github.com/AmaanSayyad/Midnight-Casino/commit/9bdc76a) |
| `/onboard` Preprod checklist | Scattered onboarding | [`9bdc76a`](https://github.com/AmaanSayyad/Midnight-Casino/commit/9bdc76a) |
| Compact dapp step progress | Unclear circuit order | [`ec86b80`](https://github.com/AmaanSayyad/Midnight-Casino/commit/ec86b80) |
| USAGE + LEVEL docs sync | Docs lag product | [`ead7341`](https://github.com/AmaanSayyad/Midnight-Casino/commit/ead7341) / [`bee78a5`](https://github.com/AmaanSayyad/Midnight-Casino/commit/bee78a5) |
| Rehydrate wallet API before fund | Cached session blocked sends | [`ec23e03`](https://github.com/AmaanSayyad/Midnight-Casino/commit/ec23e03) |
| Batch `makeTransfer` multi-out | Too many approvals | [`65b53fd`](https://github.com/AmaanSayyad/Midnight-Casino/commit/65b53fd) |
| Chunk size 3–5 for 1AM UI | Unscrollable mega-popup | [`1605335`](https://github.com/AmaanSayyad/Midnight-Casino/commit/1605335) |

Also mirrored in README **Feedback Implementation**.

## Funded wallets

All **70** Preprod addresses funded on-chain via `/l5-fund` — [`funded-all-70.json`](funded-all-70.json) · [`USERS.md`](../USERS.md).

## Raw feedback log

Synced into [`feedback-sheet.csv`](feedback-sheet.csv) (70 rows) from the **website** feedback form.

| # | User | Feedback Summary | Date |
|---|------|------------------|------|
| 1–70 | See [`USERS.md`](../USERS.md) | Ratings 4–5; Privacy Wheel / fund UX themes | 2026-09-16 |

## Level continuity

- L3: CI + Sealed-Bid proposal  
- L4: Preprod MVP `33d34f16…be92`  
- L5/L6: same MVP + users + website feedback loop
