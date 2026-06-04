# ECC Anti-Patterns — toSearchableArray Customization
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | toSearchableArray Customization | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Default toSearchableArray (all-attributes dump)
2. Missing Related Data in Searchable Array
3. Sensitive Data Leakage via Index
4. Expensive Transformation in Searchable Array
5. Missing Backwards Compatibility in Array Shape
---
## Repository-Wide Anti-Patterns
- Not customizing toSearchableArray at all
- Including fields not used for search display or filtering
- Ignoring filter fields (status, category_id, tenant_id) in the array
---
## Anti-Pattern 1: Default toSearchableArray
### Category
Performance | Security
### Description
Not overriding `toSearchableArray()` and relying on Scout's default behavior of sending `$this->toArray()` (all model attributes) to the search engine.
### Why It Happens
The Searchable trait works without any customization. Adding the trait and running `scout:import` produces working search immediately, so developers don't realize the overhead.
### Warning Signs
- Index size equals or exceeds database table size
- Search engine dashboard shows 50+ fields per document
- Internal columns (laravel_through_key, pivot fields) appear in search
### Why Harmful
Every unneeded field increases storage costs, slows indexing, and widens the attack surface. The default behavior sends everything including sensitive internal fields.
### Consequences
- Higher SaaS costs (Algolia charges per record and per field)
- Slower search responses from larger documents
- Sensitive data exposure risk
### Alternative
Always override `toSearchableArray()` to return only fields needed for search matching, filtering, and display.
### Refactoring Strategy
1. Add `toSearchableArray()` override to every Searchable model
2. Explicitly list only the fields needed for search
3. Remove any internal, sensitive, or unused columns
4. Re-index after changes
### Detection Checklist
- [ ] Every Searchable model overrides toSearchableArray()
- [ ] No `$this->toArray()` usage in toSearchableArray
- [ ] Index size reduced after customization
- [ ] Sensitive fields absent from index
### Related Rules/Skills/Trees
- Rule: Only Index Fields Needed for Search and Display
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Missing Related Data in Searchable Array
### Category
Design | Performance
### Description
Not including related model data (author name, category, tags) in `toSearchableArray()`, making it impossible to search or display related content in results.
### Why It Happens
Search indexes are denormalized by nature, but Eloquent developers think in normalized terms. They expect search queries to somehow join relations.
### Warning Signs
- Search results show IDs instead of names for related entities
- Users can't search by author name or category
- Controllers manually load relations after search to populate results
### Why Harmful
Post-query relation loading creates N+1 problems at display time. Search relevance suffers because relation data isn't available for ranking. Frontend code becomes complex with hydration logic.
### Consequences
- Poor search quality without relation context
- Additional N+1 queries on search result pages
- Complex frontend hydration for related entity data
### Alternative
Denormalize all searchable/displable related data into `toSearchableArray()` via relation accessors within the method.
### Refactoring Strategy
1. Identify all relations displayed in search results
2. Add relation fields to `toSearchableArray()`: `$this->author->name`
3. Add eager loading via `makeAllSearchableUsing()`
4. Re-index to populate relation data
### Detection Checklist
- [ ] All display fields available directly in search results
- [ ] No relation loading after search query
- [ ] `makeAllSearchableUsing()` configured for eager loading
### Related Rules/Skills/Trees
- Rule: Normalize Related Data in toSearchableArray
- Decision Tree: Searchable Trait Implementation Strategy
---
## Anti-Pattern 3: Sensitive Data Leakage via Index
### Category
Security
### Description
Including sensitive fields (passwords, tokens, PII, internal notes) in `toSearchableArray()`, exposing them through the search engine's API or dashboard.
### Why It Happens
Default behavior sends all attributes. Developers don't audit what fields are indexed. Search engines don't restrict access to individual fields.
### Warning Signs
- Password hashes visible in search engine admin dashboard
- Email addresses, phone numbers indexed without need
- Internal `is_admin` or `notes` fields searchable by all users
### Why Harmful
Search engines are not designed for field-level access control. Anyone with API keys can read indexed fields. Sensitive data becomes accessible through search APIs, creating compliance violations.
### Consequences
- GDPR/CCPA violation from PII exposure in search index
- Security incident from credential leakage
- Legal liability from internal data exposure
### Alternative
Audit every field returned by `toSearchableArray()` for sensitivity. Exclude passwords, tokens, PII, and internal-only fields.
### Refactoring Strategy
1. Audit current toSearchableArray output for sensitive fields
2. Remove password, token, PII fields from return array
3. For fields needed for filtering but sensitive (email): hash or tokenize
4. Add security review step to search schema changes
5. Re-index to purge sensitive data from search engine
### Detection Checklist
- [ ] No password or token fields indexed
- [ ] No PII indexed unless explicitly required
- [ ] Internal-only fields excluded
- [ ] Security audit of search index documents performed
### Related Rules/Skills/Trees
- Rule: Exclude sensitive data from index
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Expensive Transformation in Searchable Array
### Category
Performance
### Description
Performing expensive computations, external API calls, or heavy string operations inside `toSearchableArray()`, which runs on every model save.
### Why It Happens
Developers treat `toSearchableArray()` as a presentation layer, applying complex formatting, making HTTP calls, or building large derived structures there.
### Warning Signs
- Model saves take >1 second when queue is disabled
- External API calls happening during model save
- Queue jobs for indexing are slow (processing transformation)
- Memory usage spikes during batch import
### Why Harmful
`toSearchableArray()` runs synchronously on every save (even in queue mode). Expensive operations here slow down all write operations and make batch imports extremely slow.
### Consequences
- Slow HTTP responses on model create/update
- Queue processing bottleneck from transformation overhead
- Batch import timeout on large datasets
### Alternative
Pre-compute expensive transformations and store them in the database (cached attributes, materialized columns) so `toSearchableArray()` is a simple field pass-through.
### Refactoring Strategy
1. Profile `toSearchableArray()` execution time
2. Move expensive operations to model events or accessor caching
3. Store pre-computed values as database columns
4. Simplify `toSearchableArray()` to return stored values
### Detection Checklist
- [ ] toSearchableArray() executes in <10ms
- [ ] No external API calls in toSearchableArray()
- [ ] No heavy string manipulation in toSearchableArray()
- [ ] Pre-computed values stored in database columns
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
---
## Anti-Pattern 5: Missing Backwards Compatibility in Array Shape
### Category
Maintainability
### Description
Changing the shape of the array returned by `toSearchableArray()` (renaming keys, changing types, removing fields) without considering the impact on existing search results, filters, and frontend code.
### Why It Happens
Developers see `toSearchableArray()` as an internal implementation detail. They rename fields for consistency without realizing search results depend on field names.
### Warning Signs
- Frontend search components break after a backend deploy
- Filter by `author_name` stops working after field renamed to `author`
- Search result display shows missing fields after schema change
### Why Harmful
Search engines don't have a migration system. Changing field names breaks existing filters, sort rules, and frontend displays until a full re-index populates the new fields across all documents.
### Consequences
- Frontend errors from missing or renamed fields
- Broken search during the window between deploy and re-index
- Emergency rollback required to restore search functionality
### Alternative
Treat the shape of `toSearchableArray()` as a public API. Version the array shape, add new fields before removing old ones, and run re-index before deploying frontend changes.
### Refactoring Strategy
1. Add new fields while keeping old ones (dual-write phase)
2. Re-index to populate new fields across all documents
3. Update frontend to use new fields
4. Remove old fields in a separate deploy
5. Document schema changes in changelog
### Detection Checklist
- [ ] toSearchableArray() shape treated as public API
- [ ] Schema changes follow migrate-version-decommission pattern
- [ ] Frontend-backend contract documented
- [ ] Re-index completed before frontend migration
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
