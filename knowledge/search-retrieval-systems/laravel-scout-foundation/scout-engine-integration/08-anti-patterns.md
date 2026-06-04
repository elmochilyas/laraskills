# ECC Anti-Patterns — Scout Engine Integration
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | Scout Engine Integration | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Hardcoded Engine Selection
2. Missing Engine-Specific Index Settings
3. Ignoring Scout::extend() for Custom Backends
4. Tight Coupling to Engine-Specific Features
5. No Engine Switching Test
---
## Repository-Wide Anti-Patterns
- Relying on defaults without engine-specific tuning
- Not documenting engine-specific behavior and limitations
- Testing only with one engine while using another in production
---
## Anti-Pattern 1: Hardcoded Engine Selection
### Category
Maintainability | Portability
### Description
Hardcoding the Scout engine driver in `config/scout.php` instead of using an environment variable, making it impossible to switch engines between environments without code changes.
### Why It Happens
Initial setup uses a hardcoded value. Teams don't anticipate needing different engines for different environments.
### Warning Signs
- `'driver' => 'meilisearch'` hardcoded in scout.php (no env() call)
- Dev and prod must use the same engine
- Switching engines requires a deploy
- No SCOUT_DRIVER in .env.example
### Why Harmful
Cannot run integration tests with database engine (faster) while using Meilisearch in production. Cannot test Typesense migration without modifying configuration files. Environment parity is broken.
### Consequences
- Tests run against production-like engine instead of lightweight alternative
- Engine migration requires code changes across multiple files
- Each developer must manually configure their local engine
### Alternative
Always use `env('SCOUT_DRIVER', 'database')` in scout.php configuration for driver selection.
### Refactoring Strategy
1. Change `'driver' => 'meilisearch'` to `'driver' => env('SCOUT_DRIVER', 'database')`
2. Set SCOUT_DRIVER in .env files per environment
3. Add SCOUT_DRIVER to .env.example
4. Configure CI to use database engine for speed, production to use dedicated engine
### Detection Checklist
- [ ] Driver selected via env() call
- [ ] SCOUT_DRIVER in .env files
- [ ] Different engines usable per environment without code changes
- [ ] CI/CD passes engine value via environment
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Missing Engine-Specific Index Settings
### Category
Reliability | Performance
### Description
Configuring Scout without engine-specific index settings (filterable attributes, ranking rules, sortable attributes), causing Scout to work with default settings that may not support required query operations.
### Why It Happens
Scout works with default settings. Teams configure the engine driver and credentials but skip the index-settings configuration that declares filterable/sortable attributes and custom ranking.
### Warning Signs
- `scout.php` has no `index-settings` key
- Filter and sort queries fail despite correct toSearchableArray
- No `scout:sync-index-settings` in deployment
- All engine-specific config done via dashboard (not version-controlled)
### Why Harmful
Index settings configured in the dashboard are not version-controlled and can be lost on re-index. Filter/sort queries fail silently. Ranking defaults produce poor search relevance. Team members can't see the engine configuration.
### Consequences
- Non-version-controlled configuration that drifts between environments
- Broken filter/sort until settings are manually re-applied
- Poor default ranking that reduces search quality
### Alternative
Always define engine-specific index settings in `config/scout.php`'s `index-settings` array and apply them via `scout:sync-index-settings`.
### Refactoring Strategy
1. Add `index-settings` key to scout.php for each model/index
2. Declare filterable, sortable, and ranking settings per engine
3. Add `php artisan scout:sync-index-settings` to deployment pipeline
4. Remove dashboard-configured settings (migrate to code)
5. Add CI check that validates index settings match expected config
### Detection Checklist
- [ ] index-settings configured in scout.php
- [ ] Filterable/sortable attributes declared
- [ ] scout:sync-index-settings in deployment
- [ ] All engine settings version-controlled
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Searchable Trait Implementation Strategy
---
## Anti-Pattern 3: Ignoring Scout::extend() for Custom Backends
### Category
Architecture | Maintainability
### Description
Building custom search logic outside Scout's engine contract instead of using `Scout::extend()` to register a custom engine, bypassing Scout's queue, pagination, and event infrastructure.
### Why It Happens
Developers integrate search backends manually using HTTP clients or raw API calls. They reimplement features Scout already provides (queuing, pagination, model mapping).
### Warning Signs
- Custom search service classes that duplicate Scout's Builder API
- Manual pagination logic for search results
- Hand-rolled queue integration for search indexing
- No use of Scout's Engine contract or Scout::extend()
### Why Harmful
Reimplementing Scout's infrastructure wastes development time and introduces bugs. Manual pagination, queue integration, and model mapping are non-trivial to get right.
### Consequences
- Duplicated effort: reimplementing features Scout provides
- Inconsistent search behavior with Scout's standards
- Higher maintenance burden for custom infrastructure code
### Alternative
Use `Scout::extend()` to register a custom engine, implementing only the 8 required methods. Scout handles pagination, queue, and model mapping automatically.
### Refactoring Strategy
1. Create custom Engine class extending `Laravel\Scout\Engines\Engine`
2. Implement the 8 required methods (update, delete, search, paginate, map, mapIds, getTotalCount, flush)
3. Register via `Scout::extend()` in service provider
4. Set SCOUT_DRIVER to the custom engine name
5. Remove redundant custom search infrastructure
### Detection Checklist
- [ ] Custom search backend registered via Scout::extend()
- [ ] All 8 Engine methods implemented
- [ ] No duplicate pagination/queue logic outside Scout
- [ ] Existing Scout features (queuing, pagination) work with custom engine
### Related Rules/Skills/Trees
- Skill: Custom Engine Development
---
## Anti-Pattern 4: Tight Coupling to Engine-Specific Features
### Category
Maintainability | Portability
### Description
Using engine-specific callback APIs extensively throughout controllers without abstracting behind service classes, making it impossible to switch engines without rewriting search code.
### Why It Happens
Developers use the callback API for convenience — it's available directly on the search builder. They add engine-specific parameters in controller code without isolation.
### Warning Signs
- Controller code contains `->query(fn($meilisearch) => ...)` directly
- Engine-specific parameters spread across multiple controllers
- Switching engines would require changes in 10+ files
- No search service or repository layer
### Why Harmful
Engine-specific callbacks in controllers tightly couple the application to a specific search engine. Migrating to a different engine requires finding and rewriting every callback — an error-prone process.
### Consequences
- High migration cost when switching engines
- Inconsistent callback patterns across the codebase
- Difficulty testing search logic independently of the engine
### Alternative
Abstract engine-specific search logic behind service classes or repositories. Use conditional engine detection in the service, not in controllers.
### Refactoring Strategy
1. Create a SearchService or ProductSearch class that wraps Scout calls
2. Move engine-specific callbacks into the service class
3. Use strategy pattern: different service implementations per engine
4. Controllers call `$searchService->search($query, $filters)` without engine knowledge
5. Test service class with mock engine
### Detection Checklist
- [ ] No engine-specific callbacks in controllers
- [ ] Search logic abstracted behind service/repository class
- [ ] Engine switchable by changing service implementation
- [ ] Controller code is engine-agnostic
### Related Rules/Skills/Trees
- Skill: Customizing Engine Searches
---
## Anti-Pattern 5: No Engine Switching Test
### Category
Testing | Reliability
### Description
Not testing that Scout-powered search works with different engines, causing deployment failures when the production engine differs from the development engine.
### Why It Happens
Development and tests run with the database engine (fast, no external dependency). Production uses Meilisearch. Differences in query capabilities between engines are not caught until deployment.
### Warning Signs
- All tests run with database engine only
- No integration tests against the production engine
- Filter/sort queries work in dev but fail in production
- Production-only engine bugs found after deployment
### Why Harmful
Engine behavior differences (query syntax, filter capabilities, sorting) cause production-only failures. Debugging engine-specific issues under production load is slow and painful.
### Consequences
- Production incidents from untested engine behavior
- Emergency hotfixes for engine compatibility issues
- Developer confidence eroded in Scout abstraction
### Alternative
Run integration tests against the production engine in CI, or at minimum test engine-specific features with the actual engine.
### Refactoring Strategy
1. Add CI job that runs search tests with the production engine (Meilisearch/Typesense container)
2. Use `SCOUT_DRIVER` environment variable in CI to switch engines
3. Start engine container in CI pipeline
4. Run full search test suite against both database and production engine
5. Document engine-specific query limitations
### Detection Checklist
- [ ] Integration tests run against production engine in CI
- [ ] Engine switching documented
- [ ] No production-only engine failures
- [ ] CI pipeline includes engine container for testing
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
