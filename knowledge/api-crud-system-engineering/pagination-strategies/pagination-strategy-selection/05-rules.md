# Pagination Strategy Selection — Phase 5 Rules

## Default to Cursor Pagination for New Endpoints
---
## Category
Scalability | Design
---
## Rule
Default to cursor pagination (`cursorPaginate()`) for all new API endpoints unless there is an explicit requirement for random page access or exact total count.
---
## Reason
Most datasets grow unboundedly over time. Cursor pagination handles growth gracefully with O(1) performance at any depth. Starting with cursor avoids costly offset-to-cursor migration when the dataset inevitably grows.
---
## Bad Example
```php
// Defaulting to offset for every new endpoint
class PostController {
    public function index() {
        return Post::paginate(15); // Will need migration when data grows
    }
}
```
---
## Good Example
```php
// Defaulting to cursor for new endpoints
class PostController {
    public function index() {
        return Post::orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->cursorPaginate(15); // Gracefully handles growth
    }
}
```
---
## Exceptions
Endpoints that require random page access (page selector UI) or exact total counts (admin dashboards).
---
## Consequences Of Violation
Unnecessary migration effort when datasets grow; performance degradation at scale.
---

## Choose Strategy Per Resource, Not Per Developer Preference
---
## Category
Design | Maintainability
---
## Rule
Define pagination strategy per resource based on its data characteristics (write concurrency, size, access pattern), not on developer familiarity.
---
## Reason
Different resources have different pagination requirements. An activity feed needs cursor (high write concurrency), a user admin list needs offset (random access, total count), and an internal log needs keyset (transparency). One-size-fits-all creates problems.
---
## Bad Example
```php
// All endpoints use the same strategy regardless of data characteristics
class Controller {
    public function feed() { return Activity::paginate(15); } // Wrong: needs cursor
    public function users() { return User::paginate(15); } // OK: needs offset
    public function logs() { return Log::paginate(15); } // Wrong: needs keyset
}
```
---
## Good Example
```php
// Strategy chosen per resource
class Controller {
    public function feed() { return Activity::cursorPaginate(15); } // Cursor: concurrent writes
    public function users() { return User::paginate(15); } // Offset: random access + total
    public function logs() { return Log::where('id', '>', $cursor)->limit(15)->get(); } // Keyset: internal
}
```
---
## Exceptions
When all resources share identical data characteristics (e.g., all append-only, no concurrent writes).
---
## Consequences Of Violation
Performance problems from wrong strategy choice; phantom reads in feeds; missing totals in admin panels.
---

## Reserve Offset for Bounded Datasets With Random Access Requirements
---
## Category
Scalability | Performance
---
## Rule
Use offset pagination only when the dataset is bounded (<5000 records) and random page access or exact total count is a product requirement.
---
## Reason
Offset pagination's simplicity is valuable only where its limitations (deep-offset O(N) performance, phantom reads) don't apply. For unbounded datasets, offset inevitably degrades to unacceptable performance.
---
## Bad Example
```php
// Offset for unbounded dataset — guaranteed degradation
$activities = Activity::paginate(15); // Will grow to millions
```
---
## Good Example
```php
// Offset for bounded, small dataset
$categories = Category::paginate(15); // Categories are bounded (<100 records)
```
---
## Exceptions
Search results sorted by relevance score — cursor pagination is unreliable with scored results.
---
## Consequences Of Violation
Performance degradation as data grows; forced migration under pressure.
---

## Consider Dataset Growth Trajectory, Not Just Current Size
---
## Category
Scalability | Reliability
---
## Rule
Select pagination strategy based on projected dataset size in 12-24 months, not current record count.
---
## Reason
A 1000-record table today may be 10M records in a year. Choosing offset based on current size guarantees a painful migration later. Cursor pagination from day one avoids this.
---
## Bad Example
```php
// Choosing strategy based on today's 1000 records
$events = Event::paginate(15); // 1000 today, but growing 10K/month
// In 6 months: 60K records, deep-offset problems begin
```
---
## Good Example
```php
// Choosing strategy based on growth trajectory
$events = Event::orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15); // Growing 10K/month — cursor from day one
```
---
## Exceptions
Archived/immutable datasets with guaranteed stable size (e.g., reference tables).
---
## Consequences Of Violation
Costly migration under pressure; performance degradation; user-facing timeouts.
---

## Document Pagination Strategy Per Endpoint
---
## Category
Maintainability | Design
---
## Rule
Document the pagination strategy, parameters, default page size, and maximum per endpoint in the API reference.
---
## Reason
Clients need to know which parameters to send (`page`, `cursor`, `after_id`), what response structure to expect (`meta` fields, `links`), and what behaviors are guaranteed (random access yes/no, total count yes/no).
---
## Bad Example
```php
// No documentation — clients reverse-engineer behavior
// GET /api/posts?page=2 — is this offset or cursor? Does total exist?
```
---
## Good Example
```php
/**
 * @queryParam cursor string Cursor from previous response (cursor pagination)
 * @queryParam per_page int Records per page (default: 15, max: 100)
 *
 * @response {
 *   "data": [...],
 *   "meta": {
 *     "has_more": true,
 *     "next_cursor": "abc123",
 *     "per_page": 15
 *   }
 * }
 *
 * Notes:
 * - Uses cursor pagination — no random page access
 * - No total or last_page available
 * - Navigate sequentially using next_cursor
 */
```
---
## Exceptions
No common exceptions — always document pagination behavior.
---
## Consequences Of Violation
Client confusion; integration errors; support burden; reverse-engineering of API behavior.
---

