# ECC Anti-Patterns — Document Chunking Strategies

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | RAG & Retrieval-Augmented Generation |
| **Knowledge Unit** | Document Chunking Strategies |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Fixed-Size Chunking for All Content Types
2. No Chunk Overlap — Context Lost at Boundaries
3. Chunks Too Large (>1000 tokens) — Poor Retrieval Precision
4. Chunks Too Small (<100 tokens) — Missing Context
5. No Structural Awareness — Splitting Tables or Code Blocks

---

## Repository-Wide Anti-Patterns

- Chunking strategy never evaluated against retrieval metrics
- Same chunk size for code docs, prose, and tables

---

## Anti-Pattern 1: Fixed-Size Chunking for All Content

### Category
Reliability

### Description
Using naive fixed-size character/token chunking for all document types — splits sentences, breaks code, corrupts meaning.

### Why It Happens
Fixed-size chunking is the simplest to implement and developers don't test alternatives.

### Warning Signs
- Chunks end mid-sentence
- Code blocks split across chunks
- Poor retrieval quality despite good embeddings

### Why It Is Harmful
Chunking strategy is the single highest-leverage parameter in RAG quality — 20-40% accuracy differences. Fixed-size chunking ignores document structure: it splits sentences (losing grammatical context), breaks code blocks (losing semantic units), and splits tables (losing relational context). Retrieved chunks are harder for the LLM to interpret, reducing answer quality.

### Preferred Alternative
Use document-aware chunking (respect headers, paragraphs, code blocks) or semantic chunking (split on topic shifts). Test chunking strategies against your retrieval metrics.

### Detection Checklist
- [ ] Fixed-size for all content types
- [ ] Chunks split mid-sentence
- [ ] RAG quality below potential

### Related Rules
Choose Chunking Strategy by Content Type (05-rules.md)

---

## Anti-Pattern 2: No Chunk Overlap

### Category
Reliability

### Description
Consecutive chunks with no overlap — context at chunk boundaries lost.

### Preferred Alternative
Apply 10-20% overlap between chunks. Prevents context loss at boundaries.

### Detection Checklist
- [ ] Zero overlap between chunks
- [ ] Boundary context missing
- [ ] Overlap not configured
