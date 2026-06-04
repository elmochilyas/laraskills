# Rules: Database Migration CI

## DBCI-001: Migration Testing in CI
**Condition:** PR contains migration file
**Action:** Run migrations against test database in CI pipeline
**Rationale:** Untested migrations cause production schema errors
**Consequences:** Violation allows broken migrations to reach production

## DBCI-002: Production-Like Test Data
**Condition:** CI tests migration performance
**Action:** Use data volume representative of production for performance-critical migrations
**Rationale:** Migrations that work on 100 rows may lock tables on 10M rows
**Consequences:** Violation misses migration performance issues until production

## DBCI-003: Staging-First Migration
**Condition:** Database migration deployment
**Action:** Apply migrations to staging before production deployment
**Rationale:** Staging catches environment-specific migration issues
**Consequences:** Violation introduces migration issues directly to production

## DBCI-004: Isolated Migration Execution
**Condition:** Production migration execution
**Action:** Use `--isolated` flag to prevent concurrent migration runs
**Rationale:** Concurrent migrations from parallel deploy processes corrupt the migration state
**Consequences:** Violation causes migration table corruption
