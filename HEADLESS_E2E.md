# Headless Midnight E2E (no Lace)

Terminal alternative when you cannot use the Lace browser extension.

## What it proves

On a **local undeployed** Midnight stack (node + indexer + proof server via Docker/testcontainers):

1. Genesis wallet funds (seed `0000…0001` — local only)
2. Deploy `casino.compact`
3. `placeBet` (private choice/amount/salt)
4. `commitHouseSeed`
5. `settleWheel` → WIN + 2x payout on ledger

## Prerequisites

- Docker Desktop running
- Node 18+
- Compact toolchain on `PATH` (for contract rebuild)

```bash
export PATH="$HOME/.local/bin:$HOME/.compact/bin:$PATH"
```

## One-shot

```bash
# Install + compile contract + install CLI (pinned Midnight SDK versions)
npm run midnight:cli:install

# Ensure single WASM runtime (avoids ContractMaintenanceAuthority instanceof bugs)
rm -rf midnight-contract/node_modules
ln -sfn ../midnight-cli/node_modules midnight-contract/node_modules

# Run headless E2E (~2 min after images are cached)
cd midnight-cli && npm run test:e2e
```

Or from repo root after install:

```bash
npm run midnight:e2e
```

## Notes

- **Does not use Lace** and does **not** need your recovery phrase.
- Network id is `undeployed` (local Docker), not Preview/Preprod.
- For Lace Preview UI testing, use `midnight-dapp` on port 5173 (see `LACE_E2E.md`).
- Never paste Lace seeds into the CLI, chat, or git.
