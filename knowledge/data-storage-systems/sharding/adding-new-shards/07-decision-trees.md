# 6-12 Adding New Shards - Decision Trees

## Double-Write Migration Strategy

---

## Decision Context

Choosing the double-write + backfill + cutover approach when adding a new shard to an existing cluster — ensuring data consistency during the transition.

---

## Decision Criteria

* performance: double-write adds latency to every write during migration; backfill adds read load
* architectural: data must be consistent at cutover point
* maintainability: double-write phase must be reversible

---

## Decision Tree

Migration phase determination:

↓

Phase 1 — Double-write setup:

    ↓
    Start writing new data to both old shard AND new shard
    Reads continue from old shard only
    
    ↓
    Write path: INSERT INTO old_shard + INSERT INTO new_shard
    If double-write fails → log error, continue (old shard is source of truth)
    
    ↓
    Risk: partial double-writes (one succeeds, one fails)
    → Fix: use queue-based async double-write

Phase 2 — Backfill existing data:

    ↓
    Copy all existing data from old shard to new shard
    Use batched INSERT ... SELECT (1000 rows per batch)
    Rate-limit: pause between batches to limit IO impact
    
    ↓
    Verify after each batch: compare row counts on old vs new
    If mismatch: re-backfill the batch

Phase 3 — Consistency check:

    ↓
    Verify all data matches between old and new shards
    Compare: row counts, checksums, sample data
    
    ↓
    Pass → proceed to cutover
    Fail → fix discrepancies, re-verify

Phase 4 — Cutover:

    ↓
    Update shard map: route reads for migrated keys to new shard
    Stop double-writing
    
    ↓
    Keep old shard active for 48 hours (revert option)
    Monitor: new shard metrics, error rates

---

## Recommended Default

**Default:** Double-write → rate-limited backfill → consistency check → cutover; keep old shard 48h for rollback
**Reason:** Each phase is independently verifiable and reversible. The 48h retention enables quick rollback without data loss.

---

## Pre-Splitting vs Reactive Addition

---

## Decision Context

Choosing between adding empty shards pre-emptively (before capacity is needed) and waiting until existing shards approach capacity limits.

---

## Decision Criteria

* performance: pre-splitting distributes future writes evenly from the start; reactive addition requires data migration under pressure
* architectural: pre-splitting requires growth estimation; reactive addition reacts to actual usage
* maintainability: pre-splitting is planned and controlled; reactive addition is urgent

---

## Decision Tree

Is data growth predictable (known growth rate, seasonal patterns)?

YES → Pre-splitting recommended

    ↓
    Estimate capacity for 12 months
    Add shards pre-emptively when any shard reaches 60% utilization
    
    ↓
    Pro: No urgent migrations
    Pro: Writes are distributed evenly from the start
    Pro: Controlled migration at low utilization
    
    ↓
    Con: May add shards before they're strictly needed (cost)
    Con: Requires accurate growth projections

NO → Growth is unpredictable or bursty?

    ↓
    Reactive shard addition
    
    ↓
    Monitor utilization closely
    Set alerts at 60% (warning), 70% (plan), 80% (action required)
    
    ↓
    Pro: Only add capacity when actually needed
    Pro: No wasted resources
    
    ↓
    Con: Migration under pressure (higher risk)
    Con: Must have rapid provisioning capability (IaC)
    
    ↓
    Preparation:
    - IaC templates ready (instant provisioning)
    - Migration scripts tested and documented
    - Rollback plan tested

Number of shards to add at once:

↓

Needing to double capacity?

    YES → Add shards in groups (not all at once)
        Add one shard → migrate → verify
        Add next shard → migrate → verify
        Avoids cascading migration load
        
    NO → Single shard
        Add one shard at a time
        Each addition: 1/N data movement

---

## Recommended Default

**Default:** Pre-splitting with alerts at 60% utilization for predictable growth; reactive with IaC readiness for unpredictable growth
**Reason:** Pre-splitting avoids urgent migrations. Reactive is cost-efficient but requires preparation for rapid response.

---

## Related Rules

* Rule 6-12-1: Always Verify New Shard Before Routing Traffic
* Rule 6-12-2: Never Add Shard Without Monitoring

---

## Related Skills

* Implement Adding New Shards
* Plan Shard Capacity Growth
