# ECC Anti-Patterns — Indexing Strategies
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | Indexing Strategies | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Batch-Only Indexing Strategy
2. Incremental-Only Indexing Strategy
3. No Conditional Indexing Gate
4. Synchronous Production Indexing
5. Unplanned Bulk Operation Flood
---
## Repository-Wide Anti-Patterns
- Relying on a single indexing strategy when combined approach is needed
- Missing queue integration for production indexing
- No re-index plan for schema changes or corruption recovery
- Ignoring conditional indexing for visibility-gated content
---
## Anti-Pattern 1: Batch-Only Indexing Strategy
### Category
Scalability | Reliability
### Description
Using only batch indexing (periodic `scout:import`) for all index updates without incremental sync, causing the search index to become stale between batch runs.
### Why It Happens
Batch indexing is simple to implement — a single artisan command runs periodically. Teams underestimate the delay between record creation and search appearance.
### Warning Signs
- New records don't appear in search for hours or days
- Users report missing search results for recently created content
- `scout:import` cron job runs every hour with growing duration
### Why Harmful
Search becomes a snapshot that is always out of date. Users lose trust when they can't find content they just created. For time-sensitive content (news, tickets), batch-only is unacceptable.
### Consequences
- Poor user experience: new content invisible until next batch
- Operational overhead: batch duration grows with dataset size
- Race conditions: updates between batch runs are lost
### Alternative
Combine batch indexing for initial load and recovery with incremental (queue-backed) indexing for ongoing sync.
### Refactoring Strategy
1. Enable `SCOUT_QUEUE=true` in production environment
2. Verify model observer hooks trigger on save/delete
3. Remove periodic `scout:import` cron (keep for schema changes only)
4. Add `->searchable()` to model creation logic as fallback
5. Monitor index freshness with integration tests
### Detection Checklist
- [ ] Incremental indexing enabled for all Searchable models
- [ ] Queue driver configured for Scout indexing
- [ ] No periodic scout:import in production cron (except for recovery)
- [ ] Index freshness verified within seconds of model save
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Indexing Strategy Selection
---
## Anti-Pattern 2: Incremental-Only Indexing Strategy
### Category
Reliability | Scalability
### Description
Relying solely on incremental indexing without ever running batch re-index, making it impossible to recover from index corruption, schema changes, or missed updates.
### Why It Happens
Teams assume incremental sync covers all scenarios. Once the initial batch import is done, they never re-index. The index works fine until something breaks.
### Warning Signs
- No `scout:import` command in deployment or maintenance docs
- After schema changes, some fields are missing from index
- Index drift: search results diverge from database over time
### Why Harmful
Incremental indexing can miss updates due to queue failures, transaction rollbacks, or buggy `withoutSyncingToSearch()` calls. Without batch recovery, these gaps compound silently.
### Consequences
- Accumulated index drift is discovered during audit or outage
- Schema migration requires complex data migration instead of simple re-index
- No recovery path for index corruption from engine bugs
### Alternative
Always pair incremental indexing with periodic batch re-index (scheduled or event-driven) and a documented recovery procedure.
### Refactoring Strategy
1. Schedule weekly `scout:import` during low-traffic periods
2. Document re-index procedure for schema changes in deployment checklist
3. Add index health check that compares record counts between DB and search
4. Create a runbook for index corruption recovery
5. Add monitoring alert for index drift beyond threshold
### Detection Checklist
- [ ] Scheduled batch re-index in place
- [ ] Index health check with record count comparison
- [ ] Schema change checklist includes re-index step
- [ ] Recovery runbook documented
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
- Decision Tree: Indexing Strategy Selection
---
## Anti-Pattern 3: No Conditional Indexing Gate
### Category
Security | Reliability
### Description
Indexing all model records without implementing `shouldBeSearchable()`, causing draft, archived, soft-deleted, or otherwise restricted records to appear in search results.
### Why It Happens
Developers forget that `Searchable` trait syncs every record by default. The trait doesn't distinguish between published and unpublished content.
### Warning Signs
- Draft posts appear in search results
- Archived products show up in store search
- Soft-deleted records appear after restore
- Unverified user profiles are searchable
### Why Harmful
Draft and restricted content leaks through search, exposing internal information. Users see incomplete or inappropriate content. Compliance violations for unpublished PII.
### Consequences
- Security incident from unpublished content exposure
- SEO indexing of draft pages
- User trust erosion when seeing irrelevant or broken content
### Alternative
Implement `shouldBeSearchable()` on every Searchable model to gate indexing based on business rules (published status, verification state, visibility flags).
### Refactoring Strategy
1. Add `shouldBeSearchable(): bool` method to each Searchable model
2. Define visibility logic: `return $this->status === 'published';`
3. Re-index to remove non-searchable records
4. Add test that verifies draft records are not searchable
5. Review soft-delete handling: ensure `shouldBeSearchable` returns false for trashed
### Detection Checklist
- [ ] `shouldBeSearchable()` implemented on all Searchable models
- [ ] Draft/unpublished records excluded from index
- [ ] Soft-deleted records excluded
- [ ] Test coverage for visibility gating logic
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Indexing Strategy Selection
---
## Anti-Pattern 4: Synchronous Production Indexing
### Category
Performance | Scalability
### Description
Running Scout indexing synchronously in production (default configuration) without queue integration, adding search engine API latency to every HTTP response.
### Why It Happens
Developers use default Scout configuration in production. The `queue` setting in `config/scout.php` defaults to `false`. Teams don't realize every model save triggers a synchronous API call.
### Warning Signs
- HTTP response times spike by 50-500ms on model create/update
- API endpoints time out when search engine is slow or unreachable
- Failed model saves propagate to the user when search engine errors
### Why Harmful
Synchronous indexing couples database write performance to search engine response times. A slow or unavailable search engine makes the application unusable. Users experience timeouts on basic CRUD operations.
### Consequences
- Application outages when search engine is degraded
- Slow form submissions and resource creation
- Increased infrastructure costs from longer request durations
### Alternative
Always enable queue-backed indexing in production by setting `SCOUT_QUEUE=true` or 'queue' => true in `config/scout.php`.
### Refactoring Strategy
1. Set `SCOUT_QUEUE=true` in `.env.production`
2. Configure queue connection (Redis, SQS, database)
3. Start queue worker for Scout index queue
4. Remove synchronous indexing fallback code
5. Add monitoring for queue backlog and index job failures
### Detection Checklist
- [ ] `SCOUT_QUEUE=true` set in production
- [ ] Queue worker running for Scout jobs
- [ ] No synchronous indexing in critical request paths
- [ ] Monitoring for queue backlog configured
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Queue vs Synchronous Indexing Mode
---
## Anti-Pattern 5: Unplanned Bulk Operation Flood
### Category
Performance | Scalability
### Description
Running bulk model operations (imports, migrations, mass updates) without `withoutSyncingToSearch()`, triggering thousands of unnecessary search index API calls.
### Why It Happens
Model events fire on every save. During bulk operations, each iteration triggers a search index update. Teams don't realize how many API calls this generates.
### Warning Signs
- Indexing queue fills with thousands of jobs during import
- Scout API rate limits hit during bulk operations
- Bulk operations take orders of magnitude longer than expected
- Search engine bill spikes during data migration
### Why Harmful
Bulk operations become prohibitively slow. API rate limits cause indexing failures. SaaS search engine costs spike due to per-request pricing. Queue workers cannot keep up.
### Consequences
- Data imports that should take minutes take hours
- Failed indexing jobs from rate limiter hits
- Unexpected $1000+ bills on Algolia/Typesense
### Alternative
Wrap bulk operations in `withoutSyncingToSearch()` and run a targeted `scout:import` afterward.
### Refactoring Strategy
1. Identify all bulk operation code paths (imports, migrations, seeders)
2. Wrap loops with `Model::withoutSyncingToSearch(fn() => { ... })`
3. After bulk operation completes, run `php artisan scout:import` or mass `->searchable()`
4. Add test that verifies indexing behavior during bulk operations
5. Monitor queue backlog before and after bulk operations
### Detection Checklist
- [ ] All bulk operations use withoutSyncingToSearch()
- [ ] Post-bulk re-index strategy documented
- [ ] Queue backlog monitored during bulk operations
- [ ] API call volume to search engine within expected range
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Indexing Strategy Selection
