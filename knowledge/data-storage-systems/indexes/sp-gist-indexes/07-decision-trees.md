# 3-6 SP-GiST Indexes - Decision Trees

## SP-GiST vs GiST for Spatial Data

---

## Decision Context

Choosing between SP-GiST (space-partitioned) and GiST (generalized) for spatial queries in PostgreSQL based on data distribution.

---

## Decision Criteria

* performance: SP-GiST better for skewed distributions, GiST more general
* architectural: SP-GiST supports quadtree/k-d tree/radix tree
* maintainability: SP-GiST is more niche, less community knowledge
* security: none

---

## Decision Tree

Need a spatial index in PostgreSQL?

↓

Is the data distribution highly skewed (e.g., 90% of points in 10% of area)?

YES → Consider SP-GiST

    ↓
    What type of data?
    
    2D points → Quadtree (SP-GiST)
    Text prefixes → Radix tree (SP-GiST)
    IP addresses → Radix tree (SP-GiST)
    
    ↓
    Measure performance vs GiST before committing

NO → Data is relatively uniform?

    YES → Use GiST (simpler, more general, better tested)
    
    NO → Not sure about distribution?
    
        YES → Use GiST first, switch to SP-GiST only if profiling shows issues

---

## Rationale

GiST partitions space by splitting interior pages (balanced tree). SP-GiST recursively partitions into non-overlapping regions, which naturally adapts to data density. For skewed data (most points in cities, few in rural areas), SP-GiST can prune large empty regions faster.

---

## Recommended Default

**Default:** GiST
**Reason:** GiST is the safe, well-tested default for spatial queries. Only switch to SP-GiST when data is confirmed skewed and GiST profiling shows suboptimal performance.

---

## Risks Of Wrong Choice

SP-GiST on uniform data: no performance benefit, added complexity, less community support. GiST on heavily skewed data: potentially slower than SP-GiST for extreme distributions.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Design SP-GiST Indexes for Skewed Data Distributions
* Design GiST Indexes for Geospatial and Range Queries

---

## SP-GiST Radix Tree vs B-Tree for Prefix Search

---

## Decision Context

Choosing between SP-GiST radix tree and B-Tree for text prefix searches (autocomplete, dictionary lookup, IP prefix matching).

---

## Decision Criteria

* performance: SP-GiST radix tree for prefix, B-Tree for equality/range/sort
* architectural: B-Tree simpler and more familiar
* maintainability: SP-GiST is PostgreSQL-specific
* security: none

---

## Decision Tree

Need to index text for prefix search?

↓

What is the primary query pattern?

↓

Prefix search (WHERE word LIKE 'pre%' or autocomplete)?

YES → SP-GiST radix tree (optimized for prefix)

    ↓
    CREATE INDEX ON dictionary USING SPGIST (word text_ops)
    
    ↓
    Efficient for common prefix queries, autocomplete, dictionary lookup

NO → Equality (WHERE word = 'exact') or sorting (ORDER BY word)?

    YES → B-Tree (more efficient for equality and sort)
    
    NO → Both prefix AND equality/sort needed?
    
        YES → Consider both indexes or benchmark which pattern dominates
            Prefer B-Tree if equality dominates
            Prefer SP-GiST if prefix dominates

---

## Rationale

A radix tree (trie) compresses common prefixes — "ab" appears once for "abandon", "abbreviate", "abdicate". This makes prefix searches traverse fewer nodes. B-Tree stores each full string per entry, making prefix scans a range scan over the sorted order.

---

## Recommended Default

**Default:** B-Tree
**Reason:** B-Tree handles prefix search well enough for most workloads (LIKE 'prefix%' range scan). SP-GiST radix tree is only beneficial when prefix search is the dominant pattern and performance requirements are extreme.

---

## Risks Of Wrong Choice

SP-GiST for general text indexing: no support for full-text search operators, less optimized for range/equality. B-Tree for heavy prefix-search-only workload: more index scans than necessary.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Design SP-GiST Indexes for Skewed Data Distributions
* Design B-Tree Indexes for Equality and Range Queries
