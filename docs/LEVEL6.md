# Level 6 — Users & feedback (70 Preprod)

Per Rise In monthly cycle: **same Preprod MVP**, refined through feedback, with **70 Preprod users**, docs in sync, and **≥30 meaningful commits**.

> Note: Earlier “Supermoon / Mainnet” branding may appear in older decks. **This cycle’s written requirements are Preprod + 70 wallets** (see submission checklist below).

## How fees work (tNIGHT vs tDUST)

| Token | Role in `/l5-fund` |
|-------|---------------------|
| **tNIGHT** | What you **send** to each of the 70 addresses (e.g. 0.1 each). |
| **tDUST** | What **your** connected 1AM wallet **burns as the fee** for each transfer. It is **not** sent to recipients. |

Midnight design: DUST is non-transferable. Recipients generate their own DUST later by registering received NIGHT in 1AM/Lace. 1AM may also **sponsor** fees (ProofStation) so your visible DUST can be `0` and transfers still work.

**Before funding:** faucet your 1AM Preprod wallet with enough tNIGHT (≈ `70 × amount` + buffer) and ensure DUST is generating (or sponsorship is on).

## Canonical product

| Item | Value |
|------|-------|
| Live demo | https://midnight-casino-eta.vercel.app/ |
| Privacy Wheel | https://midnight-casino-eta.vercel.app/game/privacy-wheel |
| Fund UI (1AM) | https://midnight-casino-eta.vercel.app/l5-fund |
| Feedback | https://midnight-casino-eta.vercel.app/feedback |
| Onboard | https://midnight-casino-eta.vercel.app/onboard |
| Preprod contract | `33d34f168e360498df9b9e08baca1c999cdf50e61642f8af2888eaed7ec4be92` |
| Users list | [`USERS.md`](../USERS.md) · [`l5-wallets.public.csv`](l5-wallets.public.csv) |
| Demo video | https://youtu.be/DVEq_W_Uzrk |

## Pass requirements

- [x] 70 Preprod wallet addresses minted (public list) — name/email/feedback you fill
- [x] All 70 funded on-chain via `/l5-fund`
- [x] Feedback loop documented ([`FEEDBACK.md`](FEEDBACK.md))
- [x] Updated documentation
- [x] ≥30 meaningful commits (repo history)

## Submission checklist

- [x] Public GitHub with updated docs
- [x] Live demo link
- [x] List of 70 Preprod addresses ([`USERS.md`](../USERS.md)) — **funded**
- [x] Feedback documentation
- [x] Demo video
- [x] ≥30 meaningful commits
- [ ] Google Form + sheet URLs in README (you publish — [`GOOGLE_FORM.md`](GOOGLE_FORM.md))
- [ ] Name / email / feedback columns filled for scoring
- [ ] Product X (from L4) if not done

## Fund the 70 (1AM)

1. Open https://midnight-casino-eta.vercel.app/l5-fund  
2. Connect 1AM on **Preprod**  
3. Amount `0.1` → **Fund all** → approve each popup  
4. Your wallet pays **tDUST fees**; recipients receive **tNIGHT only**
