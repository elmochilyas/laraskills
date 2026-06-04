# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-30 Schema Comparison Drift Detection
**Generated:** 2026-06-03

---

# Decision Inventory

* INFORMATION_SCHEMA comparison vs schema dump diffing vs third-party tools
* Scheduled drift detection vs pre-deployment check
* Drift correction strategy

---

# Architecture-Level Decision Trees

---

## Schema Drift Detection Strategy

---

## Decision Context

Choosing the approach and frequency for detecting differences between the expected migration-defined schema and the actual database schema.

---

## Decision Criteria

* performance: INFORMATION_SCHEMA queries are lightweight; pt-table-checksum scans rows
* architectural: drift detection approach must match database engine
* maintainability: custom detection scripts add maintenance burden
* security: schema drift detection may expose unauthorized schema changes

---

## Decision Tree

Need to detect schema drift?
↓
Is this for regular monitoring (weekly/monthly)?
YES → Use INFORMATION_SCHEMA comparison script
    ↓
    Multi-tenant (hundreds of databases)?
    YES → Schedule during low traffic; aggregation may take minutes
    NO → Single database — completes in < 1 second
NO → Is this a pre-deployment check?
    YES → Run schema:dump and compare against current dump
        ↓
        Any differences found?
        YES → Block deployment — create drift correction migration
        NO → Safe to proceed
NO → Is this a forensic investigation (suspect unauthorized change)?
    → Use pt-table-checksum (Percona) or manual INFORMATION_SCHEMA query
    → Compare against backup or known-good schema

---

## Rationale

Regular drift detection catches schema changes made outside migrations — manual ALTER TABLE, hotfixes, or environment-specific tuning. Pre-deployment drift checks prevent deploying against a schema that doesn't match expectations. The correction for drift should always be a new migration, never a manual ALTER.

---

## Recommended Default

**Default:** Weekly INFORMATION_SCHEMA comparison + pre-deployment schema:dump check
**Reason:** Regular monitoring catches drift early. Pre-deployment checks prevent deploying against an unexpected schema state. Both are lightweight and low-maintenance.

---

## Risks Of Wrong Choice

* Correcting drift manually: creates further drift because manual ALTER isn't in a migration
* Ignoring minor drift: indicates uncontrolled access to production database
* False positives from backup/restore processes: metadata differences vs structural differences
* False negatives after schema:dump: manual ALTERs matching dumped schema are invisible

---

## Related Rules

* Always correct drift with a new migration, never manual ALTER
* Run drift detection before every production deployment

---

## Related Skills

* Detect and resolve schema drift
