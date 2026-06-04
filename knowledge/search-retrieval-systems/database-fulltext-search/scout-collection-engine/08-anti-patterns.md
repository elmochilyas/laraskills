# ECC Anti-Patterns — Scout Collection Engine
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Database Full-Text Search | Knowledge Unit | Scout Collection Engine | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Collection Engine in Production
2. Testing Only with Collection Engine
3. Expecting Production Features from Collection Engine
4. Large Dataset Collection Engine Search
5. Missing Explicit SCOUT_DRIVER Configuration
---
## Repository-Wide Anti-Patterns
- Using collection engine beyond development and testing
- Not testing search features with the actual production engine
- Assuming the collection engine behaves identically to dedicated engines
---
## Anti-Pattern 1: Collection Engine in Production
### Category
Performance | Scalability
### Description
Running Scout with `SCOUT_DRIVER=collection` in production, loading every searchable record into PHP memory and using `Str::is()` for pattern matching on every search request.
### Why It Happens
Default Scout configuration may use the collection engine. Developers don't explicitly set `SCOUT_DRIVER` in production environment. The engine "works" with small datasets so the issue goes unnoticed until data grows.
### Warning Signs
- Production search returns results but is surprisingly slow
- Memory usage spikes when search is used
- PHP memory limit errors from search pages
- No SCOUT_DRIVER set in production .env
- `Str::is()` pattern matching visible in debug backtrace
### Why Harmful
Collection engine loads ALL records from the database into PHP memory on every search. A 10K record model at 2KB per record uses 20MB per search. Under 10 concurrent searches, that's 200MB for just search. Search time is O(n) — linear scan.
### Consequences
- Out-of-memory errors under moderate traffic
- 5-30 second search times on datasets >10K records
- Server resource exhaustion from concurrent searches
- Database loaded from fetching all records on every search
### Alternative
Set `SCOUT_DRIVER=database` or a dedicated engine in production. Never use the collection engine outside development and test environments.
### Refactoring Strategy
1. Set `SCOUT_DRIVER=database` in production .env immediately
2. Create FULLTEXT indexes for better database engine performance
3. For >50K records: migrate to Meilisearch, Typesense, or Algolia
4. Test search performance with the new engine
5. Add CI check that prevents collection engine in production
### Detection Checklist
- [ ] SCOUT_DRIVER not set to collection in production
- [ ] Production search uses database or dedicated engine
- [ ] Memory usage stable during search traffic
- [ ] No Str::is() search queries in production
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Testing Only with Collection Engine
### Category
Testing | Reliability
### Description
Running all search-related tests only with the collection engine (or Scout::fake()) without testing against the actual production engine, missing engine-specific behavior differences.
### Why It Happens
Collection engine tests are fast and don't require external services. CI pipelines don't start search engine containers. Tests pass with collection but fail with the production engine.
### Warning Signs
- All search tests use `Scout::fake()` or collection engine
- No CI job running tests against the production engine
- Search features work in tests but fail in production
- Engine-specific behaviors (typo tolerance, filtering) untested
### Why Harmful
The collection engine behaves differently from dedicated engines. It doesn't support typo tolerance, doesn't use the same filter syntax, and doesn't paginate at the engine level. Tests that pass with collection may fail with the real engine.
### Consequences
- Production incidents from untested engine behavior
- "Works locally" syndrome — CI doesn't catch engine-specific issues
- Emergency fixes after deployment for engine incompatibilities
### Alternative
Run integration tests against the production engine in CI, at minimum for critical search behaviors.
### Refactoring Strategy
1. Add CI job that runs search tests with the production engine
2. Start engine container in CI pipeline (Docker Compose)
3. Use `SCOUT_DRIVER` to switch engines in CI
4. Run full search test suite against both collection and production engine
5. Document engine-specific test differences
### Detection Checklist
- [ ] Integration tests run against production engine in CI
- [ ] No "works in test, fails in prod" engine issues
- [ ] Engine container provisioned in CI pipeline
- [ ] Both collection and production engine tested
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Expecting Production Features from Collection Engine
### Category
Design | Reliability
### Description
Building search UX that depends on relevance ranking, typo tolerance, faceted search, or pagination performance — features the collection engine explicitly does not support.
### Why It Happens
Scout's unified API hides which engine is running. Developers design search interactions that work with dedicated engines but silently degrade with collection.
### Warning Signs
- Relevance-based sorting expected but collection uses Str::is() matching
- Typo tolerance expected but collection does exact pattern matching
- Pagination performance expected but collection loads all records
- Faceted search expected but collection doesn't support facets
### Why Harmful
The collection engine provides none of these features. Search UX designed for a dedicated engine silently degrades. Pagination appears broken (all results loaded, paginated in memory). No relevance ranking.
### Consequences
- Search UX degrades silently when running with collection engine
- Pagination loads all results into memory (performance bomb)
- No typo tolerance or fuzzy matching
- Unexpected behavior differences between environments
### Alternative
Match search UX design to the capabilities of the engine used in each environment. Test with the production engine to verify UX requirements.
### Refactoring Strategy
1. Document which engine runs in each environment
2. Design search UX around the PRODUCTION engine's capabilities
3. Use only Scout's Builder API (engine-agnostic)
4. Test search UX with the production engine, not collection
5. Add environment detection to warn when collection engine is used in production
### Detection Checklist
- [ ] Search UX matches production engine capabilities
- [ ] No reliance on features only available in dedicated engines
- [ ] Testing uses production engine for verification
- [ ] Environment-specific engine configuration documented
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Large Dataset Collection Engine Search
### Category
Performance
### Description
Using the collection engine with datasets of 1000+ records, causing memory and performance issues even in development environments.
### Why It Happens
Developers seed 10K records for realistic development and use the collection engine for convenience. Search becomes unusably slow in the dev environment.
### Warning Signs
- Dev environment search takes >2 seconds
- Browser DevTools shows search API responses >2 seconds
- Docker container memory usage high in dev
- Developers avoid using search in development
### Why Harmful
The development experience degrades. Developers can't effectively test search features because search is too slow. Features that depend on search (autocomplete, faceted filtering) are frustrating in development.
### Consequences
- Reduced developer productivity
- Search features tested less thoroughly
- Frustrated developers who avoid search-dependent work
### Alternative
Use the database engine in development for datasets >100 records. It's equally convenient (no external service) but much faster.
### Refactoring Strategy
1. Set `SCOUT_DRIVER=database` in .env.local
2. Create FULLTEXT indexes in development migration
3. Or use Meilisearch in Docker for development (fastest option)
4. Continue using collection engine only for unit tests
5. Benchmark dev environment search after engine change
### Detection Checklist
- [ ] Dev environment uses database or dedicated engine
- [ ] Dev search response time <500ms
- [ ] No collection engine for datasets >100 records
- [ ] Developers can effectively test search features
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Missing Explicit SCOUT_DRIVER Configuration
### Category
Reliability | Operations
### Description
Not explicitly setting `SCOUT_DRIVER` in environment files, causing the engine to default to the `collection` engine when the config uses `env('SCOUT_DRIVER', 'collection')` or leaving engine choice ambiguous.
### Why It Happens
Developers rely on defaults. The config file defines a default engine, but environment files don't override it explicitly.
### Warning Signs
- No `SCOUT_DRIVER` in any .env file
- Config contains `env('SCOUT_DRIVER', 'collection')`
- Production may be running collection engine inadvertently
- Different developers use different engines locally
### Why Harmful
Ambiguous engine configuration leads to the collection engine running in production. Different developer environments use different engines, causing "works on my machine" issues.
### Consequences
- Production performance surprises when collection engine is the default
- Inconsistent search behavior across team members
- Hard to debug environment-specific search issues
### Alternative
Explicitly set `SCOUT_DRIVER` in every environment's .env file. Never rely on defaults for engine selection.
### Refactoring Strategy
1. Set `SCOUT_DRIVER=database` in .env.example
2. Set `SCOUT_DRIVER=database` in production .env
3. Set `SCOUT_DRIVER=collection` in .env.testing (for unit tests)
4. Remove default from config or set default to 'database'
5. Add CI check that verifies SCOUT_DRIVER is set explicitly
### Detection Checklist
- [ ] SCOUT_DRIVER set explicitly in all .env files
- [ ] Production .env has non-collection engine
- [ ] Testing .env may use collection (intentional)
- [ ] No ambiguity about which engine is used where
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
