| Metadata | |
|---|---|
| KU ID | K045 |
| Subdomain | hybrid-search |
| Topic | pgvector + PostgreSQL FTS Hybrid Search |
| Source | pgvector Docs |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-PGF-01 | Missing GIN or HNSW Index for Hybrid Search | Performance |
| AP-PGF-02 | Application-Level Fusion When SQL RRF Suffices | Architecture |
| AP-PGF-03 | Tuning Hybrid Without Individual Path Baselines | Testing |
| AP-PGF-04 | Using pgvector + FTS for High-Volume Search | Design |
| AP-PGF-05 | Ignoring Write Overhead of Dual Indexes | Performance |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-01: Deploying vector search without establishing a keyword baseline (`hybrid-search-concept/04-standardized-knowledge.md:37`)
- RAP-SEARCH-04: Using raw scores without score normalization across different engines (`keyword-vector-fusion/04-standardized-knowledge.md:68`)

---

### AP-PGF-01: Missing GIN or HNSW Index for Hybrid Search

**Category:** Performance

**Description:** Creating tsvector and vector columns for hybrid search without adding corresponding GIN and HNSW indexes, causing sequential scans on every hybrid query.

**Why It Happens:** Developers focus on schema design (adding columns) and forget indexing. Index creation is often done as a separate migration step that can be skipped.

**Warning Signs:**
- Hybrid queries take seconds instead of milliseconds
- `EXPLAIN ANALYZE` shows sequential scans on large tables
- One retrieval path (usually the unindexed one) dominates latency

**Why Harmful:** Without GIN and HNSW indexes, both retrieval paths perform sequential scans. Hybrid search becomes unusably slow on datasets larger than ~10K rows.

**Consequences:**
- Query timeouts on production datasets
- Database CPU pegged under concurrent search load
- Users abandon search functionality

**Alternative:** Always add GIN index on tsvector column and HNSW index on vector column as part of the schema migration.

**Refactoring Strategy:**
1. Run `EXPLAIN ANALYZE` on hybrid query to identify sequential scans
2. Add `CREATE INDEX ... USING GIN(fts_vector)` for FTS path
3. Add `CREATE INDEX ... USING HNSW(embedding vector_cosine_ops)` for vector path
4. Re-run benchmark to verify index usage
5. Add index existence check to deployment CI pipeline

**Detection Checklist:**
- [ ] GIN index on tsvector column exists
- [ ] HNSW index on vector column exists
- [ ] `EXPLAIN ANALYZE` confirms index usage
- [ ] Query latency acceptable for dataset size

**Related Rules/Skills/Trees:**
- Rule: Create Both GIN and HNSW Indexes (`pgvector-fts-hybrid/05-rules.md:1`)
- Skill: Configure and Implement Pgvector Fts Hybrid (`pgvector-fts-hybrid/06-skills.md:1`)
- Decision Tree: Built-in vs Custom Hybrid Implementation (`pgvector-fts-hybrid/07-decision-trees.md:129`)

---

### AP-PGF-02: Application-Level Fusion When SQL RRF Suffices

**Category:** Architecture

**Description:** Implementing hybrid fusion in PHP (two separate SQL queries + application-level RRF) instead of a single SQL query with CTE-based RRF.

**Why It Happens:** Application-level fusion is the natural PHP development approach. Developers may not know PostgreSQL can handle RRF in a single query.

**Warning Signs:**
- Two separate `DB::select()` calls for keyword and vector retrieval
- PHP fusion function (RRF or weighted) combining results
- Extra network round-trips (two queries instead of one)

**Why Harmful:** Application-level fusion adds network latency (two round-trips), PHP memory overhead for intermediate results, and extra code to maintain. SQL-level RRF is a single query with sub-millisecond fusion overhead.

**Consequences:**
- ~2x query latency due to two round-trips
- PHP memory usage for storing and fusing large result sets
- Harder to tune and debug fusion logic

**Alternative:** Implement RRF fusion in a single SQL query using CTEs, window functions, and UNION ALL.

**Refactoring Strategy:**
1. Write single SQL query with keyword_results CTE, vector_results CTE, and combined RRF SELECT
2. Replace two `DB::select()` calls with one
3. Remove PHP fusion function
4. Verify results match previous implementation
5. Benchmark latency improvement

**Detection Checklist:**
- [ ] Hybrid search uses single SQL query
- [ ] No application-level fusion code for pgvector + FTS
- [ ] Network round-trips reduced to one

**Related Rules/Skills/Trees:**
- Rule: Use SQL-Level RRF for Simplicity (`pgvector-fts-hybrid/05-rules.md:34`)
- Decision Tree: Hybrid Search Fusion Strategy (`pgvector-fts-hybrid/07-decision-trees.md:20`)

---

### AP-PGF-03: Tuning Hybrid Without Individual Path Baselines

**Category:** Testing

**Description:** Tuning fusion parameters or overall hybrid quality without first measuring and optimizing each retrieval path's individual recall.

**Why It Happens:** Focus on the combined hybrid result. Teams assume if hybrid works, both paths are fine. Low recall from one path is masked by the other.

**Warning Signs:**
- FTS-only and vector-only recall metrics unknown
- Hybrid quality improvements attributed to fusion, not path fixes
- Team adjusts RRF k value while one path has <50% recall

