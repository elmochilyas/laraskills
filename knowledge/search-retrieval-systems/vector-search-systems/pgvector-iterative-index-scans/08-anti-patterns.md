# Anti-Patterns: pgvector Iterative Index Scans

## Metadata

| | |
|---|---|
| **KU ID** | K046 |
| **Subdomain** | vector-similarity-search |
| **Topic** | pgvector Iterative Index Scans |
| **Source** | pgvector Docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Unfiltered ANN Without Iterative Scans Consideration | Performance | High |
| 2 | Relaxed Mode Without Tradeoff Awareness | Design | Medium |
| 3 | No Iteration Limit for Runaway Queries | Reliability | High |
| 4 | Iterative Scans on IVFFlat Indexes | Performance | Medium |
| 5 | No Filtered ANN Recall Monitoring | Testing | Medium |

## Repository-Wide Anti-Patterns

- **Filtered ANN Naivety**: Applying WHERE clauses to HNSW queries without iterative scans, accepting poor recall for filtered results
- **Set-and-Forget Scan Mode**: Setting iterative_scan once globally without per-query tuning based on filter selectivity
- **Recall Blindness**: Not measuring recall of filtered ANN queries, so degradation from HNSW's filter blindness goes undetected

---

## 1. Unfiltered ANN Without Iterative Scans Consideration

**Category:** Performance

**Description:** Running filtered vector search queries (WHERE + ORDER BY with HNSW) without enabling iterative scans, causing the ANN index to miss results that match the filter but are not near the query vector.

**Why It Happens:** Developers add standard SQL WHERE clauses to vector similarity queries assuming the database will naturally handle the combination. The interaction between HNSW index navigation (by vector similarity) and SQL filters (by metadata) is not obvious. The query returns results, so nothing seems wrong.

**Warning Signs:**
- Vector queries with WHERE clauses return fewer results than LIMIT
- Filtered queries return less relevant results than unfiltered versions
- HNSW index is used but filtered recall is low
- Query latency is fast but result quality is poor
- Increasing ef_search does not improve filtered results

**Why Harmful:** HNSW indexes navigate a proximity graph by vector similarity, not by metadata filters. When a WHERE clause restricts the search space, the HNSW algorithm may traverse a region of the graph where none of the filter-matching vectors exist. It can reach its ef_search limit without finding enough filter-matching results, returning fewer or less relevant results than the application expects.

**Consequences:**
- Missing relevant results in filtered searches
- Users not finding items that match both their semantic and filter criteria
- Business logic that depends on filtered search (e.g., "show products from this category") fails silently
- Hard to diagnose: the query works, just less well than expected
- Query tuning effort (ef_search, probes) does not improve filtered recall

**Alternative:** Enable iterative scans for filtered HNSW queries: `SET hnsw.iterative_scan = relaxed;`. This allows the index to progressively expand the search if the initial scan doesn't find enough filter-matching results.

**Refactoring Strategy:**
1. Identify HNSW queries with WHERE clauses
2. Enable iterative scan: `SET hnsw.iterative_scan = strict;`
3. Test filtered recall: if insufficient, switch to `relaxed`
4. Set iteration limits: `SET hnsw.iterative_scan.max_iterations = 10;`
5. Verify filtered recall against exact search
6. Monitor query latency impact (iterative scans add 20-100ms)

**Detection Checklist:**
- [ ] Are iterative scans enabled for filtered HNSW queries?
- [ ] Is filtered recall measured against exact search?
- [ ] Is the scan mode (strict vs relaxed) chosen intentionally?
- [ ] Are iteration limits set to prevent runaway queries?

**Related Rules/Skills/Trees:**
- Rule: Enable Iterative Scans for Filtered ANN (`05-rules.md:1-31`)
- Skill: Configure and Implement Pgvector Iterative Index Scans (`06-skills.md:1-78`)

---

## 2. Relaxed Mode Without Tradeoff Awareness

**Category:** Design

**Description:** Setting `hnsw.iterative_scan = relaxed` globally without understanding that relaxed mode returns approximate distances rather than exact distances.

**Why It Happens:** Documentation examples may show `relaxed` mode. Developers adopt it because it "fixes the filtered recall problem." The tradeoff — approximate vs exact distances — is subtle and easy to overlook. The default `strict` mode preserves exact distances but may return fewer filter-matching results.

