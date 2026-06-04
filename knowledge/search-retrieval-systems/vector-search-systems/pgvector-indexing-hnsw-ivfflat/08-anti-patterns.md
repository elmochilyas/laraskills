# Anti-Patterns: pgvector Indexing (HNSW / IVFFlat)

## Metadata

| | |
|---|---|
| **KU ID** | ku-03 |
| **Subdomain** | vector-similarity-search |
| **Topic** | pgvector Indexing (HNSW / IVFFlat) |
| **Source** | pgvector docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | IVFFlat in Production Without HNSW Consideration | Performance | High |
| 2 | Default ef_search Without Tuning | Performance | Medium |
| 3 | Never Rebuilding ANN Indexes | Reliability | Medium |
| 4 | Wrong Index Type for Workload Profile | Architecture | Medium |
| 5 | Creating Index Without Estimating Build Time | Reliability | Medium |

## Repository-Wide Anti-Patterns

- **Index-Once-Deploy-Forever**: Creating the ANN index at deploy time and never rebuilding, even as the dataset grows 10×
- **Memory-Naive HNSW**: Using HNSW without checking whether the index fits in PostgreSQL's shared buffers
- **Prototype-to-Production Index**: Shipping the same index type and parameters used in development directly to production
- **No Recall Baseline**: Deploying ANN indexes without measuring recall against exact search, so degradation goes undetected

---

## 1. IVFFlat in Production Without HNSW Consideration

**Category:** Performance

**Description:** Using IVFFlat indexes in production without evaluating HNSW, accepting lower query performance and recall as a permanent state rather than a deliberate tradeoff.

**Why It Happens:** IVFFlat was the default choice before pgvector v0.5.0 stabilized HNSW. Documentation examples still show IVFFlat. Development teams prototype with IVFFlat (which builds faster) and never revisit the index type for production. The index type is set in a migration and forgotten.

**Warning Signs:**
- Production vector queries use IVFFlat index (check with `\di+`)
- Query latency is higher than expected for the dataset size
- Early development documentation or migrations use IVFFlat
- No ticket or evaluation exists for switching to HNSW
- IVFFlat `lists` parameter is set too low (e.g., 100 for 5M vectors)

**Why Harmful:** IVFFlat delivers 90-95% recall at best, while HNSW achieves 99%+ at comparable or better latency. IVFFlat's faster build time (O(n)) is a one-time benefit at index creation, but the slower query performance is paid on every search query. For any read-heavy workload, HNSW pays back its slower build cost within days of production traffic.

**Consequences:**
- 5-10% lower recall than HNSW for the same query budget
- 2-10× slower query latency than HNSW
- Users miss relevant results that an HNSW index would retrieve
- Higher database CPU usage per query
- Index must be dropped and rebuilt to switch — requires maintenance window

**Alternative:** Use HNSW for production workloads where query performance matters. Reserve IVFFlat for prototyping, development environments, or extreme memory-constrained deployments where IVFFlat's lower memory footprint is a hard requirement.

**Refactoring Strategy:**
1. Benchmark current IVFFlat query latency and recall
2. Create HNSW index alongside IVFFlat on a test environment
3. Compare latency and recall at equivalent recall levels
4. Schedule maintenance window for index switch
5. Drop IVFFlat index, create HNSW index with tuned parameters
6. Verify latency and recall improvement post-migration

**Detection Checklist:**
- [ ] Is the production index type HNSW or IVFFlat?
- [ ] If IVFFlat, was HNSW explicitly evaluated and rejected for a documented reason?
- [ ] Are index parameters (m, ef_construction for HNSW; lists for IVFFlat) tuned for the dataset?
- [ ] Is recall measured against exact search for the current index?

