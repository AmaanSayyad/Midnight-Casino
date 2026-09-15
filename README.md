# Midnight Casino

Privacy-first GameFi on **Midnight Network** — Compact ZK contracts, dual-ledger private bets, and a playable casino UI.

Apache License 2.0 · Tags: `midnightntwrk`, `compact`, `typescript`

## Why this project (privacy problem → Midnight fit)

Online casinos either (a) hide everything and ask users to trust them, or (b) put every bet on a public chain and dox player strategy/bankroll. Midnight’s programmable privacy lets us **prove fair settlement without publishing private bet intent**.

| Data | Visibility |
|---|---|
| Secret key, bet choice, amount, salt | **Private** (local witnesses) |
| Round id, game type, bet commitment, ownership hash | **Public ledger** |
| Outcome + payout after settle | **Selective disclosure** |

Official Midnight gaming framing matches this: verify game logic privately on-chain.

## Technical gate (Buildathon)

- Compact contract: [`midnight-contract/casino.compact`](midnight-contract/casino.compact)
- Compiles with Compact toolchain **0.30.0** / language **0.22**
- Circuits: `placeBet`, `commitHouseSeed`, `settleWheel`, `verifyRoundOwnership`
- Private-state witnesses: `localSecretKey`, `getBetChoice`, `getBetAmount`, `getBetSalt`
- Proving keys committed under `midnight-contract/managed/casino/keys/`

```bash
# Install Compact: https://docs.midnight.network/getting-started/installation
export PATH="$HOME/.local/bin:$HOME/.compact/bin:$PATH"
compact update 0.30.0

cd midnight-contract
npm install
npm run compact    # must succeed
npm test           # simulator QA
```

## Architecture

```
┌──────────────────────────┐     ZK proof      ┌────────────────────────────┐
│ Browser / Lace client    │ ───────────────► │ Midnight public ledger     │
│ privateState (witnesses) │                  │ rounds Map, commitments   │
│ choice, amount, salt, sk │                  │ outcome, payout (settled) │
└──────────────────────────┘                  └────────────────────────────┘
```

- **Compact contract** — rules + dual ledger (`midnight-contract/`)
- **UI** — Next.js casino + Privacy Wheel at `/game/privacy-wheel`
- **Proof server** — `npm run proof:up` (Docker `midnightntwrk/proof-server`)
- **Legacy EVM** — previous Solidity/Pyth experiments kept in `legacy-evm/` (not the Midnight submission surface)

## How judges can evaluate

1. **Compile gate**
   ```bash
   cd midnight-contract && npm run compact
   ```
   Expect: `Compiling 4 circuits` and artifacts in `managed/casino/`.

2. **QA**
   ```bash
   cd midnight-contract && npm test
   ```

3. **UX / end-to-end privacy demo**
   ```bash
   npm install   # repo root
   npm run dev
   ```
   Open [http://localhost:3000/game/privacy-wheel](http://localhost:3000/game/privacy-wheel)  
   Flow: set private choice/amount → `placeBet` → inspect public commitment → `commitHouseSeed` → `settleWheel`.

4. **Pitch deck** — [Figma deck](https://www.figma.com/deck/fIrY9l7XwfGovD0G5lSGiV/Midnight-Casino?node-id=1-1812&p=f&t=UEqNlvW63v7CuiZx-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1)

5. **Live demo** — https://midnight-casino-eta.vercel.app/ (Privacy Wheel: [/game/privacy-wheel](https://midnight-casino-eta.vercel.app/game/privacy-wheel))

6. **Wave progress** — see [`WAVE1_PROGRESS.md`](WAVE1_PROGRESS.md)

## Midnight integration details

| Circuit | Role |
|---|---|
| `placeBet(gameType)` | Commits hidden choice/amount; discloses only commitment + owner hash + game type |
| `commitHouseSeed(commit)` | House entropy commit for fairness |
| `settleWheel(roundId, houseOutcome)` | Owner proves commitment match; discloses win/loss + payout |
| `verifyRoundOwnership(roundId)` | Prove ownership without revealing secret key |

Dual-ledger: public `export ledger` fields vs private witnesses — same model as Midnight docs (bulletin board / leaderboard examples).

## Repo layout

```
midnight-contract/     # Compact source, managed artifacts, witnesses, vitest
src/app/game/privacy-wheel/  # UI wired to Compact semantics
src/lib/midnight/      # Client adapter mirroring circuits
proof-server/          # Docker Compose proof server
legacy-evm/            # Optional legacy Solidity (not required for judging)
LICENSE                # Apache-2.0
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run compact` | Compile Compact contract |
| `npm run compact:test` | Run contract simulator tests |
| `npm run proof:up` | Start local proof server `:6300` |
| `npm run midnight:dapp` | Lace on-chain Compact UI `:5173` |
| `npm run dev` | Next.js frontend |

## Lace on-chain DApp

Full Lace + Compact deploy/bet UI lives in `midnight-dapp/` (Vite, port 5173).

```bash
npm run proof:up          # Docker proof server :6300
npm run midnight:dapp     # http://localhost:5173
```

See [`LACE_E2E.md`](LACE_E2E.md). Seed phrases stay in Lace — the app never requests them.

## Ecosystem attribution

Built with [Midnight Network](https://midnight.network/), [Compact](https://docs.midnight.network/compact), patterns from official examples ([leaderboard](https://github.com/midnightntwrk/midnight-leaderboard), [bulletin board](https://docs.midnight.network/examples/dapps/bboard)), and docs at https://docs.midnight.network/.

## License

Midnight-related Compact contract, witnesses, managed artifacts, Privacy Wheel UI adapter, and documentation added for this Buildathon are licensed under the **Apache License 2.0** — see [`LICENSE`](LICENSE). Pre-existing frontend/game assets may retain prior terms where applicable; judges can evaluate all Midnight functionality under Apache-2.0 paths listed above.
