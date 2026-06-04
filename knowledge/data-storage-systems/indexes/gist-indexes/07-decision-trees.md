# 3-3 GiST Indexes - Decision Trees

## GiST vs GIN for Full-Text Search

---

## Decision Context

Choosing between GiST and GIN for full-text search on tsvector columns in PostgreSQL.

---

## Decision Criteria

* performance: GIN up to 10x faster query, GiST faster writes
* architectural: GIN larger size, GiST better for real-time indexing
* maintainability: GIN needs more vacuum maintenance
* security: RLS alignment with partial indexes

---

## Decision Tree

Need full-text search in PostgreSQL?

↓

Workload is write-heavy (frequent tsvector updates)?

YES → GiST is preferred (faster to update, slower to query)

NO → Workload is read-heavy (frequent search queries)?

    YES → GIN is preferred (faster queries, up to 10x)
    
    NO → Balanced workload?
    
        YES → GIN (better query performance for most apps)
        
        NO → GiST

---

## Rationale

GIN builds slower but queries faster due to its inverted index structure — each word maps directly to rows. GiST uses a balanced tree of lexemes; faster inserts but slower lookups. For most web applications with more reads than writes, GIN is preferred.

---

## Recommended Default

**Default:** GIN for full-text search
**Reason:** Most applications are read-heavy. GIN provides significantly faster query performance.

---

## Risks Of Wrong Choice

GiST with heavy read workload: slow search performance under load. GIN with heavy write workload: write throughput bottleneck and VACUUM pressure.

---

## Related Rules

* Rule 3: Write sargable WHERE conditions

---

## Related Skills

* Design GIN Indexes for JSONB and Full-Text Search
* Design GiST Indexes for Geospatial and Range Queries

---

## GiST vs B-Tree for Range Exclusion Constraints

---

## Decision Context

Choosing between GiST (with exclusion constraints) and B-Tree (with application-level checks) for preventing overlapping ranges, such as booking time slots or reservation systems.

---

## Decision Criteria

* performance: GiST exclusion constraints have overhead on each write
* architectural: database-enforced vs application-enforced
* maintainability: GiST exclusion constraints are complex to alter
* security: database-level enforcement is stronger

---

## Decision Tree

Need to prevent overlapping ranges (e.g., booking time slots)?

↓

Is absolute data integrity required (no overlap tolerance)?

YES → Use GiST Exclusion Constraint

    ↓
    CREATE TABLE bookings (
        room_id INT,
        booked_during TSRANGE,
        EXCLUDE USING GIST (room_id WITH =, booked_during WITH &&)
    )
    
    ↓
    Be aware: higher write overhead, complex to modify

NO → Can application logic enforce overlap prevention?

    YES → Application-level checks with B-Tree indexes
    
        ↓
        Query before insert to check for overlaps
        
        ↓
        Use optimistic locking for concurrency
    
    NO → Use GiST Exclusion Constraint

---

## Rationale

GiST exclusion constraints provide database-level enforcement of non-overlapping ranges. This is the strongest guarantee but adds write overhead. Application-level checks are simpler but can have race conditions under concurrent access unless combined with locking.

---

## Recommended Default

**Default:** GiST exclusion constraint for critical integrity; application-level for performance-sensitive paths
**Reason:** Database-level enforcement is stronger but expensive. Use app-level when the integrity requirement is less strict or performance is paramount.

---

## Risks Of Wrong Choice

Application-level only: race conditions leading to overlapping data. GiST constraint: higher write latency, difficult to modify or drop on large tables.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Design GiST Indexes for Geospatial and Range Queries

---

## GiST vs SP-GiST for Spatial Data

---

## Decision Context

Choosing between GiST and SP-GiST (Space-Partitioned GiST) for geospatial queries in PostgreSQL based on data distribution.

---

## Decision Criteria

* performance: GiST for balanced data, SP-GiST for skewed distributions
* architectural: SP-GiST supports different partitioning (quadtree, k-d tree)
* maintainability: SP-GiST may need parameter tuning

---

## Decision Tree

Need a spatial index in PostgreSQL?

↓

Data distribution is relatively uniform (e.g., evenly distributed points across a city)?

YES → Use GiST (general purpose, well-tested)

NO → Data is highly skewed or clustered (e.g., most points in few regions)?

    YES → Consider SP-GiST (space-partitioned, handles skew better)
    
    NO → Use GiST (default safe choice)

---

## Rationale

GiST is the default spatial index — it works well for most distributions. SP-GiST recursively partitions space into non-overlapping regions, which can handle skewed distributions more efficiently by adapting partition sizes to data density.

---

## Recommended Default

**Default:** GiST
**Reason:** Mature, well-tested, good for most spatial workloads. Only switch to SP-GiST if profiling shows GiST performance issues with strongly skewed data.

---

## Risks Of Wrong Choice

SP-GiST on uniform data: no benefit over GiST, increased complexity. GiST on extremely skewed data: performance degradation compared to SP-GiST.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Design GiST Indexes for Geospatial and Range Queries
* Design SP-GiST Indexes for Skewed Data Distributions
