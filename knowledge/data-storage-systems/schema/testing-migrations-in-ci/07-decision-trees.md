# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-16 Testing Migrations In Ci
**Generated:** 2026-06-03

---

# Decision Inventory

* Fresh Migrate vs Incremental Migration Test
* Single Engine vs Matrix Testing
* Syntax/Forward-Only vs Full Forward + Rollback Testing

---

# Architecture-Level Decision Trees

---

## Fresh Migrate vs Incremental Migration Test

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer setting up CI migration testing must decide whether to test all migrations from scratch (migrate:fresh) or only test incremental changes applied to an existing schema.

---

## Decision Criteria

* performance considerations: CI run time, database container startup
* architectural considerations: migration history size, deployment model
* security considerations: no direct impact
* maintainability considerations: test coverage completeness

---

## Decision Tree

Is this a new project or a project with few migrations?
↓
YES → Use fresh migrate (migrate:fresh from scratch) — faster to test
NO → Use incremental test (apply only new migrations to existing schema) + fresh migrate in nightly CI

---

## Rationale

Fresh migration tests run the entire history from scratch, validating that all migrations work together from a clean state. Incremental tests simulate the actual production deployment scenario: adding new migrations to an existing schema. Both have value. Fresh migrate catches issues in the full migration history. Incremental tests catch issues specific to the production state. Use both in different CI stages.

---

## Recommended Default

**Default:** Test both — incremental in PR CI, fresh migrate in nightly CI
**Reason:** Incremental testing mirrors the production deployment path. Fresh migrate catches historical migration issues before they affect `migrate:fresh` in development. Both are necessary for complete coverage.

---

## Risks Of Wrong Choice

Incremental-only testing lets broken historical migrations go undetected until `migrate:fresh` fails in development. Fresh-only testing misses issues specific to applying migrations to an existing large dataset.

---

## Related Rules

Test both forward and rollback in CI. Use production-matching database engine.

---

## Related Skills

Test Migrations in CI with Forward/Rollback Verification

---

## Single Engine vs Matrix Testing

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer supporting multiple database engines must decide whether to test migrations against all supported engines (matrix) or only the primary production engine.

---

## Decision Criteria

* performance considerations: CI compute cost, build time multiplied
* architectural considerations: supported database matrix, engine-specific syntax
* security considerations: no direct impact
* maintainability considerations: test maintenance effort

---

## Decision Tree

Does the application support multiple database engines in production?
↓
YES → Use matrix testing (test each supported engine)
NO → Use single engine testing (match production engine exactly)

---

## Rationale

Matrix testing multiplies CI compute and time by the number of engines tested. It is only justified when different production deployments use different engines. Engine-specific syntax (MySQL `after()`, PostgreSQL `fullText()`) fails silently on the wrong engine. For single-engine applications, testing against any non-production engine may miss engine-specific issues — always match the production engine.

---

## Recommended Default

**Default:** Single engine matching production
**Reason:** Testing against a non-production engine (e.g., SQLite in CI, MySQL in prod) creates false confidence. Engine-specific features will pass in CI but fail in production. Matrix testing is only needed when the application genuinely supports multiple engines.

---

## Risks Of Wrong Choice

SQLite in CI for a MySQL production app silently ignores `ALGORITHM=INSTANT` and `after()` column positioning. MySQL in CI for a PostgreSQL production app misses `ON CONFLICT` and `RETURNING` issues.

---

## Related Rules

Use production-matching database engine. Include data integrity verification.

---

## Related Skills

Test Migrations in CI with Forward/Rollback Verification

---

## Syntax/Forward-Only vs Full Forward + Rollback Testing

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer designing CI migration tests must decide whether to only test that migrations run forward or also test that they roll back correctly.

---

## Decision Criteria

* performance considerations: additional CI time for rollback step
* architectural considerations: down() method completeness
* security considerations: safety net for rollback scenarios
* maintainability considerations: test script complexity

---

## Decision Tree

Is this a schema-only migration (no data) with a simple down() method?
↓
YES → Syntax check + dry run is sufficient (rollback is trivially safe)
NO → Include full forward + rollback testing (verify down() actually works)

---

## Rationale

Many migrations have complex down() methods that are rarely tested. A rollback that fails during a production incident turns a simple revert into a crisis. The additional CI time (typically 5-10 seconds for rollback) is negligible compared to the safety it provides. Only skip rollback testing for trivial schema-only migrations where down() is `Schema::dropIfExists()`.

---

## Recommended Default

**Default:** Always test forward + rollback in CI
**Reason:** The cost of adding a rollback step to CI is minimal. The cost of a failed rollback during a production incident is high. Forward-only testing gives false confidence in the deploy's reversibility.

---

## Risks Of Wrong Choice

Forward-only testing catches syntax errors but misses broken down() methods. A broken rollback during a production incident turns a simple revert into a multi-hour recovery process.

---

## Related Rules

Test both forward and rollback in CI. Include data integrity verification.

---

## Related Skills

Test Migrations in CI with Forward/Rollback Verification
