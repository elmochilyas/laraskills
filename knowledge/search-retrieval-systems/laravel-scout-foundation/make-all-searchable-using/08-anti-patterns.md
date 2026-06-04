# ECC Anti-Patterns — makeAllSearchableUsing / makeSearchableUsing
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | makeAllSearchableUsing / makeSearchableUsing | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Missing Eager Loading During Batch Import (N+1 Disaster)
2. makeAllSearchableUsing Without makeSearchableUsing
3. Adding Filters That Conflict with Incremental Sync
4. Not Overriding When Relations Are Indexed
5. Ignoring Chunk Size Impact on Import Performance
---
## Repository-Wide Anti-Patterns
- Assuming toSearchableArray relation access doesn't need eager loading
- Using the same query for batch import and incremental sync without consideration
- Not testing import performance with realistic data volumes
---
## Anti-Pattern 1: Missing Eager Loading During Batch Import
### Category
Performance
### Description
Indexing related data in `toSearchableArray()` without implementing `makeAllSearchableUsing()` to eager-load those relationships, causing N+1 query explosion during batch import.
### Why It Happens
Developers add `$this->author->name` to `toSearchableArray()` without realizing that `scout:import` loads each record individually, triggering a separate query for every relation access on every record.
### Warning Signs
- scout:import with 10K records generates 30K+ SQL queries
- Database CPU spikes to 100% during import
- Import takes hours instead of minutes
- MySQL slow query log fills during import
- DB::enableQueryLog() shows relation queries per record
### Why Harmful
Importing 100,000 records with 3 relations generates 300,000+ queries. The import that should take 5 minutes takes 5 hours. Database server is overwhelmed, affecting other application users.
### Consequences
- Import timeout and failure mid-way
- Database performance degradation for other users during import
- Frustrated developers running overnight imports
- Increased infrastructure costs from prolonged database load
### Alternative
Always implement `makeAllSearchableUsing()` to eager-load every relation accessed in `toSearchableArray()`.
### Refactoring Strategy
1. Identify all relations used in toSearchableArray()
2. Add `makeAllSearchableUsing($query) { return $query->with(['author', 'category', 'tags']); }`
3. Verify query count reduction using DB::enableQueryLog()
4. Test import performance with realistic data volume
5. Document eager loading strategy for the team
### Detection Checklist
- [ ] makeAllSearchableUsing() eager-loads all indexed relations
- [ ] Import generates (1 + relations) queries per chunk, not per record
- [ ] Query count verified with DB::enableQueryLog()
- [ ] Import duration proportional to record count, not record count * relations
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: makeAllSearchableUsing Without makeSearchableUsing
### Category
Reliability
### Description
Implementing `makeAllSearchableUsing()` to customize the batch import query but not `makeSearchableUsing()`, causing manual `->searchable()` calls to behave differently from `scout:import`.
### Why It Happens
Developers see `makeAllSearchableUsing` and assume it covers both batch and manual `searchable()` scenarios. The two methods are independent.
### Warning Signs
- `Model::all()->searchable()` produces different results than `scout:import`
- Manual re-index produces different index data than batch import
- Relations present after scout:import missing after manual searchable()
- Only makeAllSearchableUsing() is implemented, not makeSearchableUsing()
### Why Harmful
Manual re-index operations (triggered programmatically) produce incomplete or different index data than batch import. Recovery operations that use searchable() instead of scout:import produce inconsistent results.
### Consequences
- Inconsistent data between batch and manual re-index
- Recovery operations produce wrong search data
- Debugging sessions chasing phantom inconsistencies
### Alternative
Implement both `makeAllSearchableUsing()` (for scout:import) and `makeSearchableUsing()` (for manual searchable() calls) when customizing import queries.
### Refactoring Strategy
1. Add `makeSearchableUsing($query)` alongside existing `makeAllSearchableUsing()`
2. Ensure both methods apply the same eager loading and filters
3. Consider extracting common query logic into a private method
4. Test both scout:import and manual searchable() produce identical results
5. Document the relationship between the two methods
### Detection Checklist
- [ ] Both makeAllSearchableUsing() and makeSearchableUsing() implemented
- [ ] Both methods produce identical import behavior
- [ ] test verifies scout:import and manual searchable() parity
- [ ] Common query logic extracted and shared
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Adding Filters That Conflict with Incremental Sync
### Category
Reliability
### Description
Adding `->where()` conditions in `makeAllSearchableUsing()` that filter out records which are otherwise indexed during incremental sync, causing inconsistency between batch and incremental indexing.
### Why It Happens
Developers use `makeAllSearchableUsing()` to apply filters for performance or business logic without considering that `shouldBeSearchable()` already handles conditional indexing separately.
### Warning Signs
- Batch import excludes records that incremental sync includes
- scout:import and model-save produce different index states
- Filters in makeAllSearchableUsing duplicate or contradict shouldBeSearchable()
- Records appear in search after save but disappear after batch re-index
### Why Harmful
The search index state depends on which indexing method was used last. This creates unpredictable behavior: a batch re-index can make records disappear, while individual saves bring them back.
### Consequences
- Users see disappearing search results
- Inconsistency between environments
- Debugging nightmare of racing indexing methods
### Alternative
Use `shouldBeSearchable()` for conditional indexing consistently. Use `makeAllSearchableUsing()` only for eager loading and query optimization, not for record filtering.
### Refactoring Strategy
1. Remove `->where()` filters from makeAllSearchableUsing()
2. Move filtering logic to shouldBeSearchable() (already called during batch import)
3. Keep only eager loading in makeAllSearchableUsing()
4. Re-index verify batch and incremental produce identical results
5. Add test comparing batch and incremental index outcomes
### Detection Checklist
- [ ] makeAllSearchableUsing() does not filter records
- [ ] shouldBeSearchable() is the single source of conditional indexing
- [ ] Batch and incremental indexing produce identical results
- [ ] No conflicting gating logic between methods
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Indexing Strategy Selection
---
## Anti-Pattern 4: Not Overriding When Relations Are Indexed
### Category
Performance
### Description
Indexing related data in `toSearchableArray()` without implementing `makeAllSearchableUsing()` at all, accepting the default N+1 import behavior.
### Why It Happens
Developers don't know about `makeAllSearchableUsing()`. They see search working and don't realize the performance problem during batch import.
### Warning Signs
- No `makeAllSearchableUsing()` method on any Searchable model
- toSearchableArray() accesses `$this->relation->field`
- scout:import is slow but no one investigated why
- Team has never measured search import query count
### Why Harmful
The N+1 problem silently degrades import performance. As the dataset grows, import time grows quadratically with relation count. At 100K records with 2 relations, import generates 200K+ unnecessary queries.
### Consequences
- Import duration grows faster than dataset size
- Database load spikes during imports
- Import failures on larger datasets
### Alternative
Implement `makeAllSearchableUsing()` for every Searchable model that indexes relation data.
### Refactoring Strategy
1. Audit all Searchable models for relation data in toSearchableArray()
2. For each: add `makeAllSearchableUsing($query) { return $query->with([...]); }`
3. Measure query count before and after
4. Document the performance improvement
5. Add CI check that flags models with relations in toSearchableArray but no makeAllSearchableUsing
### Detection Checklist
- [ ] makeAllSearchableUsing() on all models with relation data
- [ ] Query count per import chunk within expected range
- [ ] Import performance benchmarked
- [ ] CI checks for missing makeAllSearchableUsing()
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Ignoring Chunk Size Impact on Import Performance
### Category
Performance
### Description
Using the default chunk size (500) for all imports without considering model complexity, relation count, or memory constraints, causing out-of-memory errors or suboptimal import speed.
### Why It Happens
Default chunk size works for simple models. Teams don't tune it for models with many relations or large toSearchableArray payloads.
### Warning Signs
- PHP memory limit exhausted during scout:import
- Import is slower than expected despite eager loading
- Memory usage spikes during each chunk processing
- Chunk size never modified from default
### Why Harmful
Too-large chunks with heavy relations cause memory exhaustion. Too-small chunks increase API call count and import duration. Either way, import performance is suboptimal.
### Consequences
- Import fails with "allowed memory size exhausted" error
- Import takes 2x-3x longer than necessary
- Server resource contention from memory spikes
### Alternative
Tune chunk size per model based on payload size, relation count, and available memory.
### Refactoring Strategy
1. Profile memory usage during import with default chunk size (500)
2. For models with large payloads: reduce chunk size to 100-200
3. For simple models with no relations: increase chunk size to 1000
4. Test import with various chunk sizes and measure duration + memory
5. Set chunk size in `config/scout.php` per model if needed
### Detection Checklist
- [ ] Chunk size tuned per model or dataset
- [ ] Memory usage within limits during import
- [ ] Import duration benchmarked and optimized
- [ ] Chunk size configuration documented
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
