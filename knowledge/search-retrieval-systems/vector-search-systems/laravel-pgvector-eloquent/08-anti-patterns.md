# Anti-Patterns: Laravel + pgvector via Eloquent

## Metadata

| | |
|---|---|
| **KU ID** | K070 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Laravel + pgvector via Eloquent |
| **Source** | Community |
| **Maturity** | Emerging |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Premature Community Package Dependency | Maintainability | Medium |
| 2 | Scattered Raw SQL Without Encapsulation | Code Organization | Medium |
| 3 | No ANN Index Before Production Traffic | Performance | High |
| 4 | Unbenchmarked Impact on Transactional Queries | Performance | High |
| 5 | Direct SQL Vector Column Changes Without Migration | Maintainability | Medium |

## Repository-Wide Anti-Patterns

- **No Scout, No Search**: Assuming Scout is the only way to do search in Laravel, missing pgvector's capabilities
- **All-in-One-DB Risk**: Running heavy vector search workloads on the same database as OLTP without read-replica offloading
- **Migration-Less Schema**: Adding/altering vector columns outside Laravel migrations, losing version control
- **Controller-Level Vector Logic**: Putting raw vector SQL in controllers instead of Eloquent scopes

---

## 1. Premature Community Package Dependency

**Category:** Maintainability

**Description:** Adding the `pgvector/pgvector-php` community package as a dependency before proving that raw SQL + Eloquent scopes are insufficient, introducing unnecessary version compatibility risk.

**Why It Happens:** Community packages provide convenient abstractions (Vector class, nearestNeighbors helper). The appeal of a clean API leads teams to add the dependency early, before understanding whether the project's vector search needs are simple enough for raw SQL.

**Warning Signs:**
- `pgvector/pgvector-php` is in composer.json but vector search is simple (one model, one field)
- The package is used only for `Vector` type casting — which raw SQL handles trivially
- No evaluation of raw SQL was done before adding the dependency
- Version conflicts with Laravel or PHP versions have already occurred
- The package's API has changed, requiring migration work

**Why Harmful:** Every dependency adds maintenance burden: version constraints, security updates, breaking change migrations, and compatibility testing. The pgvector-php package is community-maintained and may lag behind pgvector or Laravel releases. For simple use cases (vector column + basic similarity queries), raw SQL with Eloquent scopes provides equivalent functionality with zero external dependencies.

**Consequences:**
- Version compatibility issues during Laravel upgrades
- Delayed adoption of pgvector features if the package lags
- Dependency audit overhead for a non-essential package
- Breaking changes from package updates requiring refactoring
- Reduced flexibility to customize query behavior

**Alternative:** Start with raw SQL encapsulated in Eloquent scopes. Only add the community package if: you need bidirectional vector casting, the `HasNeighbors` trait, or the convenience justifies the dependency risk.

**Refactoring Strategy:**
1. Evaluate actual vector search complexity (number of models, fields, query types)
2. Replace package-specific calls with equivalent raw SQL in scopes
3. Remove the package from composer.json
4. Update any type casting to manual JSON encode/decode
5. Verify identical query results

**Detection Checklist:**
- [ ] Is pgvector-php package essential or a convenience?
- [ ] Can all vector operations be expressed with raw SQL?
- [ ] Is the package the only dependency at risk of version conflict?
- [ ] Is the team comfortable maintaining raw SQL vector queries?

**Related Rules/Skills/Trees:**
- Rule: Start with Raw SQL for pgvector Integration (`05-rules.md:1-37`)
- Skill: Configure and Implement Laravel Pgvector Eloquent (`06-skills.md:1-78`)

---

## 2. Scattered Raw SQL Without Encapsulation

**Category:** Code Organization

**Description:** Placing raw SQL pgvector queries directly in controllers, API routes, or service classes instead of encapsulating them in Eloquent local scopes.

**Why It Happens:** Raw SQL is simple to write inline where it's used. The quickest implementation path is writing a `DB::select()` call in the controller. Refactoring into scopes is deferred and rarely prioritized.

**Warning Signs:**
- `DB::select()` with pgvector operators appears in multiple controllers
- Similar vector query logic is duplicated across files
- No Eloquent scope exists for nearest-neighbor queries
- Changing the vector column name requires searching across many files
- Vector queries are mixed with business logic in controllers

