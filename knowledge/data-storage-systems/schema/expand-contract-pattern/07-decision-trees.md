# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-18 Expand-Contract Pattern
**Generated:** 2026-06-03

---

# Decision Inventory

* Multi-phase expand-contract vs single-phase migration
* Dual-write strategy and compatibility window
* Safe remove timing for destructive phase

---

# Architecture-Level Decision Trees

---

## Expand-Contract Phase Planning

---

## Decision Context

Determining the correct multi-phase approach for a zero-downtime schema change that requires old and new structures to coexist during transition.

---

## Decision Criteria

* performance: dual-write doubles write throughput; backfill is long-running
* architectural: requires backward-compatible schema additions
* maintainability: each phase is a separate deployment
* security: data must remain consistent during dual-write

---

## Decision Tree

Planning a schema change that requires zero downtime?
↓
Can the change be done with instant DDL (MySQL INSTANT, PG lazy default)?
YES → Use single-phase migration (no expand-contract needed)
NO → Use expand-contract pattern
    ↓
    Phase 1 — Add: Deploy new schema elements (nullable columns, new tables)
    → No application code changes needed
    Phase 2 — Dual-write: Deploy code that writes to both old and new
    → Same value to both columns to prevent drift
    Phase 3 — Backfill: Populate historical data for existing rows
    → Use chunked, idempotent, throttled processing
    Phase 4 — Dual-read: Switch reads to new structure, verify correctness
    → Compare old vs new values; monitor for drift
    Phase 5 — Remove: Drop old structures (DESTRUCTIVE)
    → Wait 24-48 hours after dual-read verification
    → Ensure no delayed queue jobs reference old structures

---

## Rationale

The expand-contract pattern is the only safe way to make breaking schema changes without downtime. Each phase is independently deployable and reversible. The compatibility window between dual-read and remove catches delayed processes that still reference old structures.

---

## Recommended Default

**Default:** Expand-contract for breaking changes, instant DDL for additive changes
**Reason:** Breaking changes require multi-phase approach. Additive changes can use simpler instant DDL when available.

---

## Risks Of Wrong Choice

* Short compatibility window: delayed queue jobs fail on dropped columns
* Inconsistent dual-write: old and new columns drift apart
* Backfill in same deploy as column addition: long-running transaction blocks pipeline
* Removing old column before all code references removed: production crashes

---

## Related Rules

* Never drop old structures until 24-48 hours after all code references are removed
* Always backfill asynchronously, never in the migration itself

---

## Related Skills

* Execute expand-contract pattern for zero-downtime migrations
