# Anti-Patterns: Query Object Alternative

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | Query Object Alternative |
| Classification | Intermediate |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Query Object Proliferation | Design | High |
| 2 | Business Logic Leak in Query Objects | Architecture | High |
| 3 | Performance Hiding (Unbounded Results) | Performance | Critical |
| 4 | Over-Abstraction (Trivial Query Objects) | Design | Medium |
| 5 | Mutation Inside Query Objects | Reliability | Critical |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Accepting Raw Request Input Instead of Typed Filters | query-object-alternative, conditional-clauses | Critical |
| Missing Eager Loading in Query Objects | query-object-alternative, eager-loading-fundamentals | High |
| Query Objects That Mirror Repository Finder Methods | query-object-alternative, when-repositories-help | Medium |
| No Pagination Default in Query Objects | query-object-alternative, builder-fundamentals | High |
| Caching Real-Time Data in Query Objects | query-object-alternative | Medium |

---

## Anti-Pattern 1: Query Object Proliferation

### Category
Design — Unnecessary Class Explosion

### Description
The codebase contains hundreds of query object classes, many of which are unused, trivial (1-2 conditions), or duplicated. Developers create a new query object for every query variation without checking if an existing one suffices or if a model scope would be simpler.

### Why It Happens
"One query per class" is applied dogmatically. Team culture encourages creating a dedicated class for every query, even trivial ones. No process exists for discovering existing query objects or deleting unused ones.

### Warning Signs
- 100+ query object classes for a project with 20 models
- Query objects with single conditional (`where('active', true)`)
- Query objects that are never used (no call sites)
- Multiple query objects with the same or overlapping parameters
- Developers create new query objects without searching for existing ones
- Query object directory has subdirectories deeper than 3 levels

### Why Harmful
Query object proliferation increases cognitive load. Developers must navigate hundreds of files to find the right query, often creating duplicates because searching is harder than creating. Unused query objects rot (tests break, but nobody notices). The query object directory becomes a dumping ground that developers avoid.

### Real-World Consequences
A project has 180 query objects in `App/Queries/`. A developer needs the "recent active users" query and, instead of searching through 180 files, creates `RecentActiveUsersQuery.php` — the third query object for the same purpose (two already exist: `ActiveUsersQuery.php` and `RecentUsersQuery.php`). Now there are 181 query objects, three of which overlap.

### Preferred Alternative
Use model local scopes for queries with 1-2 conditions. Extract to a query object only when the query reaches 3+ conditions, is reused in 3+ places, or requires complex eager loading. Regularly audit and delete unused query objects.

### Refactoring Strategy
1. Audit all query objects: count call sites, compare complexity
2. Delete query objects with zero call sites (check with IDE "Find Usages")
3. Merge overlapping query objects with optional parameters
4. Convert trivial query objects (1-2 conditions) back to model local scopes
5. Add a code review rule: "Query objects require 3+ conditions OR 3+ usages"

### Detection Checklist
- [ ] Query object count exceeds 5x the number of models
- [ ] Query objects with zero call sites found in codebase
- [ ] Multiple query objects with overlapping filter parameters
- [ ] Query objects with a single `where` clause

### Related Rules/Skills/Decision Trees
- **Rule 3**: Prefer model local scopes for simple queries; extract at 3+ conditions (`05-rules.md`)
- **Decision 1**: Query Object vs Model Local Scope (`07-decision-trees.md`)
- **Skill 1**: Create a Query Object (`06-skills.md`)

---

## Anti-Pattern 2: Business Logic Leak in Query Objects

### Category
Architecture — Domain Logic in Read Path

### Description
Query objects apply business rules beyond filtering and sorting — they calculate discounts, determine eligibility, apply business-specific filtering, or make domain decisions. Business logic that belongs in domain models or services is hidden inside query objects in the read path.

### Why It Happens
Developers find it convenient to apply business rules during query construction because it reduces the number of PHP operations after the query. They don't realize they're duplicating domain rules in the read path.

### Warning Signs
- Query object calls model methods with business logic (`$product->shouldApplyDiscount()`)
- Query object uses `filter()` or `map()` with conditional logic about pricing, eligibility, or status transitions
- Query object contains `if/else` blocks that encode business policies
- Business rule changes require updating multiple query objects
- Query object returns transformed/calculated data, not raw model attributes

### Why Harmful
Business rules in query objects are duplicated across multiple query files instead of living in one domain method. When the business rule changes (e.g., "discount threshold changes from $100 to $150"), developers must find and update every query object that applies this rule. Rules in query objects are invisible to domain model developers and bypass domain model invariants.