**Why Harmful:** Scattered raw SQL violates DRY and makes the codebase hard to maintain. A change to the vector column name, index operator, or distance function requires finding and updating every inline query. Controllers become cluttered with database implementation details. Unit testing vector queries is difficult when they are embedded in HTTP request handlers.

**Consequences:**
- Code duplication: same query repeated across controllers
- Bug-prone: one query gets updated but another is missed
- Difficult testing: vector queries entangled with HTTP logic
- High cognitive load: developers must understand raw SQL in every controller
- Refactoring resistance: changing vector search implementation is high-risk

**Alternative:** Create Eloquent local scopes on each model that encapsulate pgvector queries. Controllers call `Document::nearestNeighbors($vec, 10)->get()` — clean, testable, single point of change.

**Refactoring Strategy:**
1. Identify all inline pgvector SQL queries across controllers and services
2. Create Eloquent local scopes on relevant models (scopeNearestNeighbors, scopeSimilarTo)
3. Replace inline SQL with scope calls
4. Add integration tests for each scope
5. Remove duplicated SQL code

**Detection Checklist:**
- [ ] Are pgvector queries encapsulated in Eloquent scopes?
- [ ] Can a vector column rename be done by changing one scope?
- [ ] Are controllers free of raw pgvector SQL?
- [ ] Are scopes covered by integration tests?

**Related Rules/Skills/Trees:**
- Rule: Encapsulate Vector Queries in Eloquent Scopes (`05-rules.md:39-68`)
- Skill: Configure and Implement Laravel Pgvector Eloquent (`06-skills.md:1-78`)

---

## 3. No ANN Index Before Production Traffic

**Category:** Performance

**Description:** Deploying vector search to production without creating an HNSW or IVFFlat ANN index, causing full sequential scans on every query as the dataset grows.

**Why It Happens:** Development environments have small datasets where sequential scans are fast. The migration creates the vector column but no ANN index. The missing index is not noticed during testing. Deploy happens before performance testing at scale.

**Warning Signs:**
- Vector queries are fast in development, slow in production
- Query latency grows linearly with record count
- EXPLAIN ANALYZE shows Sequential Scan on vector column
- No migration for ANN index exists (only vector column migration)
- Production performance alerts trigger immediately after launch

**Why Harmful:** Without an ANN index, every vector query computes distance against every stored vector. At 500K records × 1536 dimensions, each query is 768M distance computations. This is not just slow — it is operationally unscalable. The database spends most of its CPU on full scans, impacting all other queries.

**Consequences:**
- Search times of 5-30 seconds at production scale
- Database CPU pinned at 100% from vector queries
- Connection pool exhaustion as queries take seconds each
- Emergency index creation during production hours
- Feature rollback if index creation requires downtime

**Alternative:** Create the ANN index in the same migration that adds the vector column. Use HNSW as the default type.

**Refactoring Strategy:**
1. Measure production vector query latency (baseline pain point)
2. Schedule maintenance window for index creation
3. Add migration: `DB::statement('CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200)')`
4. Verify latency improvement after index build
5. Add index creation to deployment runbook for future vector features

**Detection Checklist:**
- [ ] Does a migration create an ANN index for every vector column?
- [ ] Does EXPLAIN ANALYZE show Index Scan for production vector queries?
- [ ] Are new vector features gated on index creation before deploy?
- [ ] Is the index type (HNSW) appropriate for the workload?

