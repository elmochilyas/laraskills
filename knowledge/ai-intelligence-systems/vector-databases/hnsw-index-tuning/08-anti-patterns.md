# ECC Anti-Patterns — HNSW Index Tuning

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Vector Databases |
| **Knowledge Unit** | HNSW Index Tuning |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Default HNSW Parameters for All Workloads
2. High efConstruction With Small Dataset — Unnecessary Build Cost
3. Low ef At Query Time — Poor Recall
4. High M Value Causing Memory Issues
5. No ef Tuning Based on Recall Requirements

---

## Repository-Wide Anti-Patterns

- HNSW parameters never benchmarked against workload
- Same parameters for insert-heavy and query-heavy workloads

---

## Anti-Pattern 1: Default Parameters for All

### Category
Performance

### Description
Using HNSW defaults (`M=16`, `ef_construction=200`, `ef=40`) without tuning for specific dataset and query patterns.

### Preferred Alternative
Benchmark HNSW parameters against your latency and recall requirements. Tune per workload.

### Detection Checklist
- [ ] Default HNSW parameters
- [ ] Suboptimal recall or latency
- [ ] No parameter benchmarking

---

## Anti-Pattern 2: Low ef_construction — Poor Recall

### Category
Reliability

### Description
Low `ef_construction` value — index quality suffers, recall drops below requirement.

### Preferred Alternative
Set `ef_construction` proportional to dataset size. Higher ef_construction = better recall at build-time cost.

### Detection Checklist
- [ ] ef_construction too low
- [ ] Recall below requirement
- [ ] Index quality suffers
