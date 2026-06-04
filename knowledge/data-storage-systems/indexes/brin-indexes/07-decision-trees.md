# 3-5 BRIN Indexes - Decision Trees

## BRIN vs B-Tree for Time-Series Data

---

## Decision Context

Choosing between BRIN and B-Tree indexes for large append-only tables with timestamp-based range queries.

---

## Decision Criteria

* performance: BRIN 100-1000x smaller, range query efficient, poor for point lookups
* architectural: requires insertion-order correlation, append-only workload
* maintainability: B-Tree needs bloat management, BRIN is simpler
* security: none

---

## Decision Tree

Need an index on a large table with timestamp range queries?

↓

Is the table append-only (rare UPDATE/DELETE)?

NO → Use B-Tree (BRIN degrades with updates/deletes)

YES → Is data inserted in roughly chronological order?

    NO → Use B-Tree (BRIN requires correlation between insert order and value)
    
    YES → Are queries primarily range-based (WHERE ts > ? AND ts < ?)?
    
        YES → Is storage space a concern?
        
            YES → Use BRIN (100-1000x smaller than B-Tree)
            
                ↓
                Tune pages_per_range: lower (32) for precision, higher (256) for size
                
            NO → Use B-Tree (simpler, more versatile)
        
        NO → Are queries point lookups (point lookups on timestamp)?
        
            YES → Use B-Tree (BRIN is poor for point lookups)

---

## Rationale

BRIN exploits physical correlation between insertion order and value order. For time-series data where new rows have higher timestamps, each block range covers a narrow time window, making range queries highly efficient. B-Tree is more versatile but much larger.

---

## Recommended Default

**Default:** BRIN for append-only time-series with range queries; B-Tree otherwise
**Reason:** BRIN's massive storage savings (100-1000x) are compelling for large time-series. B-Tree is the safe fallback when data patterns don't match BRIN's assumptions.

---

## Risks Of Wrong Choice

BRIN on random/updated data: every query scans all blocks — worse than no index. B-Tree on 1TB time-series: 30GB index that impacts backup time, memory, and write throughput.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Design BRIN Indexes for Time-Series Data
* Design B-Tree Indexes for Equality and Range Queries

---

## BRIN pages_per_range Tuning

---

## Decision Context

Configuring the `pages_per_range` parameter of a BRIN index to balance between index size and filtering precision.

---

## Decision Criteria

* performance: lower values = more precise filtering, larger index
* architectural: depends on query pattern and table size
* maintainability: can be changed by rebuilding index
* security: none

---

## Decision Tree

What pages_per_range value to use?

↓

Is the table small (< 10GB)?

YES → Lower value: pages_per_range = 32

    ↓
    More precise pruning, slightly larger index

NO → Is the table very large (> 1TB)?

    YES → Higher value: pages_per_range = 256
    
        ↓
        Smaller index, coarser filtering but still effective for big range queries
    
    NO → Default: pages_per_range = 128 (balance)

↓

Does the application need fast responses for narrow date-range queries (e.g., last hour)?

YES → Consider lowering pages_per_range to 32-64

NO → Are queries typically over wide date ranges (e.g., last month)?

    YES → Default 128-256 is fine

---

## Rationale

Each BRIN index entry summarizes a block range. Smaller ranges mean more entries but tighter min/max bounds, so fewer blocks need scanning. For large tables scanning millions of rows, the coarser filter is still effective. For narrow queries on large tables, finer granularity helps.

---

## Recommended Default

**Default:** pages_per_range = 128
**Reason:** Balances index size with filtering precision. Tune only after monitoring query patterns.

---

## Risks Of Wrong Choice

Too low pages_per_range: index approaches B-Tree in size, losing BRIN's main advantage. Too high: queries may scan too many unnecessary blocks, especially for narrow time windows.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Design BRIN Indexes for Time-Series Data
