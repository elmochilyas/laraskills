# Anti-Patterns: pgvector HNSW / IVFFlat Indexing

## Metadata

| | |
|---|---|
| **KU ID** | K042 |
| **Subdomain** | vector-similarity-search |
| **Topic** | pgvector HNSW / IVFFlat Indexing |
| **Source** | pgvector Docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Production IVFFlat Without HNSW Evaluation | Performance | High |
| 2 | Default ef_search Without Workload Tuning | Performance | Medium |
| 3 | Index Degradation Without Rebuild Strategy | Reliability | Medium |
| 4 | Same Index Type for All Workloads | Architecture | Medium |
| 5 | Ignoring Benchmark Step Before Index Choice | Testing | Medium |

## Repository-Wide Anti-Patterns

- **Static Index Mindset**: Creating the index at deploy and never revisiting, even as the dataset grows 10×
- **One-Size-Fits-All Indexing**: Using the same index type and parameters for every vector table regardless of access patterns
- **Prototype Leakage**: Shipping the index from development (IVFFlat, small lists) to production unchanged
- **Memory-Naive Planning**: Assuming HNSW fits in memory without calculating actual graph structure size

---

## 1. Production IVFFlat Without HNSW Evaluation

**Category:** Performance

**Description:** Using IVFFlat indexes in production without evaluating HNSW, accepting permanently lower query performance and recall.

**Why It Happens:** IVFFlat was the only ANN option before pgvector v0.5.0. Documentation examples still show IVFFlat. Teams prototype with IVFFlat and never revisit the choice. The index type is set in a migration and forgotten until performance issues surface.

**Warning Signs:**
- Index type is IVFFlat but dataset is under 10M vectors
- Query latency is higher than expected
- Recall benchmark shows 90-95% (HNSW would achieve 99%+)
- No evaluation ticket or spike exists for HNSW migration
- IVFFlat `lists` parameter was set during initial build and never adjusted

**Why Harmful:** IVFFlat delivers 5-10% lower recall than HNSW at equivalent or worse latency. The faster initial build time (O(n) vs O(n log n)) is a one-time benefit. Every query thereafter pays the penalty of lower recall and slower search. For read-heavy workloads, the decision compounds into significant ongoing quality and performance debt.

**Consequences:**
- Users miss 5-10% of relevant results daily
- 2-10× slower queries than HNSW at equivalent recall
- Higher database CPU consumption per query
- Hard to justify later migration because "it works" — but works suboptimally
- Competition with better search quality wins on user satisfaction

**Alternative:** Use HNSW for production workloads by default. Reserve IVFFlat for prototyping, development environments, or cases where available memory strictly limits HNSW's graph structure.

**Refactoring Strategy:**
1. Benchmark current IVFFlat recall and latency
2. Build HNSW index on staging with production data
3. Compare recall and latency at multiple ef_search values
4. Schedule production migration during maintenance window
5. Drop IVFFlat, create HNSW with tuned parameters
6. Verify improvement in both recall and latency

**Detection Checklist:**
- [ ] Is the production index type deliberately chosen (not default)?
- [ ] If IVFFlat, was HNSW evaluated and rejected for a documented reason?
- [ ] Are recall benchmarks run comparing both index types?
- [ ] Is the index type decision revisited when dataset size changes significantly?

