# Anti-Patterns: pgvector Binary Quantization + Re-ranking

## Metadata

| | |
|---|---|
| **KU ID** | K047 |
| **Subdomain** | vector-similarity-search |
| **Topic** | pgvector Binary Quantization + Re-ranking |
| **Source** | pgvector Docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Binary-Only Search Without Re-ranking | Performance | High |
| 2 | Applying Binary Quantization Without Model Suitability Test | Testing | High |
| 3 | Skipping halfvec Evaluation Before Binary | Architecture | Medium |
| 4 | Default Binary Query Parameters Without Tuning | Performance | Medium |
| 5 | Binary Quantization for Small Datasets | Architecture | Medium |

## Repository-Wide Anti-Patterns

- **Compression-First Mentality**: Reaching for binary quantization (32× compression) before evaluating halfvec (2×, <1% loss)
- **Quantize-Once Assumption**: Applying binary quantization at ingest and treating it as the sole representation, discarding original float32
- **Recall Slippage**: Deploying binary quantization without measuring recall against the original float32 baseline

---

## 1. Binary-Only Search Without Re-ranking

**Category:** Performance

**Description:** Using binary quantized vectors as the sole representation for search results, skipping re-ranking with the original float32 vectors and accepting significant recall loss.

**Why It Happens:** Binary quantization provides dramatic storage savings (32×), and developers may assume the resulting search quality is "good enough." The re-ranking step adds implementation complexity and latency. The temptation to skip it is strong when storage pressure is the primary motivation for quantization.

**Warning Signs:**
- Search results are returned directly from the binary HNSW index
- No float32 re-ranking step exists in the query pipeline
- Recall is 5-15% lower than the float32 baseline
- Users report missing relevant results
- Only binary vectors are stored (original float32 discarded)

**Why Harmful:** Binary quantization converts each float32 dimension to a single sign bit, losing magnitude and fine-grained distance information. This reduces recall by 5-15% compared to float32 search. Re-ranking with original float32 vectors for the top-K candidates (typically 100-200) recovers most of this loss within 10-50ms additional latency. Without re-ranking, the recall loss is permanent and significant.

**Consequences:**
- 5-15% lower recall than achievable with re-ranking
- Users miss relevant results in every query
- Storage savings come at unacceptable accuracy cost
- Hard to diagnose: results are "in the right neighborhood" but wrong specifics
- False conclusion that binary quantization is "too lossy"

**Alternative:** Always implement a two-stage pipeline: binary HNSW for fast candidate retrieval (top-K, K=100-200), followed by re-ranking with original float32 vectors for final top-N results (N=10-20).

**Refactoring Strategy:**
1. Add a re-ranking step that retrieves original float32 for binary ANN candidates
2. Set K=100 for candidate retrieval (tunable based on recall requirements)
3. Re-rank candidates using `<=>` for cosine distance
4. Benchmark recall improvement (binary-only vs binary+re-rank vs float32)
5. Document the re-ranking pipeline and parameter choices

**Detection Checklist:**
- [ ] Is there a re-ranking step after binary ANN candidate retrieval?
- [ ] Are original float32 vectors retained for re-ranking?
- [ ] Is recall measured against float32 baseline?
- [ ] Is the candidate count (K) tuned for recall vs latency?

**Related Rules/Skills/Trees:**
- Rule: Always Use Re-Ranking with Binary Quantization (`05-rules.md:1-36`)
- Skill: Configure and Implement Pgvector Binary Quantization (`06-skills.md:1-78`)

---

## 2. Applying Binary Quantization Without Model Suitability Test

**Category:** Testing

**Description:** Deploying binary quantization without first testing whether the specific embedding model produces signed values suitable for binary representation.

**Why It Happens:** Binary quantization works by converting each dimension to 1 if positive, 0 if negative. Some embedding models produce all-positive or narrowly distributed values where this sign-based threshold loses most information. Teams assume all models are equally suitable and skip the suitability test.

**Warning Signs:**
- Binary quantization recall is significantly worse than expected (>>15% loss)
- Embedding values are primarily positive (few negative dimensions)
- Embedding model documentation does not mention binary quantization
- No pre-deployment test compared binary+re-rank against float32 baseline
- Binary search returns visibly poor results during development

