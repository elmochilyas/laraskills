# Anti-Patterns: pgvector with Laravel

## Metadata

| | |
|---|---|
| **KU ID** | ku-02 |
| **Subdomain** | vector-similarity-search |
| **Topic** | pgvector with Laravel |
| **Source** | pgvector docs / Community |
| **Maturity** | Emerging |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Using Scout for Vector Search Queries | Framework Usage | High |
| 2 | No ANN Index Before Production | Performance | High |
| 3 | Manual Extension Without Migration | Maintainability | High |
| 4 | Pure Vector or Pure Keyword — Not Both | Architecture | Medium |
| 5 | Embedding Generation in Request Cycle | Performance | Medium |

## Repository-Wide Anti-Patterns

- **Abstraction Over Raw SQL**: Trying to wrap pgvector operators in Eloquent/SCOUT abstractions that leak or break
- **One Tool Mindset**: Expecting either Scout or pgvector to handle all search needs when hybrid is required
- **Production-First Indexing**: Deploying vector schema without ANN index, adding it only after performance complaints

---

## 1. Using Scout for Vector Search Queries

**Category:** Framework Usage

**Description:** Attempting to perform vector similarity queries through Laravel Scout's `search()` method, which does not support vector distance operators (<->, <=>, <#>).

**Why It Happens:** Scout is the standard search abstraction in Laravel. Developers familiar with Scout's fluent API naturally try to extend it to vector use cases. Scout's flexibility with different engine drivers creates the impression that vector support is just a driver configuration away. The documentation gap (no first-party Scout vector driver) is not immediately obvious.

**Warning Signs:**
- `Model::search($query)->nearestNeighbors($vector)` methods do not exist
- Scout returns empty or incorrect results for vector queries
- Attempts to extend Scout engine with custom vector driver fail or are incomplete
- Issues or PRs exist in the laravel/scout repo asking for vector support
- Vector queries are forced through Scout's keyword-oriented pipeline

**Why Harmful:** Scout's architecture is fundamentally keyword-oriented — it wraps search engine APIs (Algolia, Meilisearch, Typesense) that may or may not support vector search. Expecting Scout to transparently handle vector operators leads to broken search implementations, wasted development time building abstractions, and production bugs where vector queries silently fall back to keyword matching.

**Consequences:**
- Broken vector search functionality in production
- Significant wasted development time building unsupported abstractions
- Silent fallback to keyword search, producing semantically irrelevant results
- Inability to use pgvector-specific features (distance functions, filtering)
- Complex workarounds that are harder to maintain than raw SQL

**Alternative:** Use raw SQL for vector similarity queries in Laravel. Implement vector search through Eloquent query scopes that use PostgreSQL's distance operators directly with `DB::select()` or raw `orderByRaw()`.

**Refactoring Strategy:**
1. Identify all places where vector search is attempted through Scout
2. Replace Scout calls with raw SQL queries using pgvector distance operators
3. Create Eloquent scopes (`scopeNearestNeighbors`) for clean model-level API
4. Keep Scout for keyword/full-text search where it excels
5. Implement fusion (RRF) if hybrid search is required

**Detection Checklist:**
- [ ] Are vector similarity queries using raw SQL (not Scout `search()`)?
- [ ] Do Eloquent models have scopes for vector nearest-neighbor queries?
- [ ] Is Scout only used for keyword/text search?
- [ ] Are there any custom Scout drivers attempting to proxy vector search?

**Related Rules/Skills/Trees:**
- Rule: Use Raw SQL for pgvector Queries in Laravel (`05-rules.md:1-38`)
- Skill: Configure and Implement Pgvector With Laravel (`06-skills.md:1-78`)
- Decision: Vector Database Selection Strategy (`07-decision-trees.md:20-76`)

---

## 2. No ANN Index Before Production

**Category:** Performance

**Description:** Deploying vector search to production without creating an HNSW or IVFFlat ANN index, causing sequential scans that become unacceptably slow as the dataset grows.

**Why It Happens:** Development datasets are small (hundreds to thousands of records), and sequential scans complete in milliseconds. The missing index is not noticed during testing. Deployment timelines pressure teams to ship without a proper migration for index creation. Some developers assume PostgreSQL's standard B-tree index works on vector columns.

**Warning Signs:**
- Vector queries are fast in development but slow in production
- Production query latency increases linearly with record count
- PostgreSQL's `pg_stat_user_tables` shows sequential scans on vector table
- No migration exists that creates an ANN index on vector columns
- Emergency index creation is triggered after first production performance alert

