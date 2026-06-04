# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-14 pgroll Tool
**Generated:** 2026-06-03

---

# Decision Inventory

* View-based vs trigger-based vs binlog-based migration
* pgroll vs manual expand-contract
* Two-phase deployment with rollback

---

# Architecture-Level Decision Trees

---

## pgroll Migration Strategy

---

## Decision Context

Choosing pgroll's view-based zero-downtime migration approach for PostgreSQL, evaluating against manual expand-contract or trigger-based alternatives.

---

## Decision Criteria

* performance: view overhead is negligible; trigger backfill adds 15-30% write overhead
* architectural: view-based approach supports rollback natively
* maintainability: two-phase deployment is built-in
* security: no direct impact

---

## Decision Tree

Performing a zero-downtime migration on PostgreSQL?
↓
Is reversibility a critical requirement?
YES → Use pgroll (first-class rollback support)
    ↓
    Is this a simple additive change (add column, add index)?
    YES → Manual expand-contract is simpler (no tool dependency)
    NO → Is the migration complex (multi-table, column type changes)?
        → pgroll's view-based approach automates the complex expand-contract pattern
NO → Is this for MySQL?
    → Use gh-ost, pt-osc, or Spirit
↓
PostgreSQL 11+ specific features needed?
→ pgroll works with PG 11+ lazy DEFAULT for column additions
→ pg_repack for bloat management (not schema changes)

---

## Rationale

pgroll is unique in its view-based approach, enabling safe rollback at any point. It's ideal for complex multi-step migrations where reversibility is critical. For simple additive changes, manual expand-contract is simpler and avoids tool dependency.

---

## Recommended Default

**Default:** pgroll for complex PostgreSQL migrations needing rollback; manual expand-contract for simple changes
**Reason:** pgroll provides first-class rollback for complex changes. Simple changes don't need the tool overhead.

---

## Risks Of Wrong Choice

* Backfill trigger overhead: 15-30% write performance degradation during active migration
* View complexity limitations: some complex schema changes cannot be mapped through views
* Schema namespace accumulation: long migration chains create many PostgreSQL schemas
* Incompatibility with partitioning, inheritance, or FDWs

---

## Related Rules

* Test both forward and backward migration paths before production
* Monitor trigger overhead during active migrations on write-heavy tables

---

## Related Skills

* Execute zero-downtime PostgreSQL migrations with pgroll
