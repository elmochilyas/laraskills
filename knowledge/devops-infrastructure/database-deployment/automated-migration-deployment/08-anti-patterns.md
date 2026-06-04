# Anti-Patterns: Automated Migration Deployment

## AP-AM-001: No --force Flag
**Description:** Running `php artisan migrate` without `--force` in CI/CD.
**Consequences:** Pipeline hangs waiting for production confirmation input. Deployment times out.
**Remediation:** Always use `php artisan migrate --force` in non-interactive environments.

## AP-AM-002: Irreversible Migrations
**Description:** Migration with `up` but no `down`, or `down` that drops data.
**Consequences:** Rollback is impossible. Bad deployment cannot be reverted.
**Remediation:** Always implement reversible migrations. For destructive changes, use three-phase expand-migrate-contract.

## AP-AM-003: Untested Migrations
**Description:** Deploying migrations that have only been tested on local SQLite.
**Consequences:** MySQL/PostgreSQL-specific syntax or behavior differences cause production failures.
**Remediation:** Test migrations against the same database engine used in production. Use CI service containers.
