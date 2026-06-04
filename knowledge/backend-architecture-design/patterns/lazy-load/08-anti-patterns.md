# Lazy Load — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Lazy Load pattern in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | N+1 in Loops | Critical |
| 2 | Lazy Loading in Serialization | High |
| 3 | Conditional Lazy Loading in Views | High |
| 4 | Globally Disabled Lazy Loading Guard | Medium |
| 5 | Not Using load() for Subsequent Eager Loading | Medium |

---

## 1. N+1 in Loops

### Category
Performance

### Description
Calling lazy-loaded relationships inside a loop, executing 1 query for the parent collection + N queries for each item's relationship.

### Why It Happens
Relationship access in Blade `@foreach` or controller loops is the most common cause. Developers don't realize each access triggers a query.

### Warning Signs
- 1 + N queries per page load
- Slow page response with large collections
- Database query log showing repetitive identical queries
- Query count grows with result set size

### Why Harmful
Page response time grows linearly with result set size. A 100-row page with one lazy relationship generates 101 queries instead of 2.

### Consequences
- Slow page loads
- Database load spikes
- Poor user experience
- Scalability issues

### Alternative
Eager load relationships: `User::with('posts')->get()`. Use `load()` for post-query eager loading. Always know the query count.

### Refactoring Strategy
1. Identify N+1 queries via debug toolbar or query log
2. Add `with()` to the parent query
3. Use `load()` if parent already loaded
4. Verify query count reduction
5. Add query count assertions in tests

### Detection Checklist
- [ ] Check loop iteration for relationship access
- [ ] Monitor query count per page
- [ ] Add N+1 detection tooling

### Related Rules/Skills/Trees
- Skills: Lazy Load, Eager Loading, N+1 Detection

---

## 2. Lazy Loading in Serialization

### Category
Performance

### Description
Calling `toArray()` or `toJson()` on a model with unloaded relationships triggers lazy loading for every included relation, generating N queries.

### Why It Happens
Serialization is often treated as a "magic" operation. Developers don't realize it accesses lazy relationships.

### Warning Signs
- Slow API responses with serialized models
- Query log showing serialization-triggered queries
- Unexpected N+1 in JSON responses
- Conditional serialization causing unpredictable queries

### Why Harmful
Serialization is a fixed part of the request (response construction). Performance impact is unavoidable if relationships are not loaded.

### Consequences
- Slow API responses
- Unpredictable query counts based on serialization
- Hard-to-diagnose performance issues
- User-facing latency

### Alternative
Eager load relationships before serialization. Use API resources to define and control which relationships are included.

### Refactoring Strategy
1. Determine which relationships are serialized
2. Eager load before serialization
3. Use API Resource classes to define included relations
4. Add serialization query count assertions

### Detection Checklist
- [ ] Check serialization for lazy-loaded relations
- [ ] Review API Resource definitions
- [ ] Monitor serialization query count

### Related Rules/Skills/Trees
- Skills: Lazy Load, API Resources, Serialization

---

## 3. Conditional Lazy Loading in Views

### Category
Performance

### Description
Blade views that conditionally access model relationships, causing unpredictable and untestable N+1 queries based on runtime conditions.

### Why It Happens
Views with `@if($user->relation)` or similar conditional access. The query only triggers when the condition evaluates to true.

### Warning Signs
- `@if` conditions on relationship access in views
- Unpredictable query counts in tests
- Views performing heavy database access
- Template code that triggers queries

### Why Harmful
Query behavior depends on runtime conditions. Performance varies per request. Cannot predict or control in tests.

### Consequences
- Unpredictable performance
- Hard-to-diagnose slow pages
- Testing blind spot
- Production surprises

### Alternative
Eager load relationships in controller. Pass only needed data to views. Use view composers or DTOs with loaded data.

### Refactoring Strategy
1. Identify conditional relationship access in views
2. Move eager loading to controller
3. Pass pre-loaded data to view
4. Remove database access from views

### Detection Checklist
- [ ] Scan Blade files for relationship access
- [ ] Check for conditional lazy loading
- [ ] Verify views receive loaded data

### Related Rules/Skills/Trees
- Skills: Lazy Load, View Composers, Blade Best Practices

---

## 4. Globally Disabled Lazy Loading Guard

### Category
Operations

### Description
Disabling `Model::preventLazyLoading(false)` globally in production (or never enabling the guard), allowing unchecked N+1 queries.

### Why It Happens
The guard throws exceptions for lazy loading. Teams disable it because it causes too many errors during development or migration.

### Warning Signs
- `preventLazyLoading(false)` in production
- No N+1 detection in CI
- Developers unaware of lazy loading cost
- No query count monitoring

### Why Harmful
Without the guard, N+1 queries go undetected during development and testing. Performance issues with lazy loading only appear in production.

### Consequences
- Escalating N+1 issues
- Performance regression in production
- No safety net for new code
- Difficult to enforce best practices

### Alternative
Enable `Model::preventLazyLoading()` in dev/test. Use `Model::handleLazyLoadingViolationUsing()` to log (not throw) in production. Enforce in CI.

### Refactoring Strategy
1. Enable lazy loading guard in development
2. Configure violation handler in production (log, not throw)
3. Fix detected N+1 issues
4. Add CI N+1 detection
5. Monitor query count trends

### Detection Checklist
- [ ] Check lazy loading guard configuration
- [ ] Verify dev guard is enabled
- [ ] Review production violation handling

### Related Rules/Skills/Trees
- Skills: Lazy Load, N+1 Detection, Performance Monitoring

---

## 5. Not Using load() for Subsequent Eager Loading

### Category
Performance

### Description
After the initial query has executed, accessing relationships triggers lazy loading when `load()` could eager load them in a single query.

### Why It Happens
Developers are aware of eager loading via `with()` but forget `load()` exists for post-query situations.

### Warning Signs
- Query result accessed, then relationship lazy loaded
- Collection items triggering individual queries
- Conditional eager loading executed lazily
- Post-processing causes N+1

### Why Harmful
If a query is modified after retrieval (e.g., collection transforms, conditional relationships), lazy loading triggers per-item queries.

### Consequences
- Unnecessary query overhead
- N+1 when relationships needed after initial query
- Missed optimization opportunity

### Alternative
Use `$collection->load('relation')` to eager load after the initial query. Use `loadCount()`, `loadMissing()`, and `loadMorph()` as needed.

### Refactoring Strategy
1. Identify post-query relationship access
2. Add `load()` before loop iteration
3. Use `loadMissing()` to avoid over-fetching
4. Verify query count reduction

### Detection Checklist
- [ ] Check for post-query lazy loading
- [ ] Identify load() opportunities
- [ ] Monitor post-query query count

### Related Rules/Skills/Trees
- Skills: Lazy Load, Eager Loading, Collection Operations
