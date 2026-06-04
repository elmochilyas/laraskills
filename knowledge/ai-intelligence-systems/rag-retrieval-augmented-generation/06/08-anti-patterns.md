# ECC Anti-Patterns — RAG Metadata & Filtering

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | RAG & Retrieval-Augmented Generation |
| **Knowledge Unit** | RAG Metadata & Filtering |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Metadata on Chunks — Cannot Filter or Scope
2. Filtering After Vector Search Instead of Before
3. Inconsistent Metadata Schema Across Document Types
4. Metadata Without Access Control Information
5. Not Indexing Metadata for Fast Filtering

---

## Repository-Wide Anti-Patterns

- Metadata stored separately from vector — join overhead on retrieval
- Metadata fields not documented

---

## Anti-Pattern 1: No Metadata on Chunks

### Category
Architecture

### Description
Chunks stored with vector and text only — can't filter by document type, date, author, or access level.

### Preferred Alternative
Store metadata alongside each chunk: source document, section, date, access level, document type.

### Detection Checklist
- [ ] No chunk metadata
- [ ] Cannot filter by document attributes
- [ ] All chunks returned for every query

---

## Anti-Pattern 2: Filtering After Vector Search

### Category
Performance

### Description
Vector search returns top-K, then metadata filter removes results — may leave 0 results after filtering.

### Preferred Alternative
Apply metadata filters before vector search. Combine `whereVectorSimilarTo` with `where()` clauses.

### Detection Checklist
- [ ] Post-retrieval metadata filtering
- [ ] Zero results after filter
- [ ] Inefficient retrieval
