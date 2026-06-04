# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Test Framework & Runner Infrastructure
**Knowledge Unit:** PHPUnit Compatibility & Migration Paths
**Generated:** 2026-06-03

---

# Decision Inventory

1. Full migration vs mixed-mode vs stay on PHPUnit
2. File-by-file vs big-bang migration
3. Automated vs manual conversion
4. Keep phpunit.xml as single source of truth vs split config

---

# Architecture-Level Decision Trees

---

## Decision Name: Full Migration vs Mixed-Mode vs Stay on PHPUnit

---

## Decision Context

Choose the migration strategy for an existing PHPUnit test suite.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Existing PHPUnit suite is stable and well-maintained?
↓
YES → Team has bandwidth to migrate?
↓
YES → Team will benefit from Pest features (arch, mutation)?
↓
YES → Full migration (gradual, file-by-file)
NO → Stay on PHPUnit (stable is fine)

↓
NO → Mixed-mode (migrate only files being actively modified)

NO → Mixed-mode during active development; full migration later

---

## Rationale

Full migration provides long-term benefits but requires investment. Mixed-mode allows gradual adoption. Staying on PHPUnit is safest for stable, unmaintained suites.

---

## Recommended Default

**Default:** Mixed-mode during active development; full migration when bandwidth allows
**Reason:** Balances migration momentum with safety. Working tests are never broken.

---

## Risks Of Wrong Choice

Forcing full migration without bandwidth causes stalled work. Never migrating misses 40% boilerplate reduction.

---

## Related Rules

Rule 2: Migrate test files one at a time, never in a big-bang migration
Rule 7: Never rewrite working PHPUnit tests without a clear benefit

---

## Related Skills

Migrate PHPUnit Test Files to Pest Syntax

---

## Decision Name: File-by-File vs Big-Bang Migration

---

## Decision Context

Choose the pace of converting PHPUnit files to Pest syntax.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Suite has > 50 test files?
↓
YES → File-by-file migration (5-10 files per PR)
NO → Continue

↓
Team has automated CI with thorough test coverage?
↓
YES → Can batch slightly larger groups (10-20 files per PR)
NO → File-by-file is mandatory (no safety net)

↓
Any file uses complex PHPUnit features (@dataProvider, custom extensions)?
↓
YES → Convert complex files one at a time with thorough review
NO → Simpler files can be batched

---

## Rationale

Big-bang migration is high-risk: a single incompatible feature can block the entire migration. File-by-file allows testing each converted file independently.

---

## Recommended Default

**Default:** File-by-file migration, 5-10 files per PR
**Reason:** One regression doesn't block the entire suite. Rollback is trivial.

---

## Risks Of Wrong Choice

Big-bang migration: one failure blocks all files. Debugging 200 converted files for regressions is impractical.

---

## Related Rules

Rule 2: Migrate test files one at a time, never in a big-bang migration

---

## Related Skills

Migrate PHPUnit Test Files to Pest Syntax

---

## Decision Name: Automated vs Manual Conversion

---

## Decision Context

Choose whether to use pest-plugin-migrate for automated conversion or convert manually.

---

## Decision Criteria

* maintainability

---

## Decision Tree

File has complex data providers, custom setUp, or unusual patterns?
↓
YES → Manual conversion recommended (automation ~95% accurate)
NO → Use pest-plugin-migrate for initial conversion

↓
After automated conversion, was the output clean?
↓
YES → Minimal manual review needed
NO → Full manual review and fix edge cases

↓
File contains @depends or annotation-dependent tests?
↓
YES → Verify `test()` used (not `it()`) — automated tool may miss this
NO → Standard review

---

## Rationale

pest-plugin-migrate achieves ~95% accuracy. The remaining 5% includes edge cases that require manual fixes. Automated conversion without review risks broken tests.

---

## Recommended Default

**Default:** Use pest-plugin-migrate for initial pass, then manual review
**Reason:** Saves 95% of conversion effort while catching the 5% edge cases.

---

## Risks Of Wrong Choice

Full manual conversion is slow. Automated-only conversion silently breaks 5% of tests.

---

## Related Rules

Rule 6: Use pest-plugin-migrate for automated conversion but review every file

---

## Related Skills

Migrate PHPUnit Test Files to Pest Syntax
