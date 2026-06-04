# ECC Anti-Patterns — Typesense Driver Setup
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Typesense | Knowledge Unit | Typesense Driver Setup | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. No Collection Schema Pre-Defined
2. Using Master API Key in Frontend
3. Not Pinning Typesense Version
4. Under-Provisioning RAM for Index
5. Missing Snapshot/Backup Strategy
---
## Repository-Wide Anti-Patterns
- Using Typesense without pre-defined schemas (expecting Meilisearch-like auto-schema)
- Not separating Admin and Search-Only API keys
- Ignoring Typesense's RAM-first architecture in capacity planning
---
## Anti-Pattern 1: No Collection Schema Pre-Defined
### Category
Reliability
### Description
Configuring Scout for Typesense without defining collection schemas in `config/scout.php`, causing indexing failures when Typesense rejects documents without pre-declared field types.
### Why It Happens
Other engines (Meilisearch, Algolia) auto-detect schema. Developers expect Typesense to behave the same way.
### Warning Signs
- scout:import fails with undefined field errors
- Typesense logs: "field not defined in schema"
- No `typesense.model-settings` in scout.php config
- Schema defaults to `auto` type everywhere
### Why Harmful
Indexing is blocked without schemas. Auto-type detection produces wrong field types (integers as strings). Filtering and sorting on auto-typed fields may fail.
### Consequences
- Import failures blocking deployments
- Wrong field types: numeric sorting broken
- Manual schema creation via API (not version-controlled)
### Alternative
Always pre-define complete collection schemas in scout.php before the first Typesense import.
### Refactoring Strategy
1. Define collection schema for each Searchable model in scout.php
2. Specify explicit types for all fields (no auto in production)
3. Add facet:true for filterable, sort:true for sortable fields
4. Run scout:import to verify schemas work
5. Add CI check: validate schemas match toSearchableArray fields
### Detection Checklist
- [ ] Collection schemas defined for all Typesense models
- [ ] No auto type in production schemas
- [ ] Facetable/sortable fields explicitly declared
- [ ] Schema validated against model toSearchableArray
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Using Master API Key in Frontend
### Category
Security
### Description
Using the Typesense Master API Key in client-side JavaScript or mobile apps, granting full admin access to anyone who can inspect network traffic or source code.
### Why It Happens
Typesense uses a single master key by default. Developers don't create search-only keys for frontend access.
### Warning Signs
- Master API Key visible in browser network requests
- Frontend can manage collections and indexes
- No search-only API key created
- Typesense configuration uses same key for all operations
### Why Harmful
Anyone with the master key can read, modify, or delete all collections, change schemas, and access all indexed data.
### Consequences
- Complete data exposure from search index
- Schema and index manipulation by attackers
- Index deletion and data loss
- Compliance violation
### Alternative
Create a search-only API key for frontend requests. Reserve the master key for server-side admin operations.
### Refactoring Strategy
1. Generate search-only API key in Typesense configuration
2. Update Scout to use master key for admin, search-only for frontend
3. Ensure frontend never receives master key
4. Rotate master key if it was exposed
5. Verify frontend can only perform search operations
### Detection Checklist
- [ ] Search-only API key used in frontend
- [ ] Master key server-side only
- [ ] Frontend cannot perform admin operations
- [ ] API key restrictions in place
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Not Pinning Typesense Version
### Category
Reliability | Operations
### Description
Using Docker image tag `latest` or unpinned version for Typesense in production, risking unexpected breaking changes on automatic updates.
### Why It Happens
Docker Compose uses `typesense/typesense:latest` for convenience. Teams don't pin to specific versions.
### Warning Signs
- Docker image uses `:latest` tag
- Typesense version changes between deployments
- Unexpected behavior changes after infrastructure updates
- No version compatibility testing
### Why Harmful
Typesense releases may change API behavior, deprecate features, or require schema changes. Automatic upgrades cause production incidents.
### Consequences
- Search behavior changes without code changes
- API deprecation errors in production
- Emergency rollback to previous version
### Alternative
Pin Typesense to a specific version in Docker Compose.
### Refactoring Strategy
1. Check current Typesense version: `curl /health`
2. Pin to that version: `typesense/typesense:0.26.0`
3. Test version upgrades in staging before production
4. Document Typesense version in project
5. Schedule regular version reviews
### Detection Checklist
- [ ] Typesense version pinned in Docker Compose
- [ ] Version upgrades tested in staging
- [ ] Breaking changes reviewed before upgrade
- [ ] Version documented for operations
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Under-Provisioning RAM for Index
### Category
Performance | Operations
### Description
Deploying Typesense on a server with insufficient RAM to hold the entire search index, causing OOM crashes or severe performance degradation as the index grows.
### Why It Happens
Typesense documentation emphasizes RAM-first performance. Teams underestimate index size or don't plan for growth.
### Warning Signs
- Typesense process using >90% of server RAM
- Swap usage increasing over time
- Query latency increases as index grows
- OOM killer terminates Typesense under load
- Memory alerts triggered daily
### Why Harmful
Beyond RAM limits, Typesense either crashes (search downtime) or swaps (100x+ slower queries). The application's core search feature becomes unreliable.
### Consequences
- Search downtime from OOM crashes
- Degraded search performance from swapping
- Emergency server upgrades required
- Data recovery after unclean shutdowns
### Alternative
Calculate index size requirements with 2x headroom before deployment. Monitor memory usage and set scaling triggers.
### Refactoring Strategy
1. Calculate current index memory usage
2. Estimate growth rate over 6-12 months
3. Right-size server: RAM = index size × 2 + 20% overhead
4. Set monitoring alert at 75% RAM usage
5. Implement data retention limits in index (time-based pruning)
6. Plan for horizontal scaling (multi-node) if RAM requirements exceed budget
### Detection Checklist
- [ ] Server RAM adequate for current + projected index size
- [ ] RAM usage monitored with alert at 75%
- [ ] Index growth projections documented
- [ ] No OOM incidents in production
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Missing Snapshot/Backup Strategy
### Category
Operations | Reliability
### Description
Not configuring automatic snapshots or backups for Typesense, leaving the search index without disaster recovery capability.
### Why It Happens
Developers assume Typesense persists data to disk (it does) and that's sufficient for backup. They don't configure snapshot schedules.
### Warning Signs
- No Typesense snapshot configuration
- No backup schedule for search index
- Recovery plan: "just re-index from database"
- Index corruption scenario not documented
- Snapshot directory not configured
### Why Harmful
Re-indexing from the database for large datasets takes hours. During that time, search is unavailable or degraded. If the database also fails, data is permanently lost.
### Consequences
- Hours of search downtime during re-index
- No point-in-time recovery for search
- Data loss if both database and search index fail
### Alternative
Configure automatic Typesense snapshots to durable storage and test restore procedures.
### Refactoring Strategy
1. Enable Typesense snapshots: configure `--snapshot-dir` flag
2. Schedule periodic snapshots
3. Store snapshots off-server (S3, network volume)
4. Test snapshot restore in staging
5. Monitor snapshot success/failure
6. Document restore runbook
### Detection Checklist
- [ ] Snapshots enabled and scheduled
- [ ] Snapshots stored in durable location
- [ ] Restore procedure tested
- [ ] Snapshot success monitored
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
