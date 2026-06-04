# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-12 pt-online-schema-change
**Generated:** 2026-06-03

---

# Decision Inventory

* pt-osc vs gh-ost selection
* Trigger-based online migration configuration
* FK constraint handling strategy

---

# Architecture-Level Decision Trees

---

## pt-osc FK Handling Strategy

---

## Decision Context

Choosing the correct FK constraint handling method when using pt-osc for tables with foreign key relationships.

---

## Decision Criteria

* performance: trigger overhead persists for the entire migration; FK rebuild locks referencing tables
* architectural: rebuild_constraints vs drop_swap methods affect FK lifecycle
* maintainability: FK rebuild requires careful timing
* security: no direct impact

---

## Decision Tree

Running pt-osc on a table with FK constraints?
↓
Are FK column names changing in the ALTER?
YES → Use --alter-foreign-keys-method=rebuild_constraints
    → Rebuilds all FK constraints pointing to the table
    → Required when FK column references change
NO → Are FK column names staying the same?
    YES → Use --alter-foreign-keys-method=drop_swap
        → Drops original table after swap, creates new FK references
        → Faster but more destructive (no rollback after drop)
    NO → Use --alter-foreign-keys-method=auto (default)
        → pt-osc chooses the best method
↓
Is the table under high-concurrency OLTP?
YES → Monitor for trigger deadlocks
    → Consider gh-ost as alternative (trigger-free)
    → Reduce chunk size and increase sleep interval
NO → Standard pt-osc configuration works

---

## Rationale

pt-osc uses triggers for sync, which adds overhead and creates potential for deadlocks under high concurrency. The FK method choice depends on whether column references change. rebuild_constraints is safer but slower; drop_swap is faster but more destructive.

---

## Recommended Default

**Default:** --alter-foreign-keys-method=auto with --chunk-size=1000
**Reason:** Auto-detection handles most cases. Chunk size of 1000 balances throughput against per-statement lock duration.

---

## Risks Of Wrong Choice

* Trigger deadlocks under high concurrency: most common pt-osc failure
* FK rebuild timeout: large referencing tables block during swap
* Ghost table row count drift: triggers fall behind under heavy write load

---

## Related Rules

* Monitor trigger activity during migration for deadlock detection
* Test FK rebuild timing on staging before production

---

## Related Skills

* Execute online schema changes with pt-osc
