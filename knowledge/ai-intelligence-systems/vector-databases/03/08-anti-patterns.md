# ECC Anti-Patterns — Vector Data Modeling

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Vector Databases |
| **Knowledge Unit** | Vector Data Modeling |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Single Vector Column for Multiple Semantic Meanings
2. No Version Field — Can't Distinguish V1 vs V2 Embeddings
3. Metadata Bloated with Non-Filterable Fields
4. Chunking Model Coupling — Same Vector Column for Different Chunk Sizes
5. No Unique ID for Vector — Can't Deduplicate or Update

---

## Repository-Wide Anti-Patterns

- Embedding model version not tracked in metadata
- Source document ID missing from vector metadata

---

## Anti-Pattern 1: Single Vector for Multiple Meanings

### Category
Architecture

### Description
Same vector column stores embeddings for descriptions, reviews, and content — semantic spaces overlap.

### Preferred Alternative
Separate vector columns per semantic type, or store type in metadata and filter.

### Detection Checklist
- [ ] Mixed semantic types in one vector
- [ ] Cross-type retrieval noise
- [ ] Semantic overlap problematic

---

## Anti-Pattern 2: No Embedding Version

### Category
Maintainability

### Description
No field indicating which embedding model generated the vector — can't re-embed on model upgrade.

### Preferred Alternative
Store `embedding_model` and `embedding_version` in vector metadata.

### Detection Checklist
- [ ] No model version tracking
- [ ] Re-embedding on upgrade requires full scan
- [ ] Can't identify old embeddings
