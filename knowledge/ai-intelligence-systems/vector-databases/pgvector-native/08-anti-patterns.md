# ECC Anti-Patterns — pgvector Integration

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Vector Databases |
| **Knowledge Unit** | pgvector Integration |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No HNSW Index — Full Scan on Every Query
2. Creating Index After Inserting All Data — Hours-Long Build
3. Not Tuning Index Build Parameters (ef_construction, M)
4. Using Default Cosine Similarity When Inner Product Is Faster
5. No Separate Vector Column for Each Embedding Model

---

## Repository-Wide Anti-Patterns

- pgvector not monitored — query latency creeping up as vectors grow
- Vectors stored in same table without considering storage overhead

---

## Anti-Pattern 1: No HNSW Index

### Category
Performance

### Description
pgvector queries without HNSW or IVFFlat index — full table scan on every vector search.

### Preferred Alternative
Create HNSW index after data insertion. Tune `ef_construction` and `M` parameters.

### Detection Checklist
- [ ] No vector index
- [ ] Query latency grows linearly with vector count
- [ ] Full table scan on every query

---

## Anti-Pattern 2: Creating Index After All Data Inserted

### Category
Performance

### Description
Inserting millions of vectors then building HNSW index — index build takes hours, blocking writes.

### Preferred Alternative
Build index progressively during ingestion. Use IVFFlat for fast initial build.

### Detection Checklist
- [ ] Bulk insert then index build
- [ ] Hours-long index build
- [ ] Writes blocked during build
