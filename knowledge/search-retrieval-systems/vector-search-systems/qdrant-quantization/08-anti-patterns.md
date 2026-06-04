# Anti-Patterns: Qdrant Quantization

## Metadata

| | |
|---|---|
| **KU ID** | K051 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Qdrant Quantization |
| **Source** | Qdrant Docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Binary Quantization as First Choice | Performance | Medium |
| 2 | No Rescoring with Quantized Search | Performance | Medium |
| 3 | Unbenchmarked Quantization Impact | Testing | High |
| 4 | Uniform Quantization for Hot and Cold Data | Architecture | Medium |

## Repository-Wide Anti-Patterns

- **Quantization-by-Default**: Applying quantization to all collections regardless of dataset size or memory constraints
- **Rescoring-Naive Search**: Using quantized search without rescoring, accepting unnecessary recall loss
- **One-Size Quantization**: Using the same quantization strategy for all data regardless of access frequency

---

## 1. Binary Quantization as First Choice

**Category:** Performance

**Description:** Jumping to binary quantization (32× compression, 5-15% recall loss) without evaluating scalar quantization (4× compression, <2% recall loss).

**Why It Happens:** Binary quantization offers the most dramatic compression. Teams reach for the most aggressive option to maximize memory savings. The recall difference between scalar and binary is not evaluated.

**Warning Signs:**
- Binary quantization configured without scalar evaluation
- Memory savings exceed requirements (4× would suffice)
- Recall loss is noticeable (users complain about missing results)
- No quantization strategy comparison exists
- Dataset size doesn't require 32× compression

**Why Harmful:** Scalar quantization provides 4× memory reduction with <2% recall loss — an excellent tradeoff for most deployments. Binary quantization sacrifices 5-15% recall for 32× compression. If 4× compression is sufficient, scalar quantization is strictly better in recall preservation.

**Consequences:**
- 5-15% unnecessary recall loss when scalar would suffice
- More complex rescoring needed to recover recall
- Higher engineering effort for marginal compression benefit
- Potential user-facing quality regression

**Alternative:** Start with scalar quantization. Only evaluate binary or product quantization if scalar's 4× compression is insufficient for memory constraints.

**Refactoring Strategy:**
1. Change quantization config to scalar (int8)
2. Benchmark recall against float32 baseline
3. If recall is acceptable (<2% loss), keep scalar
4. Only switch to binary if memory still constrained

**Detection Checklist:**
- [ ] Was scalar quantization evaluated before binary?
- [ ] Is the quantization level appropriate for memory requirements?
- [ ] Is recall loss measured and acceptable?
- [ ] Is quantization strategy documented?

**Related Rules/Skills/Trees:**
- Rule: Start with Scalar Quantization (`05-rules.md:1-31`)
- Skill: Configure and Implement Qdrant Quantization (`06-skills.md:1-78`)

---

## 2. No Rescoring with Quantized Search

**Category:** Performance

**Description:** Using quantized vectors for final search ranking without enabling rescoring, losing recall that could be recovered by re-ranking top results with original vectors.

**Why It Happens:** Rescoring is an optional parameter that requires explicit configuration. Developers enable quantization but skip the rescoring configuration. The impact on recall is not immediately visible.

**Warning Signs:**
- `rescore` is not configured or is set to `false`
- Quantized recall is significantly below float32 baseline
- Top-K results have visibly lower relevance
- No rescoring parameters in search configuration
- Search quality degraded after quantization was enabled

**Why Harmful:** Quantized vectors lose precision. Rescoring re-ranks the top-K results using original (full-precision) vectors, recovering most of the lost recall. Without rescoring, quantized search returns results based on compressed vectors that may rank less relevant results higher than they should be.

**Consequences:**
- 3-10% lower recall than achievable with rescoring
- Users seeing less relevant results
- Missed opportunity to recover accuracy at minimal latency cost

**Alternative:** Enable rescoring with appropriate oversampling: `rescore: true, oversampling: 2.0`. This re-ranks 2× the final top-K candidates using original vectors.

**Refactoring Strategy:**
1. Enable rescoring in search parameters
2. Set oversampling to 2.0 (retrieve 2× candidates, rescore)
3. Benchmark recall improvement
4. Tune oversampling factor for recall vs latency tradeoff

