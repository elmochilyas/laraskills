# ECC Anti-Patterns — RAG Retrieval Optimization

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | RAG & Retrieval-Augmented Generation |
| **Knowledge Unit** | RAG Retrieval Optimization |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Top-K Too Large — Irrelevant Results Dilute Context
2. Top-K Too Small — Missing Relevant Documents
3. No Query Rewriting — User Query Directly Used for Embedding Search
4. Same K for All Query Types — No Dynamic Adjustment
5. No Multi-Turn Retrieval — Follow-Up Questions Don't Search Again

---

## Repository-Wide Anti-Patterns

- Retrieval latency not optimized — HNSW index not configured
- No query expansion for short user queries

---

## Anti-Pattern 1: Top-K Too Large

### Category
Reliability

### Description
Retrieving 20+ chunks but only 3-5 are relevant — irrelevant results dilute grounding context.

### Preferred Alternative
Lower K to 3-5 with minSimilarity threshold. Fewer, higher-quality results.

### Detection Checklist
- [ ] Top-K > 10
- [ ] Mostly irrelevant results
- [ ] LLM confused by unrelated context

---

## Anti-Pattern 2: No Query Rewriting

### Category
Reliability

### Description
Using raw user queries directly for embedding search — short queries lack semantic specificity.

### Preferred Alternative
Use an LLM to rewrite/expand the user query into a more specific search query before embedding.

### Detection Checklist
- [ ] Raw user query for embedding
- [ ] Short queries produce poor results
- [ ] No query rewriting step
