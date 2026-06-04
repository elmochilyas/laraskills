# ECC Anti-Patterns — Laravel Scout Searchable Trait
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | Laravel Scout Searchable Trait | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Global Searchable Trait on Base Model
2. Blind Auto-Sync Without Queue
3. Searchable Trait Without Conditional Indexing
4. Missing withoutSyncingToSearch in Bulk Operations
5. Engine-Agnostic Default Configuration
---
## Repository-Wide Anti-Patterns
- Treating the Searchable trait as a set-and-forget feature
- Assuming queue integration is optional in production
- Ignoring the cost implications of automatic index synchronization
---
## Anti-Pattern 1: Global Searchable Trait on Base Model
### Category
Architecture | Performance
### Description
Applying the `Searchable` trait to a base model class or a global trait applied to all models, causing every Eloquent model in the application to trigger search engine API calls on every save.
### Why It Happens
Convenience-driven development: adding traits to base classes avoids per-model boilerplate. Teams don't anticipate the downstream cost of every model save triggering a search API call.
### Warning Signs
- Every `Model::create()` or `Model::update()` call generates search API traffic
- Log entries, pivot table models, and session records appear in search indexes
- Search engine dashboard shows indexes for unintended model tables
- Monthly search engine bill is unexpectedly high
### Why Harmful
Models that should never be searchable (logs, pivots, cache entries) consume index storage and API quota. The application's write path is coupled to search engine availability, causing failures when the search engine is degraded.
### Consequences
- Search engine outages block application saves globally
- High SaaS costs from indexing non-content models
- Polluted search results with irrelevant model types
- API rate limits hit during normal write operations
### Alternative
Apply the `Searchable` trait selectively to individual content models that genuinely need search functionality.
### Refactoring Strategy
1. Remove `Searchable` from base model or global trait registration
2. Audit all models to determine which need search
3. Add `use Searchable;` trait only to content models
4. Customize `toSearchableArray()` and `shouldBeSearchable()` on each
5. Delete extraneous indexes from search engine
6. Re-index remaining searchable models
### Detection Checklist
- [ ] Searchable trait only on content models
- [ ] No Searchable on base Model class
- [ ] Log/pivot/meta models don't have Searchable
- [ ] Search engine cost correlates with content volume only
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Searchable Trait Implementation Strategy
---
## Anti-Pattern 2: Blind Auto-Sync Without Queue
### Category
Performance | Scalability
### Description
Using the Searchable trait's auto-sync feature in production without queue integration, causing synchronous search engine API calls on every model save.
### Why It Happens
The default Scout configuration has queue disabled. The trait works instantly, so developers don't realize every save triggers a synchronous HTTP call to the search engine.
### Warning Signs
- HTTP response times include search engine latency on writes
- Model saves fail when search engine is unreachable
- No queue worker configured for Scout jobs
- `SCOUT_QUEUE` is not set or is `false` in production
### Why Harmful
Search engine latency directly impacts user-facing write operations. A slow or unavailable search engine makes the entire application slow or broken. Queue backpressure is impossible without queue integration.
### Consequences
- Slow API responses during search engine degradation
- Application unavailable when search engine is down
- No retry mechanism for failed index updates
- No batching of index operations
### Alternative
Always enable queue-based indexing for production by setting `SCOUT_QUEUE=true` in environment configuration.
### Refactoring Strategy
1. Set `SCOUT_QUEUE=true` in production .env
2. Configure queue driver (Redis, SQS, database)
3. Start queue worker to process Scout jobs
4. Test that model saves succeed even when search engine is unreachable
5. Monitor queue backlog for Scout jobs
### Detection Checklist
- [ ] SCOUT_QUEUE=true in production
- [ ] Queue worker running for Scout jobs
- [ ] Model saves succeed when search engine is offline
- [ ] Queue backlog monitored for Scout jobs
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Queue vs Synchronous Indexing Mode
---
## Anti-Pattern 3: Searchable Trait Without Conditional Indexing
### Category
Security | Reliability
### Description
Adding the Searchable trait without implementing `shouldBeSearchable()`, causing all records including unpublished, draft, or deleted records to appear in search results.
### Why It Happens
The trait auto-syncs everything. Developers who don't read Scout's documentation may not know `shouldBeSearchable()` exists.
### Warning Signs
- Draft content appears in search
- Soft-deleted records remain in search index
- Archived items are discoverable by users
- No `shouldBeSearchable()` method on any model
### Why Harmful
Unpublished content leaks through search. Soft-deleted records remain accessible. Archive/purge workflows are undermined by persistent index entries.
### Consequences
- Draft content exposed to end users
- SEO indexing of unpublished pages
- Data retention policy violated (deleted records stay in index)
- Manual index cleanup needed after archive operations
### Alternative
Always implement `shouldBeSearchable()` on Searchable models to gate indexing based on status, visibility, and deletion state.
### Refactoring Strategy
1. Add `shouldBeSearchable()` to each Searchable model
2. Implement gating: `return $this->published_at !== null && !$this->trashed();`
3. Run full re-index to remove non-searchable records
4. Add tests for visibility gating
5. Verify restricted records are not returned by search queries
### Detection Checklist
- [ ] shouldBeSearchable() implemented on all Searchable models
- [ ] Draft/unpublished records excluded from index
- [ ] Soft-deleted records excluded from index
- [ ] Test coverage for conditional indexing logic
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Indexing Strategy Selection
---
## Anti-Pattern 4: Missing withoutSyncingToSearch in Bulk Operations
### Category
Performance | Scalability
### Description
Running bulk model operations without wrapping them in `withoutSyncingToSearch()`, causing thousands of unnecessary search index API calls during data imports, migrations, or batch updates.
### Why It Happens
Model events fire automatically on every save. During bulk operations, each iteration of the loop triggers a search index update. Teams don't realize the cumulative impact.
### Warning Signs
- Data imports trigger 10K+ API calls to search engine
- Queue backlog spikes during bulk operations
- Search engine rate limits hit during data migrations
- Bulk operations take 10x longer than expected
### Why Harmful
Bulk operations that should complete in minutes take hours. API rate limits cause indexing failures that require manual retry. Search engine costs spike due to per-request pricing.
### Consequences
- Data migration takes hours instead of minutes
- Rate-limited API calls cause partial indexing
- Unexpected cost spikes on SaaS search engines
- Queue worker overload from thousands of index jobs
### Alternative
Wrap bulk operations in `Model::withoutSyncingToSearch(fn() => { ... })` and run a full re-index afterward.
### Refactoring Strategy
1. Identify all bulk operation code (import commands, seeders, migrations)
2. Wrap with `withoutSyncingToSearch()`
3. Add `php artisan scout:import` after bulk operation completes
4. For selective models: call `Model::all()->searchable()` after operation
5. Monitor API call volume before and after refactoring
### Detection Checklist
- [ ] All bulk operations use withoutSyncingToSearch()
- [ ] Post-bulk re-index strategy documented
- [ ] API call volume during bulk ops within limits
- [ ] Queue backlog stable during bulk operations
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Indexing Strategy Selection
---
## Anti-Pattern 5: Engine-Agnostic Default Configuration
### Category
Reliability | Performance
### Description
Using Scout's engine-agnostic default configuration without tuning engine-specific settings (filterable attributes, index settings, ranking rules), leaving search quality and performance on the table.
### Why It Happens
Scout's abstraction layer hides engine differences. Developers configure the engine driver and assume defaults are optimal. Engine-specific optimizations require reading separate documentation.
### Warning Signs
- Search uses only default ranking (no custom relevance tuning)
- Filter/sort queries fail because attributes not declared per engine
- No engine-specific index settings configured
- `scout.php` config has only basic engine and queue settings
### Why Harmful
Default configuration produces poor search quality. Relevance is untuned. Filtering is broken. Sorting is incorrect. The abstraction layer becomes a leaky abstraction when engine-specific features are needed.
### Consequences
- Poor search relevance from default ranking
- Broken filter/sort functionality
- Missed performance optimizations (indexing settings, caching)
- Inconsistent search behavior across environments
### Alternative
Configure engine-specific settings (filterable attributes, ranking rules, index settings) for each Scout engine, supplementing the generic Scout configuration.
### Refactoring Strategy
1. Identify which Scout engine is in use (Meilisearch, Typesense, Algolia)
2. Read engine-specific documentation for index settings
3. Configure filterable/sortable attributes in engine settings
4. Tune ranking rules per engine (Meilisearch ranking rules, Algolia custom ranking)
5. Add `scout:sync-index-settings` to deployment pipeline
6. Test search behavior after engine-specific configuration
### Detection Checklist
- [ ] Engine-specific settings configured (not just defaults)
- [ ] Filterable attributes declared in engine config
- [ ] Sortable attributes declared in engine config
- [ ] Ranking rules tuned per use case
- [ ] Index settings synced via deployment pipeline
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
- Decision Tree: Searchable Trait Implementation Strategy
