# Anti-Patterns: pgvector Half-Precision / Binary / Sparse Vectors

## Metadata

| | |
|---|---|
| **KU ID** | K044 |
| **Subdomain** | vector-similarity-search |
| **Topic** | pgvector Half-Precision / Binary / Sparse Vectors |
| **Source** | pgvector Docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Deploying Reduced-Precision Without Accuracy Benchmark | Testing | High |
| 2 | Jumping to Binary Without halfvec Evaluation | Architecture | Medium |
| 3 | Direct Reduced-Precision Results Without Re-ranking | Performance | Medium |
| 4 | Mismatched Distance Function for Vector Type | Design | High |
| 5 | Using Float32 for Large Datasets Without Optimization | Scalability | Medium |

## Repository-Wide Anti-Patterns

- **Maximum Precision Fallacy**: Using float32 exclusively even on datasets where halfvec provides equivalent recall at half the storage
- **Quantization-by-Habit**: Always using halfvec or binary without verifying that the specific embedding model tolerates reduced precision
- **Storage Blindness**: Not tracking vector storage costs per type, unable to justify precision choices
- **Type-Mismatch Queries**: Using cosine distance on bit vectors (runtime error) or Hamming on float32 vectors

---

## 1. Deploying Reduced-Precision Without Accuracy Benchmark

**Category:** Testing

**Description:** Switching from float32 to halfvec, bit, or sparsevec without benchmarking the recall loss on the specific dataset and embedding model.

**Why It Happens:** Documentation states halfvec has "<1% accuracy loss." Teams accept this general claim without verifying it for their specific embedding model and data distribution. The actual loss varies by model architecture and value distribution — some models lose 3-5% with halfvec, others lose <0.1%.

**Warning Signs:**
- Precision switch was made based on general documentation, not specific benchmark
- No recall comparison exists between float32 and the chosen type
- Users complained about search quality regression after the switch
- Embedding model outputs have unusual value distributions (very narrow, all-positive)
- Team cannot quantify how much recall was lost by the compression

**Why Harmful:** Different embedding models have different tolerance for reduced precision. Some models' outputs have value distributions that quantize cleanly to float16 with negligible loss. Others — particularly those with narrow dynamic ranges or outlier-dependent ranking — may lose 3-5% recall or more. Without benchmarking, this loss is invisible until users report degraded search quality.

**Consequences:**
- 1-5% recall loss that could have been detected pre-deployment
- User-facing search quality regression
- Time wasted debugging "why search got worse" after infrastructure changes
- Rollback to float32 required after discover
- Loss of confidence in storage optimization efforts

**Alternative:** Always benchmark recall of the reduced-precision type against the float32 baseline on production-representative queries before deploying.

**Refactoring Strategy:**
1. Create benchmark comparing float32 vs target type recall
2. Run on staging with production-proportional data
3. If loss > acceptable threshold (typically 1%), reconsider the optimization
4. Consider re-ranking strategy if loss is borderline
5. Document benchmark results for future precision changes

**Detection Checklist:**
- [ ] Was recall benchmarked against float32 before deploying reduced precision?
- [ ] Is the recall loss documented and within acceptable thresholds?
- [ ] Are different embedding models tested separately?
- [ ] Can the benchmark be repeated when data distribution shifts?

**Related Rules/Skills/Trees:**
- Rule: Benchmark Accuracy Loss Before Deploying Reduced-Precision Vectors (`05-rules.md:1-33`)
- Skill: Configure and Implement Pgvector Half-Precision Binary Sparse (`06-skills.md:1-78`)

---

## 2. Jumping to Binary Without halfvec Evaluation

**Category:** Architecture

**Description:** Adopting binary quantization (32× compression, 5-15% recall loss) as the storage optimization strategy without evaluating halfvec (2× compression, <1% recall loss).

**Why It Happens:** Binary quantization offers dramatically more compression, making it seem like the "best" optimization. Storage or memory pressure drives teams toward the most aggressive option. The complexity of binary+re-ranking pipeline and the significant recall difference are underappreciated.

**Warning Signs:**
- Binary quantization was chosen without evaluating halfvec
- Memory utilization shows 2× compression would have been sufficient
- Engineering effort for binary+re-rank significantly exceeds expected storage savings
- Recall loss is a production concern but halfvec was never tested
- No tradeoff analysis comparing halfvec vs binary