**Why Harmful:** Binary quantization's 1-bit per dimension encoding relies on the sign distribution of the embedding values. Models with mean-centered outputs (roughly equal positive and negative values) preserve more information under binary encoding. Models with skewed distributions (mostly positive or narrowly clustered) lose much more information, sometimes making binary search unusable.

**Consequences:**
- 20-40% recall loss for unsuitable embedding models
- Complete loss of search quality for some model types
- Wasted engineering effort implementing binary pipeline for unsuitable model
- Emergency rollback to float32 after production quality issues
- Higher than expected latency from re-ranking not recovering recall

**Alternative:** Before deploying binary quantization, benchmark recall against float32 baseline on your specific embedding model. If recall loss exceeds acceptable threshold (>2-5% after re-ranking), use halfvec instead.

**Refactoring Strategy:**
1. Benchmark float32 recall with production queries
2. Implement binary+re-rank pipeline on staging
3. Compare recall: float32 vs binary+re-rank
4. If loss > acceptable threshold, switch to halfvec
5. Document suitability test results per model

**Detection Checklist:**
- [ ] Was binary quantization recall compared against float32 baseline?
- [ ] Is the embedding model known to produce suitable signed outputs?
- [ ] Are recall thresholds defined (max acceptable loss)?
- [ ] Is there a documented fallback if binary quantization is unsuitable?

**Related Rules/Skills/Trees:**
- Rule: Test Embedding Models for Binary Suitability (`05-rules.md:38-69`)
- Skill: Configure and Implement Pgvector Binary Quantization (`06-skills.md:1-78`)

---

## 3. Skipping halfvec Evaluation Before Binary

**Category:** Architecture

**Description:** Jumping directly to binary quantization (32× compression, 5-15% recall loss) without evaluating halfvec (2× compression, <1% recall loss) as a less aggressive optimization.

**Why It Happens:** Binary quantization offers dramatically more compression (32× vs 2×), which seems like the "best" optimization. Storage pressure drives teams toward the most aggressive option. The significant recall difference (halfvec <1% vs binary 5-15%) is underappreciated until production.

**Warning Signs:**
- Storage optimization went straight to binary without halfvec evaluation
- Recall loss is higher than acceptable but compression is more than needed
- Actual storage requirements would have been met by 2× compression
- Memory utilization is well within budget (halfvec would have sufficed)
- No document evaluating halfvec as an intermediate option

**Why Harmful:** halfvec (float16) provides 50% storage savings with typically less than 1% recall loss — an excellent accuracy-to-compression ratio for most models. Binary quantization trades 5-15% recall for 32× compression, which is only necessary when memory is extremely constrained (e.g., >10M vectors). Skipping halfvec means accepting unnecessary recall loss when less aggressive compression would have satisfied storage requirements.

**Consequences:**
- 5-15% unnecessary recall loss when halfvec would suffice
- Higher engineering complexity of binary+re-rank pipeline
- Increased query latency from re-ranking step
- Missed opportunity for simpler implementation (halfvec + direct search)
- Potential user-facing quality regression

**Alternative:** Evaluate halfvec before binary quantization. If 2× compression provides adequate memory savings, use halfvec directly. Only use binary quantization when halfvec's 2× compression is insufficient.

**Refactoring Strategy:**
1. Determine actual storage/memory requirements
2. Test halfvec recall against float32 baseline
3. If halfvec loss is acceptable (<1%) and storage requirement is met, switch to halfvec
4. If halfvec is insufficient, continue with binary+re-rank
5. Document the evaluation process

**Detection Checklist:**
- [ ] Was halfvec evaluated before binary quantization?
- [ ] Is the recall loss of halfvec (<1%) acceptable for the application?
- [ ] Are actual storage requirements documented?
- [ ] Is the compression choice justified by measured requirements?

**Related Rules/Skills/Trees:**
- Rule: Consider halfvec Before Binary Quantization (`05-rules.md:101-131`)
- Skill: Configure and Implement Pgvector Binary Quantization (`06-skills.md:1-78`)

---

## 4. Default Binary Query Parameters Without Tuning

**Category:** Performance

**Description:** Using default binary quantization parameters (`ef_search`, `binary_quantization.rescore`) without tuning for the specific dataset's recall and latency requirements.

**Why It Happens:** Binary quantization introduces new parameters that are unfamiliar to developers (binary_quantization.ef_search, binary_quantization.rescore). Default values are used because the parameters seem obscure. The impact of these parameters on recall is not immediately visible.