## Use Hybrid Strategy for Migration Periods
---
## Category
Reliability | Maintainability
---
## Rule
During migration from offset to cursor, implement a hybrid strategy that supports both methods simultaneously; never force a breaking change.
---
## Reason
Clients cannot update their code instantaneously. A hybrid approach supports old clients (offset) while new clients adopt cursor, providing a smooth transition without production incidents.
---
## Bad Example
```php
// Breaking change — old clients stop working
public function index(Request $request) {
    return Post::cursorPaginate(15); // Old clients using page=2 break
}
```
---
## Good Example
```php
// Hybrid — supports both old and new clients
public function index(Request $request) {
    if ($request->has('cursor')) {
        return Post::orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->cursorPaginate(15);
    }
    return Post::paginate(15);
}
```
---
## Exceptions
Internal APIs where all clients are controlled and can be updated simultaneously.
---
## Consequences Of Violation
Broken client applications; production incidents; lost trust.
---

## Never Use One Strategy for All Endpoints
---
## Category
Design | Maintainability
---
## Rule
Evaluate pagination strategy per endpoint independently; never apply the same strategy to all endpoints by default.
---
## Reason
A blog's post listing, user admin panel, activity feed, and search results all have different pagination requirements. A single strategy forces compromises — offset fails for feeds, cursor fails for admin page selectors, keyset fails for public API security.
---
## Bad Example
```php
// One strategy applied globally
// config/pagination.php
return 'cursor'; // Applied to ALL endpoints — admin panel loses page selector
```
---
## Good Example
```php
// Per-resource strategy configuration
// config/pagination.php
return [
    'posts' => ['strategy' => 'cursor', 'per_page' => 15],
    'users' => ['strategy' => 'offset', 'per_page' => 25],
    'activities' => ['strategy' => 'cursor', 'per_page' => 15],
    'search' => ['strategy' => 'offset', 'per_page' => 15], // Relevance sort
];
```
---
## Exceptions
When all endpoints serve the same type of data with identical access patterns.
---
## Consequences Of Violation
Wrong strategy for some endpoints; performance or UX problems; forced migration.
---

## Performance Test the Chosen Strategy With Production-Scale Data
---
## Category
Performance | Testing
---
## Rule
Always performance-test the selected pagination strategy with datasets matching expected production volume before finalizing the choice.
---
## Reason
All strategies perform similarly at 1000 records. Differences only emerge at 100K-10M records. Testing with production-scale data reveals offset's deep-offset degradation, cursor's index dependencies, and keyset's WHERE clause performance.
---
## Bad Example
```php
// Testing with 100 records — all strategies show 2ms
// Production has 10M records — offset deep-page queries time out
```
---
## Good Example
```php
// Production-scale performance test
public function test_pagination_performance(): void
{
    // Seed 1M records
    Post::factory()->count(1000000)->create();

    // Test offset at various depths
    $start = microtime(true);
    $this->get('/api/posts?page=50000'); // Deep offset
    $offsetTime = microtime(true) - $start;

    // Test cursor at same depth
    $start = microtime(true);
    $this->get('/api/posts?cursor=' . $deepCursor);
    $cursorTime = microtime(true) - $start;

    $this->assertLessThan($offsetTime, $cursorTime);
}
```
---
## Exceptions
Proof-of-concept endpoints before production scaling is determined.
---
## Consequences Of Violation
Performance surprises in production; emergency strategy changes under pressure.
---

## Enforce Authorization Boundaries Regardless of Strategy
---
## Category
Security
---
## Rule
Apply authorization filters to the query before any pagination method (offset, cursor, keyset); never rely on the strategy itself for access control.
---
## Reason
Pagination strategies control record positioning and ordering, not authorization. All strategies must enforce the same authorization scope — a user can only paginate through their own records regardless of strategy.
---
## Bad Example
```php
// No authorization filter — user paginates through all records
$posts = Post::paginate(15); // Returns all posts, not just user's
```
---
## Good Example
```php
// Authorization filter before pagination
$posts = Post::where('user_id', auth()->id())
    ->orderBy('created_at', 'desc')
    ->cursorPaginate(15);
```
---
## Exceptions
Public endpoints with no authorization requirements.
---
## Consequences Of Violation
Data leakage across user boundaries; authorization bypass; security breach.
---

## Avoid Over-Engineering Pagination for Small Stable Datasets
---
## Category
Maintainability
---
## Rule
Use offset pagination for small, stable datasets (<5000 records, no concurrent writes); cursor/keyset complexity is unnecessary overhead for datasets that won't grow.
---
## Reason
Cursor pagination adds complexity (composite indexes, cursor encoding, no total count) that is unjustified for datasets where offset pagination works perfectly. Choosing cursor for a 200-row category list is over-engineering.
---
## Bad Example
```php
// Cursor for a 200-row category list — unnecessary complexity
$categories = Category::orderBy('name')->cursorPaginate(15);
// No total, no random access — overkill for 200 records
```
---
## Good Example
```php
// Offset for small, stable datasets — simple and sufficient
$categories = Category::paginate(15);
// Total, page selector, random access — all work perfectly
```
---
## Exceptions
When the API standardizes on cursor pagination for consistency across all endpoints.
---
## Consequences Of Violation
Unnecessary complexity; missing features (total count, random access); client confusion.
