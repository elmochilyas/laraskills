# ECC Anti-Patterns — Meilisearch Scout Driver
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Meilisearch | Knowledge Unit | Meilisearch Scout Driver | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Not Syncing Index Settings After Config Changes
2. Using Outdated meilisearch-php SDK
3. Missing Filterable/Sortable Configuration
4. Relying Only on Schema-Free Defaults
5. No Authentication in Production
---
## Repository-Wide Anti-Patterns
- Configuring Meilisearch through the dashboard instead of version-controlled config
- Not pinning the PHP SDK version
- Assuming schema-free means no configuration needed
---
## Anti-Pattern 1: Not Syncing Index Settings After Config Changes
### Category
Reliability
### Description
Changing filterable/sortable/ranking settings in `config/scout.php` but not running `scout:sync-index-settings`, leaving the Meilisearch index with stale configuration.
### Why It Happens
Developers update the config file but forget the sync command. The deploy pipeline doesn't include the sync step.
### Warning Signs
- New filterable attributes don't work after deploy
- Config values in scout.php differ from Meilisearch dashboard
- No `scout:sync-index-settings` in CI/CD pipeline
- Developers manually update settings via dashboard
### Why Harmful
Code and engine configuration diverge. Filter/sort queries fail despite correct code. Manual dashboard configuration is lost on re-index.
### Consequences
- Broken search features after deploy
- Configuration drift between environments
- Manual debugging of "config looks right but doesn't work"
### Alternative
Always include `scout:sync-index-settings` in the deployment pipeline, after config changes are deployed.
### Refactoring Strategy
1. Add `php artisan scout:sync-index-settings` to deploy script
2. Run after config changes are deployed
3. Verify sync completes without errors in CI
4. Add post-deploy check: compare config vs actual engine settings
5. Document sync requirement in deployment runbook
### Detection Checklist
- [ ] scout:sync-index-settings in deployment pipeline
- [ ] Engine settings match code config
- [ ] Filter queries work after deploy
- [ ] Post-deploy verification step exists
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Using Outdated meilisearch-php SDK
### Category
Reliability | Security
### Description
Using an outdated version of `meilisearch/meilisearch-php` that lacks features or security fixes, causing compatibility issues with newer Meilisearch servers.
### Why It Happens
Composer dependencies are not regularly updated. The package version is pinned to an old release.
### Warning Signs
- Composer shows `meilisearch/meilisearch-php` version >6 months old
- Meilisearch server version newer than SDK version
- Missing features available in newer SDK versions
- Deprecation warnings in logs
### Why Harmful
Outdated SDKs may not support newer Meilisearch features, may use deprecated API endpoints, or may have known bugs. Breaking changes in future Meilisearch releases can cause production failures.
### Consequences
- Cannot use new Meilisearch features
- SDK compatibility warnings in production logs
- Blocked upgrades (must update SDK first)
- Potential security issues from unpatched SDK
### Alternative
Regularly update `meilisearch/meilisearch-php` and test compatibility.
### Refactoring Strategy
1. Update to latest SDK: `composer update meilisearch/meilisearch-php`
2. Test search functionality in staging
3. Verify compatibility with current Meilisearch server version
4. Add SDK version check to CI pipeline
5. Schedule regular dependency updates
### Detection Checklist
- [ ] meilisearch-php SDK up to date
- [ ] Compatible with Meilisearch server version
- [ ] No deprecation warnings
- [ ] Regular dependency update schedule
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Missing Filterable/Sortable Configuration
### Category
Reliability
### Description
Not declaring filterable and sortable attributes in Meilisearch index settings, causing Scout `where()` and `orderBy()` queries to fail silently.
### Why It Happens
Meilisearch is schema-free. Developers assume all fields are automatically filterable and sortable.
### Warning Signs
- `->where('category_id', 5)` returns 0 results with valid data
- `->orderBy('price', 'asc)` returns results in default order
- No index-settings in scout.php configuration
- scout:sync-index-settings never executed
### Why Harmful
Filtering and sorting silently fail. Users see empty or incorrectly ordered results. The application appears broken despite correct code.
### Consequences
- Useless search filters
- Incorrect sort order for e-commerce (price, date)
- User confusion and support tickets
### Alternative
Declare all filterable and sortable attributes in `config/scout.php` index-settings and sync them to Meilisearch.
### Refactoring Strategy
1. List all where() and orderBy() fields used in search queries
2. Add to index-settings in scout.php: filterableAttributes, sortableAttributes
3. Run scout:sync-index-settings
4. Test filtered and sorted queries
5. Add CI check: verify declared attributes match where() usage
### Detection Checklist
- [ ] Filterable attributes declared in index-settings
- [ ] Sortable attributes declared in index-settings
- [ ] scout:sync-index-settings applied
- [ ] Filtered/sorted queries return correct results
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Relying Only on Schema-Free Defaults
### Category
Performance | Maintainability
### Description
Using Meilisearch entirely on defaults without configuring index settings (ranking rules, typo tolerance, searchable attributes), accepting suboptimal search relevance.
### Why It Happens
Meilisearch's out-of-box relevance is good enough for basic search. Developers don't realize how much improvement is available through configuration.
### Warning Signs
- No index-settings configured in scout.php
- Search ranking order is based on default rules only
- Typo tolerance uses default settings (may be too strict or too lenient)
- All fields are searchable (including non-content fields like IDs)
- No custom ranking rules for business-specific ordering
### Why Harmful
Search relevance is suboptimal. Important results may not rank first. Non-content fields (IDs, timestamps) match queries and dilute results. Typo tolerance may reject valid variations.
### Consequences
- Poor search quality despite having the right engine
- Users struggle to find relevant results
- Competitors with tuned search provide better UX
### Alternative
Configure index settings: searchableAttributes, ranking rules, typo tolerance parameters. Tune for your specific content and user needs.
### Refactoring Strategy
1. Review Meilisearch's default ranking rules and typo tolerance
2. Configure searchableAttributes to only relevant text fields
3. Add custom ranking rules for business-specific ordering
4. Tune typo tolerance parameters based on content types
5. Run scout:sync-index-settings to apply
6. A/B test search relevance improvements
### Detection Checklist
- [ ] Searchable attributes limited to relevant text fields
- [ ] Custom ranking rules configured for business needs
- [ ] Typo tolerance tuned for content type
- [ ] Search relevance benchmarked against defaults
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
---
## Anti-Pattern 5: No Authentication in Production
### Category
Security
### Description
Running Meilisearch with Scout driver but without authentication (MEILISEARCH_KEY not set), allowing anyone with network access to read and modify search indexes.
### Why It Happens
Local development runs without auth. The same config gets deployed to production. The environment variable is not set in production .env.
### Warning Signs
- MEILISEARCH_KEY not set or empty in production
- Meilisearch health endpoints accessible from public network
- No master key configured in Meilisearch config
- Anyone can access /indexes without authentication
### Why Harmful
All indexed data is publicly accessible. Attackers can delete indexes, inject documents, or extract sensitive information. This is a critical data exposure vulnerability.
### Consequences
- Complete data exposure from search index
- Index deletion or corruption
- Compliance violation: GDPR, SOC 2, HIPAA
- Reputation damage from security incident
### Alternative
Always set MEILISEARCH_KEY in production and configure authentication on the Meilisearch server.
### Refactoring Strategy
1. Generate master key on Meilisearch server
2. Set MEILISEARCH_KEY in production .env (search-only key for Scout)
3. Verify Scout can connect with the key
4. Test that unauthenticated requests are rejected
5. Add CI check: fail if MEILISEARCH_KEY is empty or default
### Detection Checklist
- [ ] MEILISEARCH_KEY set in production
- [ ] Unauthenticated requests rejected
- [ ] Search-only key used for Scout (not master key)
- [ ] No credentials in code, only in .env
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
