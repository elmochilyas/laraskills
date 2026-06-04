# ECC Anti-Patterns — Customizing Engine Searches
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | Customizing Engine Searches | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Spreading Engine-Specific Callbacks Across Controllers
2. No Engine Detection Guard in Callbacks
3. Using Callbacks for Global Settings
4. Overusing Callbacks Instead of Index Config
5. Not Abstracting Behind Service Classes
---
## Repository-Wide Anti-Patterns
- Callback API used directly in controllers without service layer
- No conditional checks for driver type in engine-specific code
- Forgetting that callbacks couple code to a specific engine
---
## Anti-Pattern 1: Spreading Engine-Specific Callbacks Across Controllers
### Category
Maintainability | Portability
### Description
Using Scout's callback API directly in multiple controllers, scattering engine-specific search logic across the codebase instead of centralizing it.
### Why It Happens
The callback API is convenient — it's available right on the search builder. Developers add engine-specific parameters directly where the search query is built.
### Warning Signs
- `->query(fn($meilisearch) => ...)` appears in 5+ controllers
- Same callback logic duplicated across multiple search endpoints
- Switching engines requires editing many files
- No single source of truth for search configuration
### Why Harmful
Engine-specific logic is impossible to find, audit, or change. Switching engines or updating engine configuration requires touching every controller. Callback logic drifts and becomes inconsistent.
### Consequences
- High effort to migrate to different engine
- Inconsistent search behavior across endpoints
- Bugs from duplicated callback logic with slight variations
### Alternative
Centralize engine-specific search logic in dedicated service classes with a clean API.
### Refactoring Strategy
1. Create a SearchService or unified search repository
2. Move all callback logic from controllers into the service
3. The service exposes methods like `searchProducts($query, $filters)`
4. Controllers call the service without knowing engine details
5. Test the service with mock engine
### Detection Checklist
- [ ] No engine callbacks in controller code
- [ ] Search logic centralized in service/repository class
- [ ] Controllers are engine-agnostic
- [ ] Single file to modify when changing search behavior
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: No Engine Detection Guard in Callbacks
### Category
Reliability
### Description
Using engine-specific callbacks without checking which engine is active, causing errors or silent failures when switching to a different engine.
### Why It Happens
Developers write callbacks for their current engine (e.g., Meilisearch) and don't guard against different engines. They don't test with alternative engines.
### Warning Signs
- `config('scout.driver')` never checked before engine-specific callback
- search() callback calls engine-specific methods without existence check
- Tests only run with one engine
- Different environment has different engine → production failures
### Why Harmful
Switching engines (for testing, migration, or cost optimization) breaks existing search queries. Callback code calls methods that don't exist on the new engine, causing runtime errors.
### Consequences
- Production incidents from engine migration
- Search feature broken when testing with database engine
- Emergency callback cleanup during engine switch
### Alternative
Always wrap engine-specific callbacks in driver detection conditionals.
### Refactoring Strategy
1. Wrap all engine-specific callbacks in `if (config('scout.driver') === 'meilisearch')`
2. Provide engine-agnostic fallback for each callback
3. Test search with both database and production engine
4. Document which engine features are used
5. Consider abstracting behind driver-agnostic service layer
### Detection Checklist
- [ ] Engine-specific callbacks guarded by driver detection
- [ ] Fallback behavior defined for unsupported engines
- [ ] Tests run with at least two engine types
- [ ] No "method not found" errors when switching engines
### Related Rules/Skills/Trees
- Skill: Customizing Engine Searches
---
## Anti-Pattern 3: Using Callbacks for Global Settings
### Category
Performance | Maintainability
### Description
Configuring global search behavior (ranking rules, default filters) through per-query callbacks instead of setting them once in index settings.
### Why It Happens
Developers don't know about the `index-settings` configuration in scout.php or the `scout:sync-index-settings` command. They use callbacks because it's the first customization method they find.
### Warning Signs
- Same callback parameters repeated in every search query
- Index settings in dashboard are defaults (unchanged)
- Many search queries include identical callback configuration blocks
- No index-settings key in config/scout.php
### Why Harmful
Global settings applied per-query waste API round-trips with redundant configuration, increase query latency, and make it impossible to change global behavior in one place.
### Consequences
- Redundant parameters sent on every search query
- Inconsistent behavior if some queries forget the callback
- Hard to change global search behavior (edit every search call)
### Alternative
Configure global index settings in `config/scout.php` under `index-settings` and apply via `scout:sync-index-settings`. Use callbacks only for per-query customization.
### Refactoring Strategy
1. Move global settings (ranking rules, default filters) to index-settings in scout.php
2. Run `scout:sync-index-settings` to apply to the engine
3. Remove redundant callback parameters from all search queries
4. Keep callbacks only for truly per-query customization
5. Verify search behavior unchanged after migration
### Detection Checklist
- [ ] Global settings in index-settings config, not per-query callbacks
- [ ] scout:sync-index-settings applied
- [ ] Callbacks used only for per-query customization
- [ ] No redundant parameters in search queries
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
---
## Anti-Pattern 4: Overusing Callbacks Instead of Index Config
### Category
Performance | Maintainability
### Description
Using callbacks for every search customization regardless of whether the feature is available as index-level configuration, bloating search query code with unnecessary closure logic.
### Why It Happens
Developers know the callback API and use it as their primary customization tool. They don't explore engine-level configuration options.
### Warning Signs
- Callbacks contain filter, sort, and ranking configuration together
- Every search endpoint has a 20-line callback closure
- Engine admin dashboard shows default settings (unchanged)
- Filter/sort/ranking params could be set once at index level
### Why Harmful
Callbacks are re-executed on every query. Index-level settings are applied once. Per-query callbacks increase latency, code complexity, and the chance of inconsistent behavior across endpoints.
### Consequences
- Unnecessarily complex search queries
- Harder to debug search behavior (per-query vs index-level config)
- Performance impact from repeatedly sending config parameters
### Alternative
Configure stable search parameters (filterable attributes, ranking rules, sortable attributes) at the index level. Use callbacks only for truly dynamic per-query parameters.
### Refactoring Strategy
1. Audit all callback usages; categorize as index-level vs per-query
2. Move index-level parameters to scout.php index-settings
3. Apply via scout:sync-index-settings
4. Keep only dynamic parameters in callbacks (user-specific filters, session-based ranking)
5. Compare search response times before and after
### Detection Checklist
- [ ] Callbacks contain only per-query parameters
- [ ] Stable parameters configured at index level
- [ ] scout:sync-index-settings reflects index-level config
- [ ] Response time improved after reducing callback overhead
### Related Rules/Skills/Trees
- Skill: Customizing Engine Searches
---
## Anti-Pattern 5: Not Abstracting Behind Service Classes
### Category
Maintainability | Testability
### Description
Writing Scout search logic directly in controllers or Blade templates without a service layer, making search untestable and engine-specific logic impossible to isolate.
### Why It Happens
Scout's fluent API is easy to use inline. Controllers with `Model::search(...)` directly in the action method are quick to write.
### Warning Signs
- Controller methods contain 10+ line Scout query chains
- Same search logic duplicated across multiple controllers
- Search queries in Blade templates or view composers
- No dedicated search service or repository
### Why Harmful
Search logic is impossible to unit test without HTTP requests. Engine-specific callbacks are scattered across the presentation layer. Changing search behavior requires editing multiple controllers.
### Consequences
- Search logic untestable in isolation
- High duplication of search query code
- Difficult to implement consistent search behavior globally
### Alternative
Abstract search queries into dedicated service classes with testable interfaces.
### Refactoring Strategy
1. Create SearchService or similar class per domain
2. Move all search query building into the service
3. Service exposes methods: `search($query, $filters): LengthAwarePaginator`
4. Inject service into controllers
5. Write unit tests for service with mocked Scout engine
### Detection Checklist
- [ ] No search logic in controllers
- [ ] Search abstraction in service layer
- [ ] Service methods are testable with mock engine
- [ ] Engine-specific logic contained in service, not controllers
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
