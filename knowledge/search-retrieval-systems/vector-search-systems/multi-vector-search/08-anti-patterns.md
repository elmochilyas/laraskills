# Anti-Patterns: Multi-Vector Search

## Metadata

| | |
|---|---|
| **KU ID** | ku-10 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Multi-Vector Search |
| **Source** | Academic / Industry |
| **Maturity** | Emerging |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Multi-Vector Before Single-Vector Baseline | Design | High |
| 2 | Ad-Hoc Multi-Vector Without Named Vectors | Framework Usage | Medium |
| 3 | Unbenchmarked Storage Impact | Scalability | Medium |
| 4 | Unjustified Complexity Over Single-Vector | Architecture | Medium |

## Repository-Wide Anti-Patterns

- **Premature Multi-Vector**: Implementing ColBERT or multi-vector search before proving single-vector is insufficient
- **Flat Data Model for Multi-Vector**: Storing multiple vectors as separate rows/points instead of using named vectors
- **Storage Blindness**: Underestimating the 5-10× storage multiplier of multi-vector over single-vector

---

## 1. Multi-Vector Before Single-Vector Baseline

**Category:** Design

**Description:** Implementing multi-vector search (ColBERT, named vectors, per-chunk vectors) as the first retrieval approach without establishing a single-vector baseline.

**Why It Happens:** Multi-vector search promises higher precision for long documents. Teams targeting high-quality retrieval may jump to multi-vector without trying simpler approaches. The complexity is assumed necessary for quality.

**Warning Signs:**
- Multi-vector implementation before any single-vector search exists
- No recall benchmark for single-vector baseline
- Team cannot answer "how much does multi-vector improve over single-vector?"
- Complex infrastructure (ColBERT server, chunking pipeline) built before proving need
- Single-vector search considered "not good enough" without evidence

**Why Harmful:** Multi-vector adds significant complexity: multiple embeddings per document, multiple storage, more complex query logic, and higher latency. For many applications, single-vector search with good chunking provides equivalent quality. Without a baseline, the investment in multi-vector may be entirely wasted.

**Consequences:**
- Wasted engineering time on complex implementation
- Higher infrastructure costs (5-10× storage, slower queries)
- No evidence that the complexity improves results
- Difficult debugging from multi-vector pipeline complexity

**Alternative:** Implement single-vector search first. Benchmark quality. Only adopt multi-vector if single-vector is insufficient and multi-vector shows measurable improvement.

**Refactoring Strategy:**
1. Implement single-vector baseline (one embedding per document)
2. Benchmark recall@10 with production queries
3. If quality is acceptable, stop there
4. If not, implement multi-vector and compare recall improvement
5. Only deploy multi-vector if improvement justifies cost

**Detection Checklist:**
- [ ] Was single-vector search evaluated before multi-vector?
- [ ] Is the quality improvement of multi-vector over single-vector quantified?
- [ ] Is the improvement worth the additional complexity and cost?
- [ ] Is there a rollback path to single-vector if needed?

**Related Rules/Skills/Trees:**
- Rule: Start with Single-Vector Before Multi-Vector (`05-rules.md:1-31`)
- Rule: Benchmark Multi-Vector Against Single-Vector Baseline (`05-rules.md:69-100`)

---

## 2. Ad-Hoc Multi-Vector Without Named Vectors

**Category:** Framework Usage

**Description:** Storing multiple vectors per document as separate database rows/points instead of using the vector store's native multi-vector support (e.g., Qdrant named vectors).

**Why It Happens:** The simplest data model is one row per vector. If a document has 10 chunk vectors, store 10 rows with a document_id reference. Querying requires fetching all chunks then assembling results in application code.

**Warning Signs:**
- Multiple database rows per document for different vectors
- Custom application logic to group vectors back to documents
- Queries return individual chunks, not documents
- No use of vector store's named vectors feature
- Complex JOIN or multi-step queries for document-level results

**Why Harmful:** Ad-hoc multi-vector requires custom grouping logic, duplicated document metadata per vector row, and multi-step querying. Named vectors (Qdrant) or multi-vector collections (Milvus) handle this natively — one point per document with multiple named vectors. Ad-hoc approaches increase code complexity, storage overhead, and query latency.

**Consequences:**
- Custom grouping code that must be maintained
- Duplicated metadata storage per vector row
- Multi-step queries (search chunks → group → rank)
- Harder to filter at document level
- Migration pain when moving to native multi-vector

**Alternative:** Use the vector store's native multi-vector feature. In Qdrant, use named vectors per point. In Milvus, use multi-vector fields per collection.

**Refactoring Strategy:**
1. Identify ad-hoc multi-vector storage pattern
2. Migrate to named vectors (Qdrant) or multi-vector fields (Milvus)
3. Update queries to use native multi-vector search
4. Remove custom grouping logic
5. Verify query latency reduction

