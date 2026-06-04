# Anti-Patterns: Vector Search Performance

## Metadata

| | |
|---|---|
| **KU ID** | ku-13 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Vector Search Performance |
| **Source** | pgvector / Qdrant / Industry |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Tuning Without Recall vs Latency Benchmarks | Performance | Medium |
| 2 | Default ef_search (Not Tuned) | Performance | Medium |
| 3 | No Quantization for Datasets Exceeding RAM | Scalability | High |
| 4 | Underestimating Memory for HNSW Overhead | Scalability | High |

## Repository-Wide Anti-Patterns

- **Guesswork Tuning**: Changing ef_search/probes arbitrarily without benchmarking recall
- **RAM Sizing naivety**: Provisioning for raw vector size only, ignoring HNSW index overhead
- **Quantization Avoidance**: Running large datasets at full precision, causing OOM

---

## 1. Tuning Without Recall vs Latency Benchmarks

**Category:** Performance

**Description:** Changing vector search parameters (ef_search, probes, m) without measuring recall impact, tuning blindly.

**Why It Happens:** Developers adjust parameters attempting to improve speed or quality without a benchmark framework.

**Warning Signs:**
- ef_search changed without recall measurement
- No recall baseline exists
- Team can't say whether changes improved or degraded search

**Why Harmful:** Parameter tuning without benchmarks is guesswork. Changes may degrade recall without detection.

**Consequences:**
- Recall degradation goes unnoticed
- Time wasted on ineffective tuning

**Alternative:** Always benchmark recall vs latency before and after parameter changes.

**Refactoring Strategy:**
1. Establish recall baseline with current parameters
2. Test new parameters
3. Compare recall and latency
4. Only adopt if tradeoff is favorable

**Detection Checklist:**
- [ ] Are parameter changes guided by benchmarks?
- [ ] Is recall measured before/after tuning?

**Related Rules/Skills/Trees:**
- Rule: Benchmark Recall vs Latency Before Tuning (`05-rules.md:1-35`)

---

## 2. Default ef_search (Not Tuned)

**Category:** Performance

**Description:** Using the default HNSW ef_search value without tuning for the specific recall requirement.

**Why It Happens:** ef_search defaults are safe. Developers deploy and never revisit.

**Warning Signs:**
- No ef_search configuration in query code
- ef_search not set at session/query level
- Recall could be higher but latency is acceptable

**Why Harmful:** Default ef_search is conservative. Increasing it often improves recall significantly with minimal latency impact.

**Consequences:**
- 5-10% lower recall than achievable

**Alternative:** Tune ef_search per query type (high recall vs high throughput).

**Refactoring Strategy:**
1. Benchmark recall at ef_search 50, 100, 200, 400
2. Set ef_search per query type
3. Verify improvement

**Detection Checklist:**
- [ ] Is ef_search explicitly configured (not default)?
- [ ] Was recall benchmarked at chosen value?

**Related Rules/Skills/Trees:**
- Rule: Tune ef_search as Primary HNSW Lever (`05-rules.md:37-67`)

---

## 3. No Quantization for Datasets Exceeding RAM

**Category:** Scalability

**Description:** Storing all vectors at full precision (float32) when the dataset exceeds available RAM, causing OOM or swapping.

**Why It Happens:** Quantization is an explicit step. Teams don't calculate memory requirements before production scale.

**Warning Signs:**
- Dataset memory > available RAM
- OOM events under load
- Swapping during queries
- No quantization enabled

**Why Harmful:** OOM crashes cause production outages. Swapping increases query latency 100-1000×.

**Consequences:**
- Production outages from OOM
- Extreme latency from swapping

**Alternative:** Enable quantization (scalar, binary) to fit vectors in RAM.

**Refactoring Strategy:**
1. Calculate vector memory: rows × dims × bytes
2. Enable appropriate quantization
3. Verify recall vs memory tradeoff

**Detection Checklist:**
- [ ] Does dataset fit in RAM?
- [ ] Is quantization enabled if not?

**Related Rules/Skills/Trees:**
- Rule: Use Quantization to Reduce Memory Footprint (`05-rules.md:69-99`)

---

## 4. Underestimating Memory for HNSW Overhead

**Category:** Scalability

**Description:** Sizing RAM for raw vector storage only without accounting for HNSW index structures (1.5-2× overhead).

**Why It Happens:** Raw vector size calculation is straightforward. Developers don't account for HNSW's graph structures.

**Warning Signs:**
- Host RAM = raw vector size with no headroom
- OOM during index build
- OOM under query load
- No HNSW overhead calculation

**Why Harmful:** HNSW builds a multi-layer graph that requires additional memory equal to 50-100% of vector storage.

**Consequences:**
- OOM during index build or peak query load
- Emergency host resizing

**Alternative:** Calculate HNSW memory as 1.5-2× raw vector size. Add 20% safety margin.

**Refactoring Strategy:**
1. Calculate: total_memory = vectors (1.5 to 2×) × safety_margin (1.2)
2. Provision accordingly
3. Monitor actual memory usage

**Detection Checklist:**
- [ ] Was HNSW overhead included in RAM sizing?
- [ ] Is actual memory usage monitored?

**Related Rules/Skills/Trees:**
- Rule: Profile Memory for Vectors Plus Index Overhead (`05-rules.md:101-129`)
