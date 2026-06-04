# Anti-Patterns: Vector Search Benchmarking

## Metadata

| | |
|---|---|
| **KU ID** | ku-14 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Vector Search Benchmarking |
| **Source** | Industry / Academic |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Synthetic Data for Benchmarks | Testing | High |
| 2 | Average-Only Latency Reporting | Performance | Medium |
| 3 | Single Configuration Testing | Testing | Medium |
| 4 | Ignoring Index Build Time | Testing | Medium |

## Repository-Wide Anti-Patterns

- **Synthetic Data Fallacy**: Benchmarking with random vectors and assuming results apply to real data
- **Average-Only Metrics**: Reporting mean latency without P95/P99, missing tail latency issues
- **One-Shot Benchmark**: Testing one configuration and deploying, never exploring alternatives

---

## 1. Synthetic Data for Benchmarks

**Category:** Testing

**Description:** Using randomly generated vectors instead of production-representative embeddings for performance and recall benchmarks.

**Why It Happens:** Real embeddings require setting up an embedding pipeline. Random vectors are trivial to generate and seem "close enough" for performance testing.

**Warning Signs:**
- Benchmark vectors are `np.random.rand()`
- No real embedding data used
- Results differ dramatically in production

**Why Harmful:** Random vectors have uniform distribution, while real embeddings have clustered distributions. Recall benchmarks on random data are meaningless — ANN indexes perform differently on real data distributions.

**Consequences:**
- Wrong index type selection
- Misleading recall estimates
- Incorrect capacity planning

**Alternative:** Use production embeddings or representative subset. For pre-production, use embeddings from similar domains.

**Refactoring Strategy:**
1. Export a sample of production embeddings
2. Re-run benchmarks with real data
3. Compare results with synthetic benchmarks

**Detection Checklist:**
- [ ] Are benchmarks using production-representative data?
- [ ] Are random vectors avoided?

**Related Rules/Skills/Trees:**
- Rule: Use Production-Representative Data for Benchmarks (`05-rules.md:1-31`)

---

## 2. Average-Only Latency Reporting

**Category:** Performance

**Description:** Reporting only average query latency without P95 or P99, hiding tail latency that affects user experience.

**Why It Happens:** Average is the simplest metric to compute and report. Many teams don't collect percentile data.

**Warning Signs:**
- Benchmarks report only "avg: 15ms"
- No P95 or P99 data collected
- Production monitoring shows occasional slow queries

**Why Harmful:** Average latency hides variability. A system with 10ms average but 500ms P99 provides poor UX for every 1 in 100 queries.

**Consequences:**
- Deploying systems with unacceptable tail latency
- User complaints about intermittent slowness

**Alternative:** Always measure and report P50, P95, and P99 latency.

**Refactoring Strategy:**
1. Add percentile collection to benchmark script
2. Report P50/P95/P99 alongside average
3. Set P99 latency targets

**Detection Checklist:**
- [ ] Are P95/P99 latencies measured?
- [ ] Are latency percentiles reported?

**Related Rules/Skills/Trees:**
- Rule: Measure P95 Latency, Not Just Average (`05-rules.md:33-64`)
