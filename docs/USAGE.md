# How to Use Midnight Casino (Preprod MVP)

## What You Need

- A modern browser (Chrome recommended for 1AM / Lace)
- [1AM](https://1am.xyz/) or Lace wallet on **Midnight Preprod**
- Local proof server for on-chain Compact proving: `npm run proof:up` → `http://127.0.0.1:6300`
- tNIGHT from the [Preprod faucet](https://midnight-tmnight-preprod.nethermind.dev/) + Generate tDUST in wallet

## Live product

| Surface | URL |
|---------|-----|
| Casino UI | https://midnight-casino-eta.vercel.app/ |
| Privacy Wheel | https://midnight-casino-eta.vercel.app/game/privacy-wheel |
| Preprod contract | `33d34f168e360498df9b9e08baca1c999cdf50e61642f8af2888eaed7ec4be92` |
| Deploy tx | https://explorer.1am.xyz/tx/7d30659622f8686bf809e0f0530c8611627af4203ccc169a2279c02e9ecc764d?network=preprod |

## Player path (web)

1. Open https://midnight-casino-eta.vercel.app/
2. Connect 1AM / Lace from the navbar (Preprod).
3. Open **Privacy Wheel** and set a private sector + amount (witnesses).
4. Run the sealed-bid loop: placeBet → commitHouseSeed → settleWheel.
5. Observe: public ledger shows commitments; choice/amount stay private until settle disclosure.

## On-chain Compact path (Lace dapp)

```bash
export PATH="$HOME/.local/bin:$HOME/.compact/bin:$PATH"
npm run proof:up
npm run midnight:dapp:preprod   # http://localhost:5173
```

1. Connect Lace / 1AM on Preprod.
2. **Join** the prefilled Preprod MVP address (`33d34f16…be92`) — or Deploy your own.
3. Call **placeBet** (approve in wallet). Choice/amount never appear as raw ledger fields.
4. Optional: commitHouseSeed → settleWheel.

## What Gets Proved (and What Stays Private)

| Proved | Stays private |
|--------|----------------|
| You own the round | Secret key |
| Reveal matches prior bet commitment | Raw choice & amount (until settle) |
| Fair settle against house outcome | Unsettled strategy / bankroll size |

## Troubleshooting

- **Wallet won’t connect** — Install 1AM/Lace; switch to Midnight **Preprod**; refresh.
- **Proving hangs** — `npm run proof:up` → wallet proof server `http://127.0.0.1:6300`.
- **Insufficient DUST** — Faucet tNIGHT, then Generate tDUST / register for dust.
- **Join fails** — Confirm 64-hex address matches README Preprod row.
- **Compile fails** — `export PATH="$HOME/.local/bin:$HOME/.compact/bin:$PATH"` then `cd midnight-contract && npm run compact`.

## Rise In

- L3 proposal: **Sealed-Bid Auction** — [`PROPOSAL.md`](../PROPOSAL.md)
- L4 MVP: [`LEVEL4.md`](LEVEL4.md) · Build in public: [`BUILD_IN_PUBLIC.md`](BUILD_IN_PUBLIC.md)
- Tests: `npm run test:all` · CI on every push to `main`