**Detection Checklist:**
- [ ] Are named vectors used (if Qdrant) for multi-vector per document?
- [ ] Is each document stored as a single point with multiple named vectors?
- [ ] Is custom grouping logic eliminated?
- [ ] Are queries using the store's multi-vector search API?

**Related Rules/Skills/Trees:**
- Rule: Use Qdrant Named Vectors for Multi-Vector (`05-rules.md:33-67`)

---

## 3. Unbenchmarked Storage Impact

**Category:** Scalability

**Description:** Implementing multi-vector search without calculating the storage multiplier, leading to insufficient resource allocation and unexpected infrastructure costs.

**Why It Happens:** Teams focus on retrieval quality improvement without modeling the storage implications. Multi-vector multiplies the index size by the number of vectors per document (typically 5-10×). This is only discovered when storage limits are hit.

**Warning Signs:**
- Multi-vector implemented but storage estimate not calculated
- Index size unexpectedly 5-10× larger than single-vector
- Storage costs exceed budget
- Index build time much longer than expected
- Production storage limits hit soon after deployment

**Why Harmful:** Multi-vector increases storage linearly with vectors per document. For 10M documents with 10 chunks each, that's 100M vectors — 10× the storage of single-vector. This affects all costs: disk, memory (for index), backup, and transfer. Without pre-calculation, the budget impact is a surprise.

**Consequences:**
- Unexpected infrastructure costs (5-10× estimate)
- Storage limits reached sooner than planned
- Index build times 5-10× longer
- Memory constraints for HNSW indexes
- Emergency budget approval or feature rollback

**Alternative:** Calculate storage requirements before implementing multi-vector: `storage_multiplier = vectors_per_document; estimated_storage = single_vector_storage × storage_multiplier`. Budget accordingly.

**Refactoring Strategy:**
1. Calculate vectors_per_document based on chunking strategy
2. Estimate total storage: single-vector storage × multiplier
3. Compare against current and projected budget
4. If over budget, reconsider chunk size or vector count
5. Document storage estimate in architecture decision record

**Detection Checklist:**
- [ ] Was storage impact calculated before implementing multi-vector?
- [ ] Is the storage multiplier (vectors per document) documented?
- [ ] Are storage costs within budget projections?
- [ ] Is there a plan if storage exceeds initial estimates?

**Related Rules/Skills/Trees:**
- Rule: Plan Storage Requirements for Multi-Vector (`05-rules.md:102-130`)

---

## 4. Unjustified Complexity Over Single-Vector

**Category:** Architecture

**Description:** Continuing to use multi-vector search despite benchmarks showing negligible improvement over single-vector, paying the complexity cost without benefit.

**Why It Happens:** Multi-vector is implemented with significant effort. Teams are reluctant to revert to single-vector even when benchmarks show minimal improvement. The complexity is accepted as "the right way" despite evidence.

**Warning Signs:**
- Multi-vector recall improvement over single-vector is <2%
- Infrastructure complexity is high (ColBERT server, chunking pipeline)
- Indexing pipeline is significantly more complex than single-vector
- Query latency is 2-5× higher than single-vector
- No plan to revert if improvement is insufficient

**Why Harmful:** Multi-vector adds ongoing maintenance burden: chunking logic, multiple embeddings, complex queries, and slower indexing. If the quality improvement is marginal, this complexity is a pure cost with no benefit. The system is harder to debug, maintain, and evolve.

**Consequences:**
- Higher maintenance burden for marginal quality gain
- Slower feature development (complex pipeline to modify)
- Higher infrastructure costs without proportional quality improvement
- Onboarding friction for new developers
- Debugging difficulty from multi-step pipeline

**Alternative:** Revert to single-vector if multi-vector improvement is <5% (or your organization's threshold). Maintain the chunking for single-vector if helpful, but store a single aggregated or representative vector.

**Refactoring Strategy:**
1. Compare recall metrics: single-vector vs multi-vector
2. If improvement < threshold, plan reversion
3. Keep chunking infrastructure (may be useful for display)
4. Store single vector per document (averaged or first chunk)
5. Remove multi-vector query complexity
6. Benchmark to confirm recall is acceptable

**Detection Checklist:**
- [ ] Is multi-vector improvement over single-vector quantified?
- [ ] Is the improvement worth the complexity and cost?
- [ ] Is there a revert-to-single-vector plan?
- [ ] Are ongoing costs tracked against quality metrics?

**Related Rules/Skills/Trees:**
- Rule: Start with Single-Vector Before Multi-Vector (`05-rules.md:1-31`)
- Rule: Benchmark Multi-Vector Against Single-Vector Baseline (`05-rules.md:69-100`)
