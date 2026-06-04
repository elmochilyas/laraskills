# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Database Testing
## Knowledge Unit: Migration Rollback Testing

---

### Rule 1: Every `up()` method must have a corresponding `down()` method

| Field | Value |
|-------|-------|
| **Name** | Always implement `down()` for every migration |
| **Category** | Migration Design |
| **Rule** | Every migration class must implement both `up()` and `down()`. The `down()` method must reverse the exact changes made by `up()`. |
| **Reason** | Without `down()`, deployment rollback is impossible. If a deployment fails, the team either accepts an incomplete state or performs a manual, error-prone database fix. CI should enforce this with automated migration testing. |
| **Bad Example** | `up()` adds `is_admin` column; `down()` is missing (method not defined). |
| **Good Example** | `up()` adds `is_admin`; `down()` does `$table->dropColumn('is_admin')`. |
| **Exceptions** | Truly irreversible operations (rare). These must be documented with a manual rollback procedure and approved in code review. |
| **Consequences Of Violation** | Failed deployment cannot be reverted. Team must either accept broken state or manually fix the database. |

---

### Rule 2: Test the full migrate-rollback-migrate cycle in CI

| Field | Value |
|-------|-------|
| **Name** | Test migration round-trip |
| **Category** | Migration Testing |
| **Rule** | Include a CI job that runs `migrate:fresh → migrate:rollback → migrate` and verifies database schema state at each step. |
| **Reason** | `migrate:fresh` drops all tables and re-runs migrations — it does NOT test `down()` methods. Only `migrate:rollback` executes `down()`. The round-trip test validates that schema returns to its original state after rollback and can be re-applied cleanly. |
| **Bad Example** | CI only runs `migrate:fresh` — `down()` methods go untested. |
| **Good Example** | CI job: apply migrations → verify schema → rollback → verify reverse → re-apply → verify schema matches initial. |
| **Exceptions** | None. This is a mandatory safety check before deployment. |
| **Consequences Of Violation** | `down()` methods are broken. First production rollback attempt fails catastrophically. |

---

### Rule 3: Test data round-trip (preserve data across migration → rollback)

| Field | Value |
|-------|-------|
| **Name** | Verify data survives migration rollback |
| **Category** | Data Preservation |
| **Rule** | Create test data → apply migration → verify data accessible → rollback → verify data still accessible with original values. |
| **Reason** | A migration that transforms or removes data may be irreversible in terms of data — the schema is restored but the data is lost. Data round-trip testing verifies that rollback preserves data integrity. |
| **Bad Example** | Migration converts `name` to JSON `full_name`; `down()` drops the column — data loss on rollback. |
| **Good Example** | `down()` includes code to reconstruct original `name` from `full_name` JSON data. |
| **Exceptions** | Data migrations that move data to new structures where reconstruction is truly impossible. |
| **Consequences Of Violation** | Production data loss during deployment rollback. |

---

### Rule 4: Run migration tests sequentially, never in parallel

| Field | Value |
|-------|-------|
| **Name** | Migration tests must run sequentially |
| **Category** | Execution |
| **Rule** | Run all migration tests in a dedicated CI job that executes sequentially (no parallel workers). Use `needs: [test]` to ensure the migration job runs after the main test suite. |
| **Reason** | Migration tests modify the database schema (CREATE/ALTER/DROP). Parallel processes running migration tests simultaneously interfere with each other — one process may drop a table another is writing to. |
| **Bad Example** | Migration tests run as part of `php artisan test --parallel` — schema collisions cause failures. |
| **Good Example** | Separate CI job: `php artisan migrate:fresh && php artisan test --filter=Migrat --no-parallel`. |
| **Exceptions** | None. This is a hard constraint of schema-modifying operations. |
| **Consequences Of Violation** | Tests fail due to schema collisions. Migration test results are non-deterministic. |

---

### Rule 5: Preserve data in `down()` wherever possible

| Field | Value |
|-------|-------|
| **Name** | `down()` should preserve, not destroy |
| **Category** | Migration Design |
| **Rule** | The `down()` method should preserve data when reversing a migration. Do not simply drop columns or truncate tables that contain user data. |
| **Reason** | Production rollback is a crisis scenario. Dropping data during rollback makes the situation worse — now you have both a failed deployment AND data loss. Data is harder to recover than schema. |
| **Bad Example** | `down()` drops a table — all production data in that table is lost. |
| **Good Example** | `down()` re-creates the original column and copies data back if the column was just renamed or transformed. |
| **Exceptions** | When preserving data is technically impossible (e.g., column was split into multiple columns and the original values cannot be reconstructed). |
| **Consequences Of Violation** | Production data loss compounds a failed deployment. User data is permanently destroyed. |
