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

Early Preprod dogfood + first-cohort notes (Privacy Wheel + Compact dapp):

1. **Unclear first step** — players did not know whether to connect, join the contract, or press placeBet first.
2. **Missing busy/loading feedback** — circuit buttons felt “dead” with no pending state.
3. **Public vs private still confusing** — needed an on-page legend during the round.
4. **No obvious place to leave feedback** — L5 requires a durable loop; form was buried in docs.
5. **Onboarding friction** — faucet / proof-server / Preprod network steps were scattered.

## What we changed (improvement summary)

| Change | Reason (theme) | Surface |
|--------|----------------|---------|
| Onboarding checklist on Privacy Wheel | Unclear first step | `/game/privacy-wheel` |
| Busy/loading labels on place / settle | Missing loading feedback | Privacy Wheel |
| Public vs private legend panel | Privacy confusion | Privacy Wheel |
| In-app `/feedback` + CTA | No feedback surface | Next.js |
| `/onboard` Preprod checklist | Scattered onboarding | Next.js |
| Compact dapp step progress | Unclear circuit order | `midnight-dapp` |
| USAGE + LEVEL5 docs sync | Docs lag product | `docs/` |

Commit IDs for the **Feedback Implementation** table are filled in README after each L5 commit lands on `main`.

## Raw feedback log

Populate from Google Form / `/feedback` exports. Mirror into [`feedback-sheet.csv`](feedback-sheet.csv).

| # | User | Feedback Summary | Date |
|---|------|------------------|------|
| — | — | *(awaiting 50 Preprod responses)* | — |

## Level continuity

- L3: CI + Sealed-Bid proposal  
- L4: Preprod MVP `33d34f16…be92`  
- L5: same MVP + users + this feedback loop
