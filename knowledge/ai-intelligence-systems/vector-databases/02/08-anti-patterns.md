# ECC Anti-Patterns — Vector Query Optimization

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Vector Databases |
| **Knowledge Unit** | Vector Query Optimization |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Same ef for All Queries — No Dynamic Adjustment
2. Top-K Too Large for Query Type
3. No Query Batching — N Independent Query Calls
4. Vector Search Without Cache for Repeated Queries
5. No Query Timeout — Hanging Queries Block Workers

---

## Anti-Pattern 1: Same ef for All Queries

### Category
Performance

### Description
Fixed ef value regardless of query recall requirements — high recall queries get low ef, low recall queries waste latency.

### Preferred Alternative
Adjust ef per query. High recall queries use higher ef. Low recall queries (previews) use lower ef.

### Detection Checklist
- [ ] Fixed ef for all queries
- [ ] No per-query ef adjustment
- [ ] Suboptimal latency/recall tradeoff
