# ECC Anti-Patterns — RAG Pipeline with SimilaritySearch

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | RAG & Retrieval-Augmented Generation |
| **Knowledge Unit** | RAG Pipeline with SimilaritySearch |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No MinSimilarity Threshold — Irrelevant Chunks Pollute Context
2. Retrieving Without User/Tenant Scoping — Cross-User Data Leakage
3. Embedding Query Per Request Without Caching
4. No Metadata Pre-Filtering Before Vector Search
5. Injecting All Retrieved Chunks Without Truncation

---

## Repository-Wide Anti-Patterns

- No citation grounding — LLM can hallucinate facts not in retrieved documents
- Ingestion pipeline not queued — large documents block HTTP worker

---

## Anti-Pattern 1: No MinSimilarity Threshold

### Category
Reliability

### Description
Retrieving top-K chunks without similarity threshold — irrelevant chunks injected into LLM context.

### Preferred Alternative
Set `minSimilarity` to 0.7–0.8. Return fewer but more relevant chunks.

### Detection Checklist
- [ ] No minSimilarity set
- [ ] Irrelevant chunks in context
- [ ] LLM confabulating from low-relevance context

---

## Anti-Pattern 2: Retrieving Without User Scoping

### Category
Security

### Description
Vector search returns documents from all users — User A sees User B's private data.

### Preferred Alternative
Combine `whereVectorSimilarTo` with `where('user_id', $userId)` or similar tenant scope.

### Detection Checklist
- [ ] No user filter on vector search
- [ ] Cross-user data in results
- [ ] Tenant isolation missing