**Related Rules/Skills/Trees:**
- Rule: Create ANN Index for Production Vector Search (`05-rules.md:71-98`)
- Skill: Configure and Implement Laravel Pgvector Eloquent (`06-skills.md:1-78`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

---

## 4. Unbenchmarked Impact on Transactional Queries

**Category:** Performance

**Description:** Running pgvector search queries on the primary database without benchmarking their impact on concurrent transactional (OLTP) operations, risking production performance degradation.

**Why It Happens:** Vector search is deployed on the existing PostgreSQL database for architectural simplicity. The performance characteristics of vector operations (CPU-intensive distance computations, large index builds) differ fundamentally from typical OLTP workloads. The impact on inserts, updates, and simple selects is not measured until production.

**Warning Signs:**
- Vector search runs on the same database as user-facing CRUD operations
- No benchmark comparing application performance with and without vector search
- Transaction latency increased after deploying vector search
- Database CPU utilization spiked after vector search launch
- Index builds during maintenance windows slow down concurrent queries

**Why Harmful:** pgvector operations consume significant CPU and memory. ANN index builds can peg CPU at 100% for 30+ minutes. Concurrent vector queries increase database load, competing with transactional queries for resources. Without benchmarking, the impact on user-facing operations (order placement, user registration, content updates) is unknown until it causes a degradation.

**Consequences:**
- Increased latency for user-facing CRUD operations
- Database performance degradation during vector index rebuilds
- Higher database infrastructure costs (need larger instance)
- Application performance alert correlated with vector search launch
- Emergency architecture change to read-replicas or dedicated vector database

**Alternative:** Before deploying vector search on the primary database, benchmark the impact of vector queries and index builds on transactional performance. Consider using a read-replica for vector search queries, or a dedicated pgvector instance.

**Refactoring Strategy:**
1. Benchmark transactional query latency under production load
2. Add vector search workload alongside and re-measure
3. If impact > acceptable threshold, offload vector queries to read-replica
4. Configure read-replica for vector search in application configuration
5. For high-traffic applications, consider dedicated vector database

**Detection Checklist:**
- [ ] Is the performance impact of vector search on OLTP benchmarked?
- [ ] Are read-replicas considered for vector query offloading?
- [ ] Are index builds scheduled outside peak traffic?
- [ ] Is database CPU and connection utilization monitored?

**Related Rules/Skills/Trees:**
- Rule: Benchmark Performance Impact on Transactional Queries (`05-rules.md:100-130`)
- Skill: Optimize and Monitor Laravel Pgvector Eloquent (`06-skills.md:82-158`)

---

## 5. Direct SQL Vector Column Changes Without Migration

**Category:** Maintainability

**Description:** Adding or altering vector columns by executing raw SQL directly on the database instead of through Laravel migrations, losing version control and environment consistency.

**Why It Happens:** During prototyping or debugging, running `ALTER TABLE ... ADD COLUMN embedding vector(1536)` directly is faster than creating a migration. The change works on the current environment and is forgotten. When deploying to a new environment, the column is missing and the error surfaces at runtime.

**Warning Signs:**
- `$table->vector()` does not appear in any migration file
- `DB::statement('ALTER TABLE ...')` is executed in environment setup scripts
- Fresh environment setup requires manual SQL commands
- CI/CD fails on first deploy because vector column is missing
- Team has a "manual DB setup" checklist for new environments

**Why Harmful:** Manual SQL changes bypass Laravel's migration system — they are not version-controlled, not reversible, and not automatically applied across environments. Every new environment (local dev, CI, staging, production) requires the SQL to be run manually. Rollbacks cannot revert the change. Deployment automation cannot detect that the schema change is missing.

**Consequences:**
- Failed deployments when vector column is missing
- Environment drift (schema differs across environments)
- Rollbacks that leave vector columns orphaned or missing
- Onboarding friction for new developers
- Audit/compliance issues: untracked schema changes

**Alternative:** Always add vector columns through Laravel migrations using `Schema::table()` with `$table->vector()`. Include both the column creation and ANN index creation in the same migration.

**Refactoring Strategy:**
1. Create a migration: `php artisan make:migration add_vector_column_to_documents`
2. Add `$table->vector('embedding', 1536)` in the migration
3. Add `DB::statement('CREATE INDEX ...')` for ANN index
4. Create a down method that drops the index and column
5. Deploy migration to all environments
6. Remove manual SQL steps from runbooks

**Detection Checklist:**
- [ ] Is every vector column created through a Laravel migration?
- [ ] Are vector column changes reversible (down method exists)?
- [ ] Can a fresh environment be fully provisioned with `php artisan migrate`?
- [ ] Are manual SQL setup steps documented (and effort to migrate them)?

**Related Rules/Skills/Trees:**
- Rule: Add Vector Column via Migration (`05-rules.md:131-161`)
- Skill: Configure and Implement Laravel Pgvector Eloquent (`06-skills.md:1-78`)
