# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-11 gh-ost Tool
**Generated:** 2026-06-03

---

# Decision Inventory

* gh-ost vs pt-osc vs pgroll vs spirit
* Trigger-based vs binlog-based online migration
* Cut-over strategy: automatic vs manual

---

# Architecture-Level Decision Trees

---

## Online Schema Migration Tool Selection (MySQL)

---

## Decision Context

Choosing between gh-ost (binlog-based) and pt-osc (trigger-based) for MySQL online schema changes based on table size, workload, and FK complexity.

---

## Decision Criteria

* performance: gh-ost avoids trigger overhead and trigger-related deadlocks
* architectural: gh-ost is trigger-free; pt-osc handles FK constraints natively
* maintainability: gh-ost supports pause/resume and test-on-replica
* security: gh-ost requires binlog access

---

## Decision Tree

Performing an online schema change on a large MySQL table?
↓
Is the table > 100GB or under high-concurrency OLTP?
YES → Use gh-ost (trigger-free, avoids trigger deadlocks)
    ↓
    Is binlog retention sufficient for migration duration?
    YES → gh-ost is appropriate
    NO → Increase binlog retention or use pt-osc
NO → Does the table have complex FK constraints?
    YES → Use pt-osc (native FK handling, rebuild_constraints method)
        ↓
        Is trigger overhead acceptable for the workload?
        YES → pt-osc is appropriate
        NO → Use gh-ost with application-level FK handling
NO → Simple ALTER on table < 10GB
    → Use pt-osc (simpler setup, no binlog dependency)

---

## Rationale

gh-ost's trigger-free architecture avoids a major failure mode of pt-osc (trigger deadlocks under high concurrency). However, it requires sufficient binlog retention and doesn't handle FKs as natively. pt-osc is simpler for FK-heavy schemas and smaller tables.

---

## Recommended Default

**Default:** gh-ost for large tables (>100GB) and high-concurrency workloads, pt-osc for FK-heavy schemas
**Reason:** gh-ost avoids trigger overhead and deadlocks. pt-osc handles FK constraints more natively.

---

## Risks Of Wrong Choice

* pt-osc trigger deadlocks under high concurrency: most common pt-osc failure mode
* gh-ost binlog retention too short: migration fails mid-way and must restart
* Cut-over timeout: ghost table not fully caught up, extending write-blocking window

---

## Related Rules

* Always test on replica first before running on the primary
* Ensure sufficient binlog retention for gh-ost migration duration

---

## Related Skills

* Execute online schema changes with gh-ost