### Real-World Consequences
A `ProductPricingQuery` applies a 10% discount for orders over $100. When the business rule changes to "15% discount for orders over $150, 20% for orders over $500," the developer must update `ProductPricingQuery`, `CheckoutSummaryQuery`, and `InvoiceLineQuery` — all of which independently implement the same discount logic. Two of the three are missed, causing inconsistent pricing across the application for 3 weeks.

### Preferred Alternative
Query objects filter and sort only. Business rules (calculations, eligibility decisions) belong in domain model methods or domain services. Query objects return raw data; domain services process it.

### Refactoring Strategy
1. Identify business logic in query objects (calculations, eligibility checks, transformations)
2. Move each business rule to the appropriate domain model method or domain service
3. Replace complex `filter()` / `map()` logic with simple `where()` clauses in the query
4. Update consuming code to apply domain logic after receiving query results
5. Add tests for the extracted domain logic, not the query object

### Detection Checklist
- [ ] Query object calls domain methods or applies business rules
- [ ] Query object uses `filter()` with conditional business logic
- [ ] Query object returns calculated/transformed data beyond attribute selection
- [ ] Business rule changes require changes in multiple query objects

### Related Rules/Skills/Decision Trees
- **Rule 6**: Keep business logic out of query objects (`05-rules.md`)
- **Decision 1**: Query Object vs Model Local Scope (`07-decision-trees.md`)

---

## Anti-Pattern 3: Performance Hiding (Unbounded Results)

### Category
Performance — Memory Exhaustion Risk

### Description
Query objects return all matching rows without pagination or limits. As the dataset grows, unbounded queries cause memory exhaustion, slow response times, and production outages. The query object hides the performance risk behind a simple API.

### Why It Happens
Initial datasets are small (hundreds of rows), and pagination seems unnecessary. Developers focus on functionality first and don't consider data growth. The query object API returns `Collection` without requiring any pagination parameters.

### Warning Signs
- Query object returns `Collection` (not `LengthAwarePaginator` or `Paginator`)
- Query object has no `->limit()`, `->take()`, or pagination call
- Query object is used on list endpoints that could return 1000+ rows
- Production monitoring shows slow queries for this query pattern as data grows
- Query object is called without any limit parameter

### Why Harmful
A query returning 50,000 rows instead of 20 causes memory exhaustion on the PHP process (typically 128-256MB limit). The application returns a 500 error or times out. Users see blank pages. The root cause is invisible because the query object itself is simple — the problem is data volume, not query complexity.

### Real-World Consequences
A `RecentOrdersQuery` returns all orders from the last 7 days. Initially, this is 200 rows. After a year, the company has 50,000 orders per week. The admin dashboard (`GET /admin/orders/recent`) starts returning 502 errors. Debugging shows memory exhaustion. The fix (adding pagination) is simple, but the production incident takes 2 hours to diagnose and deploy.

### Preferred Alternative
Default query objects to pagination (page size 15-50). Require explicit opt-out documented with a comment explaining why the result set is guaranteed small.

### Refactoring Strategy
1. Change query object return type from `Collection` to `LengthAwarePaginator`
2. Add `$perPage` and `$page` parameters with sensible defaults (15 for lists, 50 for exports)
3. Add `->orderBy()` to ensure consistent pagination results
4. Update all callers to handle paginated results
5. For callers that truly need all rows, add a `$unbounded = false` parameter with explicit documentation

### Detection Checklist
- [ ] Query object returns `Collection` instead of `LengthAwarePaginator`
- [ ] No `->limit()`, `->take()`, or pagination in the query
- [ ] Query result could exceed 1000 rows based on data growth projection
- [ ] API endpoints using this query object don't accept page/perPage parameters

### Related Rules/Skills/Decision Trees
- **Rule 5**: Default to pagination or limits (`05-rules.md`)
- **Decision 4**: Paginated vs Unbounded Result Sets (`07-decision-trees.md`)
- **Skill 1**: Create a Query Object (`06-skills.md`)

---

## Anti-Pattern 4: Over-Abstraction (Trivial Query Objects)

### Category
Design — Unnecessary Indirection

### Description
Query objects are created for queries with 1-2 `where` clauses that are used in a single place. The query object wraps `Model::where('active', true)->get()` — a 1-line query that would be clearer as an inline scope call.

### Why It Happens
Dogmatic application of query object patterns without considering whether the indirection is justified. "We always use query objects" standards. Scaffolding generators that create a query object file for every potential query.

