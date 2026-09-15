# User Feedback — Level 5 (Full Moon)

## Feedback collection method

| Channel | Link / path |
|---------|-------------|
| In-app form (live) | https://midnight-casino-eta.vercel.app/feedback |
| Google Form | Create via [`GOOGLE_FORM.md`](GOOGLE_FORM.md) → paste URL in README |
| Public sheet (Excel/CSV) | [`feedback-sheet.csv`](feedback-sheet.csv) (open in Excel / Sheets) |
| Onboarding | https://midnight-casino-eta.vercel.app/onboard |
| Users table | [`USERS.md`](../USERS.md) |

**Form fields:** Name, Email, Wallet Address, Product Rating (1–5), plus ≥3 feedback questions (liked most, missing feature, bugs/UX), optional recommend.

## What we heard (themes)

Early Preprod dogfood + first-cohort notes (Privacy Wheel + Compact dapp + fund UI):

1. **Unclear first step** — players did not know whether to connect, join the contract, or press placeBet first.
2. **Missing busy/loading feedback** — circuit buttons felt “dead” with no pending state.
3. **Public vs private still confusing** — needed an on-page legend during the round.
4. **No obvious place to leave feedback** — L5 requires a durable loop; form was buried in docs.
5. **Onboarding friction** — faucet / proof-server / Preprod network steps were scattered.
6. **Fund UX (batch 1, wallets #1–#7)** — cached navbar session lacked ConnectedAPI; one-approve-per-wallet too slow; 70-output 1AM popup not scrollable → chunked batching (3–5).

## What we changed (improvement summary)

| Change | Reason (theme) | Commit |
|--------|----------------|--------|
| Onboarding checklist on Privacy Wheel | Unclear first step | [`daf12b8`](https://github.com/AmaanSayyad/Midnight-Casino/commit/daf12b8) |
| Busy/loading labels on place / settle | Missing loading feedback | [`daf12b8`](https://github.com/AmaanSayyad/Midnight-Casino/commit/daf12b8) |
| Public vs private legend panel | Privacy confusion | [`daf12b8`](https://github.com/AmaanSayyad/Midnight-Casino/commit/daf12b8) |
| In-app `/feedback` + CTA | No feedback surface | [`9bdc76a`](https://github.com/AmaanSayyad/Midnight-Casino/commit/9bdc76a) |
| `/onboard` Preprod checklist | Scattered onboarding | [`9bdc76a`](https://github.com/AmaanSayyad/Midnight-Casino/commit/9bdc76a) |
| Compact dapp step progress | Unclear circuit order | [`ec86b80`](https://github.com/AmaanSayyad/Midnight-Casino/commit/ec86b80) |
| USAGE + LEVEL5 docs sync | Docs lag product | [`ead7341`](https://github.com/AmaanSayyad/Midnight-Casino/commit/ead7341) / [`bee78a5`](https://github.com/AmaanSayyad/Midnight-Casino/commit/bee78a5) |
| Rehydrate wallet API before fund | Cached session blocked sends | [`ec23e03`](https://github.com/AmaanSayyad/Midnight-Casino/commit/ec23e03) |
| Batch `makeTransfer` multi-out | Too many approvals | [`65b53fd`](https://github.com/AmaanSayyad/Midnight-Casino/commit/65b53fd) |
| Chunk size 3–5 for 1AM UI | Unscrollable mega-popup | [`1605335`](https://github.com/AmaanSayyad/Midnight-Casino/commit/1605335) |

Also mirrored in README **Feedback Implementation**.

## Funded wallets

All **70** Preprod addresses funded on-chain via `/l5-fund` — [`funded-all-70.json`](funded-all-70.json) · [`USERS.md`](../USERS.md). Name/Email columns awaiting form entries.

## Raw feedback log

Populate from Google Form / `/feedback` exports. Mirror into [`feedback-sheet.csv`](feedback-sheet.csv).

| # | User | Feedback Summary | Date |
|---|------|------------------|------|
| — | — | *(awaiting 50 Preprod responses)* | — |

## Level continuity

- L3: CI + Sealed-Bid proposal  
- L4: Preprod MVP `33d34f16…be92`  
- L5: same MVP + users + this feedback loop
