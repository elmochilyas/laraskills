# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-19 Data Backfill Strategies
**Generated:** 2026-06-03

---

# Decision Inventory

* Direct UPDATE vs chunked vs queued backfill
* chunk vs chunkById selection
* Throttling and idempotency strategy

---

# Architecture-Level Decision Trees

---

## Data Backfill Strategy Selection

---

## Decision Context

Choosing the correct backfill approach based on table size, production traffic, and failure tolerance.

---

## Decision Criteria

* performance: direct UPDATE blocks writes; chunked processing spreads load
* architectural: chunkById is stable under concurrent writes; chunk is not
* maintainability: queued backfill provides retry and progress tracking
* security: no direct impact

---

## Decision Tree

Backfilling data for a recently added column?
↓
Is the table < 10K rows?
YES → Use single UPDATE (simple, fast, one query)
NO → Is the table < 1M rows or during a maintenance window?
    YES → Use chunkById directly in a command
        ↓
        Can rows be modified during backfill?
        YES → chunkById (stable ordering, no offset drift)
        NO → Regular chunk is acceptable
    NO → Is this a production table with 24/7 traffic?
        YES → Use queued backfill (async, retryable)
            ↓
            Dispatch one queue job per chunk
            Use chunkById for stable ordering
            Include idempotency check: WHERE new_col IS NULL
            Track progress in backfill_progress table
            Throttle with sleep intervals between chunks
        NO → chunkById in a command with throttling

---

## Rationale

Direct UPDATE is acceptable only for small tables. chunkById is the minimum for any production backfill (avoids offset drift). Queued backfill is required for large tables under live traffic — it provides retry, progress tracking, and rate limiting.

---

## Recommended Default

**Default:** chunkById with queued processing for production backfills
**Reason:** Stable ordering prevents missed/duplicate rows. Queue provides retry on failure and progress tracking.

---

## Risks Of Wrong Choice

* Direct UPDATE on large table: long transaction, replication lag, possible timeout
* Using chunk instead of chunkById on mutable data: rows skipped or duplicated
* Non-idempotent backfill: re-running produces different (wrong) results
* Backfill inside migration: blocks deployment pipeline for hours
* No progress tracking: crash mid-way requires re-processing from start

---

## Related Rules

* Always make backfill operations idempotent
* Never run backfill directly in a migration — use queued jobs

---

## Related Skills

* Execute safe data backfill strategies
