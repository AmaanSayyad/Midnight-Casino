# Midnight Casino Compact Contract

Apache-2.0

## Compile

Requires [Compact toolchain](https://docs.midnight.network/getting-started/installation) 0.30.x:

```bash
export PATH="$HOME/.local/bin:$HOME/.compact/bin:$PATH"
npm run compact
```

Successful output includes `Compiling 4 circuits` and writes `managed/casino/{contract,keys,zkir,compiler}`.

## Test

```bash
npm install
npm test
```

## Circuits

- `placeBet` — private bet commitment
- `commitHouseSeed` — house entropy commitment
- `settleWheel` — ownership + commitment check, disclose outcome/payout
- `verifyRoundOwnership` — prove control of a round
