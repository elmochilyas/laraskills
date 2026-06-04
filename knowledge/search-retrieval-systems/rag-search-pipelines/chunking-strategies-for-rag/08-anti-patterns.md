# Anti-Patterns: Chunking Strategies for RAG

## Metadata

| | |
|---|---|
| **KU ID** | K068 |
| **Subdomain** | rag-search-pipelines |
| **Topic** | Chunking Strategies for RAG |
| **Source** | General (LangChain, LlamaIndex) |
| **Maturity** | New |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 14-rag-search-pipelines |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | One-Chunk-Fits-All | Architecture | High |
| 2 | No Overlap | Quality | Medium |
| 3 | Over-Chunking | Performance | Medium |
| 4 | Ignoring Document Structure | Quality | High |

## Repository-Wide Anti-Patterns

- **Universal Chunk Fallacy**: Assuming one chunk size and strategy works optimally for all document types
- **Boundary Information Loss**: Strict chunk boundaries that split sentences, paragraphs, or code blocks
- **Structure Stripping**: Removing headings, metadata, and document structure from chunks before embedding

---

## 1. One-Chunk-Fits-All

**Category:** Architecture

**Description:** Using the same chunk size and splitting strategy for all document types regardless of content structure.

**Why It Happens:** Simplicity of implementation. A single chunking configuration is easier to deploy and maintain.

**Warning Signs:**
- All documents chunked identically (e.g., fixed 512-token splits)
- Code documentation chunked the same as prose articles
- Retrieval quality varies dramatically by document type

**Why Harmful:** Different document types have different optimal chunk sizes. Fixed-size splitting breaks logical boundaries in structured documents. Semantic chunking may be wasteful for simple prose.

**Consequences:**
- Poor retrieval for specific document types
- Chunks that break mid-paragraph or mid-code-block
- Inconsistent answer quality across document sources

**Alternative:** Use recursive character splitting that adapts to document structure. Consider different strategies per document type: recursive for prose, semantic for technical docs.

**Refactoring Strategy:**
1. Classify documents by type (prose, code, technical, etc.)
2. Test different chunking strategies per type
3. Implement a document-type-aware chunking router

**Detection Checklist:**
- [ ] Are different document types chunked differently?
- [ ] Are chunks evaluated for boundary quality per type?
- [ ] Is the chunking strategy tuned per corpus?

**Related Rules/Skills/Trees:**
- Rule: Adapt Chunking Strategy to Document Type (`04-standardized-knowledge.md:36-37`)

---

## 2. No Overlap

**Category:** Quality

**Description:** Splitting documents into chunks with zero overlap, causing information loss at chunk boundaries.

**Why It Happens:** Overlap increases index size and feels redundant. Teams optimize for storage efficiency over retrieval quality.

**Warning Signs:**
- Zero overlap configured in splitter
- Queries about content near boundaries return no results
- Chunks end or begin mid-sentence

**Why Harmful:** Content at chunk boundaries (especially key terms, names, or context) is lost entirely. A query that spans the boundary will not match either adjacent chunk.

**Consequences:**
- Retrieval gaps for content near chunk boundaries
- Missed relevant results for queries spanning splits
- Wasted storage isn't the real cost — missed retrieval is

**Alternative:** Configure 10-20% chunk overlap to ensure boundary content is captured in both adjacent chunks.

**Refactoring Strategy:**
1. Set overlap to 10-20% of chunk size
2. Verify boundary content appears in both chunks
3. Verify index size increase is acceptable

**Detection Checklist:**
- [ ] Is chunk overlap configured (>0%)?
- [ ] Are chunk boundaries reviewed for content loss?
- [ ] Do queries near boundaries still retrieve relevant chunks?

**Related Rules/Skills/Trees:**
- Rule: Configure 10-20% Chunk Overlap (`04-standardized-knowledge.md:38-39`)

---

## 3. Over-Chunking

**Category:** Performance

**Description:** Using very small chunks (<256 tokens) that lack sufficient context for the LLM to answer questions.

**Why It Happens:** Smaller chunks improve retrieval precision metrics. Teams optimize for precision without considering whether the LLM has enough context to synthesize an answer.

**Warning Signs:**
- Average chunk size <200 tokens
- Retrieval precision is high but answer quality is poor
- LLM frequently lacks sufficient context to answer

**Why Harmful:** Small chunks may be relevant but lack surrounding context (introductory sentences, definitions, explanations) needed for the LLM to produce a complete answer.

**Consequences:**
- High retrieval precision but low answer quality
- LLM produces incomplete or incorrect answers from partial context
- More chunks needed per query, increasing API costs

**Alternative:** Use moderate chunk sizes (256-1024 tokens). Consider hierarchical chunking — index small chunks for retrieval, retrieve parent section for LLM context.

**Refactoring Strategy:**
1. Benchmark chunk sizes: 256, 512, 768, 1024
2. Evaluate both retrieval recall and answer quality
3. Use hierarchical chunking (index small, retrieve large) for best of both

**Detection Checklist:**
- [ ] Is chunk size tested against answer quality?
- [ ] Are chunks large enough for the LLM to understand context?
- [ ] Is hierarchical chunking considered for variable context needs?

**Related Rules/Skills/Trees:**
- Rule: Balance Chunk Size Between Precision and Context (`04-standardized-knowledge.md:50-51`)

---

## 4. Ignoring Document Structure

**Category:** Quality

**Description:** Stripping headings, metadata, and document structure from chunks before embedding, losing critical context for retrieval.

**Why It Happens:** Simpler text extraction. Teams split text without preserving structural elements that aid semantic understanding.

**Warning Signs:**
- Chunks contain raw text without section headings
- No document metadata (title, source, page) attached to chunks
- Fixed-size splitting breaks across section boundaries

**Why Harmful:** Headings and structure provide essential semantic context. A paragraph about "pricing" under "Enterprise Plan" is meaningless without that heading context. Chunks without metadata cannot be cited.

**Consequences:**
- Poor retrieval for queries needing structural context
- Chunks from different sections appear identical semantically
- Cannot provide source citations in answers

**Alternative:** Use document-aware splitting that preserves headings, structure, and metadata. Always attach source metadata to each chunk.

**Refactoring Strategy:**
1. Extract document structure before chunking
2. Prepend section hierarchy to each chunk (e.g., "Section > Subsection > Content")
3. Attach metadata (title, source, page, section) to every chunk

**Detection Checklist:**
- [ ] Do chunks include section/heading context?
- [ ] Is source metadata preserved per chunk?
- [ ] Are document structure boundaries respected during splitting?

**Related Rules/Skills/Trees:**
- Rule: Preserve Document Structure in Chunks (`04-standardized-knowledge.md:37-39`)
