# Anti-Patterns: Laravel API Route Versioning

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | ku-24 |
| **Domain** | API Integration Engineering |
| **Subdomain** | API Versioning |
| **Type** | Implementation |
| **Version** | 1.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Versioning at Parameter Level](#1-versioning-at-parameter-level)
2. [No Deprecation Timeline for Old Versions](#2-no-deprecation-timeline-for-old-versions)
3. [Breaking Changes Within Same Version](#3-breaking-changes-within-same-version)
4. [Versioning the Entire Application](#4-versioning-the-entire-application)
5. [Forgetting to Version Error Responses and Pagination](#5-forgetting-to-version-error-responses-and-pagination)

---

## 1. Versioning at Parameter Level

### Category
Route Organization Failure

### Description
Managing API versioning at the individual endpoint or parameter level rather than at the route group level. Each endpoint has its own version logic: `Route::get('/users?version=1', ...)` and `Route::get('/users?version=2', ...)` are scattered across controllers. This fragments versioning logic, makes adding new versions tedious, and creates inconsistent version behavior across endpoints.

### Why It Happens
- Quick implementation: adding a query parameter seems simpler than route groups
- No versioning strategy planned upfront
- Endpoints versioned independently as changes are needed
- No route file organization by version
- Controller version logic embedded in each method

### Warning Signs
- Routes are not grouped by version prefix
- Controllers check version from request parameter or header inline
- Some endpoints are versioned, others are not
- Adding a new version requires changes across multiple files
- Inconsistent version parameter names (v, version, api_version)

### Why Harmful
- No centralized version management
- Version behavior is inconsistent across endpoints
- Adding a new version requires touching every controller
- Route caching doesn't work optimally for fragmented routes
- Consumers cannot reliably determine endpoint version

### Real-World Consequences
- New developer adds endpoint without versioning (unclear which version it belongs to)
- Adding v3 requires editing 15 controllers instead of creating one route file
- Some endpoints on "/api/v2" while others behave like v1
- Route cache conflicts from mixed version management

### Preferred Alternative
Organize routes by version using route groups. Use separate route files per version: `routes/api/v1.php`, `routes/api/v2.php`. Controllers are namespaced per version.

### Refactoring Strategy
1. Create versioned route files: `routes/api/v1.php`, `routes/api/v2.php`
2. Group routes by version using `Route::prefix('v1')`
3. Move versioned controllers into namespaced directories
4. Remove inline versioning logic from controllers
5. Centralize version negotiation in middleware if using header/query versioning

### Detection Checklist
- [ ] Routes are organized by version (route groups or files)
- [ ] No inline version checking in controllers
- [ ] Adding new version requires new route file, not controller edits
- [ ] Versioning strategy is consistent across endpoints

### Related Rules/Skills/Trees
- Skill: Implement Laravel API Route Versioning

---

## 2. No Deprecation Timeline for Old Versions

### Category
Lifecycle Management Failure

### Description
Maintaining old API versions indefinitely without a deprecation timeline or removal plan. Old versions accumulate because the team never defines when they will be deprecated and removed. Over time, the team supports 3+ versions with no plan to retire any of them.

### Why It Happens
- "We'll deprecate later" without specifying when
- No version lifecycle policy
- Fear of breaking consumers
- No version usage analytics
- Deprecation feels like extra work

### Warning Signs
- 3+ API versions active simultaneously
- No deprecation dates documented
- Oldest version has declining usage but no retirement plan
- No Sunset headers on old versions
- Team cannot answer "when will v1 be removed?"
- Version registry has no lifecycle state for active versions

### Why Harmful
- Maintenance burden grows linearly with version count
- Security patches must be backported to all versions
- Test suite expands with every version
- New features delayed by old version compatibility requirements
- Consumers never migrate because there's no urgency

### Real-World Consequences
- 4 API versions supported; 80% traffic on v2, 0.5% on v1, still maintained
- v1 security vulnerability requires patch to codebase that no one remembers
- Adding new field requires updating 4 controller sets
- Route cache file exceeds memory limit from too many version routes

### Preferred Alternative
Define a version lifecycle policy from the start: Active → Deprecated → Sunset → Removed. Set Sunset dates based on usage analytics. Enforce removal on schedule.

### Refactoring Strategy
1. Audit all active versions and their usage
2. Define version lifecycle states and transitions
3. Set removal dates for oldest versions
4. Add Deprecation and Sunset headers
5. Communicate timeline to consumers
6. Remove versions on schedule

### Detection Checklist
- [ ] Version lifecycle policy exists
- [ ] Each version has a defined state (active/deprecated/sunset/removed)
- [ ] Deprecated versions have Sunset dates
- [ ] Versions are removed according to policy

### Related Rules/Skills/Trees
- Skill: Implement Laravel API Route Versioning

---

## 3. Breaking Changes Within Same Version

### Category
Contract Integrity Failure

### Description
Making breaking changes to an API endpoint or response format without incrementing the version number. Fields are removed, types changed, required fields added, or response structure altered within the same version prefix. Existing consumers break without warning.

### Why It Happens
- "It's a minor change, consumers won't notice" assumption
- No contract testing to detect breaking changes
- Pressure to ship quickly without following versioning process
- Misunderstanding of what constitutes a breaking change
- No CI validation for API contract changes

### Warning Signs
- API changelog mentions breaking changes without version bumps
- Consumer integration failures after routine deployments
- Response fields removed or renamed within version
- Required fields added to request schemas
- Response format changes (array to object, key restructuring)
- No OpenAPI diff validation in CI pipeline

### Why Harmful
- Existing consumers silently break without version signal
- Production downtime for consumer integrations
- Emergency fixes required to restore old behavior
- Consumer trust damaged by unpredictable changes
- "Versioning" loses all meaning as a stability guarantee

### Real-World Consequences
- Mobile app crash because JSON field removed within same API version
- Integration partner's data processing fails due to response format change
- Emergency revert required after breaking change reaches production

### Preferred Alternative
Breaking changes require a new API version. Within a version, only additive changes are permitted. Use CI to detect breaking changes via OpenAPI spec diff.

### Refactoring Strategy
1. Revert breaking changes if they were made within a version
2. Move breaking changes to a new version
3. Implement OpenAPI spec diff in CI pipeline
4. Define explicit criteria for what constitutes a breaking change
5. Add contract tests that protect existing behavior

### Detection Checklist
- [ ] No breaking changes within active versions
- [ ] OpenAPI diff runs in CI on every change
- [ ] Breaking changes go to new version
- [ ] Contract tests protect existing consumer behavior

### Related Rules/Skills/Trees
- Skill: Implement Laravel API Route Versioning

---

## 4. Versioning the Entire Application

### Category
Architecture Coupling

### Description
Applying a single version number to the entire application rather than to individual API endpoints. All routes share the same version, and changing any endpoint behavior requires bumping the version for the whole application—even for unrelated endpoints. This couples the evolution of independent API surfaces.

### Why It Happens
- Versioning as a monolith: one application, one version
- No modular route organization by API surface
- Controller namespace is application-wide, not versioned
- "Our API" treated as a single product with a single version
- Versioning added after the fact, applied to entire app at once

### Warning Signs
- Single version number for the entire API surface
- Changing one endpoint's behavior requires bumping all endpoints
- Different endpoints (users, orders, payments) share the same version
- Version bump for a minor change to one feature forces all consumers to migrate
- No per-module or per-endpoint versioning flexibility

### Why Harmful
- Unnecessary version churn: consumers must migrate for changes they don't use
- Version numbers lose meaning (v4 includes 10 unrelated changes)
- Consumers bear cost of migrating for changes that don't affect them
- Large version jumps (v1→v4) overwhelm consumers with many changes at once
- Cannot release independent endpoint updates

### Real-World Consequences
- Changing search filters requires bumping entire API, breaking all other consumers
- Sales integration forced to migrate to v2 because of unrelated change to billing
- v1→v2 migration guide includes 50 endpoint changes, overwhelming consumers

### Preferred Alternative
Version at the route group level, not the application level. Different API surfaces (users, orders, payments) can have different versions. Version granularity matches consumer usage patterns.

### Refactoring Strategy
1. Identify independently evolving API surfaces
2. Create per-surface versioning (separate route groups)
3. Keep shared infrastructure but version-specific controllers
4. Allow surfaces to evolve at their own pace
5. Document which version scope each endpoint uses

### Detection Checklist
- [ ] Different API surfaces can have different versions
- [ ] Consumer migration is scoped to affected endpoints
- [ ] Endpoint version matches its evolution needs
- [ ] No unnecessary version bumps from unrelated changes

### Related Rules/Skills/Trees
- Skill: Implement Laravel API Route Versioning

---

## 5. Forgetting to Version Error Responses and Pagination

### Category
Incomplete Contract Versioning

### Description
Versioning successful response bodies and request schemas but leaving error responses, pagination formats, and metadata structures unversioned. Error formats change between versions without notice, pagination structure evolves differently from the main API, and consumers that parse error bodies break silently.

### Why It Happens
- Focus on "happy path" versioning
- Error responses considered "internal" or "not part of the API contract"
- Pagination format copied from examples without version consideration
- No OpenAPI spec coverage for error schemas
- Error handling code is not namespaced per version

### Warning Signs
- Error response format differs between versions unintentionally
- Pagination metadata structure changes without version bump
- Validation error format inconsistent across versions
- Error schemas not documented in OpenAPI spec
- Error handling code is shared across versions without transformation

### Why Harmful
- Error-parse logic in consumer code breaks between versions
- Automated retry tooling fails on changed error formats
- Pagination logic breaks silently (off-by-one, structure change)
- Monitoring and alerting depending on error format breaks
- Consumer integration fails in edge cases not covered by happy-path testing

### Real-World Consequences
- Consumer's error logging crashes on unexpected error format
- Pagination component in mobile app breaks because `total` field renamed
- Automated retry system doesn't recognize new error structure
- Integration monitoring alerts fail because error format changed

### Preferred Alternative
Version error responses, pagination formats, and metadata alongside the main API contract. Use version-specific error response classes. Document error schemas in OpenAPI spec.

### Refactoring Strategy
1. Create version-specific error response classes
2. Add error response and pagination schemas to OpenAPI spec
3. Version pagination metadata structure
4. Add tests that verify error formats per version
5. Ensure error handling is version-aware

### Detection Checklist
- [ ] Error responses are versioned consistently with API
- [ ] Pagination format is versioned
- [ ] Error schemas are documented in OpenAPI spec
- [ ] Error format tests exist per version
