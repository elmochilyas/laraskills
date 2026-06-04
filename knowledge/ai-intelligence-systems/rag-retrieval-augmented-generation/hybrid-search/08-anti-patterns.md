# ECC Anti-Patterns — Hybrid Search (Vector + Keyword)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | RAG & Retrieval-Augmented Generation |
| **Knowledge Unit** | Hybrid Search |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Vector-Only Search — Missing Exact Keyword Matches
2. Keyword-Only Search — Missing Semantic Matches
3. Equal Weights for Vector and Keyword — No Tuning
4. Normalization Mismatch Between Vector and Keyword Scores
5. Hybrid Search Without Evaluation — Tuning Blind

---

## Repository-Wide Anti-Patterns

- Hybrid search without fallback to pure vector/keyword
- No per-query weight adjustment

---

## Anti-Pattern 1: Vector-Only or Keyword-Only Search

### Category
Reliability

### Description
Using only vector similarity or only keyword search when hybrid would perform better.

### Preferred Alternative
Implement hybrid search combining vector similarity and keyword matching with tunable weights.

### Detection Checklist
- [ ] Vector-only search
- [ ] Keyword-only search
- [ ] Missing hybrid combination

---

## Anti-Pattern 2: Equal Weights Without Tuning

### Category
Reliability

### Description
Vector and keyword results combined with 0.5/0.5 weight for all queries — suboptimal for many use cases.

### Preferred Alternative
Tune hybrid weights per domain. Use higher keyword weight for exact-match queries (IDs, codes), higher vector weight for semantic queries.

### Detection Checklist
- [ ] Equal weights for all queries
- [ ] No weight tuning
- [ ] Suboptimal for specific query types