**Why Harmful:** Without an ANN index, every vector query performs O(n) distance computations against all stored vectors. For a production dataset with 500K records and 1536 dimensions, each query computes 768 million floating-point operations. This is not merely slow — it is fundamentally unscalable and consumes significant database CPU for every query.

**Consequences:**
- 5-30 second search latency at production scale
- High PostgreSQL CPU usage from repeated full scans
- Database connection pool exhaustion from long-running queries
- Poor user experience leading to feature abandonment
- Emergency maintenance to add index after performance crisis

**Alternative:** Create an ANN index (HNSW preferred) as part of the database migration that adds the vector column. Use HNSW for query performance or IVFFlat for faster initial builds on large datasets.

**Refactoring Strategy:**
1. Measure production vector query latency (baseline metric)
2. Create migration during maintenance window
3. Add `CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)` with tuned parameters
4. Set `SET hnsw.ef_search = 200` for production query sessions
5. Verify latency reduction with production traffic
6. Add index creation to deployment runbook for new vector features

**Detection Checklist:**
- [ ] Does a migration exist that creates an ANN index on each vector column?
- [ ] Does EXPLAIN ANALYZE show Index Scan for vector queries in production?
- [ ] Is the index type (HNSW vs IVFFlat) deliberately chosen and documented?
- [ ] Are new vector features gated on index creation before deployment?

