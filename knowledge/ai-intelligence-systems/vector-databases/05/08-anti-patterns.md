# ECC Anti-Patterns — Vector Search with Metadata Filtering

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Vector Databases |
| **Knowledge Unit** | Vector Search with Metadata Filtering |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Pre-Filtering Without Index — Full Scan on Metadata
2. Post-Filtering — Zero Results After Too Many Filters
3. Not Using Indexed Metadata Fields for Frequent Filters
4. No Combined Filter Optimization — AND Filters Without Composite Index
5. Filter Values Not Normalized — Case-Sensitivity Mismatches

---

## Repository-Wide Anti-Patterns

- Metadata filters never benchmarked for latency impact
- Filter cardinality not considered (low-cardinality filters are inefficient)

---

## Anti-Pattern 1: Pre-Filtering Without Index

### Category
Performance

### Description
Metadata pre-filter on non-indexed field — full metadata scan before vector search.

### Preferred Alternative
Create indexes on frequently filtered metadata fields. Use vector DB's built-in payload indexing.

### Detection Checklist
- [ ] Non-indexed metadata filter
- [ ] Pre-filter latency high
- [ ] Index not created

---

## Anti-Pattern 2: Post-Filtering Results

### Category
Reliability

### Description
Vector search returns top-K, then metadata filter removes most results — K is effectively smaller.

### Preferred Alternative
Apply metadata filter before or during vector search (pre-filtered search). Ensure enough candidates survive filtering.

### Detection Checklist
- [ ] Post-retrieval filtering
- [ ] Few results after filter
- [ ] Pre-filter approach not used
