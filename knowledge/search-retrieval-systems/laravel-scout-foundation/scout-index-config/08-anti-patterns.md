# ECC Anti-Patterns — Scout Index Configuration
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | Scout Index Configuration | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Hardcoded Credentials in Scout Config
2. Missing Environment-Specific Config
3. Index Settings in Dashboard, Not Code
4. No Index Prefix for Multi-Environment Isolation
5. Default Queue Configuration in Production
---
## Repository-Wide Anti-Patterns
- Hardcoding sensitive credentials in config files
- Not version-controlling index settings
- Using same config for all environments without differentiation
---
## Anti-Pattern 1: Hardcoded Credentials in Scout Config
### Category
Security
### Description
Storing search engine API keys, host URLs, and authentication tokens directly in `config/scout.php` instead of environment variables, exposing credentials in version control.
### Why It Happens
Quick setup: developers put credentials directly in the config file during development and forget to extract them. The config file is committed to version control.
### Warning Signs
- API keys visible in `config/scout.php`
- Hardcoded host URLs and ports in config
- `.env` file has no SCOUT_* entries
- Credentials differ between environments but same config committed
### Why Harmful
Anyone with access to the repository gets search engine admin access. Attackers can read, modify, or delete the entire search index. Credentials leaked in public repositories cause immediate security incidents.
### Consequences
- Security breach from leaked credentials
- Unauthorized access to search engine data
- Compliance violation (PCI, SOC 2, GDPR)
- Emergency credential rotation and access audit
### Alternative
Always use `env()` calls in config files and set real values in `.env` files that are excluded from version control.
### Refactoring Strategy
1. Replace hardcoded values with `env('SCOUT_DRIVER')`, `env('SCOUT_KEY')`, etc.
2. Add SCOUT_* variables to .env.example (without real values)
3. Set real values in .env per environment
4. Add config/scout.php to .gitignore if it contains any stale credentials
5. Rotate compromised credentials immediately
### Detection Checklist
- [ ] No hardcoded credentials in scout.php
- [ ] All credentials loaded via env() calls
- [ ] .env files excluded from version control
- [ ] .env.example documents all required SCOUT_* variables
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Missing Environment-Specific Config
### Category
Reliability | Operations
### Description
Using identical Scout configuration for development, staging, and production environments, causing queue settings, engine selection, and credentials to be out of sync per environment.
### Why It Happens
Default config works in all environments. Teams don't create environment-specific overrides.
### Warning Signs
- Queue enabled in all environments (slow dev experience)
- Different engines per environment not configured
- Same credentials used across all .env files
- Dev, staging, and prod use identical scout.php
### Why Harmful
Development runs with queue (harder to debug). Staging writes to production search index. Production has queue disabled (slow responses). No environment isolation.
### Consequences
- Slow form submissions in development (queue latency)
- Staging search data polluting production
- Production performance issues from sync indexing
- Hard to test engine configuration changes
### Alternative
Use environment-specific configuration via .env variables and conditional config in scout.php.
### Refactoring Strategy
1. Set `'queue' => env(' SCOUT_QUEUE', true)` — true in production, false in dev
2. Set separate SCOUT_DRIVER per environment (database for dev, meilisearch for production)
3. Different credentials per environment in .env files
4. Test engine switching between environments
5. Add CI environment-specific Scout configuration
### Detection Checklist
- [ ] Queue disabled in development, enabled in production
- [ ] Different engines usable per environment
- [ ] No cross-environment credential sharing
- [ ] Environment-specific .env files with different Scout values
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Index Settings in Dashboard, Not Code
### Category
Maintainability | Reliability
### Description
Configuring search engine settings (filterable attributes, ranking rules, synonyms) via the engine's web dashboard instead of version-controlled configuration files.
### Why It Happens
Dashboard is visual and immediate. Developers configure settings there because it's faster than writing code. They don't think about reproducibility.
### Warning Signs
- Engine dashboard has custom settings not reflected in scout.php
- `scout:sync-index-settings` would override dashboard settings
- No `index-settings` key in config/scout.php
- Settings cannot be reproduced on a fresh engine instance
### Why Harmful
Dashboard settings are not version-controlled. They can't be reviewed in code review, rolled back, or reproduced on a new instance. A fresh engine requires manual reconfiguration.
### Consequences
- Settings lost on engine reset or migration
- No audit trail of configuration changes
- Staging environment has different (or no) manual settings
- Emergency re-index produces wrong results without dashboard settings
### Alternative
Define all index settings in `config/scout.php` under `index-settings` and apply via `scout:sync-index-settings`.
### Refactoring Strategy
1. Document all current dashboard settings
2. Replicate in config/scout.php index-settings array
3. Run scout:sync-index-settings in staging first
4. Verify settings match
5. Apply in production via deploy
6. Remove reliance on dashboard for configuration
### Detection Checklist
- [ ] All engine settings version-controlled in scout.php
- [ ] scout:sync-index-settings reproduces dashboard settings
- [ ] No dashboard-only configuration
- [ ] Fresh engine instance fully configured by code
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: No Index Prefix for Multi-Environment Isolation
### Category
Reliability | Security
### Description
Not configuring an index prefix (`'prefix' => ''`) in Scout configuration, causing index name collisions when multiple environments share a search engine.
### Why It Happens
Default prefix is empty. Teams using separate search engine accounts per environment are fine. Teams sharing an account get cross-environment data mixing.
### Warning Signs
- Index names are plain table names with no prefix
- Dev and prod use same search engine account
- Staging data appears in production search
- No `prefix` key in config/scout.php
### Why Harmful
Development and staging data pollute production indexes. A scout:flush in staging deletes production data. Users see test content in production search.
### Consequences
- Production search contaminated with test data
- Accidental production data loss from staging operations
- Time wasted cleaning up cross-environment pollution
### Alternative
Configure `'prefix' => env('SCOUT_PREFIX', 'dev_')` in scout.php to isolate environments.
### Refactoring Strategy
1. Add `'prefix' => env('SCOUT_PREFIX', 'dev_')` to scout.php config
2. Set SCOUT_PREFIX per environment: dev=dev_, staging=staging_, prod=(empty or prod_)
3. If changing prefix for existing environments: re-index to populate new indexes
4. Delete unprefixed old indexes after migration
5. Verify environment isolation with integration tests
### Detection Checklist
- [ ] Index prefix configured per environment
- [ ] No cross-environment index name collisions
- [ ] scout:flush in one environment doesn't affect others
- [ ] Prefix applied consistently across all search operations
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Default Queue Configuration in Production
### Category
Performance | Scalability
### Description
Using Scout's default queue configuration (`'queue' => false`) in production, causing synchronous search engine API calls on every model save.
### Why It Happens
Default config has queue disabled. Teams don't change it because synchronous indexing "works" with small datasets and localhost search engines.
### Warning Signs
- SCOUT_QUEUE not set or false in production .env
- Queue worker never configured for Scout
- Response times show search engine latency on model saves
- Model saves fail when search engine is unreachable
### Why Harmful
Every model save (create, update, delete) waits for search engine API response before returning HTTP response. Remote search engines (Algolia, Typesense Cloud) add 50-500ms latency. Engine outage causes application-wide write failures.
### Consequences
- Slow HTTP responses on every write operation
- Application unavailability when search engine is degraded
- No retry mechanism for failed index updates
- Poor user experience on form submissions
### Alternative
Always enable queue for Scout in production: `'queue' => env('SCOUT_QUEUE', true)`.
### Refactoring Strategy
1. Set `'queue' => env('SCOUT_QUEUE', true)` in config/scout.php
2. Set `SCOUT_QUEUE=true` in production .env
3. Configure queue driver (Redis, SQS, database)
4. Start queue worker for Scout index jobs
5. Test that model saves succeed when search engine is offline
### Detection Checklist
- [ ] queue enabled in production Scout config
- [ ] Queue worker running for Scout jobs
- [ ] Model saves succeed independently of search engine availability
- [ ] Response times don't include search engine latency on writes
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Queue vs Synchronous Indexing Mode
