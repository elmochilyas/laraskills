# ECC Anti-Patterns — Typesense Scout Driver
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Typesense | Knowledge Unit | Typesense Scout Driver | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. No Collection Schema Defined
2. No Alias Swap Strategy for Schema Migrations
3. id Not Cast to String
4. Not Using query_by Weights for Relevance
5. Schema Drift Between Config and Engine
---
## Repository-Wide Anti-Patterns
- Not pre-defining schemas (expecting auto-schema like Meilisearch)
- Not planning for schema migrations (Typesense requires alias swaps)
- Not monitoring schema drift between code config and engine state
---
## Anti-Pattern 1: No Collection Schema Defined
### Category
Reliability
### Description
Configuring Typesense through Scout without defining collection schemas in `model-settings`, causing import failures and type inference errors.
### Why It Happens
Typesense is schema-enforced — unlike Meilisearch. Developers coming from schema-free engines don't pre-define schemas.
### Warning Signs
- scout:import fails with "field not defined" errors
- Typesense uses `auto` type for all fields
- No typesense.model-settings in scout.php
- Fields missing from search results after import
### Why Harmful
Import fails. Auto-detected types are wrong (integers as strings). Filtering and sorting break. Data must be re-indexed with correct schema.
### Consequences
- Blocked deployments: import fails
- Wrong field types: numeric sort broken
- Time wasted debugging type inference issues
### Alternative
Always define complete collection schemas in scout.php before importing to Typesense.
### Refactoring Strategy
1. Define collection schemas for all Searchable models
2. Specify field types explicitly (no auto in production)
3. Add facet:true for filters, sort:true for ordering
4. Run scout:import and verify
5. Add CI validation for schema completeness
### Detection Checklist
- [ ] Schemas defined for all Typesense models
- [ ] No auto type in production
- [ ] Facetable/sortable fields declared
- [ ] Import succeeds with correct types
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: No Alias Swap Strategy for Schema Migrations
### Category
Reliability | Operations
### Description
Not using Typesense's alias swap pattern for schema changes, causing search downtime during collection recreation and re-indexing.
### Why It Happens
Developers don't know about Typesense's alias swap. They drop and recreate collections directly.
### Warning Signs
- Schema changes require dropping the collection
- Search returns 404 during schema migration
- Deployment scripts contain collection drop/create commands
- No collection alias configured
- Manual re-index needed after every schema change
### Why Harmful
Every schema change causes search downtime. Adding a field to the index requires minutes to hours of re-indexing during which search is completely unavailable.
### Consequences
- Extended search downtime during schema changes
- Slow iteration: adding a field takes hours (full re-index)
- Developers avoid adding fields to avoid the migration pain
### Alternative
Use alias swap: create new collection, populate, swap alias, drop old.
### Refactoring Strategy
1. Configure collection aliases in Typesense
2. Create deployment script: new collection with schema → import → alias swap → drop old
3. Automate this in deployment pipeline
4. Test zero-downtime migration in staging
5. Document alias management for operations team
### Detection Checklist
- [ ] Collection aliases configured
- [ ] Alias swap deployment script exists
- [ ] Zero-downtime schema changes verified
- [ ] No production search downtime during schema migrations
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: id Not Cast to String
### Category
Reliability
### Description
Not casting the model ID to a string in `toSearchableArray()` when using Typesense, causing indexing failures because Typesense requires string-type IDs.
### Why It Happens
Eloquent model IDs are integers. Typesense requires string IDs. The mismatch causes import errors.
### Warning Signs
- Typesense import errors: "id must be a string"
- scout:import fails on the first document
- Document ID validation errors
- scout:flush fails because IDs don't match
### Why Harmful
Search is completely blocked. No documents can be indexed until the ID type is fixed.
### Consequences
- Search unavailable until fix is deployed
- Emergency model change required
- Deployment blocked
### Alternative
Cast ID to string in `toSearchableArray()`: `'id' => (string) $this->id`
### Refactoring Strategy
1. Add `'id' => (string) $this->id` to toSearchableArray() for Typesense models
2. Update Typesense schema to declare id as string
3. Re-index and verify
4. Add test: verify all Typesense models return string IDs
5. Document this requirement
### Detection Checklist
- [ ] ID field cast to string in toSearchableArray()
- [ ] Schema declares id as string type
- [ ] Import succeeds without type errors
- [ ] Test coverage for ID type requirement
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Not Using query_by Weights for Relevance
### Category
Performance | Design
### Description
Not configuring `query_by` and `query_by_weights` in Typesense search queries, accepting default field weighting that may prioritize less important fields.
### Why It Happens
Default Typesense search queries all fields equally. Developers don't customize field weighting through Scout's callback API.
### Warning Signs
- Search results prioritize description over title
- Default `query_by` includes all fields
- No custom `query_by_weights` configured
- Less relevant results appear before more important content
- Scout callback never used for Typesense-specific params
### Why Harmful
Search relevance is suboptimal. Important fields (title) don't get priority over less important fields (body). Users find relevant results buried below less relevant matches.
### Consequences
- Poor search relevance
- Important results ranked below irrelevant matches
- Users must scroll to find what they need
### Alternative
Configure `query_by` and `query_by_weights` through Scout's callback API to prioritize important fields.
### Refactoring Strategy
1. Define field importance: title > name > description > body
2. Use Scout callback: `->query(fn($typesense, $query) => $typesense->setQueryBy(['title', 'description'])->setQueryByWeights(['title:4', 'description:1'])`
3. Test search relevance before and after
4. Abstract Typesense-specific params in service class
5. A/B test relevance weighting
### Detection Checklist
- [ ] query_by and query_by_weights configured
- [ ] Important fields weighted higher
- [ ] Search relevance improved
- [ ] Typesense callbacks abstracted in service layer
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Schema Drift Between Config and Engine
### Category
Reliability | Maintainability
### Description
Schema definitions in `config/scout.php` diverging from the actual Typesense collection schema due to manual changes, direct API modifications, or failed sync operations.
### Why It Happens
Typesense schema is set once on collection creation. If manually changed via API or dashboard, the code config becomes stale.
### Warning Signs
- scout:sync-index-settings reports schema differences
- Fields present in Typesense but not in scout.php config
- Fields in config but missing from actual Typesense collection
- Manual API calls made to modify Typesense schema
- Environment schemas differ from each other
### Why Harmful
Schema drift causes unexpected search behavior. Code changes may not take effect. New deployments may not apply intended schema updates. Debugging drift is time-consuming.
### Consequences
- Inconsistent search behavior across environments
- Schema changes not taking effect after deploy
- Manual investigation of "config vs reality" differences
- Time wasted reconciling schema drift
### Alternative
Treat Typesense schema as code. Use scout:sync-index-settings to ensure engine matches config. Add drift detection.
### Refactoring Strategy
1. Add scout:sync-index-settings to deployment pipeline
2. Implement drift detection: compare config schema vs actual Typesense schema
3. Alert when drift is detected
4. Remove manual schema modification practices
5. Add CI check: validate config schema matches engine after deploy
### Detection Checklist
- [ ] scout:sync-index-settings in deploy pipeline
- [ ] Schema drift detection implemented
- [ ] Alert on schema mismatch
- [ ] No manual Typesense schema modifications
- [ ] CI validates schema consistency after deploy
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
