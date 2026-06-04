# ECC Anti-Patterns — Embedding Generation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | RAG & Retrieval-Augmented Generation |
| **Knowledge Unit** | Embedding Generation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Regenerating Embeddings for Unchanged Content
2. Different Embedding Models for Indexing and Querying
3. Embedding Large Documents Synchronously — Blocks Worker
4. No Error Handling on Embedding API Calls
5. Using Provider Embedding Without Considering Dimensions

---

## Repository-Wide Anti-Patterns

- Embedding API keys not configured separately from chat API keys
- Embedding cache not implemented — redundant API calls

---

## Anti-Pattern 1: Regenerating Embeddings for Unchanged Content

### Category
Performance

### Description
Re-embedding all documents on every ingestion run — wasted API calls and latency.

### Preferred Alternative
Cache embedding vectors. Only regenerate when content changes.

### Detection Checklist
- [ ] Full re-embed on every run
- [ ] No embedding cache
- [ ] Unchanged content re-embedded

---

## Anti-Pattern 2: Different Embedding Models for Indexing and Querying

### Category
Reliability

### Description
Using different embedding models at index time vs. query time — vector dimensions or semantic spaces don't match.

### Preferred Alternative
Use the same embedding model (or compatibly dimensioned models) for both indexing and querying.

### Detection Checklist
- [ ] Index model != query model
- [ ] Dimension mismatch
- [ ] Poor retrieval quality
