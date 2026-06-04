# 8-1 Range Partitioning - Decision Trees

## Partition Type Selection: Range vs List vs Hash

---

## Decision Context

Choosing between range, list, and hash partitioning methods based on data characteristics and query patterns.

---

## Decision Criteria

* performance: partition pruning, partition-wise joins
* architectural: time-series vs discrete categories vs uniform distribution
* maintainability: partition management overhead

---

## Decision Tree

Which partitioning type to use?

↓

Is data naturally ordered by time (events, logs, orders)?

YES → Range partitioning

    ↓
    Monthly ranges: `PARTITION BY RANGE (TO_DAYS(created_at))`
    
    ↓
    Pros: Efficient partition pruning for date ranges, instant partition drop for archival
    Cons: Uneven partition sizes if data volume varies by month

NO → Discrete categories (region, status, type)?

    YES → List partitioning
        
        ↓
        `PARTITION BY LIST (region) (PARTITION p_us VALUES IN ('US'), PARTITION p_eu VALUES IN ('EU'))`
        
        ↓
        Pros: Related data grouped by category, can target specific partition
        Cons: Adding new category requires ALTER

NO → Need even distribution and don't have natural range/list key?

    YES → Hash partitioning
        
        ↓
        `PARTITION BY HASH (YEAR(created_at)) PARTITIONS 12`
        
        ↓
        Pros: Even distribution, no hot partitions
        Cons: No range pruning, no semantic grouping

---

## Recommended Default

**Default:** Range for time-series; List for categories; Hash for even distribution
**Reason:** Each type optimizes for different access patterns. Choose based on primary query pattern.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Apply Range Partitioning for Time-Series Data
