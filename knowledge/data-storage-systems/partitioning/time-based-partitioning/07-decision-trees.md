# 8-7 Time Based Partitioning - Decision Trees

## Partition Interval Selection

---

## Decision Context

Choosing between daily, monthly, quarterly, or yearly partition intervals based on data volume, query patterns, and retention policy.

---

## Decision Criteria

* performance: fine-grained intervals prune more precisely but increase partition count
* architectural: interval affects total partition count (MySQL max 8192)
* maintainability: more partitions = more management overhead

---

## Decision Tree

Data volume per time unit?

↓

> 1M rows per day?

YES → Daily partitioning

    ↓
    365 partitions per year
    Queries prune to 1-2 partitions
    Metadata overhead: ~365 KB in buffer pool
    
    ↓
    Consider: will you exceed 8192 limit? (22 years at 365/year)
    Consider: composite partitioning (range-month + hash-day)

NO → 10K-1M rows per day?

    YES → Monthly partitioning
        
        ↓
        12 partitions per year
        Good balance of pruning granularity and partition count
        Queries for a month scan exactly 1 partition
        
        ↓
        Most common interval for transactional data
        Manageable for decades (120 partitions for 10 years)

NO → < 10K rows per day?

    YES → Quarterly or yearly partitioning
        
        ↓
        4 partitions per year (quarterly)
        1 partition per year (yearly)
        
        ↓
        Low volume doesn't benefit from finer granularity
        Keep it simple — larger intervals

NO → Specific data retention period?

    → Match interval to retention
    Retain 90 days? → Daily partitions
    Retain 2 years? → Monthly
    Retain 5+ years? → Quarterly

---

## Recommended Default

**Default:** Monthly for transactional data (12/year); daily for high-volume time-series (>1M rows/day)
**Reason:** Monthly balances pruning precision with partition count overhead. Only go daily when volume demands it.

---

## Pre-Creation Window

---

## Decision Context

Determining how many partitions to create ahead of the current period to prevent insert failures from missing partitions.

---

## Decision Criteria

* performance: pre-creation is lightweight (metadata operation)
* architectural: scheduled job must run before current partition fills
* maintainability: longer pre-creation window provides more safety margin

---

## Decision Tree

How critical is partition availability?

↓

Inserts must never fail due to missing partitions?

YES → Create 3+ months ahead

    ↓
    Monthly job creates next 3 months:
    Current: May → create June, July, August
    
    ↓
    Buffer: if job fails for 2 months, still safe
    Monitor: alert if pre-created count drops below 2

NO → Scheduled job runs reliably?

    YES → Create 1-2 months ahead
        
        ↓
        Monthly job creates next 1-2 months
        Lower overhead (fewer partitions tracked)
        
        ↓
        Risk: if job fails, inserts fail
        Mitigation: monitor partition job success

NO → Manual partition management?

    → Create 6+ months ahead
    Manual operation window is unpredictable
    Safest to create many ahead to reduce frequency
    Risk: human forgets (set calendar reminders)

---

## Recommended Default

**Default:** Create 3 months ahead with monthly automation; alert if fewer than 2 months remaining
**Reason:** 3-month buffer covers missed job executions. Monthly cadence aligns with typical maintenance windows.

---

## Related Rules

* Rule 8-7-1: Always Include Partition Key In WHERE
* Rule 8-7-2: Automate Partition Creation and Archival

---

## Related Skills

* Implement Time-Based Partitioning
* Implement Data Retention Policy
