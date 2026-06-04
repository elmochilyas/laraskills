# ECC Anti-Patterns — Qdrant Integration

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Vector Databases |
| **Knowledge Unit** | Qdrant Integration |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Payload Indexing — Full Scan on Metadata Filters
2. One Collection Per Vector Dimension — Management Overhead
3. Default Segment Configuration for All Workloads
4. No HNSW Tuning for Qdrant-Specific Parameters
5. Not Using Quantization for Large Collections

---

## Repository-Wide Anti-Patterns

- Qdrant cluster not monitored for segment optimization
- No backup/restore strategy for Qdrant collections

---

## Anti-Pattern 1: No Payload Indexing

### Category
Performance

### Description
Metadata filters without indexing — Qdrant scans all points to apply filters.

### Preferred Alternative
Create payload indexes for frequently filtered fields (tenant_id, document_type, date).

### Detection Checklist
- [ ] No payload index
- [ ] Metadata filter latency high
- [ ] Filtered queries slow

---

## Anti-Pattern 2: One Collection Per Vector Dimension

### Category
Architecture

### Description
Creating separate collections for models with different embedding dimensions — unnecessary complexity.

### Preferred Alternative
Standardize on one embedding model/dimension per application. Use a single collection unless dimensions are truly incompatible.

### Detection Checklist
- [ ] Multiple collections for different dimensions
- [ ] Management overhead
- [ ] Redundant configuration
