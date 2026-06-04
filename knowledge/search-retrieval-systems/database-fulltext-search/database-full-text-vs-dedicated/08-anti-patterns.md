# ECC Anti-Patterns — Database Full-Text vs Dedicated
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Database Full-Text Search | Knowledge Unit | Database Full-Text vs Dedicated | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Collection Engine in Production
2. Dedicated Engine for Tiny Applications
3. Skipping Scout Abstraction (Engine Lock-In)
4. Expecting Dedicated Engine Features from Database Engine
5. No Migration Path Planned
---
## Repository-Wide Anti-Patterns
- Not setting SCOUT_DRIVER explicitly per environment
- Assuming all engines provide the same features
- Over-engineering search infrastructure before understanding scale
---
## Anti-Pattern 1: Collection Engine in Production
### Category
Performance | Scalability
### Description
Running Scout with the `collection` engine in production, which loads all searchable records into memory and filters them using PHP `Str::is()`, causing memory exhaustion and slow queries at any scale.
### Why It Happens
Default Scout configuration uses the collection engine. Developers don't set `SCOUT_DRIVER` in production .env, leaving it on the default.
### Warning Signs
- Memory usage spikes when search is used on production
- Search takes 2-10 seconds on datasets >10K records
- No SCOUT_DRIVER set in production .env
- PHP memory limit errors during search
### Why Harmful
The collection engine loads ALL records into PHP memory for every search. A 50K-record dataset at 1KB per record uses 50MB RAM per search. Concurrent users cause memory thrashing and OOM crashes.
### Consequences
- PHP out-of-memory errors on production
- Application crashes under search load
- Database overload from loading all records on every search
- Terrible user experience with 5-second search latency
### Alternative
Use at minimum the `database` engine in production, or a dedicated engine for larger datasets.
### Refactoring Strategy
1. Set `SCOUT_DRIVER=database` in production .env (minimal improvement over collection)
2. For >50K records: migrate to Meilisearch, Typesense, or Algolia
3. Add FULLTEXT indexes if using database engine
4. Remove collection engine from production config
5. Monitor memory usage after switch
### Detection Checklist
- [ ] SCOUT_DRIVER set to a non-collection engine in production
- [ ] No Str::is() based search in production
- [ ] Production search loads no more than page-sized results into memory
- [ ] Memory usage stable during search peaks
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Dedicated Engine for Tiny Applications
### Category
Cost | Operations
### Description
Deploying a dedicated search server (Meilisearch, Typesense, Algolia) for an application with <5K records, adding unnecessary infrastructure cost, complexity, and operational burden.
### Why It Happens
Tutorials and guides focus on dedicated engines. Developers assume they need Meilisearch from day one. Scout's abstraction makes it easy to set up but doesn't mention the infra overhead.
### Warning Signs
- Search engine server costs exceed $50/month for a small app
- DevOps time spent maintaining search server for tiny dataset
- Application has <5K records but runs a separate search service
- No benchmark comparing database engine performance for current dataset
### Why Harmful
Dedicated engines cost money ($10-500+/month on cloud), require maintenance (upgrades, backups, scaling), and increase deployment complexity. For small datasets, the database engine provides comparable performance at zero additional cost.
### Consequences
- Unnecessary monthly infrastructure cost
- DevOps overhead for search server maintenance
- Complex deployment pipeline (must start search server)
- Slower local development (must run search server)
### Alternative
Start with the database engine. Benchmark at current scale. Only migrate to a dedicated engine when the database engine shows performance or feature limitations.
### Refactoring Strategy
1. Set SCOUT_DRIVER=database and test search performance
2. Benchmark with production data volume
3. If performance is acceptable: keep database engine
4. If features are needed: plan migration only when justified
5. Remove or decommission dedicated search server if over-engineered
### Detection Checklist
- [ ] Current search engine choice justified by data volume
- [ ] Benchmark shows database engine is insufficient before migrating
- [ ] No unnecessary search server costs for small apps
- [ ] Engine migration plan follows proven scaling path
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Indexing Strategy Selection
---
## Anti-Pattern 3: Skipping Scout Abstraction (Engine Lock-In)
### Category
Maintainability | Portability
### Description
Using engine-specific APIs directly (Meilisearch PHP SDK, Algolia search client) instead of Scout's abstraction, making future engine migration prohibitively expensive.
### Why It Happens
Developers use engine-native SDKs for advanced features Scout doesn't expose. Over time, more code bypasses Scout until the application is tightly coupled to the specific engine.
### Warning Signs
- Engine SDKs imported directly in controllers and services
- No Scout Builder usage for search queries
- Search logic tightly coupled to engine-specific query syntax
- Migrating to a different engine would require rewriting all search code
### Why Harmful
The application becomes locked into the search engine. Switching engines (for cost, performance, or feature reasons) requires rewriting all search logic, not just changing a config value.
### Consequences
- High switching cost: vendor lock-in
- Unable to take advantage of better-priced or better-performing alternatives
- Migrating from Algolia (expensive) to Typesense (self-hosted) is a months-long project
### Alternative
Use Scout's abstraction for all search queries. Use engine-specific callbacks sparingly, abstracted behind service classes. Keep engine-specific code isolated.
### Refactoring Strategy
1. Replace engine SDK calls with Scout Builder equivalents where possible
2. Abstract remaining engine-specific code behind service classes
3. Document that engine-specific code exists and which engine it targets
4. Plan for migration by identifying all engine-specific touchpoints
5. Use Scout::extend() for custom engine features rather than direct SDK calls
### Detection Checklist
- [ ] Primary search queries use Scout Builder API
- [ ] Engine SDKs not used in controllers
- [ ] Engine-specific code isolated in service classes
- [ ] Engine switchable by changing config (with minor abstraction layer changes)
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Expecting Dedicated Engine Features from Database Engine
### Category
Design | Reliability
### Description
Building an application that requires typo tolerance, faceted search, fuzzy matching, or personalized ranking but using only the database engine, then discovering these features aren't available.
### Why It Happens
Scout provides a unified API. Developers assume all engines support the same features. They design search UX around features the database engine can't provide.
### Warning Signs
- Search UX designed with autocomplete, typo tolerance, facets
- `SearchUsingFullText` attribute applied but no FULLTEXT index created
- Users expect "did you mean" suggestions, which MySQL doesn't provide
- Performance complaints about search on datasets the database handles poorly
### Why Harmful
Search UX must be dumbed down or redesigned when features aren't available. Users get a poor search experience compared to what dedicated engines provide. Features like faceting require complex application-level workarounds.
### Consequences
- Poor search UX compared to competitor apps with dedicated engines
- Application-level faceting that's slow and memory-intensive
- Users frustrated with lack of typo tolerance
- Late-stage engine migration (expensive and risky)
### Alternative
Understand the database engine's limitations before designing search UX. If features like typo tolerance, faceting, or fuzzy matching are required, use a dedicated engine from the start.
### Refactoring Strategy
1. Audit required search features: typo tolerance, faceting, fuzzy matching, personalization
2. If any are required: migrate to dedicated engine
3. If database engine is sufficient: design UX within its capabilities
4. Document engine feature limitations in project README
5. Set user expectations with appropriate search UX
### Detection Checklist
- [ ] Required search features documented and mapped to engine capabilities
- [ ] Database engine limitations understood before UX design
- [ ] No application-level workarounds for missing engine features
- [ ] User search experience matches engine capabilities
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: No Migration Path Planned
### Category
Maintainability | Operations
### Description
Starting with a database engine but not planning for migration to a dedicated engine, making the eventual switch painful when scale demands it.
### Why It Happens
Teams start simple with the database engine and plan to "deal with migration later." When scale hits, the lack of preparation causes rushed, risky migrations under pressure.
### Warning Signs
- Application uses database engine but expects to outgrow it
- No migration guide or runbook exists
- Scout abstraction not fully utilized (engine-specific code)
- Data volume is growing but migration is not planned
### Why Harmful
When the database engine becomes a bottleneck (typically at 50-100K records), teams must migrate under pressure. Rush migrations risk data loss, extended search downtime, and production incidents.
### Consequences
- Stressful emergency migration during performance crisis
- Extended search downtime during migration
- Higher risk of data inconsistency or loss
- Poor decisions made under time pressure
### Alternative
Document the migration path early: what engine to migrate to, what schema changes are needed, what features will be gained, and a testing plan for the migration.
### Refactoring Strategy
1. Document current dataset size, growth rate, and performance metrics
2. Identify the target dedicated engine (Meilisearch, Typesense, Algolia)
3. Create migration runbook with rollback plan
4. Test migration in staging with production data volume
5. Schedule migration during a low-traffic window
6. Document the decision: when to migrate, what triggers the migration
### Detection Checklist
- [ ] Migration path documented
- [ ] Target engine identified and tested in staging
- [ ] Runbook for engine migration exists
- [ ] Early warning metrics defined (index size, query latency thresholds)
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
