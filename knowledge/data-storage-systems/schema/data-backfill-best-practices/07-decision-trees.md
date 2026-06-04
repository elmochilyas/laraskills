# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-9 Data Backfill Best Practices
**Generated:** 2026-06-03

---

# Decision Inventory

* ID-Based vs Offset-Based Batch Iteration
* Direct UPDATE vs Queued Jobs for Large Backfills
* Batch Size Selection for Backfill Performance

---

# Architecture-Level Decision Trees

---

## ID-Based vs Offset-Based Batch Iteration

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer implementing a backfill must choose between ID-based and offset-based iteration for processing rows in batches.

---

## Decision Criteria

* performance considerations: query efficiency, stability under concurrent writes
* architectural considerations: source data primary key type, table churn
* security considerations: no direct impact
* maintainability considerations: resumability, debugging

---

## Decision Tree

Does the source table have a monotonic primary key?
↓
YES → Use ID-based batching (WHERE id > $lastId ORDER BY id LIMIT $batchSize)
NO → Use cursor-based batching (keyset pagination on unique column)

---

## Rationale

ID-based batching is stable under concurrent writes: new rows inserted during backfill do not shift the batch boundaries. Offset-based batching (`LIMIT $batchSize OFFSET $offset`) is unstable — rows inserted or deleted during iteration cause rows to be skipped or duplicated. Always avoid OFFSET for production backfills. If no monotonic PK exists, use a keyset cursor on any unique, sortable column.

---

## Recommended Default

**Default:** ID-based batching
**Reason:** ID-based iteration is stable, resumable, and efficient. It handles concurrent writes correctly and makes progress tracking trivial (store the last processed ID).

---

## Risks Of Wrong Choice

Offset-based batching under concurrent writes skips or duplicates rows, causing incorrect backfill results that may go undetected.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Execute Production Data Backfill with Progress Tracking

---

## Direct UPDATE vs Queued Jobs for Large Backfills

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer planning a large backfill must decide between running UPDATE statements directly or dispatching batches as queue jobs.

---

## Decision Criteria

* performance considerations: concurrency control, retry handling
* architectural considerations: queue infrastructure, worker capacity
* security considerations: no direct impact
* maintainability considerations: monitoring, observability

---

## Decision Tree

Is the table smaller than 1M rows?
↓
YES → Use direct UPDATE (simpler, completes quickly)
NO → Use queued jobs (distributed processing, retry per batch)

---

## Rationale

Direct UPDATE in a single command or loop works for small tables where the backfill completes in minutes. For large tables (millions of rows), a single-threaded loop may take hours and blocks the process on failure. Queued jobs distribute processing across workers, provide retry per batch, and enable partial completion with progress tracking. Each batch is an independent, retryable unit.

---

## Recommended Default

**Default:** Queued jobs for tables > 1M rows, direct UPDATE for smaller tables
**Reason:** Queued jobs provide distributed processing, automatic retry, and partial completion. Direct UPDATE is simpler when the backfill duration is short enough that failure/restart cost is acceptable.

---

## Risks Of Wrong Choice

Direct UPDATE on a 50M row table takes hours and restarts from scratch on failure. Queued jobs on a 10K row table add unnecessary infrastructure overhead.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Execute Production Data Backfill with Progress Tracking

---

## Batch Size Selection for Backfill Performance

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer configuring a backfill must choose the batch size to balance processing speed against production impact.

---

## Decision Criteria

* performance considerations: per-batch execution time, row lock duration
* architectural considerations: replication lag tolerance, IO capacity
* security considerations: no direct impact
* maintainability considerations: monitoring granularity, checkpoint frequency

---

## Decision Tree

Is the table write-heavy (> 500 writes/sec)?
↓
YES → Use smaller batch size (100-500 rows, lower lock impact)
NO → Is the table an archive or read-only table?
    YES → Use larger batch size (2000-5000 rows, faster completion)
    NO → Use default batch size (500-1000 rows)

---

## Rationale

Smaller batches reduce the per-operation lock duration and replication lag impact but increase the total number of queries. Write-heavy tables benefit from smaller batches to avoid contention with application writes. Archive tables with no concurrent writes can use larger batches for maximum throughput. The default range (500-1000) is a good starting point — adjust based on observed replication lag and CPU impact.

---

## Recommended Default

**Default:** 500-1000 rows per batch
**Reason:** This range balances throughput and production impact for most workloads. Start at 500 for general use, increase to 1000 if no replication lag is observed, decrease to 250 if lag spikes.

---

## Risks Of Wrong Choice

Too-large batches on write-heavy tables cause replication lag spikes and lock contention. Too-small batches on archive tables unnecessarily extend migration duration.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Execute Production Data Backfill with Progress Tracking
