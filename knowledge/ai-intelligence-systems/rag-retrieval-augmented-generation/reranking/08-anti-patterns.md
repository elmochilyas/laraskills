# ECC Anti-Patterns — Reranking

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | RAG & Retrieval-Augmented Generation |
| **Knowledge Unit** | Reranking |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Reranking — Top-K From Vector Similarity Used Directly
2. Reranking with Same Model Used for Embedding
3. Reranking Too Many Candidates — Latency/Lost Impact
4. Reranking Without Threshold — Low-Quality Results Promoted
5. No Cross-Encoder Reranking for Production Quality

---

## Repository-Wide Anti-Patterns

- Reranking latency not measured — may exceed retrieval time
- Reranking applied to all queries including exact-match lookups

---

## Anti-Pattern 1: No Reranking

### Category
Reliability

### Description
Using raw vector similarity results directly without reranking — misses relevance improvements.

### Preferred Alternative
Add a cross-encoder reranking step after initial vector retrieval. Rerank top-20, return top-5.

### Detection Checklist
- [ ] No reranking step
- [ ] Raw vector similarity used
- [ ] Missed relevance gains

---

## Anti-Pattern 2: Reranking Too Many Candidates

### Category
Performance

### Description
Reranking 100+ candidates — cross-encoder latency makes retrieval slower than generation.

### Preferred Alternative
Rerank a smaller set (top-10 to top-20). Vector search handles the wide recall; reranker refines the top candidates.

### Detection Checklist
- [ ] Reranking 50+ candidates
- [ ] Reranking latency > retrieval latency
- [ ] Diminishing returns from many candidates
