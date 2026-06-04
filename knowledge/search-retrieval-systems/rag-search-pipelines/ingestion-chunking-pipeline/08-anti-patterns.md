# Anti-Patterns: Ingestion & Chunking Pipeline

## Metadata

| | |
|---|---|
| **KU ID** | ku-02 |
| **Subdomain** | rag-search-pipelines |
| **Topic** | Ingestion & Chunking Pipeline |
| **Source** | LangChain / LlamaIndex / Industry |
| **Maturity** | New |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 14-rag-search-pipelines |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Ignoring Document Structure | Architecture | High |
| 2 | One-Size-Fits-All Chunk Size | Architecture | Medium |
| 3 | Re-Embedding Unchanged Documents | Performance | High |
| 4 | Not Handling Document Updates | Reliability | Medium |

## Repository-Wide Anti-Patterns

- **Structure-Blind Chunking**: Using the same splitting strategy for all document types regardless of content structure
- **Chunk-and-Forget**: Embedding chunks without tracking which documents they belong to for updates or deletion
- **Re-Index Everything**: Re-embedding all documents when chunking strategy changes, unchanged documents included

---

## 1. Ignoring Document Structure

**Category:** Architecture

**Description:** Applying uniform chunking (e.g., fixed-size splitting) to all document types — PDFs, HTML, code, markdown — without accounting for their structural differences.

**Why It Happens:** Fixed-size splitting is the simplest to implement and appears to "just work" regardless of input format.

**Warning Signs:**
- PDF documents split across page boundaries mid-paragraph
- Code files broken mid-function or mid-class
- HTML documents with tags split across chunks

**Why Harmful:** Different document types require different chunking strategies. Fixed-size splitting destroys the semantic boundaries in structured documents, making retrieval less accurate.

**Consequences:**
- Chunks that start or end at structurally meaningless positions
- Poor retrieval for structured documents (code, technical docs)
- Need for more chunks per query to reconstruct context

**Alternative:** Use document-type-aware chunking. Implement recursive splitting for prose, semantic splitting for technical documents, and language-aware splitting for code.

**Refactoring Strategy:**
1. Classify documents by type (prose, code, HTML, PDF)
2. Implement type-specific chunking strategies
3. Test retrieval quality per document type independently

**Detection Checklist:**
- [ ] Are different document types chunked differently?
- [ ] Are chunks evaluated for boundary quality?
- [ ] Do chunks respect document structure (paragraphs, sections, code blocks)?

**Related Rules/Skills/Trees:**
- Rule: Use Document-Type-Aware Chunking (`04-standardized-knowledge.md:37-38`)

---

## 2. One-Size-Fits-All Chunk Size

**Category:** Architecture

**Description:** Using a single chunk size for all documents without testing or tuning for the specific corpus and query patterns.

**Why It Happens:** Chunk size seems like a minor detail. Teams pick a common default (e.g., 512 tokens) without validation.

**Warning Signs:**
- Same chunk size used regardless of document length or type
- No chunk size benchmarking performed
- Retrieval quality not compared across chunk sizes

**Why Harmful:** Optimal chunk size depends on document length, topic density, query patterns, and model context window. One-size-fits-all leads to suboptimal retrieval for all document types.

**Consequences:**
- Short documents are over-chunked (too many tiny chunks)
- Long documents are under-chunked (chunks too large or unmanageable)
- No data to justify chunk size decisions

**Alternative:** Benchmark multiple chunk sizes (256, 512, 768, 1024) against your test set. Tune per document type if retrieval quality varies.

**Refactoring Strategy:**
1. Create a test set with diverse document types and queries
2. Benchmark retrieval recall at 256, 512, 768, 1024 token chunks
3. Select optimal size(s) based on empirical results

**Detection Checklist:**
- [ ] Is chunk size benchmarked against your test set?
- [ ] Are different sizes considered for different doc types?
- [ ] Is there data supporting the chosen chunk size?

**Related Rules/Skills/Trees:**
- Rule: Benchmark and Tune Chunk Size (`04-standardized-knowledge.md:40-41`)

---

## 3. Re-Embedding Unchanged Documents

**Category:** Performance

**Description:** Re-embedding all documents on every indexing run, even when content has not changed, wasting API calls and compute.

**Why It Happens:** Simpler implementation. Full re-indexing is easier than tracking document changes and selectively re-embedding.

**Warning Signs:**
- All documents re-embedded on every pipeline run
- No content-hash caching implemented
- Embedding API costs correlate with total documents, not changed documents

**Why Harmful:** For large indexes, re-embedding unchanged content represents 90%+ of embedding costs with zero quality benefit.

**Consequences:**
- 10-100× higher embedding API costs than necessary
- Slower indexing from processing unchanged documents
- Rate limit issues caused by unnecessary embeddings

**Alternative:** Cache embeddings by document content hash. Only re-embed documents whose content hash has changed.

**Refactoring Strategy:**
1. Compute document content hash on ingestion
2. Check if hash exists in embedding cache
3. Skip embedding for unchanged documents
4. Invalidate cache when content actually changes

**Detection Checklist:**
- [ ] Are embeddings cached by content hash?
- [ ] Are unchanged documents skipped during re-indexing?
- [ ] Is embedding cache hit rate monitored?

**Related Rules/Skills/Trees:**
- Rule: Cache Embeddings by Document Hash (`04-standardized-knowledge.md:40-41`)

---

## 4. Not Handling Document Updates

**Category:** Reliability

**Description:** No mechanism to track document versions or re-ingest updated documents, leading to stale or conflicting chunks in the index.

**Why It Happens:** Initial implementation focuses on first-time ingestion. Update workflows require additional infrastructure for change detection and partial re-indexing.

**Warning Signs:**
- Updated documents coexist with their old versions in the index
- No document-level version tracking
- Re-ingestion requires full re-index

**Why Harmful:** Users retrieve stale information from outdated chunks. Old and new versions of the same document can both appear in retrieval results, confusing the LLM.

**Consequences:**
- Stale answers based on outdated documents
- Conflicting information from old and new versions
- No audit trail for document changes

**Alternative:** Implement version tracking per document. On update, delete old chunks and insert new ones atomically. Use document IDs to track versions.

**Refactoring Strategy:**
1. Assign unique document IDs with version numbers
2. On update: delete all chunks for old version, insert new chunks
3. Implement change detection (modified_at timestamps or webhooks)
4. Test partial re-indexing for single-document updates

**Detection Checklist:**
- [ ] Are document versions tracked in the index?
- [ ] Are old chunks removed when documents are updated?
- [ ] Is partial re-indexing supported (not full re-index only)?

**Related Rules/Skills/Trees:**
- Rule: Handle Document Updates with Version Tracking (`04-standardized-knowledge.md:42-43`)
