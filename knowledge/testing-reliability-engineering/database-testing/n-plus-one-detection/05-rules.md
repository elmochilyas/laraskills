# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Database Testing
## Knowledge Unit: N+1 Query Detection

---

### Rule 1: Enable `Model::preventLazyLoading()` in non-production environments

| Field | Value |
|-------|-------|
| **Name** | Prevent lazy loading in development and testing |
| **Category** | Prevention |
| **Rule** | Set `Model::preventLazyLoading(!$this->app->isProduction())` in `AppServiceProvider::boot()`. |
| **Reason** | This single line catches all N+1 query issues at the moment they occur — before tests even run. When a lazy load is triggered, it throws `LazyLoadingViolationException` immediately, making N+1 impossible to ignore. |
| **Bad Example** | No `preventLazyLoading()` — N+1 queries silently execute in development and tests. |
| **Good Example** | `Model::preventLazyLoading(!$this->app->isProduction())` — lazy loading throws an exception in dev/test. |
| **Exceptions** | None. The overhead is negligible, and the benefit is catching N+1 before it reaches production. |
| **Consequences Of Violation** | N+1 queries silently pass all tests. Performance regression reaches production without detection. |

---

### Rule 2: Test with realistic data volumes (10+ records) to surface N+1

| Field | Value |
|-------|-------|
| **Name** | Test relationship loading with sufficient data |
| **Category** | Test Data Volume |
| **Rule** | When testing endpoints that load Eloquent relationships, create at least 10 parent records, each with multiple children (3-5). |
| **Reason** | N+1 is invisible with 1-2 parent records (3-5 queries vs 5-9 queries — looks similar). With 10 parents and 5 children each, the difference is 2 queries (eager) vs 51 queries (lazy). Realistic volumes make the problem measurable. |
| **Bad Example** | `Post::factory()->count(2)->create()` — N+1 not visible with only 2 records. |
| **Good Example** | `Post::factory()->count(10)->has(Comment::factory()->count(5))->create()` — N+1 clearly visible in query count. |
| **Exceptions** | Endpoints that only ever serve single records (show endpoints, not index endpoints). |
| **Consequences Of Violation** | N+1 passes tests with small datasets. Performance regression manifests only with production data volumes. |

---

### Rule 3: Use `expectsDatabaseQueryCount()` on every database-touching endpoint

| Field | Value |
|-------|-------|
| **Name** | Set query count budgets on all database endpoints |
| **Category** | Query Budget |
| **Rule** | Include `$this->expectsDatabaseQueryCount($count)` in every feature test that touches the database. Set the count to a fixed budget that accounts for auth, session, and the endpoint's queries. |
| **Reason** | A fixed query count budget prevents regressions from new event listeners, middleware, or relationship changes. Without it, query counts can inflate silently over time. |
| **Bad Example** | `$this->get('/posts')->assertOk()` — no query count protection. |
| **Good Example** | `$this->expectsDatabaseQueryCount(4); $this->get('/posts')->assertOk();` — budget enforced. |
| **Exceptions** | Endpoints with inherently variable query counts (reporting, dashboards). For these, use a range or document the variability. |
| **Consequences Of Violation** | Query counts inflate silently over multiple PRs. Performance degrades gradually without detection. |

---

### Rule 4: Eager-load all serialized relationships

| Field | Value |
|-------|-------|
| **Name** | Eager-load relationships before serialization |
| **Category** | Serialization |
| **Rule** | Ensure all relationships accessed during serialization (API resources, `toArray()`, `toJson()`) are eager-loaded before the serialization call. |
| **Reason** | Serialization triggers lazy loading on any unloaded relationship. An API resource that accesses `$this->user->posts` triggers an N+1 query for each resource in the collection. Eager loading ensures all needed data is fetched in the initial queries. |
| **Bad Example** | `return UserResource::collection(User::all())` — `UserResource` accesses `posts` relationship → N+1 on every user. |
| **Good Example** | `return UserResource::collection(User::with('posts')->get())` — all relationships pre-loaded. |
| **Exceptions** | Serialization that only accesses the model's own attributes (no relationship traversal). |
| **Consequences Of Violation** | API responses trigger massive N+1 queries during JSON serialization. Response times degrade linearly with result count. |

---

### Rule 5: Fix lazy-loading packages, don't disable the safety net

| Field | Value |
|-------|-------|
| **Name** | Fix third-party lazy loading, don't disable `preventLazyLoading()` |
| **Category** | Prevention |
| **Rule** | If a third-party package triggers lazy loading violations, fix the package (eager load its relationships) or wrap it. Do not disable `Model::preventLazyLoading()` globally. |
| **Reason** | Disabling the safety net because one package triggers lazy loading also disables it for all your application code. The cure is worse than the disease. |
| **Bad Example** | `Model::preventLazyLoading(false)` — disabled because a Nova package lazy-loads. |
| **Good Example** | Reporting the issue to the package maintainer or wrapping the package call with an eager-loaded query. |
| **Exceptions** | If a package cannot be fixed and the lazy loading is in a non-critical path, disable prevention in only that specific context using `Model::handleLazyLoadingViolationUsing()` with selective filtering. |
| **Consequences Of Violation** | Application code can introduce N+1 queries without detection. The safety net that prevents performance regressions is removed. |