**Related Rules/Skills/Trees:**
- Rule: Add ANN Index for Production (`05-rules.md:39-68`)
- Rule: Default to HNSW Indexes (`pgvector-extension/05-rules.md:41-69`)
- Skill: Configure and Implement Pgvector With Laravel (`06-skills.md:1-78`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

---

## 3. Manual Extension Without Migration

**Category:** Maintainability

**Description:** Enabling the pgvector extension by running `CREATE EXTENSION vector;` directly in the database console instead of through a version-controlled Laravel migration.

**Why It Happens:** During initial prototyping, the quickest path is running SQL directly. The manual step is never converted to a migration. The extension works on the prototype environment, so it is forgotten. New environments fail until someone remembers to run the command manually.

**Warning Signs:**
- CI/CD pipeline fails on first deploy with "type vector does not exist"
- Fresh environment setup requires undocumented manual SQL steps
- Staging or production environments were never verified to have the extension
- No migration file contains `CREATE EXTENSION IF NOT EXISTS vector`
- Onboarding docs include manual SQL commands instead of migrate commands

**Why Harmful:** Manual extension installation is invisible to version control, deployment automation, and other developers. Every new environment requires tribal knowledge. Rollbacks cannot revert the extension state. When upgrading pgvector versions, there is no record of the original installation.

**Consequences:**
- Failed deployments when the extension is missing
- Environment drift across development, staging, and production
- Onboarding delays when new developers must discover manual steps
- Inability to recreate environments from scratch automatically
- Production incidents from schema mismatches

**Alternative:** Create a migration that enables the extension: `DB::statement('CREATE EXTENSION IF NOT EXISTS vector')` in `up()` and `DB::statement('DROP EXTENSION IF EXISTS vector')` in `down()`.

**Refactoring Strategy:**
1. Run `php artisan make:migration add_pgvector_extension`
2. Add extension creation to `up()` and dropping to `down()`
3. Run `php artisan migrate` on all environments
4. Remove manual SQL steps from runbooks and onboarding docs
5. Test fresh environment provisioning to verify migration covers extension

**Detection Checklist:**
- [ ] Is there a migration that enables the pgvector extension?
- [ ] Does `php artisan migrate:fresh` recreate the extension automatically?
- [ ] Are all environments managed through migrations (no manual SQL)?
- [ ] Can a new developer provision their environment with only `migrate` + `seed`?

**Related Rules/Skills/Trees:**
- Rule: Enable pgvector Extension via Migration (`05-rules.md:71-101`)
- Skill: Configure and Implement Pgvector With Laravel (`06-skills.md:1-78`)

---

## 4. Pure Vector or Pure Keyword — Not Both

**Category:** Architecture

**Description:** Implementing only vector search or only keyword search when the application requires both (hybrid search), forcing users to choose between semantic relevance and exact keyword matching.

**Why It Happens:** Teams default to one search paradigm based on their initial requirements. Keyword-focused teams add Scout and never consider vector embeddings. Vector-focused teams add pgvector and drop full-text search. The integration complexity of combining both approaches (RRF fusion, normalization, pagination) leads to deferring hybrid support.

**Warning Signs:**
- Users complain that searches for specific codes/SKUs return irrelevant results (vector-only)
- Users complain that searches for concepts/topics miss semantically related items (keyword-only)
- Search team is split debating "vector vs keyword" instead of combining both
- Product requirements include both exact-match and semantic search but implementation uses one
- Queries with mixed intent (e.g., "red sneakers size 10") perform poorly

**Why Harmful:** Vector search excels at semantic similarity but fails for exact identifiers (SKUs, codes, proper names). Keyword search excels at exact matching but misses synonyms and conceptual relationships. Using only one approach means the other failure mode is inherent to the system design — no tuning can fix it.

**Consequences:**
- Poor search quality for a significant subset of user queries
- Users must rephrase queries multiple times to find results
- Business impact when users cannot find products or documents by reference codes
- Competitors with hybrid search outperform for mixed-intent queries
- Architecture redesign required when hybrid support is added later

**Alternative:** Implement hybrid search using both Scout for keyword/FTS and raw SQL with pgvector for vector similarity. Fuse results using Reciprocal Rank Fusion (RRF) or weighted scoring. Use Scout's `search()->where()` for structured filters and pgvector distance for semantic ranking.

**Refactoring Strategy:**
1. Audit query patterns — classify as "keyword lookup" vs "semantic search" vs "mixed"
2. Add missing search paradigm (Scout if keyword missing, pgvector if vector missing)
3. Implement parallel query execution: Scout for keyword + raw SQL for vector
4. Implement RRF fusion with configurable k constant (typically k=60)
5. Normalize scores and paginate fused results
6. A/B test fused results against single-paradigm search

**Detection Checklist:**
- [ ] Does the search implementation handle both exact-match and semantic queries?
- [ ] Are both Scout and pgvector available in the architecture?
- [ ] Is there a fusion strategy (RRF, weighted, or cascading) documented?
- [ ] Are query patterns monitored to detect hybrid-search failures?

**Related Rules/Skills/Trees:**
- Rule: Mix Scout for Keyword and Raw SQL for Vector (`05-rules.md:103-136`)
- Skill: Optimize and Monitor Pgvector With Laravel (`06-skills.md:82-158`)

---

## 5. Embedding Generation in Request Cycle

**Category:** Performance

**Description:** Generating vector embeddings synchronously during the HTTP request-response cycle, blocking the response until the embedding API call completes.

**Why It Happens:** The simplest implementation generates an embedding when creating or updating a model record, right in the model event handler or controller. Embedding generation appears fast in development (single user, small payloads). The latency impact at production traffic scale is not considered.

**Warning Signs:**
- Model save operations take 200-500ms longer than expected
- API embedding calls time out during web requests
- Queue worker is not configured for embedding generation
- Application performance monitoring shows high latency on create/update endpoints
- Users experience slow page loads when saving content that triggers embedding

**Why Harmful:** Embedding API calls typically take 100-500ms depending on text length and provider latency. Blocking the web request for this duration ties up PHP-FPM workers, increases queue depth for web servers, and creates a poor user experience. At scale, this synchronous pattern can exhaust worker pools and cause request queuing.

**Consequences:**
- Slow page loads for content creation/update operations
- Web server worker pool exhaustion from long-running requests
- Increased infrastructure costs from over-provisioned workers
- Timeout errors when embedding provider experiences latency spikes
- Poor user experience for content creators and administrators

**Alternative:** Generate embeddings asynchronously using Laravel queues. Dispatch a job after model save that generates the embedding and updates the record. The web request completes quickly, and the embedding is processed in the background.

**Refactoring Strategy:**
1. Create a dedicated queue job for embedding generation
2. Remove inline embedding generation from controllers/model events
3. Dispatch job from model's `created` / `updated` events
4. Configure dedicated queue worker for embedding jobs
5. Handle failures with retry logic and failed-job alerts
6. For time-sensitive scenarios, use `dispatch()->afterResponse()` for non-critical updates

**Detection Checklist:**
- [ ] Are embeddings generated asynchronously (queue jobs)?
- [ ] Are there dedicated queue workers for embedding generation?
- [ ] Is there retry logic with exponential backoff for embedding API calls?
- [ ] Are failed embedding jobs monitored and alerted?
- [ ] Is there a fallback search method while embedding is pending?

**Related Rules/Skills/Trees:**
- Skill: Configure and Implement Pgvector With Laravel (`06-skills.md:1-78`)
- Skill: Optimize and Monitor Pgvector With Laravel (`06-skills.md:82-158`)
