# ECC Anti-Patterns — Embedding Caching

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Vector Databases |
| **Knowledge Unit** | Embedding Caching |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Embedding Cache — Regenerating for Every Query
2. Cache Key Not Including Embedding Model Version
3. Cache TTL Too Short — Frequent Cache Misses
4. Cache Without Fallback — Cache Miss = Failed Query
5. In-Memory Cache for Large Embedding Cache — Memory Overflow

---

## Repository-Wide Anti-Patterns

- Cache invalidation not triggered on content updates
- Cache hit rate not monitored

---

## Anti-Pattern 1: No Embedding Cache

### Category
Performance

### Description
Query embedding generated on every request — redundant API calls for repeated queries.

### Preferred Alternative
Cache query embeddings by normalized query hash. Use TTL appropriate to query repetition pattern.

### Detection Checklist
- [ ] No embedding cache
- [ ] Same query re-embedded
- [ ] Unnecessary API costs

---

## Anti-Pattern 2: Cache Without Model Version in Key

### Category
Reliability

### Description
Same cache key used across embedding model versions — stale embeddings from old model.

### Preferred Alternative
Include embedding model name and version in cache key.

### Detection Checklist
- [ ] No model version in cache key
- [ ] Stale embeddings after model upgrade
- [ ] Wrong dimension vectors in cache