**Related Rules/Skills/Trees:**
- Rule: Use HNSW for Production, IVFFlat for Prototyping (`05-rules.md:1-31`)
- Skill: Configure and Implement Pgvector Indexing Hnsw Ivfflat (`06-skills.md:1-78`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

---

## 2. Default ef_search Without Tuning

**Category:** Performance

**Description:** Using the default HNSW ef_search value (40 in pgvector) without evaluating the recall-vs-latency tradeoff for the specific dataset and query workload.

**Why It Happens:** ef_search defaults to a pgvector-defined value that is "safe but not optimal." The parameter is set at session level (SET hnsw.ef_search) and is easy to miss during implementation. Developers focus on index creation parameters (m, ef_construction) and forget the runtime query parameter.

**Warning Signs:**
- No `SET hnsw.ef_search` statement in application database initialization code
- ef_search is never adjusted between different query types (high-recall vs high-throughput)
- Recall measured against exact search is significantly below 99%
- Query latency is acceptable but could be much lower with a smaller ef_search for high-throughput endpoints
- Team is unaware of the ef_search parameter

**Why Harmful:** ef_search is the primary knob for the HNSW recall-vs-latency tradeoff at query time. Default 40 typically achieves 90-95% recall, leaving 5-10% of relevant results on the table. Increasing to 100-200 often achieves 99%+ recall with only modest latency increase. Conversely, for high-traffic endpoints where recall is less critical, ef_search can be lowered for faster queries.

**Consequences:**
- 5-10% lower recall than achievable at minimal additional latency cost
- Search results missing relevant items that would be found with higher ef_search
- High-throughput queries may be slower than necessary
- No documented relationship between ef_search and recall for the application
- Missed opportunity to optimize latency for different query types

**Alternative:** Set ef_search per query type: `SET LOCAL hnsw.ef_search = 200` for high-relevance searches, `SET LOCAL hnsw.ef_search = 40` for high-throughput autocomplete. Benchmark recall at 2-3 ef_search values (40, 100, 200) with production data before choosing defaults.

**Refactoring Strategy:**
1. Implement benchmarking script that measures recall at various ef_search values
2. Run benchmark on production-sized dataset
3. Categorize query types by recall vs latency requirements
4. Set ef_search per query type using session-level SET
5. Document ef_search values and expected recall for each query type

**Detection Checklist:**
- [ ] Is ef_search explicitly configured for each query type?
- [ ] Has recall been benchmarked at the chosen ef_search values?
- [ ] Is ef_search re-evaluated when dataset size changes significantly?
- [ ] Are there different ef_search values for different query endpoints?

**Related Rules/Skills/Trees:**
- Rule: Tune ef_search for Latency/Recall Tradeoff (`05-rules.md:33-62`)
- Skill: Optimize and Monitor Pgvector Indexing Hnsw Ivfflat (`06-skills.md:82-158`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

---

## 3. Never Rebuilding ANN Indexes

**Category:** Reliability

**Description:** Creating an HNSW or IVFFlat index at application deploy time and never rebuilding it, allowing search quality to degrade gradually as new vectors are inserted.

**Why It Happens:** Index creation is seen as a one-time deployment activity. The index continues to work (no errors) after insertions, so there is no immediate signal that quality is degrading. The gradual nature of recall degradation — a few percentage points per month — makes it invisible without regular benchmarking.

**Warning Signs:**
- Search quality has declined since initial deployment (users complain, or metrics show decline)
- Dataset has grown by 20%+ since the last index build
- No index rebuild job or schedule exists in the maintenance runbook
- Index was created during initial data load and never rebuilt since
- Recall measured against exact search has dropped below acceptable threshold

**Why Harmful:** Both HNSW and IVFFlat indexes degrade with data mutations. HNSW quality drops noticeably after 20%+ insertions — new vectors are not integrated into the graph structure optimally. IVFFlat suffers because the k-means clusters shift as the data distribution changes. The degradation is gradual but cumulative, and by the time it is noticed, search quality may have dropped significantly.

**Consequences:**
- Gradual, undetected decline in search relevance (85% recall → 70% over months)
- Users notice search "doesn't work as well as it used to"
- Hard to diagnose because there is no explicit error — just worse results
- After significant data growth, index may be worse than no index
- Emergency index rebuild during peak traffic because degradation became critical

**Alternative:** Schedule periodic index rebuilds based on data change rate. For high-churn datasets, rebuild weekly. For stable datasets, rebuild monthly. Monitor recall degradation and trigger rebuilds automatically when recall drops below threshold.

**Refactoring Strategy:**
1. Measure current recall against exact search (baseline)
2. Determine acceptable recall threshold (e.g., 95% of exact)
3. Schedule index rebuild in maintenance window
4. Implement monitoring that checks recall periodically
5. Add automatic rebuild trigger when recall drops below threshold
6. Document rebuild schedule and process in runbook

**Detection Checklist:**
- [ ] Is there a scheduled index rebuild based on data change rate?
- [ ] Is recall monitored to detect index degradation?
- [ ] Is the rebuild process documented in operational runbooks?
- [ ] Are rebuild times estimated and accounted for in maintenance windows?

**Related Rules/Skills/Trees:**
- Rule: Rebuild Indexes Periodically After Insertions (`05-rules.md:64-94`)
- Skill: Optimize and Monitor Pgvector Indexing Hnsw Ivfflat (`06-skills.md:82-158`)

---

## 4. Wrong Index Type for Workload Profile

**Category:** Architecture

**Description:** Choosing HNSW or IVFFlat based on habit or default rather than analyzing the workload's read/write ratio, memory constraints, and recall requirements.

**Why It Happens:** Teams pick one index type (usually HNSW for "production quality") and apply it uniformly to all vector columns regardless of access patterns. The decision is made early in the project lifecycle without workload analysis. Different tables or use cases may have different optimal index types.

**Warning Signs:**
- All vector indexes use the same type regardless of table size or access pattern
- Write-heavy vector tables have HNSW indexes (high rebuild cost per write)
- Static read-only tables have IVFFlat indexes (missed query performance)
- Memory-constrained environment uses HNSW (OOM risks)
- Query performance is adequate but index build costs dominate maintenance windows

**Why Harmful:** HNSW and IVFFlat have fundamentally different tradeoffs: HNSW prioritizes query performance at the cost of memory and build time; IVFFlat prioritizes build speed and memory efficiency at the cost of query performance. Using the wrong type for a workload means either paying unnecessary costs or leaving performance on the table. The cumulative operational cost of a wrong choice compounds over the index's lifetime.

**Consequences:**
- HNSW on write-heavy tables: frequent expensive rebuilds
- HNSW on memory-constrained systems: OOM or swap thrashing
- IVFFlat on read-heavy tables: 2-10× slower queries than HNSW
- IVFFlat on high-recall-requirement tables: insufficient recall
- Index maintenance costs dominate the search infrastructure budget

**Alternative:** Choose index type based on workload characteristics: HNSW for read-heavy, low-latency, high-recall workloads where index fits in memory. IVFFlat for write-heavy, memory-constrained, or prototyping workloads where query speed is less critical.

**Refactoring Strategy:**
1. Profile workload for each vector table: read/write ratio, query latency requirements, recall requirements
2. Analyze memory availability for HNSW graph structures
3. Choose index type per table based on profile
4. For mixed workloads, consider IVFFlat on write-heavy tables and HNSW on read-heavy tables
5. Document the rationale for each table's index type choice

**Detection Checklist:**
- [ ] Is the index type chosen based on workload analysis (not default/habit)?
- [ ] Are there different index types for different vector tables based on access patterns?
- [ ] Is memory availability checked before choosing HNSW?
- [ ] Is the index type documented with its rationale per table?

**Related Rules/Skills/Trees:**
- Rule: Use HNSW for Production, IVFFlat for Prototyping (`05-rules.md:1-31`)
- Skill: Optimize and Monitor Pgvector Indexing Hnsw Ivfflat (`06-skills.md:82-158`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

---

## 5. Creating Index Without Estimating Build Time

**Category:** Reliability

**Description:** Creating or rebuilding a large ANN index during a deployment or maintenance window without estimating the build time, causing unexpected downtime or conflict with other maintenance operations.

**Why It Happens:** Index creation is a single DDL statement that developers may not benchmark beforehand. The migration or deployment script runs `CREATE INDEX` as part of the process. On small development datasets, the index builds in milliseconds. The production dataset may be 1000× larger, but the build time is never estimated or tested.

**Warning Signs:**
- Deployments are unpredictable — sometimes fast, sometimes hours-long
- No build time estimate exists for vector indexes
- Index creation is part of regular deployment migration (blocks deploy)
- Production index build times have caused maintenance window overruns
- Team is surprised by how long index builds take on production-sized data

**Why Harmful:** HNSW index building is O(N log N) and CPU-intensive. For 5M vectors with 1536 dimensions, HNSW build can take 30-120 minutes. If this build is part of a deployment migration, the deployment is blocked for hours. If the build is during a maintenance window, the window may overrun. In emergency rebuild scenarios, the team cannot estimate how long the process will take.

**Consequences:**
- Deployment pipeline blocked for hours while index builds
- Maintenance window overruns causing unplanned downtime
- Emergency rebuilds cannot be scheduled because build time is unknown
- No ability to plan maintenance windows accurately
- Rollbacks are complicated if index creation fails mid-build

**Alternative:** Before creating a production index, build the same index on a staging environment with production-proportional data to estimate build time. Use `EXPLAIN ANALYZE CREATE INDEX` to get timing estimates. Schedule index creation in maintenance windows with 2× the estimated time buffer.

**Refactoring Strategy:**
1. Identify all vector indexes with unknown build times
2. Create identical index on staging with production-proportional dataset
3. Measure build time and resource usage
4. Document estimated build time for each index
5. Schedule index creation in maintenance windows with appropriate buffer
6. For existing indexes, document rebuild time in runbook

**Detection Checklist:**
- [ ] Are index build times estimated before production creation?
- [ ] Are build time estimates documented for operations planning?
- [ ] Is there a staging environment with production-proportional data for benchmarking?
- [ ] Are maintenance windows sized appropriately (2× estimated build time)?
- [ ] Is index creation separated from deployment (not part of migration pipeline)?

**Related Rules/Skills/Trees:**
- Rule: Monitor Index Build Time for Large Datasets (`pgvector-extension/05-rules.md:104-134`)
- Skill: Optimize and Monitor Pgvector Indexing Hnsw Ivfflat (`06-skills.md:82-158`)