**Related Rules/Skills/Trees:**
- Rule: Default to HNSW for Production (`05-rules.md:1-29`)
- Rule: Benchmark Both Index Types Before Choosing (`05-rules.md:131-162`)
- Skill: Configure and Implement Pgvector Hnsw Ivfflat (`06-skills.md:1-78`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

---

## 2. Default ef_search Without Workload Tuning

**Category:** Performance

**Description:** Using the pgvector default ef_search value (100 in recent versions) without tuning for the application's specific recall and latency requirements.

**Why It Happens:** ef_search is a session-level parameter that defaults to a conservative value. Developers deploy with the default and never consider tuning it. The parameter is not visible in the index creation or migration, making it easy to overlook.

**Warning Signs:**
- No `SET hnsw.ef_search = <value>` in application database configuration
- Same ef_search used for all query types regardless of recall requirements
- Recall measured against exact search is below 98%
- P99 latency is acceptable but recall could be significantly higher with minimal latency increase
- Team cannot articulate the recall-vs-latency tradeoff for their queries

**Why Harmful:** The default ef_search is a general-purpose compromise, not an optimization for any specific workload. For high-recall queries (product search, document retrieval), higher ef_search (200-400) achieves 99%+ recall with modest latency increase. For high-throughput queries (autocomplete, suggestions), lower ef_search (20-40) provides faster responses at acceptable recall. The default satisfies neither extreme optimally.

**Consequences:**
- 2-8% lower recall than achievable with minimal latency cost
- High-throughput queries slower than necessary
- No documented recall baseline — degradation is invisible
- Users find relevant results missing in top-k rankings
- Query latency cannot be traded off against recall for different endpoints

**Alternative:** Categorize query types by recall requirements and set ef_search per type. Benchmark recall at 3-4 ef_search values to choose optimal settings.

**Refactoring Strategy:**
1. Measure current recall with default ef_search against exact search
2. Test ef_search at values 50, 100, 200, 400 with production data
3. Categorize query endpoints by recall vs latency requirements
4. Configure ef_search per category using session-level SET
5. Monitor and re-benchmark periodically

**Detection Checklist:**
- [ ] Is ef_search set per query type (not just default)?
- [ ] Was recall benchmarked at the chosen ef_search value?
- [ ] Are different ef_search values used for different query endpoints?
- [ ] Is ef_search re-evaluated when dataset size changes significantly?

**Related Rules/Skills/Trees:**
- Rule: Tune HNSW ef_search for Recall/Latency Balance (`05-rules.md:31-62`)
- Skill: Optimize and Monitor Pgvector Hnsw Ivfflat (`06-skills.md:82-158`)

---

## 3. Index Degradation Without Rebuild Strategy

**Category:** Reliability

**Description:** Never rebuilding ANN indexes after initial creation, allowing gradual recall degradation as the dataset changes through insertions, updates, and deletions.

**Why It Happens:** Index creation is viewed as a one-time activity. The index continues to return results (no errors), so there is no explicit signal of degradation. The decline is gradual — a few percentage points per month — and invisible without periodic recall benchmarking.

**Warning Signs:**
- Dataset has grown 20%+ since index creation
- No scheduled index rebuild exists in maintenance runbooks
- Search quality has declined since initial deployment (user complaints)
- Recall measured against exact search has dropped significantly
- Newly inserted vectors are rarely returned in top results

**Why Harmful:** HNSW indexes degrade because newly inserted vectors are not perfectly integrated into the graph structure. After 20%+ insertions, the graph becomes suboptimal — some vectors become disconnected from their true nearest neighbors. IVFFlat degrades because k-means centroids shift as the data distribution changes. The degradation is cumulative and accelerates as the data distribution evolves.

**Consequences:**
- Gradual, undetected decline from 99% recall to 80-85% recall
- Users notice search "feels worse" but cannot articulate why
- Emergency rebuild during peak traffic when degradation becomes critical
- Lost trust in search functionality
- Hard to diagnose because there is no error — just consistently worse results

**Alternative:** Schedule periodic index rebuilds based on data change rate. Rebuild HNSW after approximately 20% data change. Monitor recall against exact search and trigger rebuild when it drops below threshold.

**Refactoring Strategy:**
1. Measure current recall against exact search (baseline)
2. Determine acceptable recall threshold (e.g., 95% of exact)
3. Schedule index rebuild in maintenance window
4. Implement automated recall monitoring
5. Add rebuild trigger: when recall drops below threshold
6. Document rebuild process with estimated time

**Detection Checklist:**
- [ ] Is there a scheduled index rebuild based on data change rate?
- [ ] Is recall monitored to detect index degradation?
- [ ] Is the rebuild process documented with estimated time?
- [ ] Are rebuilds scheduled during known maintenance windows?

**Related Rules/Skills/Trees:**
- Rule: Rebuild Indexes After Significant Data Changes (`05-rules.md:99-129`)
- Skill: Optimize and Monitor Pgvector Hnsw Ivfflat (`06-skills.md:82-158`)

---

## 4. Same Index Type for All Workloads

**Category:** Architecture

**Description:** Using the same index type (always HNSW or always IVFFlat) for all vector tables regardless of their read/write ratio, size, and recall requirements.

**Why It Happens:** Teams standardize on one index type for simplicity. The first vector table's choice becomes the organizational default. Different tables with different access patterns all get the same index type without workload-specific analysis.

**Warning Signs:**
- All vector tables use the same index type regardless of access patterns
- Write-heavy tables have HNSW (expensive rebuild on every batch insert)
- Read-only static tables have IVFFlat (suboptimal query performance)
- Small tables (<100K rows) have the same index type as large tables (>10M rows)
- No workload analysis exists for individual vector tables

**Why Harmful:** HNSW and IVFFlat have opposite tradeoff profiles. HNSW excels at query speed with high memory cost; IVFFlat excels at build speed with low memory. Using HNSW on a write-heavy table means frequent expensive rebuilds. Using IVFFlat on a read-heavy table means 2-10× slower queries than necessary. The one-size-fits-all approach leaves significant performance and cost on the table.

**Consequences:**
- Write-heavy tables with HNSW: rebuild costs dominate maintenance windows
- Read-heavy tables with IVFFlat: users experience slower search
- Memory-constrained servers with HNSW: OOM risks
- Small tables with HNSW: over-engineered, no benefit over sequential scan
- No documentation of workload-specific indexing rationale

**Alternative:** Choose index type per table based on: read/write ratio, dataset size, memory available, and recall requirements. Document the rationale for each table's choice.

**Refactoring Strategy:**
1. Profile workload for each vector table (read/write ratio, dataset size)
2. Assess memory availability for HNSW graph structures
3. Choose index type per table based on profile
4. Align rebuild strategies with write frequency
5. Document each decision

**Detection Checklist:**
- [ ] Are different index types considered for different vector tables?
- [ ] Is the index type per table based on workload analysis?
- [ ] Is the memory impact of HNSW calculated per table before choosing?
- [ ] Are read-heavy vs write-heavy tables treated differently?

**Related Rules/Skills/Trees:**
- Rule: Default to HNSW for Production (`05-rules.md:1-29`)
- Rule: Use IVFFlat for Bulk Imports (`05-rules.md:64-97`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

---

## 5. Ignoring Benchmark Step Before Index Choice

**Category:** Testing

**Description:** Choosing HNSW or IVFFlat based on general guidance or habit without benchmarking both options with the specific dataset, query distribution, and hardware.

**Why It Happens:** General guidance ("HNSW is better for production") is treated as an absolute rule. The effort required to benchmark both index types is perceived as unnecessary or deferrable. Development datasets are too small to reveal meaningful differences, so the choice seems inconsequential until production.

**Warning Signs:**
- No benchmark comparing HNSW and IVFFlat exists for the application
- Index type choice rationale is "best practice" rather than "best for our data"
- Team cannot provide recall or QPS numbers for the chosen index type
- The index decision was made early in development and never revisited
- Production performance issues are discovered after deploy, not before

**Why Harmful:** General guidance is a starting point, not a conclusion. Your specific data dimensionality, distribution, query patterns, and hardware may favor one index type over the other differently than the average case. Deploying without benchmarking risks accepting suboptimal performance indefinitely — the index type cannot be changed without a maintenance window and index rebuild.

**Consequences:**
- Permanent suboptimal recall or latency from a wrong default choice
- Poor QPS under production load
- Inability to diagnose whether the index choice is the bottleneck
- Benchmark must be done under emergency (production fire) rather than proactively
- Missed opportunity to optimize for your specific workload

**Alternative:** Before committing to an index type, build both HNSW and IVFFlat indexes on a staging environment with production-proportional data. Measure recall@10 and queries-per-second for both. Choose based on measured data, not general guidance.

**Refactoring Strategy:**
1. Set up staging environment with production-proportional data
2. Build both HNSW and IVFFlat indexes
3. Benchmark recall and QPS for each at multiple parameter settings
4. Document results and choose the index type that best meets requirements
5. For existing deployments, run the same benchmark to validate or reconsider current choice

**Detection Checklist:**
- [ ] Were both index types benchmarked before production choice?
- [ ] Does the benchmark use production-proportional data (size, dimensionality)?
- [ ] Are recall and QPS measured (not just latency)?
- [ ] Is the benchmark repeatable for when data size changes significantly?

**Related Rules/Skills/Trees:**
- Rule: Benchmark Both Index Types Before Choosing (`05-rules.md:131-162`)
- Skill: Configure and Implement Pgvector Hnsw Ivfflat (`06-skills.md:1-78`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)