**Warning Signs:**
- No `binary_quantization` parameters are configured explicitly
- ef_search for binary HNSW uses the float32 default
- rescore value is left at default without evaluation
- Recall is lower than expected but parameter tuning has not been attempted
- No benchmarks exist for different binary parameter settings

**Why Harmful:** Binary HNSW has different optimal parameters than float32 HNSW because binary distance computation is faster and the index structure differs. The default ef_search may retrieve too few candidates for adequate recall after re-ranking. The rescore parameter controls how many candidates are re-ranked with float32 — too few loses recall, too many increases latency unnecessarily.

**Consequences:**
- Lower recall than achievable with tuned parameters
- Higher latency than necessary from too many re-ranked candidates
- Missed recall-latency sweet spot for binary quantization
- Inconsistent performance across different dataset sizes
- Unnecessary compute from suboptimal parameter choices

**Alternative:** Tune `hnsw.ef_search` (candidate retrieval breadth) and `binary_quantization.rescore` (number of re-ranked candidates) based on recall benchmarks. Start with ef_search=200, rescore=50, and adjust based on measured recall.

**Refactoring Strategy:**
1. Benchmark recall at ef_search values 50, 100, 200, 400
2. Benchmark recall at rescore values 20, 50, 100, 200
3. Choose the combination that meets recall requirements at acceptable latency
4. Set parameters at session level: SET hnsw.ef_search = N; SET binary_quantization.rescore = M;
5. Document chosen values and expected recall

**Detection Checklist:**
- [ ] Are binary query parameters explicitly configured (not defaults)?
- [ ] Was ef_search tuned for binary HNSW (not copied from float32)?
- [ ] Was rescore tuned based on recall vs latency benchmark?
- [ ] Are benchmarks repeatable when dataset size changes?

**Related Rules/Skills/Trees:**
- Rule: Tune Binary Query Parameters (`05-rules.md:71-100`)
- Skill: Optimize and Monitor Pgvector Binary Quantization (`06-skills.md:82-158`)

---

## 5. Binary Quantization for Small Datasets

**Category:** Architecture

**Description:** Applying binary quantization to datasets under 1M vectors where float32 or halfvec storage is well within available memory, adding unnecessary complexity.

**Why It Happens:** Binary quantization is an interesting optimization technique, and developers may adopt it proactively or prematurely. Documentation and examples make it seem like a standard best practice rather than a specific solution for memory-constrained large-scale deployments.

**Warning Signs:**
- Dataset has fewer than 1M vectors
- Memory utilization is below 50% with float32 storage
- Binary quantization was added "because it's better" without data-driven justification
- Engineering effort for binary+re-rank pipeline exceeds the storage cost savings
- Re-ranking latency is considered a problem for a small dataset

**Why Harmful:** Binary quantization adds significant architectural complexity: separate binary column, two-stage query pipeline (binary ANN + float32 re-rank), additional parameter tuning, and ongoing maintenance. For small datasets where float32 or halfvec handles storage comfortably, this complexity is wasted effort. The re-ranking step adds latency without benefit, and the storage savings are negligible in absolute terms.

**Consequences:**
- Unnecessary architectural complexity for small datasets
- Added query latency from re-ranking step with no benefit
- Engineering time spent implementing and maintaining binary pipeline
- Higher cognitive load for team maintaining vector search infrastructure
- Increased surface area for bugs and misconfigurations

**Alternative:** Use float32 for datasets under 1M vectors. Use halfvec (2× compression, <1% loss) for datasets under 10M vectors. Reserve binary quantization for datasets exceeding 10M vectors where memory is the primary constraint.

**Refactoring Strategy:**
1. Measure actual memory utilization with float32 storage
2. If memory is well within budget, drop binary column and use float32 directly
3. If moderate compression is needed, evaluate halfvec
4. Remove binary quantization pipeline and associated parameters
5. Simplify query code to single-stage float32 or halfvec search

**Detection Checklist:**
- [ ] Is the dataset size justified for binary quantization (>10M vectors)?
- [ ] Is memory utilization actually constrained?
- [ ] Was halfvec evaluated as a simpler alternative?
- [ ] Is the complexity of binary+re-rank justified by storage savings?

**Related Rules/Skills/Trees:**
- Skill: Configure and Implement Pgvector Binary Quantization (`06-skills.md:1-78`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)
