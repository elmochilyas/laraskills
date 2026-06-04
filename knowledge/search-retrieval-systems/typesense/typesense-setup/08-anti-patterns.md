# ECC Anti-Patterns — Typesense Setup
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Typesense | Knowledge Unit | Typesense Setup | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Index Exceeds Available RAM (OOM Crashes)
2. In-Place Schema Modification
3. Single-Node Production (No HA)
4. Not Pre-Defining Collection Schemas
5. id Not Cast to String
---
## Repository-Wide Anti-Patterns
- Treating RAM as infinite without calculating index size
- Not planning for schema migration with alias swap
- Running Typesense single-node, losing HA benefits
---
## Anti-Pattern 1: Index Exceeds Available RAM
### Category
Performance | Operations
### Description
Loading a Typesense index that exceeds the available RAM on the server, causing out-of-memory crashes, swapping, and severe performance degradation.
### Why It Happens
Typesense is RAM-first — the entire index must fit in memory. Teams don't calculate index size before production deployment. Data grows beyond initial estimates.
### Warning Signs
- Typesense process OOM-killed by kernel
- Memory usage consistently at 95%+
- Swap usage increases (typesense performance plummets)
- Query latency spikes during index operations
- `free -m` shows typesense using all available RAM
### Why Harmful
Beyond RAM limits, Typesense crashes or swaps to disk, making search unusable. OOM crashes cause downtime with no automatic recovery. Index rebuild from database is required after restart.
### Consequences
- Search downtime from OOM crashes
- Performance degradation from swapping
- Emergency server upgrades or index pruning
- Data loss if unclean shutdown corrupts index
### Alternative
Calculate index size before production deployment. Maintain 2x headroom (index size × 2). Monitor RAM at 75% threshold and set up proactive alerts.
### Refactoring Strategy
1. Calculate current index size: check Typesense stats endpoint
2. Estimate growth: monitor index growth rate
3. Right-size server: provision RAM with 2x headroom
4. Set monitoring alert at 75% RAM usage
5. Implement index pruning strategy (archive old records from index)
6. Consider sharding or dataset reduction if RAM limits are unavoidable
### Detection Checklist
- [ ] Index size calculated and server RAM adequate
- [ ] RAM monitoring at 75% threshold
- [ ] Growth projections accounted for
- [ ] No OOM crashes in incident history
- [ ] Index pruning strategy documented
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: In-Place Schema Modification
### Category
Reliability | Operations
### Description
Attempting to modify a Typesense collection schema in-place without using the alias swap pattern, causing schema errors or requiring destructive re-indexing.
### Why It Happens
Typesense doesn't support in-place schema alterations. Teams coming from Meilisearch or Algolia expect schema changes to be non-disruptive.
### Warning Signs
- Schema change errors: "collection already exists"
- Adding a field requires dropping the entire collection
- Fields appear in toSearchableArray but not in Typesense schema
- scout:sync-index-settings fails for Typesense
- Manual collection drop and recreate during deployments
### Why Harmful
Schema changes cause search downtime (no collection during rebuild) or require complex migration scripts. Development iteration is slow because every field addition requires a full re-index.
### Consequences
- Search downtime during schema migrations
- Slow iteration: adding a field takes hours (full re-index)
- Complex deployment scripts for alias swap management
### Alternative
Use the alias swap pattern: create new collection with updated schema, swap alias, drop old collection.
### Refactoring Strategy
1. Create new collection with updated schema
2. Re-index data to the new collection
3. Update alias to point to new collection
4. Drop old collection after verification
5. Automate this in deployment scripts
### Detection Checklist
- [ ] Alias swap pattern documented
- [ ] Deployment scripts handle schema changes via alias swap
- [ ] Zero-downtime schema changes implemented
- [ ] No in-place schema modification attempts
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Single-Node Production
### Category
Reliability | Scalability
### Description
Running Typesense on a single node in production, losing the high-availability and failover benefits provided by Typesense's built-in Raft clustering.
### Why It Happens
Single-node is simpler to deploy. Teams start with one node and never add more. Cost concerns prevent multi-node deployment.
### Warning Signs
- Single Typesense node in production
- No failover if the node goes down
- No Raft consensus configuration
- Manual recovery needed after node failure
- No read replicas for query load distribution
### Why Harmful
A single Typesense node is a single point of failure. Node crashes, network issues, or maintenance windows cause complete search downtime. No read load distribution.
### Consequences
- Complete search outage on node failure
- Scheduled maintenance requires full search downtime
- No horizontal scaling for read queries
- Data loss risk on disk failure
### Alternative
Deploy minimum 3 Typesense nodes for Raft consensus enabling automatic failover and high availability.
### Refactoring Strategy
1. Provision 3 Typesense nodes (or minimum 3 for Raft)
2. Configure Raft clustering between nodes
3. Update Scout config to point to cluster
4. Test node failure: verify the cluster continues serving
5. Document cluster topology and failure procedures
### Detection Checklist
- [ ] Minimum 3 Typesense nodes in production
- [ ] Raft consensus configured
- [ ] Node failure test passed
- [ ] Automatic failover verified
- [ ] Read load distributed across nodes
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Not Pre-Defining Collection Schemas
### Category
Reliability
### Description
Attempting to index data into Typesense without pre-defining collection schemas in `config/scout.php`, causing indexing failures due to missing field type declarations.
### Why It Happens
Developers coming from Meilisearch or Algolia are used to schema-free indexing. They don't realize Typesense requires explicit schema definitions.
### Warning Signs
- scout:import fails with schema errors
- Fields not indexed because they're not in the schema
- Typesense returns "field not found" errors
- No typesense.model-settings in scout.php
- Default `auto` type used for all fields
### Why Harmful
Indexing fails or produces incorrect results. Fields may be silently dropped. Type auto-detection (`auto`) produces wrong types (string instead of float, for example).
### Consequences
- Import fails completely (blocking deployment)
- Missing fields in search results
- Wrong field types causing sort/filter errors
- Data re-indexing needed to fix schema issues
### Alternative
Always pre-define complete collection schemas in `config/scout.php` before the first import.
### Refactoring Strategy
1. Define collection schemas in scout.php for all Searchable models
2. Declare explicit field types (no `auto` in production)
3. Add `facet: true` for filterable fields, `sort: true` for sortable
4. Run scout:import with new schemas
5. Verify all fields indexed correctly
### Detection Checklist
- [ ] Collection schemas defined for all models
- [ ] No `auto` type in production schema
- [ ] Facetable and sortable fields explicitly declared
- [ ] Import succeeds with complete schema
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: id Not Cast to String
### Category
Reliability
### Description
Not casting the model's `id` field to a string in `toSearchableArray()`, causing Typesense schema errors because Typesense requires string-type IDs.
### Why It Happens
Eloquent IDs are integers by default. Developers don't realize Typesense requires string IDs.
### Warning Signs
- scout:import fails with ID type mismatch error
- Typesense errors: "id must be a string"
- Documents indexed with wrong ID type
- scout:flush fails because ID format is wrong
### Why Harmful
Import fails entirely. Documents cannot be indexed. The search feature is blocked until the issue is fixed.
### Consequences
- Blocked deployments due to import failure
- Emergency model fix needed before search works
- Time wasted debugging type mismatch
### Alternative
Cast the `id` field to `(string) $this->id` in `toSearchableArray()` for Typesense models.
### Refactoring Strategy
1. Add `'id' => (string) $this->id` to toSearchableArray()
2. Update Typesense collection schema to declare id as string type
3. Run scout:import to verify fix
4. Add test: verify all Searchable models have string IDs for Typesense
5. Document the requirement for team members
### Detection Checklist
- [ ] id field cast to string in toSearchableArray()
- [ ] Collection schema declares id as string type
- [ ] scout:import succeeds without type errors
- [ ] Test coverage for Typesense ID type requirement
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
