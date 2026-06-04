# 7-5 Replica Lag Causes - Decision Trees

## Diagnosing Replica Lag Patterns

---

## Decision Context

Identifying the root cause of replica lag based on its pattern — constant lag vs intermittent spikes — to determine whether the fix is provisioning, DDL strategy, or transaction optimization.

---

## Decision Criteria

* performance: constant lag = replica underprovisioned; spikes = DDL or burst writes
* architectural: replica apply capacity must match primary write rate
* maintainability: monitoring lag patterns guides resolution approach

---

## Decision Tree

Lag pattern observed?

↓

Constant lag (steady, grows over time)?

YES → Replica underprovisioned

    ↓
    Replica CPU/IO cannot keep up with primary write rate
    Binlog apply is single-threaded (MySQL default) — hits ceiling
    
    ↓
    Fixes:
    - Upgrade replica hardware (CPU, IOPS)
    - Enable parallel replication (MySQL 8.0: slave_parallel_workers)
    - Reduce write rate on primary (batch, throttle)

NO → Intermittent spikes (lag grows then recovers)?

    YES → Check for DDL operations
            
        ↓
        ALTER TABLE blocks replica apply thread
        Check SHOW PROCESSLIST on replica for lock wait
            
        ↓
        Fixes:
        - Use online DDL (gh-ost, pt-online-schema-change)
        - Run DDL during off-peak hours
        - Monitor DDL progress with lag threshold

    NO → Spikes correlate with specific times?
    
        YES → Write bursts (batch jobs, imports, peak traffic)
            
            ↓
            Check cron jobs, data imports, traffic patterns
            Batch operations overwhelm replica apply rate
                
            ↓
            Fixes:
            - Throttle batch operations
            - Schedule during low-traffic periods
            - Stagger writes across time window

NO → No lag pattern detected?

    → Check for long-running transactions
    BEGIN ... long operation ... COMMIT
    Replica can't apply until commit
    Break into smaller transactions

---

## Recommended Default

**Default:** Monitor lag pattern first — constant = hardware; spikes = DDL/bursts; correlate = transactions
**Reason:** The lag pattern directly indicates the root cause. Fixing the wrong cause (buying hardware when DDL is the issue) wastes resources.

---

## DDL Lag Prevention

---

## Decision Context

When running migrations/DDL on replicated databases, choosing between native online DDL and external tools (gh-ost, pt-online-schema-change) to minimize replica lag.

---

## Decision Criteria

* performance: ALGORITHM=COPY causes full table rebuild on replica
* architectural: DDL blocks replica single-threaded apply
* maintainability: external tools are safer but add dependency

---

## Decision Tree

DDL type?

↓

Additive (ADD COLUMN, CREATE INDEX, ADD CONSTRAINT)?

YES → Low risk — ALGORITHM=INPLACE or INSTANT

    ↓
    MySQL 8.0: ALTER TABLE orders ADD COLUMN ... , ALGORITHM=INSTANT;
    
    ↓
    Minimal replica impact
    No rebuild needed
    Monitor lag, but typically safe

NO → Destructive (DROP COLUMN, CHANGE COLUMN, ALTER INDEX)?

    YES → High risk — ALGORITHM=COPY (full rebuild)
        
        ↓
        Option 1: Use gh-ost or pt-online-schema-change
            
            ↓
            Throttle based on replica lag threshold
            Automatic pause if lag exceeds limit
            Safer for production
            
        Option 2: Run during maintenance window
            
            ↓
            Accept lag during DDL
            Schedule off-peak
            
            ↓
        Option 3: Replica-first approach
            
            ↓
            Run DDL on replica first
            Promote replica to primary
            Run DDL on old primary (now replica)

NO → DDL with large table (> 100GB)?

    → Always use external tool (gh-ost/pt-osc)
    Native DDL on large table = hours of lock/lag
    gh-ost chunks and throttles automatically

---

## Recommended Default

**Default:** gh-ost or pt-online-schema-change for destructive DDL on large tables; native INPLACE/INSTANT for additive changes
**Reason:** Additive changes are low-risk. Destructive changes on large tables require throttled, lag-aware tools to prevent replica lag incidents.

---

## Related Rules

* Rule 7-5-1: Always Monitor Replica Lag
* Rule 7-5-2: Never Run Long Transactions Without Lag Awareness

---

## Related Skills

* Diagnose Replica Lag Causes
* Prevent Replica Lag from DDL Operations
