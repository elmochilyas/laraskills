# ECC Anti-Patterns — SQLite Vec Local RAG

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | RAG & Retrieval-Augmented Generation |
| **Knowledge Unit** | SQLite Vec Local RAG |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using SQLite Vec for Production-Scale RAG (>100K Documents)
2. No Embedding Cache — Regenerating on Every Query
3. SQLite Vec Without Proper Index — Full Scan on Every Query
4. Mixing SQLite Vec with pgvector in Same Pipeline
5. Not Testing SQLite Vec Performance Before Production

---

## Repository-Wide Anti-Patterns

- SQLite Vec used without understanding its limitations for concurrent writes
- No fallback to pgvector when scale exceeds SQLite capability

---

## Anti-Pattern 1: SQLite Vec at Production Scale

### Category
Performance

### Description
Using SQLite Vec for 100K+ document RAG pipeline — performance degrades beyond small datasets.

### Preferred Alternative
Use SQLite Vec for development and small datasets (<10K docs). Use pgvector for production-scale workloads.

### Detection Checklist
- [ ] SQLite Vec with 100K+ documents
- [ ] Query latency > 500ms
- [ ] Scale exceeds SQLite capability

---

## Anti-Pattern 2: No Embedding Cache

### Category
Performance

### Description
Embedding generated for every query even when query is identical to previous — redundant API calls.

### Preferred Alternative
Cache query embeddings by query text hash. Skip embedding API for cached queries.

### Detection Checklist
- [ ] Same query re-embedded
- [ ] No embedding cache
- [ ] Unnecessary API calls
