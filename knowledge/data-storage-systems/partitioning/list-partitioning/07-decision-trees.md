# 8-2 List Partitioning - Decision Trees

## List vs Range Partitioning for Status Columns

---

## Decision Context

Choosing between list partitioning (discrete values) and range partitioning (continuous ranges) for columns like status, region, or type that have a known set of discrete values.

---

## Decision Criteria

* performance: list partitioning prunes by exact value match
* architectural: list partitioning matches discrete categories; range matches intervals
* maintainability: list requires updating partition definitions when new values appear

---

## Decision Tree

Column has discrete values (status, region, type)?

YES → Use list partitioning

    ↓
    Small, known set of values (2-20)?
    
    YES → Explicit list partition for each group
        PARTITION BY LIST (status) (
            PARTITION p_active VALUES IN ('active','pending'),
            PARTITION p_inactive VALUES IN ('inactive','cancelled')
        )
        
    NO → Default partition strategy needed?
        YES → Include DEFAULT partition for unexpected values
            Monitor default partition growth
        NO → Omit DEFAULT — error on unmatched values

NO → Column has natural ranges (dates, ages, salaries)?
    
    YES → Use range partitioning instead
        Range by month/year/interval
        Not suitable for list partitioning
    
    NO → Column has high cardinality (thousands of unique values)?
        
        → Use hash partitioning for even distribution
        Not suitable for list — too many partition definitions

---

## Recommended Default

**Default:** List partitioning for columns with ≤20 known discrete values; range or hash for everything else
**Reason:** List partitioning excels at exact-match pruning on categorical data. High cardinality or continuous ranges need different strategies.

---

## Default Partition Strategy

---

## Decision Context

Choosing whether to include a `DEFAULT` partition in list partitioning — catch-all for unmatched values vs error on mismatch.

---

## Decision Criteria

* performance: default partition grows unbounded if values aren't managed
* architectural: default catches new values silently; omit forces explicit updates
* maintainability: default requires monitoring; omit requires deployment for new values

---

## Decision Tree

Will new values be added to the system over time?

YES → Include DEFAULT partition

    ↓
    New values go to default partition automatically
    Must monitor default partition size
    
    ↓
    Checklist:
    - Alert when default partition > 10% of total rows
    - Periodic review: move new values to correct partition
    - After migration: REORGANIZE to split values out of default

NO → All possible values known at creation?

    YES → Omit DEFAULT partition
        
        ↓
        INSERT of unmatched value throws error
        Forces explicit ALTER TABLE ... ADD PARTITION for new values
        
        ↓
        Pros: catches missing values immediately
        Pros: no hidden default partition growth
        
    NO → Unsure about future values?
    
        → Start with DEFAULT, migrate to explicit
        Include default for safety, monitor growth
        Convert to explicit partitions as values stabilize

---

## Recommended Default

**Default:** Include DEFAULT partition with monitoring alerts; remove once all values are known and stable
**Reason:** DEFAULT prevents silent INSERT failures. Monitor it and convert to explicit partitions as the value set stabilizes.

---

## Related Rules

* Rule 8-2-1: Always Include Partition Key In WHERE
* Rule 8-2-2: Automate Partition Lifecycle

---

## Related Skills

* Implement List Partitioning
* Implement Default Partition Strategy
