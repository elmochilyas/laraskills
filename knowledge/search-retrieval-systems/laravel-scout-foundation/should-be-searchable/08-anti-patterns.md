# ECC Anti-Patterns — shouldBeSearchable
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | shouldBeSearchable | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Missing shouldBeSearchable Gate
2. Expensive Database Queries in shouldBeSearchable
3. shouldBeSearchable for Permission-Based Gating
4. Frequent State Changes Causing Index Churn
5. Forgetting to Test the True-to-False Transition
---
## Repository-Wide Anti-Patterns
- Not implementing shouldBeSearchable at all on any model
- Using shouldBeSearchable for runtime user permission checks
- Complex multi-condition logic without a dedicated method
---
## Anti-Pattern 1: Missing shouldBeSearchable Gate
### Category
Security | Reliability
### Description
Not implementing `shouldBeSearchable()` on Searchable models, causing all records including drafts, archived items, and unverified content to appear in search results.
### Why It Happens
The Searchable trait works without this method. Teams are unaware of the gate or assume visibility is handled elsewhere.
### Warning Signs
- Draft records appear in public search results
- Archived products discoverable through search
- Unverified user profiles show up in user search
- No `shouldBeSearchable()` method found in any model
### Why Harmful
Unpublished and restricted content leaks through search. Draft blog posts, archived products, and unverified users become discoverable. This creates security incidents and compliance violations.
### Consequences
- Internal draft content publicly searchable
- SEO indexing of unpublished pages
- Compliance violation for unverified PII exposure
- Manual cleanup required after going live
### Alternative
Always implement `shouldBeSearchable()` on Searchable models to gate indexing based on publication status, verification state, and active status.
### Refactoring Strategy
1. Add `shouldBeSearchable(): bool` to all Searchable models without it
2. Define gating conditions: `return $this->status === 'published' && !$this->trashed();`
3. Run full re-index to remove non-searchable records
4. Test both publish and unpublish transitions
5. Document the gating logic for each model
### Detection Checklist
- [ ] shouldBeSearchable() on all Searchable models
- [ ] Draft records excluded from search
- [ ] Archived records excluded from search
- [ ] Soft-deleted records excluded from search
- [ ] Test coverage for searchability transitions
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Indexing Strategy Selection
---
## Anti-Pattern 2: Expensive Database Queries in shouldBeSearchable
### Category
Performance
### Description
Performing expensive database queries, API calls, or complex calculations inside `shouldBeSearchable()`, which runs on every model save and batch import.
### Why It Happens
Developers treat `shouldBeSearchable()` like any other model method. They add relation checks, role lookups, and complex business logic without considering frequency of execution.
### Warning Signs
- Model saves take >100ms due to shouldBeSearchable logic
- scout:import is slow due to per-record gating checks
- Database query count spikes during batch operations
- Profile shows shouldBeSearchable as a hot path
### Why Harmful
`shouldBeSearchable()` runs for every record during save and import. Expensive logic here multiplies the cost across all write operations, making batch imports extremely slow and normal saves sluggish.
### Consequences
- Batch import 10x slower due to per-record gating queries
- User-facing save operations delayed by gating logic
- Database load increased by repeated gating queries
### Alternative
Keep `shouldBeSearchable()` fast — use simple property checks on the model itself. Pre-compute expensive conditions and store them as database columns.
### Refactoring Strategy
1. Profile `shouldBeSearchable()` execution time
2. Move expensive logic to model events (saving event pre-computes a `is_searchable` column)
3. Simplify to property checks: `return $this->status === 'published';`
4. Add `is_searchable` boolean column if conditions are complex
5. Update `shouldBeSearchable()` to reference the pre-computed column
### Detection Checklist
- [ ] shouldBeSearchable() uses only property checks (no DB queries)
- [ ] Pre-computed column used for complex conditions
- [ ] Execution time <1ms per call
- [ ] No N+1 queries from shouldBeSearchable during import
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
---
## Anti-Pattern 3: shouldBeSearchable for Permission-Based Gating
### Category
Security | Design
### Description
Using `shouldBeSearchable()` to implement role-based or permission-based access control in the search index, gating records based on which user role can see them.
### Why It Happens
Developers think if a record shouldn't be visible to some users, it shouldn't be in the index at all. They implement per-role gating in `shouldBeSearchable()`.
### Warning Signs
- shouldBeSearchable() checks `auth()->user()->role`
- Different users see different search results from the same query
- Index contains only records visible to the last-saved user's role
- shouldBeSearchable() has user context dependency
### Why Harmful
`shouldBeSearchable()` runs during model save, not during query. It has no access to the querying user's context. Permission-based gating here permanently removes records from the index regardless of who searches.
### Consequences
- Records invisible to all users because the last save was by an admin
- Inconsistent search results across user sessions
- Complex workarounds with per-role indexes
### Alternative
Use query-time filtering (Scout `where()` clauses with role conditions) for permission-based access control, not index-time gating. Keep `shouldBeSearchable()` for status-based gating only.
### Refactoring Strategy
1. Remove permission checks from `shouldBeSearchable()`
2. At query time, add role-based where clauses: `->where('visibility', 'public')`
3. Or use query-level authorization (Laravel policies applied after search)
4. For strict isolation, use per-role indexes with separate searchableAs() names
5. Re-index to restore all records that should be in the index
### Detection Checklist
- [ ] shouldBeSearchable() has no user context dependency
- [ ] Permission filtering done at query time, not index time
- [ ] All visible records are in the index regardless of role
- [ ] Query-time filters handle access control
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Searchable Trait Implementation Strategy
---
## Anti-Pattern 4: Frequent State Changes Causing Index Churn
### Category
Performance | Scalability
### Description
Implementing `shouldBeSearchable()` with conditions that change frequently (e.g., every user interaction) causing excessive index update API calls.
### Why It Happens
Developers add tracking or analytics conditions to the gate. Each time a user views a post, increments a counter, or changes a minor state, the gate re-evaluates and triggers an index update.
### Warning Signs
- Search engine receives updates for records whose content hasn't changed
- Queue worker processing many "remove from index / add to index" toggle jobs
- High search engine API call volume from records with frequently toggling boolean fields
- saw-tooth pattern in index document count charts
### Why Harmful
Each state change triggers a search engine API call (add or remove). Frequent toggling doubles the API cost — one call to remove and one to re-add. This wastes API quota, increases queue backlog, and causes unnecessary index churn.
### Consequences
- High search engine API costs from unnecessary updates
- Queue backlog from index toggle jobs
- Decreased search availability during re-index cycles
- Engine performance impact from constant document churn
### Alternative
Use `searchIndexShouldBeUpdated()` to suppress index updates when only non-searchable attributes change, or batch state changes.
### Refactoring Strategy
1. Implement `searchIndexShouldBeUpdated()` to gate on only relevant attribute changes
2. Batch frequent state changes: update in memory, persist and trigger index update once
3. For analytics-driven conditions, use separate collection with periodic sync
4. Monitor API call volume to search engine
5. Add rate limiting or debouncing for index updates
### Detection Checklist
- [ ] searchIndexShouldBeUpdated() implemented
- [ ] Index update triggered only for relevant attribute changes
- [ ] No rapid toggle-add-remove pattern in index
- [ ] API call volume stable regardless of non-searchable updates
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
---
## Anti-Pattern 5: Forgetting to Test the True-to-False Transition
### Category
Testing | Reliability
### Description
Only testing that records appear in search when `shouldBeSearchable()` returns true, but not testing that records are removed when it transitions from true to false.
### Why It Happens
Developers test search functionality at creation time. They verify published posts appear in results. They don't test what happens when a post is unpublished.
### Warning Signs
- Tests verify search inclusion but not exclusion
- After unpublishing, records remain in search results
- No test for `shouldBeSearchable()` false condition
- Manual unpublishing requires separate clean-up step
### Why Harmful
Scout automatically removes records when `shouldBeSearchable()` changes from true to false — but only if the model is saved. If the transition is missed (batch update, direct DB change), old records remain in the index indefinitely.
### Consequences
- Unpublished content remains searchable
- Manual cleanup needed after unpublish operations
- Stale data accumulates in search index
### Alternative
Always test both transitions: record appears when gating condition becomes true, and disappears when it becomes false.
### Refactoring Strategy
1. Add integration tests for both searchability transitions
2. Test: create → should be in index → unpublish → should not be in index
3. Test via direct `$model->searchable()` and API search endpoints
4. Also test that scout:import respects the gating
5. Add batch unpublish test for bulk operations
### Detection Checklist
- [ ] Tests verify both true-to-false and false-to-true transitions
- [ ] Scout automatically removes unpublished records
- [ ] Manual cleanup not needed after unpublish
- [ ] Integration test covers the full lifecycle
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
