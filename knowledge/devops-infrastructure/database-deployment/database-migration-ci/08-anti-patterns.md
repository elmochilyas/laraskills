# Anti-Patterns: Database Migration CI

## AP-DBCI-001: No Migration Testing
**Description:** Deploying migrations that have never been tested against a real database instance.
**Consequences:** Syntax errors, constraint violations, and performance issues are discovered during production deployment.
**Remediation:** Run migrations in CI against a service container database.

## AP-DBCI-002: Concurrent Migration Execution
**Description:** Allowing multiple deployment processes to run migrations simultaneously.
**Consequences:** Migration table corruption. Duplicate migration entries. Schema in inconsistent state.
**Remediation:** Use `--isolated` flag. Implement deployment locks.
