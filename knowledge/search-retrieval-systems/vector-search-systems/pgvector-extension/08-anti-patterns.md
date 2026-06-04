# Anti-Patterns: pgvector Extension

## Metadata

| | |
|---|---|
| **KU ID** | K041 |
| **Subdomain** | vector-similarity-search |
| **Topic** | pgvector Extension |
| **Source** | pgvector Docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | No ANN Index on Vector Column | Performance | Critical |
| 2 | Wrong Embedding Dimension on Vector Column | Maintainability | High |
| 3 | Manual Extension Installation Outside Migrations | Maintainability | High |
| 4 | Default Index Parameters Without Tuning | Performance | Medium |
| 5 | Building Large Indexes During Peak Traffic | Performance | Medium |

## Repository-Wide Anti-Patterns

- **PostgreSQL-Only Narrowness**: Assuming pgvector only works with PostgreSQL-specific tooling, missing hybrid options with other databases
- **Index-Once-Forget**: Creating indexes at deploy time and never monitoring their recall/performance degradation as data grows
- **Raw SQL Avoidance**: Trying to abstract pgvector behind Eloquent/Scout when raw SQL is the correct and documented path

---

## 1. No ANN Index on Vector Column

**Category:** Performance

**Description:** Running vector similarity queries on a `vector(n)` column without creating an HNSW or IVFFlat approximate nearest neighbor index, causing full sequential scans on every query.

**Why It Happens:** Developers prototype vector search on small datasets (hundreds to low thousands of records) where sequential scans complete in milliseconds. The missing index is not noticed until the dataset grows to production scale. Index creation requires ALTER TABLE DDL that may feel heavyweight or risky, so it is deferred. Some developers assume PostgreSQL automatically indexes vector columns like B-tree columns.

**Warning Signs:**
- Vector search query latency grows linearly with table row count
- EXPLAIN ANALYZE shows Sequential Scan on vector column
- Query latency jumps suddenly as dataset passes 10K records
- No `CREATE INDEX` statement exists in migrations for vector columns
- Production monitoring shows vector queries taking seconds

**Why Harmful:** Vector search inherently requires distance computation against every stored vector. Without an ANN index, every query performs O(n) distance calculations. At 100K vectors with 1536 dimensions, a single query computes 153.6 million floating-point operations — prohibitively slow for any real-time application.

**Consequences:**
- Query timeouts as dataset grows
- Poor user experience (5-30 second search latency)
- Inability to scale past small datasets
- High PostgreSQL CPU usage from repeated full scans
- Emergency index build during production causing further disruption

**Alternative:** Always create an HNSW index on vector columns before serving production traffic. Use `CREATE INDEX ON table USING hnsw (embedding vector_cosine_ops)` for cosine distance queries.

**Refactoring Strategy:**
1. Identify vector columns queried without ANN indexes
2. Assess dataset size and expected query latency impact
3. Plan index creation during maintenance window
4. Create HNSW index with tuned parameters (m=16, ef_construction=200)
5. Verify query latency reduction with EXPLAIN ANALYZE
6. Set up monitoring to alert if vector queries hit sequential scans

**Detection Checklist:**
- [ ] Are all vector columns backed by an ANN index (HNSW or IVFFlat)?
- [ ] Does EXPLAIN ANALYZE show Index Scan (not Seq Scan) for vector queries?
- [ ] Are indexes re-evaluated as dataset grows past key thresholds (10K, 100K, 1M)?
- [ ] Is index type (HNSW vs IVFFlat) chosen deliberately based on workload?

