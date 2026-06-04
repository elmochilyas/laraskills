# ECC Anti-Patterns — Typesense Collection Schemas
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Typesense | Knowledge Unit | Typesense Collection Schemas | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Using Auto Type for Production Fields
2. Not Declaring Facetable/Sortable Fields
3. Schema Not Version-Controlled
4. No Schema Migration Plan for Field Changes
5. Schema Mismatch Between Config and toSearchableArray
---
## Repository-Wide Anti-Patterns
- Relying on Typesense's `auto` type inference in production
- Not documenting schema migration procedures
- Defining schema in dashboard instead of version-controlled config
---
## Anti-Pattern 1: Using Auto Type for Production Fields
### Category
Reliability
### Description
Using `auto` type for fields in collection schemas, relying on Typesense to infer field types from the first indexed document, leading to incorrect type detection and unexpected behavior.
### Why It Happens
`auto` is the easiest option — developers don't have to think about types. It works for the first document but fails when data varies.
### Warning Signs
- Schema uses `auto` type for fields
- First indexed document determines all types
- Price fields become strings instead of floats
- Boolean fields become ints or strings
- Type inference breaks on null values
### Why Harmful
Auto-detection infers types from the first document. If the first document has `price` as a string, all prices become strings. Null values cause inference failures. Filtering and sorting produce wrong results.
### Consequences
- Numeric sorting broken (strings sorted lexicographically)
- Range filters produce wrong results
- Indexing fails on first null value for an auto field
- Data must be re-indexed to fix type mistakes
### Alternative
Always declare explicit field types in collection schemas. Only use `auto` for rapid prototyping in development.
### Refactoring Strategy
1. Identify all fields using auto type
2. Determine correct types: string, int32, int64, float, bool
3. Define explicit types in schema
4. Re-create collection with explicit schema
5. Re-index data
6. Verify field types match expected behavior
### Detection Checklist
- [ ] No auto type in production schemas
- [ ] All fields have explicit type declarations
- [ ] Numeric fields typed as float/int32/int64
- [ ] Boolean fields typed as bool
- [ ] String fields typed as string
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Not Declaring Facetable/Sortable Fields
### Category
Reliability
### Description
Not adding `facet: true` or `sort: true` to fields that are used in `where()` or `orderBy()` queries, causing filtering and sorting to fail silently.
### Why It Happens
Developers define field types but forget to add indexing options. Typesense doesn't facet/sort fields unless explicitly configured.
### Warning Signs
- `->where('category', 'electronics')` returns 0 results
- `->orderBy('price', 'asc')` returns default order
- No `facet: true` on category, brand, status fields
- No `sort: true` on price, date, rating fields
- Fields defined without facet/sort options
### Why Harmful
Filters and sorts silently fail. Users apply filters and see empty results. Sort dropdowns appear to do nothing.
### Consequences
- Useless search filters
- Ineffective sort controls
- User frustration and support tickets
- Emergency schema change to add missing facet/sort options
### Alternative
Add `facet: true` to all filterable fields and `sort: true` to all sortable fields in the collection schema.
### Refactoring Strategy
1. Audit all where() and orderBy() calls across codebase
2. Add `facet: true` to each filterable field in schema
3. Add `sort: true` to each sortable field in schema
4. Re-create collection with new schema (alias swap)
5. Re-index and test filter/sort behavior
### Detection Checklist
- [ ] Filterable fields have facet:true
- [ ] Sortable fields have sort:true
- [ ] Filtered queries return correct results
- [ ] Sort order matches expected ordering
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Schema Not Version-Controlled
### Category
Maintainability | Reliability
### Description
Defining Typesense collection schemas only through the API or interactive console, without storing them in version-controlled configuration files.
### Why It Happens
Developers use Typesense's API or dashboard for initial schema creation. Schemas are never migrated to scout.php config.
### Warning Signs
- Schema defined via Typesense API, not in scout.php
- No model-settings for Typesense in config/scout.php
- Cannot recreate schema from code alone
- Schema differs between environments
- No schema change history in git
### Why Harmful
Schemas are not reproducible, not reviewed in PRs, and not auditable. A fresh environment requires manual schema creation. Schema drift between environments is inevitable.
### Consequences
- Can't spin up new environment without manual schema creation
- No code review for schema changes
- Schema drift between staging and production
- Lost schema on collection rebuild
### Alternative
Store all collection schemas in `config/scout.php` under `typesense.model-settings` and version-control them.
### Refactoring Strategy
1. Export current Typesense schemas
2. Add to scout.php under typesense.model-settings
3. Remove manual schema creation from procedures
4. Add schema validation to deployment pipeline
5. Document that all schema changes go through code
### Detection Checklist
- [ ] Collection schemas in version-controlled scout.php
- [ ] Schema reproducible from code alone
- [ ] No manual schema creation in production
- [ ] Schema changes reviewed via PR
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: No Schema Migration Plan for Field Changes
### Category
Operations | Reliability
### Description
Making changes to collection schemas (adding fields, changing types) without planning for the required collection recreation and re-indexing, causing search downtime.
### Why It Happens
Developers expect schema changes to be instant like in relational databases. They don't realize Typesense requires full collection recreation.
### Warning Signs
- Adding a field requires manual collection drop
- No alias swap deployment script
- Schema changes cause search downtime
- Fields added to toSearchableArray but not reflected in search
- Deployment pipeline doesn't handle schema migrations
### Why Harmful
Every field addition causes search downtime during re-index. Developers avoid adding fields because the process is painful. Search quality stagnates.
### Consequences
- Search downtime during each schema change
- Slow iteration: avoiding field additions
- Complex manual migration procedures
### Alternative
Define a schema migration plan using Typesense's alias swap pattern for zero-downtime changes.
### Refactoring Strategy
1. Create alias swap deployment script
2. For field additions: create new collection, alias swap, drop old
3. Automate in deployment pipeline
4. Test migration in staging with production data volume
5. Document migration procedures
### Detection Checklist
- [ ] Alias swap script for schema migrations
- [ ] Zero-downtime schema changes
- [ ] Automated in deployment pipeline
- [ ] Schema migration runbook documented
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Schema Mismatch Between Config and toSearchableArray
### Category
Reliability
### Description
Collection schema fields in scout.php not matching the fields returned by `toSearchableArray()`, causing fields to be silently dropped or import failures.
### Why It Happens
Developers update toSearchableArray() but forget to update the Typesense schema. The two sources of truth diverge.
### Warning Signs
- Fields in toSearchableArray() missing from Typesense schema
- scout:import succeeds but search results lack certain fields
- Typesense ignores fields not in schema
- No validation between model config and schema
- Schema has extra fields that model doesn't provide
### Why Harmful
Fields are silently dropped during indexing. Search results are missing data. Users can't search by or see data that exists in the database but wasn't declared in the schema.
### Consequences
- Missing fields in search results
- Inconsistent data: some documents have the field, others don't
- Long debugging sessions: "field exists in DB but not in search"
### Alternative
Maintain strict alignment between toSearchableArray() fields and Typesense schema fields. Add automated validation.
### Refactoring Strategy
1. Compare toSearchableArray() keys with schema fields
2. Add missing fields to schema
3. Remove extra schema fields not in toSearchableArray
4. Add CI check: validate schema fields match toSearchableArray keys
5. Create shared reference for field list to prevent drift
### Detection Checklist
- [ ] Schema fields match toSearchableArray keys
- [ ] No fields silently dropped during indexing
- [ ] CI validates schema-model alignment
- [ ] Search results contain all expected fields
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
