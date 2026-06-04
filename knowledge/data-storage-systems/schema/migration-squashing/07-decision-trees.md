# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-8 Migration Squashing
**Generated:** 2026-06-03

---

# Decision Inventory

* schema:dump with --prune vs without
* When to squash vs keep individual migrations
* CI optimization via schema dump

---

# Architecture-Level Decision Trees

---

## Migration Squashing Strategy

---

## Decision Context

Deciding when to consolidate migrations into a schema dump to improve fresh-install performance.

---

## Decision Criteria

* performance: fresh migration time drops from minutes to seconds
* architectural: schema dump replaces hundreds of migration files for fresh installs
* maintainability: --prune permanently deletes original migration files
* security: no impact

---

## Decision Tree

Migration history growing large?
↓
Is the project > 1 year old or > 50 migrations?
YES → Consider squashing
    ↓
    Is it time for a major release?
    YES → Run schema:dump (without --prune initially)
        ↓
        Has the team verified the dump on all environments?
        YES → Run schema:dump --prune after full team sync
        NO → Keep --prune off until verified
    NO → Wait for the next release cycle
NO → Keep individual migrations (< 30 = no benefit from squashing)
↓
Does the CI pipeline run migrations on fresh databases?
YES → Schema dump cuts CI time dramatically
NO → Squashing benefits only new developer setups

---

## Rationale

schema:dump compresses hundreds of migration files into a single SQL file used for fresh installs. Existing environments maintain individual migration execution. The --prune option must be used carefully — it permanently deletes original files, and team members who haven't pulled the latest changes lose their local migration history reference.

---

## Recommended Default

**Default:** schema:dump without --prune before major releases
**Reason:** Safely improves fresh install performance. Prune only after all team members have synced and no rollback from the squashed state is anticipated.

---

## Risks Of Wrong Choice

* Pruning too early: team members on other branches lose migration reference
* Stale schema dump: dump not regenerated after schema changes, causing CI failures
* Incompatible dump format: MySQL dump on MariaDB or vice versa

---

## Related Rules

* Regenerate schema dump after significant schema changes
* Only use --prune after full team sync

---

## Related Skills

* Squash migrations with schema:dump
