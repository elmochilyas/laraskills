# ECC Anti-Patterns — searchableAs / Index Naming
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | searchableAs / Index Naming | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Environment-Crossing Index Names
2. Per-Tenant Index Explosion
3. Special Characters in Index Names
4. Single Unversioned Index for Blue-Green Deploys
5. Multi-Model Index Name Collision
---
## Repository-Wide Anti-Patterns
- Using default table names in multi-environment setups
- Not documenting the index naming convention
- Ignoring engine-specific index name restrictions (length, character set)
---
## Anti-Pattern 1: Environment-Crossing Index Names
### Category
Reliability | Security
### Description
Using the default model table name as the search index name without environment prefix, causing development, staging, and production environments to share the same search index.
### Why It Happens
The default `searchableAs()` returns the table name. Teams using separate search engine accounts per environment is expensive; shared accounts with shared index names cause data mixing.
### Warning Signs
- Staging data appears in production search results
- Development seed data pollutes production index
- `scout:flush` in staging removes production data
- Index names are just table names with no prefix
### Why Harmful
Environment isolation is destroyed. A staging deploy can overwrite production search data. Development testing with real data can corrupt production search results. Recovery requires full re-index from clean data.
### Consequences
- Production search results contaminated with test data
- Data loss from accidental flush in wrong environment
- Time wasted cleaning up cross-environment index pollution
### Alternative
Always prefix index names with the application environment using `searchableAs()`.
### Refactoring Strategy
1. Override `searchableAs()` to include environment: `app()->environment().'_'.$this->getTable()`
2. Run `scout:flush` on old unprefixed indexes
3. Run `scout:import` to populate new environment-specific indexes
4. Update all search query references to use new index names
5. Verify environment isolation with integration tests
### Detection Checklist
- [ ] searchableAs() includes environment prefix
- [ ] Production and staging indexes are separate
- [ ] No cross-environment data contamination
- [ ] Flush in one environment does not affect others
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Searchable Trait Implementation Strategy
---
## Anti-Pattern 2: Per-Tenant Index Explosion
### Category
Scalability | Performance
### Description
Creating a separate search index per tenant in a multi-tenant application, resulting in hundreds or thousands of small indexes that waste search engine memory and management overhead.
### Why It Happens
Per-tenant indexing is conceptually clean — each tenant's data is fully isolated. The approach starts with a few tenants and seems manageable until scale multiplies.
### Warning Signs
- Search engine dashboard shows hundreds of indexes
- Index creation/deletion becomes a frequent operation
- Search engine memory usage is high despite low document count
- Engine performance degrades as tenant count grows
### Why Harmful
Each search index consumes memory, file handles, and management overhead on the search engine. At scale (500+ tenants), the engine spends more resources on index management than on search. Index creation rate limits are hit during tenant onboarding.
### Consequences
- Search engine crashes from too many open indexes
- Slow query performance across all tenants
- Tenant onboarding fails due to index creation limits
- High infrastructure costs from wasted engine resources
### Alternative
Use a single shared index per model with a tenant_id filter field, or use namespace-based isolation (Pinecone namespaces, Qdrant payload filtering).
### Refactoring Strategy
1. Change to single-index strategy with tenant_id filter field in toSearchableArray()
2. Add tenant_id to filterable attributes in engine config
3. Add `->where('tenant_id', tenant()->id)` to all search queries
4. Delete per-tenant indexes
5. Run scout:import to populate single shared index
### Detection Checklist
- [ ] Single index per model (not per tenant)
- [ ] tenant_id filter field in all search queries
- [ ] No tenant index creation in onboarding flow
- [ ] Engine memory usage proportional to document count, not tenant count
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Searchable Trait Implementation Strategy
---
## Anti-Pattern 3: Special Characters in Index Names
### Category
Reliability
### Description
Using spaces, uppercase letters, hyphens, or other special characters in index names via `searchableAs()`, causing silent failures or errors on search engines with strict naming rules.
### Why It Happens
Developers use natural naming (e.g., "My App Posts") without checking engine documentation. Different engines have different rules: Meilisearch allows only alphanumeric and hyphens, Typesense has specific character restrictions.
### Warning Signs
- Index creation fails with cryptic engine error
- scout:sync-index-settings fails for some index names
- Index names with spaces appear in the admin dashboard but queries fail
- Inconsistent naming across models (camelCase, snake_case, Title Case)
### Why Harmful
Engine-specific naming failures cause index creation, sync, or query failures at unexpected times. Debugging is difficult because the error messages vary by engine and operation.
### Consequences
- scout:import silently fails for models with invalid names
- Users see empty search results despite data being indexed
- Time wasted debugging engine naming errors
### Alternative
Use only lowercase alphanumeric characters and underscores in index names. Validate against engine-specific naming rules.
### Refactoring Strategy
1. Review all `searchableAs()` implementations for invalid characters
2. Normalize to lowercase_with_underscores
3. Add engine-specific naming validation in CI/CD
4. Re-index with corrected names
5. Document naming conventions in project README
### Detection Checklist
- [ ] All index names use lowercase alphanumeric + underscores
- [ ] No spaces, hyphens, or special characters in index names
- [ ] Engine-specific naming rules validated
- [ ] Naming convention documented and enforced
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Single Unversioned Index for Blue-Green Deploys
### Category
Reliability | Operations
### Description
Using a single index without versioning or alias support, making zero-downtime index swaps impossible during deployments that require schema changes.
### Why It Happens
Default naming uses static names. Developers don't plan for index versioning until they need to change the schema without downtime.
### Warning Signs
- Schema changes require search downtime
- Full re-index during deploy makes search unavailable for minutes
- Cannot roll back search schema independently of application code
- No index alias mechanism in use
### Why Harmful
Schema changes require either downtime (flush and re-index during deploy) or complex migration scripts. Without index aliases, rolling back application code doesn't roll back search schema, causing compatibility issues.
### Consequences
- Production search downtime during schema migrations
- Deploy failures when old code tries to query new schema
- Emergency rollbacks that leave search index incompatible
### Alternative
Use index aliases (Algolia) or multi-index swap patterns with versioned index names.
### Refactoring Strategy
1. For Algolia: create index aliases, deploy to secondary index, swap alias
2. For Meilisearch: use multi-index with swap API
3. Version index names: `posts_v1`, `posts_v2`
4. Update deployment pipeline to handle index swap steps
5. Test rollback procedure with index swap
### Detection Checklist
- [ ] Index aliases or versioning in use
- [ ] Zero-downtime schema changes possible
- [ ] Rollback procedure includes index swap
- [ ] Deploy pipeline handles index versioning
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
- Decision Tree: Searchable Trait Implementation Strategy
---
## Anti-Pattern 5: Multi-Model Index Name Collision
### Category
Design | Maintainability
### Description
Using the same searchableAs() name across multiple models without coordination, causing one model's index data to overwrite another's in shared-index scenarios.
### Why It Happens
Two models independently implement `searchableAs()` returning the same string. Each model's Scout operations assume exclusive ownership of the index.
### Warning Signs
- scout:import for Model A removes Model B's data from index
- Search results contain unexpected model types
- scout:flush for one model wipes another model's data
### Why Harmful
Shared index coordination requires careful design. Without explicit multi-model index strategy, models silently overwrite each other's data, causing data loss and unpredictable search results.
### Consequences
- Intermittent data loss in search results
- Confusing search results with mixed model data
- Emergency debugging to identify the collision
### Alternative
Use unique index names per model, or explicitly implement shared-index patterns with unique document key prefixes.
### Refactoring Strategy
1. Audit all `searchableAs()` return values for duplicates
2. Use unique names per model: `ModelA::class => 'app_model_a_index'`
3. For deliberate shared indexes, implement unique document key strategy
4. Document shared-index architecture if applicable
5. Re-index with corrected names
### Detection Checklist
- [ ] All searchableAs() names are unique per model
- [ ] Shared indexes have explicit coordination strategy
- [ ] No unexpected data loss during scout:flush of any model
- [ ] Index naming documented and reviewed in code review
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
