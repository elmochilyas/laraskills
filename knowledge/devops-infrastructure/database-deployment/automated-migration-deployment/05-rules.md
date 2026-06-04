# Rules: Automated Migration Deployment

## AM-001: --force Flag Required
**Condition:** Migration executed in CI/CD pipeline
**Action:** Include `--force` flag in `artisan migrate` command
**Rationale:** Pipeline cannot respond to production confirmation prompts
**Consequences:** Violation causes migration to hang waiting for confirmation

## AM-002: Idempotent Migrations
**Condition:** All migrations in project
**Action:** Each migration must be safe to run multiple times
**Rationale:** CI/CD retries or parallel deployments may re-run migrations
**Consequences:** Violation causes migration errors on retry

## AM-003: Test Migrations in CI
**Condition:** Migration PR submitted
**Action:** Run migrations against test database in CI pipeline
**Rationale:** Untested migrations can lock or corrupt production database
**Consequences:** Violation means migration errors are discovered in production

## AM-004: Reversible Migrations
**Condition:** Migration modifies schema
**Action:** Implement both `up` and `down` methods
**Rationale:** Irreversible migrations prevent rollback
**Consequences:** Violation makes deployment rollback impossible
