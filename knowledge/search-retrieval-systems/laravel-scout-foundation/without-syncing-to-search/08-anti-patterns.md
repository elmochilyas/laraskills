# ECC Anti-Patterns — withoutSyncingToSearch
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | withoutSyncingToSearch | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Forgetting to Re-index After Skipping Sync
2. Using withoutSyncingToSearch for Single Record Operations
3. Nesting withoutSyncingToSearch Without Understanding Scope
4. Missing withoutSyncingToSearch in Bulk Imports
5. Incorrect Re-index Scope After Bulk Operation
---
## Repository-Wide Anti-Patterns
- Misunderstanding that withoutSyncingToSearch also suppresses shouldBeSearchable evaluation
- Not documenting when and why sync is suppressed
- Using the method in the wrong scope (static vs instance)
---
## Anti-Pattern 1: Forgetting to Re-index After Skipping Sync
### Category
Reliability | Data Integrity
### Description
Using `withoutSyncingToSearch()` to suppress index updates during bulk operations but forgetting to re-index the affected records afterward, leaving records missing from or stale in the search index.
### Why It Happens
The method name suggests it just "pauses" syncing. Developers suppress sync, run the operation, and expect sync to "resume" and catch up. But no catch-up happens automatically — records modified during the block are never indexed.
### Warning Signs
- After bulk operation, new/modified records don't appear in search
- No `->searchable()` call after `withoutSyncingToSearch()` block
- Database has data that search index doesn't reflect
- Records drift between database and search index over time
### Why Harmful
Records modified during the suppressed sync window are lost to search. The database and search index diverge silently. Users can't find content that exists in the database.
### Consequences
- Missing search results for bulk-imported records
- Silent data drift requiring full re-index to fix
- User-facing inconsistency: "I know it's there but search can't find it"
### Alternative
Always pair `withoutSyncingToSearch()` with an explicit re-index step on the affected records immediately after the block.
### Refactoring Strategy
1. Add `->searchable()` call immediately after every `withoutSyncingToSearch()` block
2. For affected query: `Model::whereIn('id', $ids)->searchable()`
3. Test: verify records appear in search after bulk operation
4. Add static analysis lint to flag withoutSyncingToSearch without re-index
### Detection Checklist
- [ ] Every withoutSyncingToSearch() block has post-operation re-index
- [ ] Records appear in search after bulk operations
- [ ] No silent data drift between DB and search index
- [ ] Static analysis checks for missing re-index after sync suppression
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Using withoutSyncingToSearch for Single Record Operations
### Category
Performance | Maintainability
### Description
Wrapping single-record operations in `withoutSyncingToSearch()` when the overhead of a single index update is negligible, adding unnecessary complexity.
### Why It Happens
Developers cargo-cult the pattern from bulk operations. They wrap every model update in the method "just in case", without considering the actual API call volume.
### Warning Signs
- Every controller that updates a model uses `withoutSyncingToSearch()`
- Single record updates wrapped in the method
- Code comments say "just in case" or "to be safe"
- Re-index called immediately after for a single record
### Why Harmful
The method adds cognitive overhead and code complexity for zero benefit on single-record operations. It also introduces risk of forgetting the re-index step.
### Consequences
- More complex code with no performance benefit
- Increased risk of bugs from forgotten re-index after individual saves
- Confusing code that suggests a bulk operation that doesn't exist
### Alternative
Use `withoutSyncingToSearch()` only for batch operations affecting 100+ records. For individual saves, let Scout handle the index update automatically.
### Refactoring Strategy
1. Audit all `withoutSyncingToSearch()` usages
2. Remove wrapping for single-record operations
3. Keep only for loops, imports, chunked updates, and bulk operations
4. Document threshold (e.g., 100+ records) for when to use the method
### Detection Checklist
- [ ] withoutSyncingToSearch() used only for bulk operations
- [ ] Single-record saves not wrapped
- [ ] Threshold for usage documented
- [ ] Code comments explain why the method is used
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Nesting withoutSyncingToSearch Without Understanding Scope
### Category
Reliability | Maintainability
### Description
Nesting `withoutSyncingToSearch()` blocks or using the method inside jobs that are dispatched from within a `withoutSyncingToSearch()` block, causing unexpected re-enablement of sync.
### Why It Happens
The method uses a static counter internally to track nesting. If a job dispatched inside the block runs after the block exits, sync may be re-enabled before the job completes.
### Warning Signs
- Index updates fire unexpectedly during operations thought to be suppressed
- Jobs dispatched inside a withoutSyncingToSearch block trigger index updates
- Complex nesting patterns where sync appears to resume prematurely
### Why Harmful
Dispatched jobs running in a different process don't inherit the suppression state. The outer block resumes sync when it completes, even if inner operations haven't finished. This leads to partial indexing and race conditions.
### Consequences
- Some records indexed, others not, during bulk operations
- Race conditions between suppression and job execution
- Hard-to-debug index inconsistencies
### Alternative
Avoid nesting. For jobs that need suppression, use `withoutSyncingToSearch()` inside the job itself, not in the dispatching context.
### Refactoring Strategy
1. Identify nested or cross-process `withoutSyncingToSearch()` patterns
2. Move suppression into the job's handle method: surround job body with withoutSyncingToSearch
3. For chained operations, use explicit suppression at each level
4. Test that suppression scope matches execution scope
### Detection Checklist
- [ ] No nesting of withoutSyncingToSearch blocks
- [ ] Jobs that need suppression wrap their own handle() body
- [ ] Suppression scope matches execution scope
- [ ] No race conditions between suppression blocks
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Missing withoutSyncingToSearch in Bulk Imports
### Category
Performance | Scalability
### Description
Running bulk data imports, seeding, or data migrations without `withoutSyncingToSearch()`, causing hundreds of thousands of unnecessary search engine API calls.
### Why It Happens
Default behavior triggers indexing on every model save. Import loops implicitly trigger index updates per iteration. Developers don't think about per-iteration API costs.
### Warning Signs
- Data imports that should take 5 minutes take 2 hours
- Search engine API dashboard shows millions of operations during import
- Queue backlog spikes massively during data migration
- Search engine bill increases dramatically during import periods
### Why Harmful
A 100K-record import generates 100K API calls to the search engine. At 100ms per call, that's 10,000 seconds (2.7 hours) of API time. Most of these are redundant since only the final state matters.
### Consequences
- Import operations timeout or fail mid-way
- High API costs from per-record indexing
- Queue worker overload from import jobs
- Production database locked by slow import transaction
### Alternative
Wrap import loops in `withoutSyncingToSearch()` and batch-index the imported records at the end.
### Refactoring Strategy
1. Wrap import loop body in `withoutSyncingToSearch()`
2. After loop: call `Model::all()->searchable()` or `scout:import`
3. For chunked imports: index in chunks of 500-1000 after each chunk
4. Monitor API call volume before and after refactoring
5. Document import pattern in data migration guide
### Detection Checklist
- [ ] All import loops use withoutSyncingToSearch()
- [ ] Post-import batch indexing in place
- [ ] API call volume proportional to chunk count, not record count
- [ ] Import duration acceptable for dataset size
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Incorrect Re-index Scope After Bulk Operation
### Category
Reliability
### Description
Calling `->searchable()` on a query that includes records not modified during the `withoutSyncingToSearch()` block, or excluding records that were modified, causing incorrect or incomplete re-indexing.
### Why It Happens
Developers use the original query scope for re-index instead of tracking which specific records were actually modified. Over-scope re-indexes extra records; under-scope misses records.
### Warning Signs
- Post-operation re-index includes unmodified records (wasted API calls)
- Some modified records still missing from search after re-index
- Re-index query uses `Model::all()->searchable()` instead of targeted scope
- Modification timestamp tracking not used for re-index scope
### Why Harmful
Over-scope re-index wastes API calls and time. Under-scope leaves records missing from search. Both erode trust in the search system.
### Consequences
- Wasted API calls on unmodified records
- Missing search results for some modified records
- Inefficient batch re-index operations
### Alternative
Track the specific IDs or scope of modified records during the bulk operation and re-index only those records.
### Refactoring Strategy
1. Collect IDs of modified records during the withinSyncingToSearch block
2. After block: `Model::whereIn('id', $modifiedIds)->searchable()`
3. For updates with date filters: use `->where('updated_at', '>=', $startTime)`
4. Test: verify exact set of re-indexed records matches modified set
### Detection Checklist
- [ ] Re-index scope matches modified records exactly
- [ ] No unmodified records unnecessarily re-indexed
- [ ] All modified records included in re-index
- [ ] Integration test verifies re-index completeness
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
