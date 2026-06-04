# 7-20 Migration Replication Compatibility - Decision Trees

## DDL Algorithm Selection

---

## Decision Context

Choosing the safest MySQL DDL algorithm (INSTANT, INPLACE, or COPY) for schema migrations on a replicated database, minimizing replication lag and table locking.

---

## Decision Criteria

* performance: INSTANT is metadata-only (instant); INPLACE allows concurrent DML; COPY locks and rebuilds
* architectural: COPY DDL blocks replica apply thread — all replicas accumulate lag
* maintainability: INSTANT supports limited operations; COPY supports all but is most disruptive

---

## Decision Tree

Supported by ALGORITHM=INSTANT (add column, set default, drop default, rename column)?

YES → Use ALGORITHM=INSTANT

    ↓
    Laravel: Schema::table('users', fn($t) => ...)->withAlgorithm('instant')
    
    ↓
    Pro: Completes instantly — no replica lag
    Pro: Metadata-only change — no table rebuild
    Pro: Safe to run at any time (even peak hours)

NO → Supported by ALGORITHM=INPLACE (add index, drop index, rename column, add FK, drop FK)?

    YES → Use ALGORITHM=INPLACE
        
        ↓
        Pro: Allows concurrent reads AND writes
        Pro: No full table rebuild
        Pro: Replica lag minimal (index build may cause brief lag)
        
        ↓
        Monitor replica lag during build
        Schedule for low-traffic if large index on big table

NO → Requires ALGORITHM=COPY (change column type, drop PK, add AUTO_INCREMENT, change charset)?

    ↓
    Table size < 1M rows?
    
    YES → Run COPY during low-traffic window
        DDL completes quickly on small table
        Monitor replica lag — minimal impact
        
    NO → Use online DDL tool (pt-online-schema-change / gh-ost)
        
        ↓
        Creates shadow table, copies incrementally
        Swaps atomically — zero table lock
        
        ↓
        Verify: disk space (2x table), --max-lag threshold set
        Monitor: lag stays below threshold during copy
        Schedule: low-traffic window for safety margin

---

## Recommended Default

**Default:** Use INSTANT when possible → INPLACE → COPY with online DDL tool for large tables
**Reason:** INSTANT has zero replication impact. Online tools eliminate table locking for COPY operations.

---

## Migration Timing

---

## Decision Context

Deciding when to run schema migrations — determining whether a migration is safe during peak hours or must wait for a maintenance window, based on replication impact.

---

## Decision Criteria

* performance: some DDL runs instantly (no impact); others block replication for minutes/hours
* architectural: replica lag from DDL causes stale reads for all user-facing queries
* maintainability: scheduling migrations outside business hours adds operational overhead

---

## Decision Tree

DDL uses ALGORITHM=INSTANT?

YES → Safe at any time

    ↓
    Run during business hours
    No replication impact
    No table locking

NO → DDL uses ALGORITHM=INPLACE on small table (<10M rows)?

    YES → Safe during low-traffic periods
        
        ↓
        INPLACE allows concurrent DML
        Small table = quick operation
        Avoid absolute peak (highest write throughput)

NO → DDL requires COPY or affects large table?

    ↓
    Peak hours (business hours)?
    
    YES → Schedule for maintenance window
        
        ↓
        COPY blocks table writes on primary
        Replicas can't apply any events during COPY DDL
        Lag grows linearly with table size
        
        ↓
        Alternative: pt-online-schema-change (zero-downtime)
        Even with online tools, schedule during low traffic

NO → Off-peak hours?

    ↓
    Check: replica lag near zero before starting
    
    YES → Proceed with migration
        Monitor lag continuously during DDL
        If lag exceeds threshold → pause or cancel
        
    NO → Resolve lag issue first
        Don't start DDL if replicas are already behind

---

## Recommended Default

**Default:** INSTANT DDL anytime; INPLACE/COPY during low-traffic window; online tools for large table COPY operations
**Reason:** Respecting replication impact prevents user-facing stale reads. INSTANT is the only zero-impact option.

---

## Related Rules

* Rule 7-20-1: Always Check Replica Lag Before Running DDL
* Rule 7-20-2: Never Use ALGORITHM=COPY During Peak Hours
* Rule 7-20-3: Always Have a Rollback Plan for Schema Migrations
* Rule 7-20-4: Always Check Disk Space Before Online DDL
* Rule 7-20-5: Always Set --max-lag When Using Online DDL Tools

---

## Related Skills

* Run Schema Migrations on Replicated Databases
* Use Online Schema Change Tools with Replication