**Related Rules/Skills/Trees:**
- Rule: Default to HNSW Indexes (`05-rules.md:41-69`)
- Rule: Add ANN Index for Production (`05-rules.md:69-102`)
- Skill: Configure and Implement Pgvector Extension (`06-skills.md:1-78`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

---

## 2. Wrong Embedding Dimension on Vector Column

**Category:** Maintainability

**Description:** Specifying a vector column dimension that does not match the embedding model's output dimension, causing runtime query failures.

**Why It Happens:** The dimension is hardcoded in migrations during initial setup. When the embedding model is later changed (e.g., from text-embedding-3-small/1536 to text-embedding-3-large/3072), the migration's dimension is not updated. Developers may also guess or approximate the dimension instead of checking the model's documentation.

**Warning Signs:**
- pgvector throws "vector dimension mismatch" errors at query time
- ERROR: expected N dimensions, not M
- Multiple vector columns exist with different dimensions but the same embedding model
- Dimension is hardcoded in migrations without a configuration constant

**Why Harmful:** pgvector enforces strict dimension matching — every inserted vector and every query vector must match the column's declared dimension. A mismatch causes runtime errors that crash search queries. Because the error occurs at query time (not insert time), it can bypass testing and surface in production.

**Consequences:**
- Production search outages from dimension mismatch
- Emergency migrations to alter column dimension (requires table rebuild)
- Lost developer time debugging "vector dimension mismatch" errors
- Inability to upgrade embedding models without schema changes
- Monitoring gaps where search silently fails for partial queries

**Alternative:** Store the embedding dimension as a configuration constant (config('scout.embedding_dimension')) referenced in both migrations and embedding code. Document the expected dimension and model in comments. Add an integration test that verifies dimension consistency.

**Refactoring Strategy:**
1. Define embedding dimension in `config/scout.php` or a dedicated config
2. Update migration to reference config value `$table->vector('embedding', config('scout.embedding_dimension'))`
3. Add validation in embedding pipeline that checks dimension before insert
4. Run migration to fix any columns with wrong dimensions (requires ALTER TABLE)
5. Add integration test: generate embedding, verify dimension, store and retrieve

**Detection Checklist:**
- [ ] Is embedding dimension defined in a single source of truth (config)?
- [ ] Do migrations reference this config value?
- [ ] Is there validation that generated embeddings match column dimension?
- [ ] Are integration tests detecting dimension mismatches before deployment?

**Related Rules/Skills/Trees:**
- Rule: Store Vectors with Correct Dimension (`05-rules.md:136-166`)
- Skill: Configure and Implement Pgvector Extension (`06-skills.md:1-78`)

---

## 3. Manual Extension Installation Outside Migrations

**Category:** Maintainability

**Description:** Enabling the pgvector extension by manually running SQL on each environment (development, staging, production) instead of through a version-controlled Laravel migration.

**Why It Happens:** During initial prototyping, developers run `CREATE EXTENSION vector;` directly in the database console to test quickly. The manual step is never formalized into a migration. When deploying to new environments, the extension is forgotten because it exists only as tribal knowledge.

**Warning Signs:**
- Fresh environment setup requires manual database commands not in the deployment script
- Different environments have different pgvector versions installed
- CI/CD pipeline fails on first deploy because "type vector does not exist"
- Extension is created manually in production but not tracked anywhere

**Why Harmful:** Manual extension installation violates infrastructure-as-code principles. Every new developer must know to run the command. Every new environment (staging, CI, production) requires manual intervention. Deployment automation cannot reproduce the database state. When the extension needs upgrading, there is no version-controlled record of the original installation.

**Consequences:**
- CI/CD pipeline failures on fresh deployments
- Environment drift where some environments have the extension and others don't
- Lost time onboarding new developers
- Inability to automate database provisioning
- Rollbacks cannot revert the extension state cleanly

**Alternative:** Always install pgvector through a Laravel migration: `DB::statement('CREATE EXTENSION IF NOT EXISTS vector')` with a corresponding down method `DB::statement('DROP EXTENSION IF EXISTS vector')`.

**Refactoring Strategy:**
1. Create a new migration for the extension: `php artisan make:migration add_pgvector_extension`
2. Add `CREATE EXTENSION IF NOT EXISTS vector` in up(), `DROP EXTENSION IF EXISTS vector` in down()
3. Deploy migration to all environments
4. Remove manual extension creation from runbooks
5. Verify all environments have the extension via migration status

**Detection Checklist:**
- [ ] Is pgvector extension created via a migration (not manually)?
- [ ] Does the migration have a reversible down() method?
- [ ] Are all environments (dev, staging, CI, prod) running the same migration?
- [ ] Can a fresh environment be fully provisioned by running `php artisan migrate`?

**Related Rules/Skills/Trees:**
- Rule: Install pgvector via Migration (`05-rules.md:1-39`)
- Skill: Configure and Implement Pgvector Extension (`06-skills.md:1-78`)

---

## 4. Default Index Parameters Without Tuning

**Category:** Performance

**Description:** Creating HNSW or IVFFlat indexes with default parameters (m=16, ef_construction=100 for HNSW; lists=100 for IVFFlat) without tuning for the dataset size and recall requirements.

**Why It Happens:** Documentation examples show simple CREATE INDEX statements. Developers copy these examples verbatim into migrations. The impact of parameters on recall/latency tradeoff is not immediately visible because the application "works" with defaults. Tuning feels like premature optimization until production performance issues surface.

**Warning Signs:**
- Search recall is lower than expected (missing relevant results in top-k)
- Query latency is acceptable but recall could be significantly higher
- Dataset size has grown past thresholds where defaults degrade recall
- No parameter tuning was performed before or after index creation
- IVFFlat lists parameter is still at default with >1M vectors

**Why Harmful:** Default parameters are conservative estimates. HNSW defaults (m=16, ef_construction=100) work for moderate-sized datasets but produce lower recall than achievable at minimal extra cost. IVFFlat lists default of 100 produces inadequate recall for datasets over 1M vectors. Suboptimal parameters lock in performance characteristics for the index lifetime until the index is rebuilt.

**Consequences:**
- 5-15% lower recall than achievable with tuned parameters
- Query latency may be higher than necessary (poor recall/latency sweet spot)
- Users miss relevant results without understanding why
- Index must be dropped and rebuilt to improve — expensive on large datasets

**Alternative:** Tune parameters based on dataset size before creating the index. For HNSW: m=16 (min), m=32-48 (medium), m=64 (high recall); ef_construction=200-400 for production. For IVFFlat: lists = sqrt(N) where N is row count. Tune ef_search proportional to desired recall.

**Refactoring Strategy:**
1. Evaluate current recall with production queries (measure recall@k)
2. Drop existing index (if IVFFlat or poor HNSW params) during maintenance window
3. Recreate with tuned parameters based on dataset size
4. Set ef_search at connection level: `SET hnsw.ef_search = 200;`
5. Verify recall improvement, measure latency tradeoff
6. Document tuned parameters alongside dataset size for future reference

**Detection Checklist:**
- [ ] Are HNSW parameters (m, ef_construction) chosen based on dataset size?
- [ ] Is ef_search set per-query or per-session (not left at default)?
- [ ] Are IVFFlat lists set appropriately (sqrt of row count)?
- [ ] Was recall benchmarked against tuned parameters before production deploy?

**Related Rules/Skills/Trees:**
- Rule: Tune Index Parameters for Dataset (`05-rules.md:71-102`)
- Skill: Optimize and Monitor Pgvector Extension (`06-skills.md:82-158`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

---

## 5. Building Large Indexes During Peak Traffic

**Category:** Performance

**Description:** Creating or rebuilding large HNSW/IVFFlat indexes during business hours when production traffic is high, causing query performance degradation.

**Why It Happens:** Index creation is often added as a database migration that runs during deployment. Deployments happen during working hours. The developer does not estimate the index build time or consider the performance impact on concurrent queries during the build process.

**Warning Signs:**
- Production query latency spikes during deployments
- pg_stat_activity shows CREATE INDEX with high CPU usage during peak traffic
- Index build times are not estimated before migration creation
- No maintenance windows are defined for database schema changes
- HNSW index builds cause memory pressure on PostgreSQL

**Why Harmful:** HNSW index building is O(N log N) and CPU-intensive. For a table with 5M vectors, building an HNSW index can take 30-60 minutes of significant CPU usage. During this time, concurrent queries compete for resources. The index's internal data structures are being modified, potentially causing query slowdowns or timeouts for in-flight search queries.

**Consequences:**
- Degraded search experience during deployment windows
- Query timeouts for concurrent vector searches during index build
- Memory pressure causing PostgreSQL to spill to disk or OOM
- Deployment rollbacks because index build blocks other operations
- Developer hesitation to add or modify indexes, leaving performance on the table

**Alternative:** Schedule index builds during low-traffic maintenance windows. Use `CREATE INDEX CONCURRENTLY` to avoid blocking writes (though CPU contention remains). For very large datasets, consider IVFFlat for faster initial build, then rebuild as HNSW later. Estimate build time with a smaller test dataset before production.

**Refactoring Strategy:**
1. Move index creation out of deployment migrations into scheduled maintenance
2. Identify low-traffic windows for your application (typically 2-4 AM)
3. Run index creation during maintenance window with monitoring
4. For existing problematic builds, drop and recreate during off-peak hours
5. Add index build time estimates to deployment runbook
6. Consider CONCURRENTLY option to avoid write locks

**Detection Checklist:**
- [ ] Are index build times estimated before deployment?
- [ ] Are large index builds scheduled during defined maintenance windows?
- [ ] Is CPU and memory usage monitored during index builds?
- [ ] Is CONCURRENTLY used when avoiding write locks is critical?

**Related Rules/Skills/Trees:**
- Rule: Monitor Index Build Time for Large Datasets (`05-rules.md:104-134`)
- Skill: Optimize and Monitor Pgvector Extension (`06-skills.md:82-158`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)