**Why Harmful:** halfvec provides 50% storage reduction with typically <1% recall loss and no re-ranking complexity. Binary quantization requires a two-stage pipeline (binary ANN + float32 re-rank), 5-15% recall loss before re-ranking, and ongoing parameter tuning. If 2× compression meets storage requirements, halfvec is strictly superior: simpler, faster, and more accurate.

**Consequences:**
- 5-15% unnecessary recall loss when halfvec would suffice
- Complexity of maintaining binary+re-rank pipeline
- Additional query latency from re-ranking step
- Engineering time implementing and debugging binary pipeline
- Potential production quality issues from binary recall loss

**Alternative:** Evaluate halfvec before binary quantization. Use halfvec directly if 2× compression provides adequate storage savings. Reserve binary quantization for datasets where halfvec's 2× compression is insufficient.

**Refactoring Strategy:**
1. Calculate actual storage/memory requirements
2. Test halfvec recall against float32 baseline
3. If halfvec meets requirements (<1% loss, sufficient compression), switch to halfvec
4. Only adopt binary if halfvec compression is inadequate
5. Document the evaluation with recall and storage numbers

**Detection Checklist:**
- [ ] Was halfvec evaluated as an intermediate compression option?
- [ ] Is halfvec's recall loss (<1%) acceptable?
- [ ] Does halfvec provide sufficient compression for storage requirements?
- [ ] Is the binary quantization decision justified by data?