**Why Harmful:** If one path has fundamentally poor recall, fusion amplifies its weaknesses. Tuning fusion is wasted effort when the real issue is a broken path.

**Consequences:**
- Hours spent tuning RRF k parameter with minimal improvement
- Undiagnosed path-level issues persist across deployments
- False conclusion that pgvector + FTS hybrid "doesn't work well"

**Alternative:** Benchmark each path independently to a minimum recall threshold before evaluating hybrid improvement.

**Refactoring Strategy:**
1. Run benchmark suite against FTS-only retrieval
2. Run benchmark suite against vector-only retrieval
3. If FTS recall < 70%, improve tsvector configuration (dictionary, weights)
4. If vector recall < 70%, improve embedding model or HNSW index parameters
5. Only then measure hybrid recall and tune fusion
6. Document each path's baseline metrics

**Detection Checklist:**
- [ ] FTS-only recall benchmarked
- [ ] Vector-only recall benchmarked
- [ ] Each path meets minimum threshold before fusion tuning
- [ ] Hybrid improvement measured against both baselines

**Related Rules/Skills/Trees:**
- Rule: Benchmark Individual Paths Before Fusion (`pgvector-fts-hybrid/05-rules.md:73`)
- Decision Tree: Hybrid Search Fusion Strategy (`pgvector-fts-hybrid/07-decision-trees.md:20`)

---

### AP-PGF-04: Using pgvector + FTS for High-Volume Search

**Category:** Design

**Description:** Choosing pgvector + PostgreSQL FTS hybrid search for applications with very high query volume (>1000 QPS) where a dedicated search engine would be more efficient.

**Why It Happens:** Laravel + PostgreSQL is the default stack. Teams choose pgvector + FTS for simplicity without evaluating whether PostgreSQL can handle the load.

**Warning Signs:**
- PostgreSQL CPU consistently >70% from search queries
- Read replica lag increases during search traffic spikes
- Connection pool exhausted by search queries
- Search query latency degrades under concurrent load

**Why Harmful:** Hybrid search queries are more expensive than single-path queries. At high volume, PostgreSQL becomes the bottleneck, affecting all database-dependent application features.

**Consequences:**
- Database CPU saturation under search load
- Application-wide performance degradation (not just search)
- Emergency migration to dedicated search engine under pressure

**Alternative:** Use a dedicated search engine (Meilisearch, Typesense, Qdrant) that offloads search traffic from the primary database.

**Refactoring Strategy:**
1. Benchmark current database CPU/IO under peak search load
2. If database resource usage is problematic, select dedicated search engine
3. Migrate keyword search to Meilisearch or Typesense via Scout
4. For vector search, use Qdrant or Meilisearch vector
5. Offload hybrid search from PostgreSQL
6. Monitor database health after migration

**Detection Checklist:**
- [ ] Database CPU/IO under search load measured
- [ ] Dedicated search engine evaluated if volume exceeds thresholds
- [ ] Search traffic offloaded from primary database
- [ ] Application performance regained after migration

**Related Rules/Skills/Trees:**
- Rule: Use Engine-Level Hybrid When Available (`laravel-hybrid-implementation/05-rules.md:1`)
- Skill: Optimize and Monitor Pgvector Fts Hybrid Production Search (`pgvector-fts-hybrid/06-skills.md:81`)
- Decision Tree: Built-in vs Custom Hybrid Implementation (`pgvector-fts-hybrid/07-decision-trees.md:129`)

---

### AP-PGF-05: Ignoring Write Overhead of Dual Indexes

**Category:** Performance

**Description:** Not accounting for the write performance impact of maintaining both GIN and HNSW indexes during insert/update/delete operations.

**Why It Happens:** Focus on read-time benefits. Index maintenance cost is invisible during development with small datasets.

**Warning Signs:**
- Insert/update latency increased significantly after adding dual indexes
- Queue backlog for model saves after enabling hybrid search
- Index bloat requires frequent `REINDEX` operations
- Write-heavy operations (imports) taking hours

**Why Harmful:** GIN and HNSW indexes both have write overhead. During bulk imports or high-write workloads, the dual-index maintenance can cause significant performance degradation and queue backlogs.

**Consequences:**
- Slow admin panel saves
- Delayed index updates (stale search results)
- Need for read replicas to separate search from write traffic

**Alternative:** Benchmark write performance impact. Use read replicas for search queries. Schedule index maintenance during low-traffic periods.

**Refactoring Strategy:**
1. Measure insert/update latency before adding hybrid indexes
2. Measure after adding both indexes
3. If write overhead is unacceptable, use read replica for search queries
4. Schedule `REINDEX` during maintenance windows
5. Consider dropping one index type if hybrid is not fully utilized
6. Set up monitoring for index bloat

**Detection Checklist:**
- [ ] Write performance impact measured
- [ ] Read replica configured for search if needed
- [ ] Index maintenance schedule in place
- [ ] Index bloat monitoring active

**Related Rules/Skills/Trees:**
- Rule: Create Both GIN and HNSW Indexes (`pgvector-fts-hybrid/05-rules.md:1`)
- Skill: Configure and Implement Pgvector Fts Hybrid (`pgvector-fts-hybrid/06-skills.md:1`)
