# Decision Trees: Automated Migration Deployment

## Migration Timing

**Deployment type:**
- Zero-downtime (symlink swap) → Run migrations BEFORE swap
- Maintenance window → Run migrations AFTER code deploy
- Blue-green → Run migrations once, shared database

## Migration Risk

**Schema change type:**
- Add column (nullable) → Low risk, standard CI deploy
- Add column (NOT NULL with default) → Low risk
- Add column (NOT NULL, no default) → Medium risk, needs data backfill
- Drop column → High risk, requires expand-migrate-contract
- Rename table → High risk, requires zero-downtime tools (pt-osc)
