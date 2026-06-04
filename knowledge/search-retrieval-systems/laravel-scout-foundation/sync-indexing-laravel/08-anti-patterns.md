# ECC Anti-Patterns — Sync Indexing in Laravel
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | Sync Indexing in Laravel | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Sync Indexing in Production
2. Sync Indexing for Bulk Operations
3. No Queue Fallback for Remote Search Engines
4. Relying on Sync Indexing for Consistency Guarantees
5. Production-Development Config Drift on Queue Settings
---
## Repository-Wide Anti-Patterns
- Using identical queue settings across all environments
- Not understanding the latency cost of sync indexing
- Confusing sync indexing with data consistency
---
## Anti-Pattern 1: Sync Indexing in Production
### Category
Performance | Scalability
### Description
Running Scout with synchronous indexing (`SCOUT_QUEUE=false`) in production, adding search engine round-trip latency to every HTTP response that modifies a model.
### Why It Happens
Developers configure Scout locally (sync mode), test it, and deploy to production without changing the queue setting. Sync mode is Scout's default.
### Warning Signs
- HTTP response spikes of 100-500ms on model create/update
- Search engine latency visible in application performance monitoring
- API endpoints fail when search engine is slow or timeout
- SCOUT_QUEUE not set in production .env (defaults to false)
- Queue worker not configured for Scout
### Why Harmful
Search engine latency directly impacts user-facing operations. A 200ms Algolia API call adds 200ms to every post save. If the search engine is degraded, the entire application is degraded.
### Consequences
- Slow form submissions and API responses
- Application partially unavailable during search engine issues
- Higher p99 latency from search engine tail latencies
- User complaints about slow page loads
### Alternative
Enable queue-based indexing for all production environments by setting `SCOUT_QUEUE=true`.
### Refactoring Strategy
1. Set `SCOUT_QUEUE=true` in production .env
2. Configure queue driver (Redis recommended for low latency)
3. Start queue worker for Scout index queue
4. Remove sync indexing from critical request paths
5. Verify HTTP response times decrease after switching to queue
### Detection Checklist
- [ ] SCOUT_QUEUE=true in production
- [ ] Queue worker running for Scout jobs
- [ ] No search engine latency in HTTP response times
- [ ] Model saves succeed when search engine is offline
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Queue vs Synchronous Indexing Mode
---
## Anti-Pattern 2: Sync Indexing for Bulk Operations
### Category
Performance
### Description
Using sync indexing while performing bulk operations (updating 1000+ records), causing thousands of sequential search engine API calls within a single HTTP request.
### Why It Happens
Even with queue enabled, if a developer calls `$post->save()` in a loop without `withoutSyncingToSearch()`, each save fires a sync index update before the next iteration.
### Warning Signs
- Bulk operations timeout or take minutes
- foreach loops updating models one by one without suppression
- Search engine receives a call for each iteration of the loop
- Queue is enabled but sync calls still happen in bulk operations
### Why Harmful
Each `save()` in a loop triggers an index update. 1000 iterations = 1000 API calls, each taking 50-200ms = 50-200 seconds of sequential wait time. The HTTP request times out before the operation completes.
### Consequences
- HTTP timeout from long-running bulk operations
- Partial updates: some records indexed, others not
- Search engine API rate limits hit
- Server resource exhaustion from concurrent API calls
### Alternative
Wrap bulk operations in `withoutSyncingToSearch()` and batch re-index after.
### Refactoring Strategy
1. Wrap bulk update loops in `Model::withoutSyncingToSearch(fn() => { ... })`
2. After loop: `Model::whereIn('id', $ids)->searchable()` (batch index)
3. For very large datasets: use chunked searchable() calls
4. Monitor API call volume before and after
### Detection Checklist
- [ ] Bulk operations use withoutSyncingToSearch()
- [ ] Post-bulk batch re-index in place
- [ ] API call volume proportional to chunks, not records
- [ ] Bulk operations complete within acceptable time
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: No Queue Fallback for Remote Search Engines
### Category
Reliability
### Description
Running sync indexing with remote search engines (Algolia, Typesense Cloud, Meilisearch Cloud) where network latency makes synchronous indexing prohibitively slow.
### Why It Happens
Teams deploy to cloud without adjusting configuration. Sync worked locally with localhost Meilisearch. They don't account for 50-200ms network round-trip to cloud search engines.
### Warning Signs
- Higher latency in cloud production vs local development
- Search engine in different region or data center
- API calls to search engine add visible latency to page loads
- No queue configuration despite using cloud search engine
### Why Harmful
Cloud search engines add 50-200ms network latency per API call. Sync indexing multiplies this across all write operations. Your application's performance is now tied to network conditions between your server and the search engine provider.
### Consequences
- Slow application response due to cross-region network latency
- Increased error rates from network timeouts
- Higher infrastructure costs from longer request durations
### Alternative
Always enable queue-backed indexing when using remote search engines where network latency is a factor.
### Refactoring Strategy
1. Enable SCOUT_QUEUE=true
2. Configure local queue driver (Redis) for minimal overhead
3. Search engine API calls happen in queue workers, not HTTP requests
4. Verify HTTP response times no longer include search engine latency
5. Monitor queue processing time for index jobs
### Detection Checklist
- [ ] Queue enabled for all production environments with remote engines
- [ ] No search engine latency in HTTP response times
- [ ] Queue processing time monitored
- [ ] Index jobs retry on network failure
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Relying on Sync Indexing for Consistency Guarantees
### Category
Architecture | Reliability
### Description
Assuming sync indexing guarantees immediate search index consistency, not accounting for database transactions, queue failures, or eventual consistency in the search engine itself.
### Why It Happens
Developers think "sync = consistent" because the API call happens during the request. They don't consider transaction rollback, partial failures, or engine-side indexing delay.
### Warning Signs
- Code reads model from search immediately after write
- Post-save logic depends on search index being updated
- JavaScript reads search results after form submission
- No handling of stale search results after write
### Why Harmful
Even sync indexing has consistency gaps: the database transaction may roll back after the search update, the search engine may have internal indexing delay (synchronous from client perspective, but not immediately searchable), or partial failures leave inconsistent state.
### Consequences
- Search gets data that database rolled back
- Read-after-write inconsistency despite sync indexing
- Hard-to-reproduce bugs from assumed consistency
### Alternative
Design applications for eventual consistency of search indexes. Don't depend on search reflecting the latest write. Use database reads for post-write consistency.
### Refactoring Strategy
1. Remove code that reads from search immediately after write
2. Use database queries for post-write consistency
3. Add frontend handling for stale search (polling, refresh indicators)
4. Document that search indexes are eventually consistent
5. Add monitoring for search-database drift
### Detection Checklist
- [ ] No immediate read-after-write from search index
- [ ] Database used for post-write consistency
- [ ] Eventual consistency documented
- [ ] Search-database drift monitored
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Queue vs Synchronous Indexing Mode
---
## Anti-Pattern 5: Production-Development Config Drift on Queue Settings
### Category
Reliability | Maintainability
### Description
Development environment has sync indexing (fast for debugging) while production has queue indexing, but tests don't run with queue mode, missing bugs that only occur with async indexing.
### Why It Happens
Dev uses sync for convenience (no queue worker needed). Tests also run in sync mode. Production uses queue. Queue-specific issues only surface after deployment.
### Warning Signs
- Tests pass locally with sync but fail in production
- Index order or timing issues in production only
- Queue worker crashes from test-untested job payloads
- Race conditions in production that never appear in testing
### Why Harmful
Bugs introduced by async indexing (job serialization, payload size limits, ordering) are never caught in development. Production incidents from untested queue behavior are common and preventable.
### Consequences
- Production incidents from queue-specific bugs
- Emergency fixes after deploy for job payload issues
- Developer frustration: "it worked in dev"
### Alternative
Run search-related tests with both sync and queue modes, or at minimum run a subset of integration tests with queue mode in CI.
### Refactoring Strategy
1. Add CI job with SCOUT_QUEUE=true to test async indexing behavior
2. Test job serialization payload sizes match queue driver limits
3. Add integration test that verifies index updates complete asynchronously
4. Document queue-related behavior differences for the team
5. Consider testing with the actual queue driver (Redis, SQS) in CI
### Detection Checklist
- [ ] Tests run with queue mode in CI
- [ ] Job serialization tested
- [ ] No production-only queue indexing bugs
- [ ] Async indexing behavior tested pre-deploy
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