### Warning Signs
- Query object is under 10 lines total (class declaration + single method + 1-2 query calls)
- Query object has no parameters (no filtering, no pagination)
- Query object is used in exactly one place
- The same query could be written as a model scope or inline in the controller
- Query object directory has more files than model directory

### Why Harmful
Each query object adds a file that must be created, maintained, and navigated. For trivial queries, the indirection provides no benefit: the query is already simple, and extracting it to a separate class makes the code harder to follow (open the file, read one line, return to caller). Over time, developers stop looking at existing query objects and create new ones, accelerating the proliferation.

### Real-World Consequences
A `GetActiveUsersQuery` contains `return User::where('active', true)->get();` and is called from exactly one controller method. The developer could have written `$users = User::whereActive(true)->get();` in the controller — a single line. Instead, the developer created a file (25 lines with boilerplate), registered it in the container (if following DI), and forced the next developer to navigate to it.

### Preferred Alternative
Use model local scopes or inline queries for trivial 1-2 condition filters. Only extract to a query object when complexity or reuse justifies the separate file.

### Refactoring Strategy
1. Identify query objects with single `where` clause and single usage
2. Inline the query into the caller or convert to a model local scope
3. Delete the query object file
4. Remove any container bindings for the deleted query object
5. Update the caller to use the model scope or inline query

### Detection Checklist
- [ ] Query object has exactly one `where` clause and no parameters
- [ ] Query object is used in a single call site
- [ ] Query object is under 15 lines total
- [ ] Query does not benefit from separate testing (trivial to verify)

### Related Rules/Skills/Decision Trees
- **Rule 3**: Prefer model local scopes for simple queries (`05-rules.md`)
- **Decision 1**: Query Object vs Model Local Scope (`07-decision-trees.md`)

---

## Anti-Pattern 5: Mutation Inside Query Objects

### Category
Reliability — Side Effects in Read Paths

### Description
A query object calls `save()`, `update()`, `delete()`, or dispatches events during query execution. Callers expecting a read-only operation receive side effects, making the query object unsafe to cache, reuse, or call multiple times.

### Why It Happens
Developers "optimize" by updating a "last_accessed" timestamp or logging access during the query. Query objects grow into hybrid read/write operations as features are added. The query object pattern is used when an action class is needed.

### Warning Signs
- Query object calls `save()`, `update()`, `delete()`, or `insert()`
- Query object dispatches events or dispatches queue jobs
- Query object writes to log files or audit tables
- Calling the same query object twice produces different results (side effect on first call)
- Query object has a comment about "side effect" or "update as a side effect"

### Why Harmful
Side effects in query objects violate the principle of least surprise. A developer caching the query result (`Cache::remember('key', fn() => $query->__invoke())`) inadvertently caches the side effect or skips it. Calling the query twice in a request doubles the side effects. Query objects can no longer be safely used in read-only contexts.

### Real-World Consequences
An `OverdueInvoicesQuery` updates `last_checked_at` on each invoice as it iterates through results. A developer caches the query with `Cache::remember('overdue', 300, fn() => $query())`. The first request triggers the update (correct), but subsequent cached responses skip the update (overdue invoices show stale `last_checked_at`). The monitoring team creates an incident because "overdue invoices aren't being checked" when actually they are — but the side effect is cached away.

### Preferred Alternative
Query objects are read-only. Use action classes for operations that combine reads with writes. If a timestamp or audit log is needed during a read, extract that to a separate observer or middleware.

### Refactoring Strategy
1. Remove all `save()`, `update()`, `delete()`, and event dispatch calls from the query object
2. Create an action class for the write side effect if it's business-critical
3. If the side effect is audit/logging, move it to a repository method or middleware
4. If the side effect is truly coupled to the read (e.g., "mark as notified"), restructure as: query notifies, action marks
5. Verify the query object is now idempotent and cache-safe
6. Add tests that calling the query twice returns identical results

### Detection Checklist
- [ ] Query object calls any write method on a model or DB
- [ ] Query object dispatches events or jobs
- [ ] Query object modifies state visible outside the query
- [ ] Query object results differ between first and second call

### Related Rules/Skills/Decision Trees
- **Rule 1**: Never call `save()`, `update()`, or `delete()` inside a query object (`05-rules.md`)
- **Decision 2**: Query Object vs Repository Finder Method (`07-decision-trees.md`)
- **Skill 1**: Create a Query Object (`06-skills.md`)