**Warning Signs:**
- `hnsw.iterative_scan = relaxed` is set globally at the session or database level
- Application code relies on exact distance values for ranking
- No awareness that relaxed mode returns approximate distances
- Distance values in relaxed mode differ from exact search
- Application displays distance values to users (misleading)

**Why Harmful:** Relaxed mode returns approximate distances because it may return vectors that are not the true nearest neighbors but happen to match the filter. The distances for these additional results are approximate, not exact. Any application logic that relies on exact distance values — such as threshold-based filtering, multi-stage ranking, or displaying confidence scores — will receive incorrect values.

**Consequences:**
- Distance values displayed to users are inaccurate
- Threshold-based filtering (distance < 0.5) behaves incorrectly
- Downstream ranking stages receive wrong distance inputs
- Application bugs that are hard to reproduce (depends on filter selectivity)
- Debugging confusion when exact and approximate distances differ

**Alternative:** Use strict mode by default. Only use relaxed mode when filtered recall with strict mode is insufficient, and document that distances may be approximate. Never display relaxed distances to users.

**Refactoring Strategy:**
1. Set `hnsw.iterative_scan = strict` as default
2. Measure filtered recall in strict mode
3. If recall is insufficient, evaluate relaxed mode against exact search
4. Document the tradeoff: relaxed mode improves recall but distances are approximate
5. Use relaxed mode per-query (not globally) when needed

**Detection Checklist:**
- [ ] Is the scan mode (strict vs relaxed) chosen deliberately?
- [ ] Is strict mode tested first before falling back to relaxed?
- [ ] Are distance values from relaxed mode not used for critical business logic?
- [ ] Is the tradeoff documented for the team?

**Related Rules/Skills/Trees:**
- Rule: Start with Strict Ordering, Relax Only If Needed (`05-rules.md:33-65`)
- Skill: Optimize and Monitor Pgvector Iterative Index Scans (`06-skills.md:82-158`)

---

## 3. No Iteration Limit for Runaway Queries

**Category:** Reliability

**Description:** Enabling iterative scans without setting `hnsw.iterative_scan.max_iterations`, allowing queries with highly restrictive filters to iterate indefinitely and cause timeouts.

**Why It Happens:** The iteration limit parameter is not well-known. Developers enable iterative scans but do not know about or forget to set the limit. The parameter has a default but it may be too high for the application's latency requirements.

**Warning Signs:**
- Iterative scans enabled but no `max_iterations` is configured
- Some queries occasionally time out (especially with restrictive filters)
- P99 latency is much higher than P50
- `hnsw.iterative_scan.max_iterations` is not in the database configuration
- Query latency varies wildly based on filter selectivity

**Why Harmful:** Without an iteration limit, iterative scans will keep expanding the search until they find enough filter-matching results. For highly selective filters (e.g., "category = 'obscure_category' WHERE only 10 records exist"), the scan may iterate dozens of times, each iteration increasing latency. The query could run for seconds, exhausting database connections and causing cascading failures.

**Consequences:**
- Query timeouts for restrictive filters
- Database connection pool exhaustion from long-running queries
- Poor P99 latency that degrades user experience
- Cascading application failures from hung queries
- Debugging difficulty: intermittent by filter selectivity

**Alternative:** Always set a reasonable max_iterations limit (typically 5-10). This caps the latency impact while still improving recall over non-iterative search.

**Refactoring Strategy:**
1. Set `SET hnsw.iterative_scan.max_iterations = 10;` in session configuration
2. Monitor query latency for filtered queries
3. Reduce max_iterations if latency is too high
4. Increase max_iterations if filtered recall is insufficient
5. Document the chosen limit and rationale

**Detection Checklist:**
- [ ] Is max_iterations explicitly configured?
- [ ] Is the chosen iteration limit appropriate for the workload?
- [ ] Are query timeouts monitored for filtered queries?
- [ ] Is P99 latency tracked for iterative scan queries?

**Related Rules/Skills/Trees:**
- Rule: Set Iteration Limits to Prevent Runaway Queries (`05-rules.md:67-95`)
- Skill: Optimize and Monitor Pgvector Iterative Index Scans (`06-skills.md:82-158`)

---

## 4. Iterative Scans on IVFFlat Indexes

**Category:** Performance

