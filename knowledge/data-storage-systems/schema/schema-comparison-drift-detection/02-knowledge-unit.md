# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.30 Schema comparison and drift detection
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Schema drift — differences between the expected schema (defined by migrations) and the actual schema (in the database) — accumulates over time due to manual changes, partial migrations, hotfixes, and environment inconsistencies. Drift detection compares the actual database schema against the migration-defined schema and reports differences. This is essential for audit compliance, deployment reliability, and production debugging.

---

# Core Concepts

- **Drift sources**: Manual `ALTER TABLE` in production console, partial migration failures, hotfixes applied directly, environment-specific changes (e.g., index tuning on production only).
- **Detection approaches**: (1) Compare `INFORMATION_SCHEMA` against migration output. (2) Use schema dump diffing: dump production schema, compare against migration-generated schema. (3) Third-party tools like `pt-table-checksum`, `liquibase diff`.
- **Impact of undetected drift**: A manual index added to production but not in the migration means the index is lost on the next `migrate:fresh`. A column added manually is missing from staging, causing code that references it to fail.

---

# Mental Models

Schema drift is like git divergence. The migration directory is the "source of truth" branch. The production database is a "deployed" branch. They should be identical. Drift detection is `git diff` for schemas.

---

# Internal Mechanics

**Comparison approach**:
1. Run `php artisan schema:dump` to capture the migration-defined schema.
2. Query `INFORMATION_SCHEMA.COLUMNS`, `INFORMATION_SCHEMA.TABLES`, `INFORMATION_SCHEMA.STATISTICS` from the actual database.
3. Compare the two: missing tables, extra tables, column type differences, missing indexes, extra indexes.
4. Report discrepancies.

---

# Patterns

**Scheduled drift check**: Run a drift detection script weekly (production) and daily (staging). Alert on any discrepancy.

**Pre-deployment drift check**: Before running `migrate` in production, verify that the current schema matches the expected migration state. If drift is detected, block the deployment.

**Drift correction migration**: When drift is detected, create a new migration that brings the schema in line with the expected state, rather than manually modifying the database.

---

# Architectural Decisions

| Approach | Use Case | Complexity |
|----------|----------|------------|
| INFORMATION_SCHEMA comparison | Custom drift detection | Medium |
| `pt-table-checksum` | Percona environments | Low (tool does the work) |
| `schema:dump` diff | Quick manual check | Low |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Early detection of manual changes | Requires scheduled tooling | Proactive vs reactive management
Prevents deployment failures from drift | Comparison tools add complexity | Small operational overhead

---

# Performance Considerations

Schema comparison queries on `INFORMATION_SCHEMA` are lightweight for individual database checks — typically completing in under a second. For multi-tenant deployments with hundreds of databases, the aggregation query across all tenants can take minutes. The `schema:dump` comparison approach has negligible runtime cost since it operates on files rather than live queries. Scheduled drift detection should be timed to avoid peak traffic hours. The `pt-table-checksum` tool for Percona environments has a higher performance impact because it scans rows for checksum verification and should be run during low-traffic windows.

# Production Considerations

- **Drift alerting threshold**: Not every schema difference requires immediate action. Index statistics differences and auto-increment values commonly drift. Focus alerts on structural differences (missing tables, missing columns, type mismatches).
- **Automated correction**: When drift is detected, generate a corrective migration automatically rather than applying a manual ALTER. Tools like `doctrine/dbal` schema diff can produce migration stubs.
- **Pre-deployment drift check**: Integrate drift detection into the CI/CD pipeline before `php artisan migrate --force`. Block deployment if unexpected drift is detected — the migration may fail or produce incorrect results.
- **Audit trail**: Log all detected drift events with timestamps, the discovering user, and resolution actions. Required for SOC2 and PCI compliance in regulated environments.

---

# Common Mistakes

**Correcting drift manually**: Manually altering the database to match the expected state. This creates further drift because the manual correction isn't in a migration. Always create a migration to correct drift.

**Ignoring minor drift**: A column default that differs by 1 character is ignored. It indicates that someone manually altered the database, which may have done other undetected changes.

---

# Failure Modes

- **False positives from environment-specific changes**: Backup/restore processes, read replica provisioning, and disaster recovery failovers can alter schema metadata (auto-increment values, index statistics) without structural drift. Distinguish metadata drift from structural drift.
- **False negatives from migration squashing**: After `schema:dump`, the schema definition file represents the current state, not the migration history. Subsequent manual ALTERs that match the dumped schema are invisible to comparison.
- **INFORMATION_SCHEMA inconsistency**: In MySQL, `INFORMATION_SCHEMA` queries on busy servers can return stale metadata due to the internal dictionary lock. Retry queries if results seem inconsistent.
- **Cross-engine incompatibility**: Schema comparison tools built for MySQL may not work correctly with MariaDB-specific features (e.g., `SEQUENCE` storage engine, virtual columns). Always use engine-specific comparison logic.

---

# Ecosystem Usage

Schema drift detection is widely practiced by mature Laravel teams using tools like `doctrine/dbal` (which Laravel uses internally for schema operations), `liquibase diff`, and custom `INFORMATION_SCHEMA` queries. Managed database platforms like PlanetScale and Neon include built-in drift detection as part of their branching workflows. CI platforms like GitHub Actions can run drift checks on scheduled intervals using community actions. Laravel's `schema:dump` provides a quick manual drift check by diffing the dumped schema against the actual database. For multi-tenant deployments, drift detection must check each tenant database individually.

---

# Related Knowledge Units

1.8 Migration squashing | 1.28 Migration testing in CI | 1.20 Migration immutability

---

# Research Notes

Schema drift is pervasive in long-running Laravel applications. The most common source is DBA hotfixes applied directly to production without a corresponding migration. A quarterly drift detection schedule combined with automated migration generation for detected drift keeps the schema consistent.