**Detection Checklist:**
- [ ] Is rescoring enabled for quantized search?
- [ ] Is oversampling configured (minimum 2.0)?
- [ ] Was recall measured before and after rescoring?
- [ ] Is rescoring documented in search configuration?

**Related Rules/Skills/Trees:**
- Rule: Enable Rescoring for Quantized Results (`05-rules.md:33-62`)
- Skill: Configure and Implement Qdrant Quantization (`06-skills.md:1-78`)

---

## 3. Unbenchmarked Quantization Impact

**Category:** Testing

**Description:** Deploying quantization to production without benchmarking the recall impact on the specific dataset, risking undetected search quality degradation.

**Why It Happens:** General documentation states "scalar quantization has <2% recall loss." Teams accept this claim without testing on their specific data. The actual loss varies by embedding distribution and query patterns.

**Warning Signs:**
- Quantization was enabled without a recall benchmark
- No before/after recall comparison exists
- Search quality regression suspected but unmeasured
- Recall impact is assumed, not verified
- No monitoring for quantization-related recall degradation

**Why Harmful:** Quantization impact varies by embedding model and data distribution. Some datasets experience 0.5% recall loss with scalar quantization; others may lose 3-5%. Without benchmarking, a significant quality regression can go undetected until users complain.

**Consequences:**
- 1-5% undetected recall loss
- User-facing search quality regression
- Hard to attribute regression to quantization (no baseline)
- Rollback needed after discover

**Alternative:** Before enabling quantization, benchmark recall@k against float32 baseline on a representative query set. Only deploy if loss is within acceptable threshold.

**Refactoring Strategy:**
1. Collect representative query set from production
2. Run queries without quantization — measure baseline recall
3. Enable quantization — measure recall
4. Calculate recall loss
5. Deploy quantization only if loss < acceptable threshold (typically 2%)
6. Add ongoing recall monitoring

**Detection Checklist:**
- [ ] Was recall benchmarked before enabling quantization?
- [ ] Is the recall loss documented and within acceptable threshold?
- [ ] Are there ongoing quality checks for quantized search?
- [ ] Is there a rollback plan if recall degrades?

**Related Rules/Skills/Trees:**
- Rule: Benchmark Quantization Impact Before Production (`05-rules.md:64-96`)
- Skill: Configure and Implement Qdrant Quantization (`06-skills.md:1-78`)

---

## 4. Uniform Quantization for Hot and Cold Data

**Category:** Architecture

**Description:** Applying the same quantization level to all data regardless of access frequency, wasting recall on frequently queried hot data or wasting memory on rarely queried cold data.

**Why It Happens:** Quantization is configured at the collection level in Qdrant, making uniform application the simplest approach. Data access patterns (hot vs cold) are not analyzed before quantization configuration.

**Warning Signs:**
- Same quantization for all data regardless of query frequency
- Frequently queried recent data quantized (unnecessary recall loss)
- Rarely queried historical data at full precision (memory waste)
- No data tiering strategy (hot/warm/cold)
- Access pattern analysis not performed

**Why Harmful:** Recent or popular data (hot) is queried more frequently and benefits from higher recall. Historical or rarely accessed data (cold) can tolerate more compression. Uniform quantization applies the same tradeoff to both — wasting recall on hot data or wasting memory on cold data.

**Consequences:**
- Hot data has lower recall than achievable (if quantized)
- Cold data wastes memory (if full precision)
- Suboptimal memory-recall tradeoff across the dataset
- Higher infrastructure costs from inefficient allocation

**Alternative:** Use a hybrid approach: keep recent/frequently queried vectors at full precision or scalar quantization. Use more aggressive quantization for older/cold data. Qdrant currently applies quantization per-collection — consider multiple collections for hot vs cold data, or segment-based strategies.

**Refactoring Strategy:**
1. Analyze data access patterns (query frequency by recency/popularity)
2. Consider splitting hot and cold data into separate collections
3. Apply lighter quantization (scalar or none) to hot collection
4. Apply heavier quantization (product/binary) to cold collection
5. Route queries to appropriate collection based on context

**Detection Checklist:**
- [ ] Are access patterns analyzed for quantization strategy?
- [ ] Is hot data quantized less aggressively than cold data?
- [ ] Is there a data tiering strategy (hot/warm/cold)?
- [ ] Are query frequencies monitored per data segment?

**Related Rules/Skills/Trees:**
- Rule: Use Hybrid Quantization for Cold vs Hot Data (`05-rules.md:97-126`)