**Description:** Attempting to use iterative scans with IVFFlat indexes, which do not support this feature, resulting in no benefit and potential confusion.

**Why It Happens:** The iterative scans feature is mentioned generally for pgvector filtered ANN. Developers may apply it across all index types without checking compatibility. The configuration may be accepted without error but has no effect.

**Warning Signs:**
- Iterative scans are configured but the index is IVFFlat
- Filtered recall with IVFFlat has not improved after enabling iterative scans
- Query plans show IVFFlat scan without iterative behavior
- Documentation shows iterative scans are HNSW-specific but configuration exists for IVFFlat
- Team is unaware that iterative scans are an HNSW-only feature

**Why Harmful:** Iterative scans are an HNSW-specific feature that leverages the graph structure to progressively expand the search neighborhood. IVFFlat uses a different index structure (inverted file with clusters) that does not support this progressive expansion. Configuring iterative scans on IVFFlat indexes wastes developer effort and provides a false sense of improved filtered recall.

**Consequences:**
- Engineering effort configuring ineffective feature
- False confidence that filtered ANN is optimized
- Unresolved filtered recall problems with IVFFlat
- Time wasted tuning non-functional parameters
- Missing the correct solution (rebuild as HNSW or increase IVFFlat probes)

**Alternative:** Use HNSW indexes if iterative scans are needed for filtered ANN. For IVFFlat, improve filtered recall by increasing `ivfflat.probes` or switching to HNSW.

**Refactoring Strategy:**
1. Identify IVFFlat indexes used with filtered queries
2. Drop IVFFlat index and create HNSW index
3. Enable iterative scans with appropriate limits
4. Benchmark filtered recall improvement
5. If IVFFlat is required for memory reasons, increase probes parameter instead

**Detection Checklist:**
- [ ] Are iterative scans only configured for HNSW indexes?
- [ ] Are IVFFlat indexes using alternative methods for filtered recall (probes tuning)?
- [ ] Is the index type appropriate for the filtered query workload?
- [ ] Has the team documented the index-type-specific feature limitations?

**Related Rules/Skills/Trees:**
- Rule: Enable Iterative Scans for Filtered ANN (`05-rules.md:1-31`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

---

## 5. No Filtered ANN Recall Monitoring

**Category:** Testing

**Description:** Deploying filtered vector search without monitoring recall against exact search, so degradation from HNSW's filter blindness goes undetected.

**Why It Happens:** Teams measure overall search quality but do not specifically measure recall for filtered queries. The impact of iterative scans (or their absence) on filtered recall is unknown. Monitoring infrastructure focuses on latency and error rates, not recall quality.

**Warning Signs:**
- No monitoring exists for filtered query recall
- Filtered search quality is assumed to equal unfiltered quality
- User complaints about missing results in filtered search are not tracked
- No exact search baseline exists for filtered queries
- Team cannot answer: "What is our filtered recall at top-10?"

**Why Harmful:** Filtered ANN recall can degrade significantly without any latency or error signal. HNSW may return results that don't match the filter or fail to find matching results entirely. Without monitoring, this degradation is invisible until users complain. The longer it goes undetected, the harder it is to correlate with the root cause.

**Consequences:**
- Undetected filtered recall degradation over time
- Users silently failing to find items they know exist
- Business impact from reduced conversion on filtered searches
- Difficulty correlating user complaints with infrastructure changes
- Reactive debugging rather than proactive monitoring

**Alternative:** Implement periodic recall monitoring that compares filtered ANN results against exact filtered search. Track filtered recall@k as a quality metric.

**Refactoring Strategy:**
1. Define filtered recall metrics (recall@10, recall@100)
2. Implement periodic recall benchmark comparing ANN vs exact filtered search
3. Set up alerting when filtered recall drops below threshold (e.g., <90%)
4. Track filtered recall trends over time
5. Correlate recall changes with data growth and index rebuilds

**Detection Checklist:**
- [ ] Is filtered recall monitored (separately from unfiltered)?
- [ ] Are there alert thresholds for filtered recall degradation?
- [ ] Is filtered recall compared against exact search periodically?
- [ ] Are recall trends tracked to detect gradual degradation?

**Related Rules/Skills/Trees:**
- Skill: Optimize and Monitor Pgvector Iterative Index Scans (`06-skills.md:82-158`)
