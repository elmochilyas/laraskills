# ECC Anti-Patterns — Soft Delete Handling in Scout
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | Soft Delete Handling in Scout | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Custom Soft Delete Without Scout Integration
2. Inconsistent Soft Delete Behavior Across Models
3. Batch Soft Delete Without Index Cleanup
4. Not Using SoftDeletes Trait with Searchable
5. Expecting Immediate Index Removal After Soft Delete
---
## Repository-Wide Anti-Patterns
- Assuming Scout handles all soft delete scenarios automatically
- Not testing the soft-delete-to-search lifecycle end-to-end
- Mixing hard delete and soft delete models inconsistently
---
## Anti-Pattern 1: Custom Soft Delete Without Scout Integration
### Category
Reliability | Maintainability
### Description
Implementing soft delete using a custom approach (not Laravel's `SoftDeletes` trait) without managing the `__soft_deleted` attribute, causing Scout to not detect or handle soft-deleted records properly.
### Why It Happens
Some teams use their own soft delete implementation (e.g., `is_active` flag, `is_deleted` column) for business reasons, unaware that Scout only auto-detects Laravel's built-in `SoftDeletes` trait.
### Warning Signs
- Soft-deleted records remain in search index after "deletion"
- No `__soft_deleted` attribute in the search index documents
- Model uses `SoftDeletes` trait but also has custom deletion logic
### Why Harmful
Records that should be hidden from search remain visible. Users can search for and find "deleted" content. Data retention and privacy compliance violated when deleted records are still accessible via search.
### Consequences
- Deleted records accessible through search API
- Privacy compliance violation (GDPR right to deletion not honored)
- Manual cleanup scripts needed to sync custom soft deletes to index
### Alternative
Use Laravel's `SoftDeletes` trait with `Searchable` trait, or manually manage the `__soft_deleted` attribute in custom implementations by overriding Scout's sync methods.
### Refactoring Strategy
1. Replace custom soft delete with Laravel's `SoftDeletes` trait if possible
2. If custom is required: add `__soft_deleted` attribute to toSearchableArray()
3. Override `shouldBeSearchable()` to check custom soft delete flag
4. Ensure deletion/restoration logic updates the index accordingly
5. Re-index to remove previously soft-deleted records
### Detection Checklist
- [ ] SoftDeletes trait used on all soft-deletable Searchable models
- [ ] __soft_deleted attribute present in search index
- [ ] Soft-deleted records excluded from search results
- [ ] Custom soft delete implementations manually handle index sync
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Inconsistent Soft Delete Behavior Across Models
### Category
Maintainability | Testing
### Description
Some models implement `shouldBeSearchable()` to exclude soft-deleted records while others rely only on Scout's automatic `__soft_deleted` handling, creating inconsistent search behavior.
### Why It Happens
Teams add soft delete gating piecemeal. Different developers implement different patterns. Some models get explicit `shouldBeSearchable()` overrides, others rely on Scout defaults.
### Warning Signs
- Some soft-deleted records appear in search, others don't
- No standard pattern for soft delete handling across models
- Some models have `shouldBeSearchable()`, others don't
- Inconsistent test coverage for soft delete scenarios
### Why Harmful
Inconsistent behavior creates user-facing bugs that are hard to reproduce. QA can't predict whether deleting a record will remove it from search. Support team gets inconsistent reports.
### Consequences
- Users intermittently find deleted content
- QA testing gaps: some models tested, others not
- Developer confusion about the "correct" soft delete pattern
### Alternative
Establish a consistent pattern: either always implement `shouldBeSearchable()` with soft delete check, or always rely on Scout's automatic handling. Document and enforce the pattern.
### Refactoring Strategy
1. Audit all Searchable models for soft delete handling pattern
2. Choose one pattern: either explicit `shouldBeSearchable()` gating on all models, or rely on Scout auto-handling
3. Apply chosen pattern consistently across all models
4. Add standardized test for soft delete behavior
5. Add CI lint rule to enforce pattern
### Detection Checklist
- [ ] Consistent soft delete pattern across all Searchable models
- [ ] All models either all have explicit gating or all rely on auto-handling
- [ ] Standardized test covers soft delete behavior for all models
- [ ] Documentation specifies the chosen pattern
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Searchable Trait Implementation Strategy
---
## Anti-Pattern 3: Batch Soft Delete Without Index Cleanup
### Category
Performance | Reliability
### Description
Batch soft-deleting many records without using `withoutSyncingToSearch()` or considering the indexing impact, causing thousands of API calls to update the search index.
### Why It Happens
Developers iterate over a collection and call `delete()` on each model. Each deletion triggers a search engine API call to set `__soft_deleted = true`.
### Warning Signs
- Queue backlog spikes during batch soft-delete operations
- scout:import never finishes for models with many soft-deleted records
- Search engine receives a delete API call for every record in a batch operation
### Why Harmful
Batch soft-deleting 10,000 records generates 10,000 API calls to the search engine. This is expensive in both time (10-30 seconds per batch) and cost (per-request billing).
### Consequences
- Long-running batch operations
- Search engine API rate limits hit
- High costs on per-request billed engines
- Queue worker overload from index update jobs
### Alternative
Wrap batch soft deletes in `withoutSyncingToSearch()` and run a single re-index after the operation, or use `Model::whereIn(...)->searchable()` to trigger a batched update.
### Refactoring Strategy
1. Wrap batch soft delete in `withoutSyncingToSearch()`
2. Perform the soft delete operation (chunked if needed)
3. Run targeted re-index for affected records
4. For permanent removal: use scout:import to rebuild index
5. Monitor API call volume before and after refactoring
### Detection Checklist
- [ ] Batch soft deletes use withoutSyncingToSearch()
- [ ] Post-deletion re-index strategy in place
- [ ] API call volume reduced after refactoring
- [ ] Queue backlog stable during batch deletes
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Not Using SoftDeletes Trait with Searchable
### Category
Reliability
### Description
Using the `Searchable` trait on a model without the `SoftDeletes` trait, causing hard-deleted records to remain in the search index after deletion.
### Why It Happens
Some models use the `SoftDeletes` trait without the `Searchable` trait, or vice versa. If `deleted_at` is managed manually without the trait, Scout doesn't know the model is soft-deletable.
### Warning Signs
- Force-deleted records remain in search results
- No `__soft_deleted` attribute in the index
- `SoftDeletes` trait is on the model but not detected by Scout
- Scout documentation about auto-handling is referenced but not working
### Why Harmful
When records are hard-deleted, Scout may leave stale entries in the index if model events don't fire. Soft-deleted records that Scout doesn't detect remain searchable indefinitely.
### Consequences
- Deleted data persists in search index
- Privacy compliance violation from undeleted index entries
- Manual index cleanup needed after deletions
### Alternative
Always pair `SoftDeletes` with `Searchable` on models that need both soft delete and search. Or, if hard-deleting, ensure Scout's model observer fires on delete.
### Refactoring Strategy
1. Add `SoftDeletes` trait to Searchable models that need it
2. Ensure `deleted_at` column exists in the database
3. Verify Scout auto-detects the trait (__soft_deleted in index)
4. Test that soft delete removes records from search
5. For hard-delete models, test that delete event triggers index removal
### Detection Checklist
- [ ] SoftDeletes trait present on all soft-deletable Searchable models
- [ ] __soft_deleted attribute in search index for soft-deletable models
- [ ] Hard-deleted records properly removed from index
- [ ] Test coverage for delete-index behavior
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Expecting Immediate Index Removal After Soft Delete
### Category
Performance | Scalability
### Description
Assuming that soft-deleting a record immediately removes it from search results, without considering queue delays or batch processing.
### Why It Happens
Developers test in local environment where queue is disabled (sync). In production with queue enabled, the index update is asynchronous, causing a delay between deletion and search removal.
### Warning Signs
- After soft delete, record still appears in search for seconds/minutes
- Test environment works instantly but production has delay
- No monitoring for queue backlog of index updates
- Users report deleted content still findable in search
### Why Harmful
Users can search for and find content that the application considers deleted. For privacy-sensitive content, this delay creates a window where deleted data is still accessible.
### Consequences
- Deleted content findable during queue backlog
- Privacy window between deletion and index sync
- User confusion when deleted items appear in search
### Alternative
Design the application to accept eventual consistency for search indexes. For immediate removal needs, use synchronous indexing or force immediate queue processing.
### Refactoring Strategy
1. Document the eventual consistency model for search indexes
2. For critical deletions: use synchronous indexing (`SCOUT_QUEUE=false` temporarily)
3. Or: trigger `Post::searchable()` immediately after delete for that record
4. Monitor queue backlog; alert if >30 seconds delay
5. Add frontend handling: hide search results that are pending deletion
### Detection Checklist
- [ ] Eventual consistency documented for search index
- [ ] Queue backlog monitored for index updates
- [ ] Critical deletions have synchronous fallback
- [ ] Frontend handles stale search results gracefully
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
- Decision Tree: Queue vs Synchronous Indexing Mode