**Related Rules/Skills/Trees:**
- Rule: Use halfvec as Default Storage Optimization (`05-rules.md:35-65`)
- Rule: Consider halfvec Before Binary Quantization (`pgvector-binary-quantization/05-rules.md:101-131`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

---

## 3. Direct Reduced-Precision Results Without Re-ranking

**Category:** Performance

**Description:** Using compressed vectors (halfvec or binary) directly for final search results without re-ranking with original float32, accepting unnecessary accuracy loss.

**Why It Happens:** Simplest implementation returns compressed-vector results directly. The re-ranking step adds latency and code complexity. Developers may not realize that compressed vectors lose accuracy and that re-ranking recovers most of it.

**Warning Signs:**
- Query results come directly from the compressed vector index
- No float32 re-ranking step exists in the pipeline
- Recall is below float32 baseline but no re-ranking is implemented
- Team believes compressed vectors are "accurate enough"
- Re-ranking is considered "too complex" or "too slow"

**Why Harmful:** Even halfvec, which preserves accuracy well for ranking, loses some information. Returning compressed-vector results directly means accepting this loss permanently. Re-ranking with original float32 for the top-K candidates (typically K=100) adds 10-50ms latency but recovers most of the lost recall, providing float32-level accuracy at near-compressed-vector speed.

**Consequences:**
- 1-5% recall loss that re-ranking would recover
- Users missing relevant results in top-k
- Storage savings come at measurable accuracy cost
- No mechanism to recover accuracy without full float32 migration
- False efficiency when re-ranking would provide strictly better results

**Alternative:** Implement a two-stage pipeline: compressed vector ANN for candidate retrieval (top-K), then re-rank candidates with original float32 vectors for final results. Compressed vectors are used for fast candidate filtering, not for final ranking.

**Refactoring Strategy:**
1. Store both compressed and original float32 vectors
2. Add re-ranking step after ANN candidate retrieval
3. Set K=100 for candidate count, re-rank top 10-20 with float32
4. Benchmark recall improvement (compressed-only vs compressed+re-rank vs float32)
5. Tune K for acceptable recall vs latency tradeoff

**Detection Checklist:**
- [ ] Are final results ranked using re-ranking with original vectors?
- [ ] Is recall measured for compressed-only vs compressed+re-rank?
- [ ] Is the candidate count (K) tuned for the workload?
- [ ] Are original float32 vectors retained for re-ranking?

**Related Rules/Skills/Trees:**
- Rule: Consider Re-ranking with Reduced-Precision Vectors (`05-rules.md:67-101`)
- Skill: Optimize and Monitor Pgvector Half-Precision Binary Sparse (`06-skills.md:82-158`)

---

## 4. Mismatched Distance Function for Vector Type

**Category:** Design

**Description:** Using a distance function that is not supported by the chosen vector type (e.g., cosine on bit vectors, Hamming on halfvec), causing runtime errors.

**Why It Happens:** Developers are familiar with distance operators from float32 vectors and assume they work uniformly across all vector types. The operator-class restrictions per vector type are not immediately obvious. A distance function that works on `vector` may raise an error on `bit` or produce incorrect results on `halfvec`.

**Warning Signs:**
- Runtime errors when querying specific vector types: "operator does not exist"
- Queries work on float32 columns but fail on bit or halfvec columns
- No awareness that different vector types support different distance functions
- Mixing vector types in the same query with the same operator
- Test coverage does not include different vector types

**Why Harmful:** Each pgvector type supports a specific set of distance functions. `bit` vectors only support Hamming and Jaccard. `halfvec` supports cosine, L2, and inner product (same as float32). `sparsevec` only supports L2. Using an unsupported distance function raises a PostgreSQL error that crashes the query and application.

**Consequences:**
- Application errors for vector queries
- Production outages if error surfaces in user-facing search
- Developer confusion about which operators work with which types
- Emergency hotfixes to change operators
- Inconsistent behavior across vector columns with different types

**Alternative:** Document the supported distance functions for each vector type. Use cosine (`<=>`) for halfvec, Hamming (`<->`) for bit, L2 (`<->`) for sparsevec.

**Refactoring Strategy:**
1. Identify vector columns and their types in the schema
2. Audit queries against each type for invalid distance operators
3. Fix mismatches by changing operators to supported ones
4. Add integration tests that verify queries for each vector type
5. Document type-operator compatibility in the codebase

**Detection Checklist:**
- [ ] Are queries using the correct distance function for each vector type?
- [ ] Are bit queries using Hamming or Jaccard (not cosine/L2)?
- [ ] Are sparsevec queries using L2 (not cosine)?
- [ ] Are there integration tests for each vector type's supported operators?

**Related Rules/Skills/Trees:**
- Rule: Match Distance Function to Vector Type (`05-rules.md:103-134`)
- Skill: Configure and Implement Pgvector Half-Precision Binary Sparse (`06-skills.md:1-78`)

---

## 5. Using Float32 for Large Datasets Without Optimization

**Category:** Scalability

**Description:** Storing all vectors as float32 even on large datasets (>10M vectors), incurring unnecessary storage and memory costs when halfvec or binary quantization would provide equivalent results.

**Why It Happens:** Float32 is the default and simplest type to use. Teams do not track storage costs per vector. The decision to optimize is deferred until storage becomes a visible cost problem. Development and early production datasets are small, so the impact of float32 is not apparent.

**Warning Signs:**
- Dataset exceeds 10M vectors with float32 storage
- Vector storage costs are a significant line item in infrastructure budget
- Memory pressure causes HNSW index out-of-memory errors
- No evaluation of reduced-precision types has been conducted
- Team cannot articulate justification for float32 over halfvec

**Why Harmful:** Float32 consumes 4 bytes per dimension — 6KB per 1536-dim vector. For 10M vectors, that's 60GB for vectors alone, plus HNSW graph structures (additional 20-30GB). halfvec reduces to 3GB for vectors, binary quantization to 0.48GB. The accuracy difference is often negligible (halfvec <1% loss, binary+re-rank near-float32 recall). The storage and memory savings directly reduce infrastructure costs.

**Consequences:**
- 2× higher storage costs than necessary
- Higher memory requirements for HNSW indexes (OOM risks)
- Longer backup and restore times
- Higher data transfer costs for replication
- Slower full scans and index builds

**Alternative:** For datasets exceeding 10M vectors, adopt halfvec as the default storage format. Benchmark recall loss against float32. Only retain float32 if recall loss is unacceptable.

**Refactoring Strategy:**
1. Measure vector storage cost and memory utilization
2. Benchmark halfvec recall against float32 with production queries
3. If recall loss is acceptable (<1%), migrate to halfvec
4. Add halfvec column, re-embed or cast existing vectors
5. Rebuild HNSW index on halfvec column
6. Decommission float32 column after verification

**Detection Checklist:**
- [ ] Is vector storage tracked and monitored per type?
- [ ] Is float32 justified over halfvec for the dataset size?
- [ ] Was halfvec recall benchmarked before deciding on float32?
- [ ] Are storage costs reviewed periodically as dataset grows?

**Related Rules/Skills/Trees:**
- Rule: Use halfvec as Default Storage Optimization (`05-rules.md:35-65`)
- Skill: Optimize and Monitor Pgvector Half-Precision Binary Sparse (`06-skills.md:82-158`)
