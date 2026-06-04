# ECC Anti-Patterns — Model Observer Indexing
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Real-Time Indexing | Knowledge Unit | Model Observer Indexing | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Non-Queued Observers in Production
2. No shouldBeSearchable Gate on Indexing
3. Not Using withoutSyncingToSearch for Bulk Operations
4. Ignoring Soft Delete Observer Behavior
5. Observer-Created Infinite Loops
---
## Repository-Wide Anti-Patterns
- Not testing observer behavior (especially delete and restore)
- Assuming observers fire for all Eloquent operations (direct DB updates bypass them)
- No distinction between synced and async observer modes in different environments
---
## Anti-Pattern 1: Non-Queued Observers in Production
### Category
Performance | Reliability
### Description
Using synchronous model observers in production, blocking HTTP responses on search engine latency for every model save.
### Why It Happens
Default Scout configuration is synchronous. Developers must explicitly enable queue.
### Warning Signs
- HTTP response times include search engine latency
- Slow model saves correlated with search engine response time
- `'queue' => true` not set in config/scout.php
- User-facing latency from indexing operations
### Why Harmful
Every model save waits for the search engine to confirm indexing. This adds 20-200ms to every HTTP response and makes application performance dependent on search engine availability.
### Consequences
- Increased page load times from indexing latency
- Application slowdown during search engine issues
- Poor user experience from slow saves
- Unnecessary coupling between search engine and application performance
### Alternative
Enable queue for production: `'queue' => true` in `config/scout.php`.
### Refactoring Strategy
1. Set `'queue' => true` in production config
2. Verify queue worker running (php artisan queue:work)
3. Test: model save returns quickly without search engine latency
4. Monitor failed jobs to ensure indexing completes
5. Set `'queue' => false` in development/testing
### Detection Checklist
- [ ] queue = true in production config
- [ ] Queue worker running
- [ ] Model saves no longer block on search engine
- [ ] Failed jobs monitored for indexing issues
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: No shouldBeSearchable Gate on Indexing
### Category
Data Quality | Performance
### Description
Not implementing `shouldBeSearchable()` on models, indexing all records including those that should never appear in search (drafts, inactive, archived).
### Why It Happens
Default behavior indexes all records. Developers forget to gate which records should be searchable.
### Warning Signs
- Draft/unpublished records appear in search results
- Archived or soft-deleted records in search index
- No `shouldBeSearchable()` method on model
- Users see content they shouldn't access
### Why Harmful
Draft and unpublished content leaks into search results. Users see content that isn't ready. Inactive products appear as available. Index space is wasted on non-searchable records.
### Consequences
- Sensitive/incomplete content exposed in search
- Users confused by unavailable content in results
- Index size inflated with non-searchable records
- Wasted indexing operations on records that shouldn't be indexed
### Alternative
Implement `shouldBeSearchable()` on all Searchable models to gate indexing based on model state.
### Refactoring Strategy
1. Add `shouldBeSearchable(): bool` method to each Searchable model
2. Return false for: drafts, inactive records, archived, unpublished
3. Test: draft records not indexed, publish triggers indexing
4. Clean up existing index by removing non-searchable records
5. Document shouldBeSearchable logic
### Detection Checklist
- [ ] shouldBeSearchable implemented on all Searchable models
- [ ] Draft/inactive records excluded from index
- [ ] Existing non-searchable records removed from index
- [ ] Index size reduced after cleanup
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Skill: Should Be Searchable Trait
---
## Anti-Pattern 3: Not Using withoutSyncingToSearch for Bulk Operations
### Category
Performance | Data Quality
### Description
Performing bulk Eloquent operations (updates, deletes) without wrapping in `withoutSyncingToSearch()`, triggering individual index operations for every record.
### Why It Happens
Developers forget that model observers fire for every record in a bulk operation.
### Warning Signs
- Bulk update triggers thousands of index operations
- Very slow bulk operations due to per-record indexing
- High search engine load during batch jobs
- Queue backlog spikes during bulk operations
### Why Harmful
Each record in a bulk operation triggers a separate index sync. For 10,000 records, that's 10,000 unnecessary index operations when a single re-index would suffice.
### Consequences
- Bulk operations extremely slow
- Search engine load spikes during batch jobs
- Queue worker backlog from redundant index operations
- Risk of search engine rate limiting
### Alternative
Wrap bulk Eloquent operations in `withoutSyncingToSearch()` and run a re-index afterward.
### Refactoring Strategy
1. Identify bulk Eloquent operations in codebase
2. Wrap with `Model::withoutSyncingToSearch()->update(...)` or `->delete()`
3. After bulk operation, run targeted re-index
4. For bulk updates to searchable fields, re-index affected records
5. Test: bulk operation executes quickly without per-record indexing
### Detection Checklist
- [ ] Bulk operations use withoutSyncingToSearch
- [ ] Re-index triggered after bulk operation if needed
- [ ] Bulk operation performance improved
- [ ] Queue backlog reduced during batch jobs
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Skill: Without Syncing To Search
---
## Anti-Pattern 4: Ignoring Soft Delete Observer Behavior
### Category
Data Quality | Reliability
### Description
Not understanding that Scout observers only remove soft-deleted models from the index on force delete, leaving soft-deleted records searchable.
### Why It Happens
Developers assume soft delete removes the record from search like a regular delete.
### Warning Signs
- Soft-deleted records still appear in search results
- Users can find records that should be unavailable
- No `restored` observer handling in tests
- Confusion about why deleted records remain in search
### Why Harmful
Soft-deleted records remain visible in search, potentially exposing data that should be hidden. Depending on the application, this could be a privacy or security issue.
### Consequences
- Deactivated products still findable in search
- Archived content accessible through search
- User data that should be hidden remains visible
- Compliance issues if soft-deleted records should be excluded
### Alternative
Implement `shouldBeSearchable()` to exclude soft-deleted records, or force delete from search on soft delete.
### Refactoring Strategy
1. Add `shouldBeSearchable()` check: `return ! $this->trashed()`
2. For immediate removal: override `delete()` to force remove from index
3. Test: soft delete removes from search immediately
4. Test: restore brings record back to search
5. Document soft delete + search behavior
### Detection Checklist
- [ ] Soft-deleted records excluded from search
- [ ] shouldBeSearchable handles trashed state
- [ ] Restore triggers re-index
- [ ] Force delete removes from search
### Related Rules/Skills/Trees
- Skill: Soft Delete Handling
- Skill: Should Be Searchable Trait
---
## Anti-Pattern 5: Observer-Created Infinite Loops
### Category
Reliability | Performance
### Description
Creating infinite loops when `toSearchableArray()` or observer logic performs saves that trigger re-indexing, causing cascading save-index-save cycles.
### Why It Happens
When `toSearchableArray()` computes values that modify the model (e.g., touch counters), or observers call save on the observed model.
### Warning Signs
- Endless queue jobs for a single model
- Model save triggers multiple index operations
- Queue backlog grows from looped indexing
- Server load spikes from cascading save events
### Why Harmful
Infinite loops consume server resources, fill the queue with redundant jobs, and may crash workers. The model is indexed hundreds of times for a single save.
### Consequences
- Excessive server load from cascading operations
- Queue worker exhaustion
- Search engine: hundreds of identical index operations
- Application performance degradation
### Alternative
Use `saveQuietly()` for internal updates and gate indexing with `searchIndexShouldBeUpdated()`.
### Refactoring Strategy
1. Audit `toSearchableArray()` for model-saving operations
2. Replace `save()` calls with `saveQuietly()` for internal updates
3. Implement `searchIndexShouldBeUpdated()` to skip indexing for non-searchable changes
4. Add loop detection: maximum indexing attempts per request
5. Test: single save produces one index operation
### Detection Checklist
- [ ] No save() calls in toSearchableArray
- [ ] Internal updates use saveQuietly
- [ ] searchIndexShouldBeUpdated prevents unnecessary indexing
- [ ] Single model save produces one index operation
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
