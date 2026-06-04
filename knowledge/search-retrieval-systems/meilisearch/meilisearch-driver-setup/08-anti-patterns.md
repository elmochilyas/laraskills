# ECC Anti-Patterns — Meilisearch Driver Setup
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Meilisearch | Knowledge Unit | Meilisearch Driver Setup | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Using Master Key in Frontend Code
2. No Version Pinning for Meilisearch
3. Not Configuring Filterable/Sortable Attributes
4. Forgetting Dump/Backup Schedule
5. Running Meilisearch Without Sail/Laravel Integration
---
## Repository-Wide Anti-Patterns
- Exposing admin API keys in client-facing code
- Using `latest` Docker tag for Meilisearch
- Not having a backup strategy for the search index
---
## Anti-Pattern 1: Using Master Key in Frontend Code
### Category
Security
### Description
Using the Meilisearch master API key in client-side JavaScript or mobile apps, exposing full admin access to the search index to anyone who inspects the network traffic or source code.
### Why It Happens
Developers configure Scout with the master key and then expose it publicly. They don't create separate search-only keys for frontend access.
### Warning Signs
- Master key visible in browser network requests
- Frontend JavaScript contains the API key
- Instant-search frontend configured with same key as admin operations
- No search-only API key created in Meilisearch
### Why Harmful
Anyone with the master key can create, modify, or delete indexes, change settings, and access all indexed data. This is a critical security vulnerability.
### Consequences
- Unauthorized index manipulation
- Data exfiltration from search index
- Index deletion or corruption by attackers
- Compliance violation from exposed credentials
### Alternative
Use search-only API keys for all frontend search requests. Reserve the master key for server-side admin operations.
### Refactoring Strategy
1. Create a search-only API key in Meilisearch with restricted permissions
2. Update frontend to use the search-only key
3. Keep master key in server-side .env only
4. Verify master key is never sent to client-side
5. Rotate the compromised master key
### Detection Checklist
- [ ] Search-only key used in frontend JavaScript
- [ ] Master key never exposed to client
- [ ] Frontend API requests use restricted key
- [ ] Network traffic inspected: no master key visible
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: No Version Pinning for Meilisearch
### Category
Reliability | Operations
### Description
Using the `latest` Docker tag for Meilisearch in production, causing unexpected breaking changes when a new version is automatically pulled on deployment.
### Why It Happens
Docker Compose files use `getmeili/meilisearch:latest` for convenience. Teams don't pin to a specific version.
### Warning Signs
- Docker Compose uses `:latest` tag
- Meilisearch version changes unexpectedly between deploys
- Breaking changes in search behavior after infrastructure updates
- No version compatibility tested before deploys
### Why Harmful
Meilisearch releases may deprecate features, change default behavior, or modify API responses. An automatic version upgrade can silently break search functionality in production.
### Consequences
- Search behavior changes without code changes
- API deprecations causing runtime errors
- Emergency rollback of Meilisearch version
- Lost developer time debugging "what changed?"
### Alternative
Pin Meilisearch to a specific major.minor version in Docker Compose.
### Refactoring Strategy
1. Identify current Meilisearch version: `curl http://localhost:7700/version`
2. Pin to that version in Docker: `getmeili/meilisearch:v1.12`
3. Test version upgrades in staging before production
4. Document version compatibility in project README
5. Schedule regular version review and testing
### Detection Checklist
- [ ] Meilisearch version pinned in Docker Compose
- [ ] Version upgrades tested in staging
- [ ] Breaking changes reviewed before upgrade
- [ ] Version documented for operations team
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Not Configuring Filterable/Sortable Attributes
### Category
Reliability
### Description
Setting up Meilisearch through Scout without declaring filterable and sortable attributes in index settings, causing `where()` and `orderBy()` calls to silently return empty results.
### Why It Happens
Meilisearch is schema-free — documents index without any declaration. Developers assume filtering and sorting work on all fields automatically.
### Warning Signs
- Scout where() clauses return 0 results for valid data
- sort by any field produces incorrect order or empty results
- No filterable/sortable attributes in scout.php config
- scout:sync-index-settings never run
### Why Harmful
Filters and sorts fail silently. Users see empty results when applying filters. Developers waste hours debugging "correct" code.
### Consequences
- Users can't filter or sort in search
- Support tickets: "search filters show nothing"
- Emergency config changes after deployment
### Alternative
Always declare filterable and sortable attributes in `config/scout.php` and run `scout:sync-index-settings`.
### Refactoring Strategy
1. Add index-settings to scout.php with filterable/sortable attributes
2. Run `php artisan scout:sync-index-settings`
3. Test filtered and sorted search queries
4. Add scout:sync-index-settings to deployment pipeline
5. Add integration test for filter/sort behavior
### Detection Checklist
- [ ] Filterable attributes declared in index settings
- [ ] Sortable attributes declared in index settings
- [ ] scout:sync-index-settings run and verified
- [ ] Filtered queries return expected results
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Forgetting Dump/Backup Schedule
### Category
Operations | Reliability
### Description
Not configuring automatic Meilisearch dumps, leaving the search index without a recoverable backup in case of corruption or accidental deletion.
### Why It Happens
Meilisearch persists data to disk by default. Developers assume this is sufficient backup.
### Warning Signs
- No Meilisearch dump scheduled
- No dump directory configured
- Recovery plan: "just re-index from database"
- Index corruption scenario not documented
### Why Harmful
Re-indexing from the database for large datasets takes hours, during which search is unavailable or limited. If the database also has issues, data is permanently lost.
### Consequences
- Hours of search downtime during re-index
- No point-in-time recovery
- Data loss if database and Meilisearch both fail
### Alternative
Schedule automatic Meilisearch dumps to durable storage.
### Refactoring Strategy
1. Enable dumps: `--dump-dir /data/dumps` in Meilisearch config
2. Schedule daily dumps via Meilisearch schedule-snapshot or cron
3. Store dumps in S3/network volume (not local only)
4. Test dump restore in staging
5. Monitor dump success/failure
### Detection Checklist
- [ ] Dumps scheduled and stored durably
- [ ] Restore from dump tested
- [ ] Recovery runbook documented
- [ ] Dump monitoring in place
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
---
## Anti-Pattern 5: Running Meilisearch Without Laravel Sail Integration
### Category
Operations | Maintainability
### Description
Manually installing and configuring Meilisearch outside of Laravel Sail's service definition, causing environment inconsistency across developer machines.
### Why It Happens
Developers install Meilisearch manually via Docker or binary. They don't add it to Sail's docker-compose.yml or configure it in the Sail service.
### Warning Signs
- Meilisearch not in docker-compose.yml
- Sail up doesn't start Meilisearch
- Each developer installs Meilisearch differently
- README has "Install Meilisearch" steps instead of "sail up"
- Configuration drift between developer machines
### Why Harmful
New team members struggle to set up search locally. Environment differences cause "works on my machine" bugs. No standardized development environment for search.
### Consequences
- Developer onboarding friction: manual Meilisearch setup
- Inconsistent environments: different Meilisearch versions
- CI pipeline depends on external service configuration
### Alternative
Add Meilisearch as a Sail service in docker-compose.yml and use `sail share` for testing.
### Refactoring Strategy
1. Add Meilisearch to docker-compose.yml as a Sail service
2. Configure environment variables in .env.sail
3. Update Sail documentation for the team
4. Run `sail up` and verify Meilisearch starts automatically
5. Remove manual installation instructions from README
### Detection Checklist
- [ ] Meilisearch in docker-compose.yml as Sail service
- [ ] `sail up` starts Meilisearch automatically
- [ ] Consistent Meilisearch version across developer machines
- [ ] No manual Meilisearch setup needed for development
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
