# Per-Page Parameter Design — Phase 5 Rules

## Always Enforce a Documented Maximum per_page
---
## Category
Security | Performance
---
## Rule
Always enforce a documented maximum per_page value on every paginated endpoint; never allow unbounded page sizes.
---
## Reason
Unbounded per_page allows clients to request tens of thousands of records in a single response, causing out-of-memory errors, slow queries, and resource exhaustion attacks. A hard maximum prevents this.
---
## Bad Example
```php
// No maximum — client can request any number
$perPage = $request->input('per_page', 15);
$users = User::paginate($perPage); // per_page=100000 possible
```
---
## Good Example
```php
// Documented and enforced maximum
$perPage = min(max((int) $request->input('per_page', 15), 1), 100);
$users = User::paginate($perPage);
```
---
## Exceptions
Dedicated export endpoints with batch processing safeguards, extended timeouts, and separate rate limits.
---
## Consequences Of Violation
OOM errors; slow/crashing responses; DoS vector; excessive database load.
---

## Use Consistent per_page Naming Across All Endpoints
---
## Category
Maintainability | Design
---
## Rule
Standardize on one naming convention (per_page or limit) across the entire API; never mix naming schemes.
---
## Reason
Clients must adapt to different parameter names per endpoint when naming is inconsistent, increasing integration complexity and bug surface. Consistency reduces client development effort.
---
## Bad Example
```php
// Mixed naming — clients must adapt per endpoint
// /api/posts?per_page=15
// /api/users?limit=25
// /api/comments?page[size]=10
```
---
## Good Example
```php
// Consistent naming across the entire API
// /api/posts?per_page=15
// /api/users?per_page=25
// /api/comments?per_page=10
```
---
## Exceptions
When matching an established legacy client convention that cannot be changed.
---
## Consequences Of Violation
Client confusion; increased integration effort; parameter handling bugs.
---

## Use Clamping Over Rejection for Out-of-Range Values
---
## Category
Reliability
---
## Rule
Clamp per_page values to the valid range using min(max()) instead of rejecting out-of-range values with validation errors.
---
## Reason
Rejecting out-of-range values forces clients to handle 400 errors during pagination, which may break pagination loops. Clamping gracefully adjusts to the nearest valid value, keeping pagination working.
---
## Bad Example
```php
// Rejection — breaks client pagination for out-of-range values
$request->validate(['per_page' => 'integer|min:1|max:100']);
// Client sends per_page=200 -> 400 error, pagination fails
```
---
## Good Example
```php
// Clamping — gracefully adjusts to valid range
$perPage = min(max((int) $request->input('per_page', 15), 1), 100);
// Client sends per_page=200 -> clamped to 100, pagination continues
```
---
## Exceptions
When regulatory or compliance requirements mandate strict rejection of out-of-range parameters.
---
## Consequences Of Violation
Client pagination breaks due to 400 errors; support incidents; reduced API resilience.
---

## Choose Default per_page Based on Median Record Size
---
## Category
Performance | Design
---
## Rule
Set default per_page based on the median record size in the response: 10-15 for large records (articles with content), 25-50 for small records (ID lists).
---
## Reason
Small records (IDs, names) allow larger page sizes without response bloat. Large records (full articles, nested relationships) need smaller page sizes to keep payload size and query time acceptable.
---
## Bad Example
```php
// Same default for all endpoints regardless of record size
// GET /api/posts?per_page=50 — articles with 5KB each = 250KB responses
// GET /api/users?per_page=50 — user objects at 200B each = 10KB responses
```
---
## Good Example
```php
// Per-model defaults based on record size
class Post extends Model {
    protected $perPage = 15; // Articles are large
}
class User extends Model {
    protected $perPage = 50; // User objects are small
}
```
---
## Exceptions
When the API standardizes on one default for consistency across all endpoints.
---
## Consequences Of Violation
Bloated responses for large records; slow serialization; excessive bandwidth usage.
---

## Validate per_page as Positive Integer
---
## Category
Reliability | Security
---
## Rule
Always validate that per_page is a positive integer before using it in pagination; reject or clamp zero and negative values.
---
## Reason
Per_page values of zero, negative, or non-numeric types can crash pagination logic or produce undefined SQL behavior (LIMIT 0 returns no rows, LIMIT -1 may error).
---
## Bad Example
```php
// No validation — per_page=0 returns empty, per_page=-1 may error
$perPage = $request->input('per_page', 15);
$users = User::paginate($perPage); // LIMIT 0 or LIMIT -1
```
---
## Good Example
```php
// Clamp to safe range with integer cast
$perPage = min(max((int) $request->input('per_page', 15), 1), 100);
$users = User::paginate($perPage);
```
---
## Exceptions
No common exceptions — always validate per_page as a positive integer.
---
## Consequences Of Violation
Empty responses; SQL errors; 500 server errors from invalid LIMIT clauses.
---

## Set Different Defaults for Mobile vs Web Clients
---
## Category
Performance | UX
---
## Rule
Use smaller default per_page (10) for mobile APIs and larger (15-30) for web APIs.
---
## Reason
Mobile clients have smaller screens, slower network connections, and limited memory. Smaller page sizes reduce response size, improve render time, and reduce data usage.
---
## Bad Example
```php
// Same per_page for all client types
$perPage = min(max((int) $request->input('per_page', 15), 1), 100);
// Mobile clients get the same 15 items as desktop
```
---
## Good Example
```php
// Client-adaptive defaults
if ($request->header('User-Agent') && str_contains($request->header('User-Agent'), 'Mobile')) {
    $defaultPerPage = 10;
    $maxPerPage = 50;
} else {
    $defaultPerPage = 25;
    $maxPerPage = 100;
}
$perPage = min(max((int) $request->input('per_page', $defaultPerPage), 1), $maxPerPage);
```
---
## Exceptions
When using client-adaptive defaults adds unacceptable complexity for minimal benefit.
---
## Consequences Of Violation
Slow mobile experience; high data usage; unnecessary bandwidth costs.
---

## Log Large per_page Requests for Abuse Detection
---
## Category
Security | Maintainability
---
## Rule
Log and monitor requests with per_page values near the maximum threshold for abuse detection.
---
## Reason
Consistently requesting maximum per_page values may indicate data scraping, denial-of-service attempts, or batch processing using pagination endpoints instead of dedicated export endpoints.
---
## Bad Example
```php
// No monitoring — large page requests go undetected
$perPage = min(max((int) $request->input('per_page', 15), 1), 100);
```
---
## Good Example
```php
$perPage = min(max((int) $request->input('per_page', 15), 1), 100);
if ($perPage >= 90) {
    Log::channel('abuse')->warning('Large per_page request', [
        'user_id' => auth()->id(),
        'per_page' => $perPage,
        'endpoint' => $request->path(),
        'ip' => $request->ip(),
    ]);
}
```
---
## Exceptions
Internal batch processing tools where large page requests are expected.
---
## Consequences Of Violation
Undetected data scraping; undetected abuse; missed DoS early warning.
---

## Use Dedicated Export Endpoints for Batch Data Retrieval
---
## Category
Design | Performance
---
## Rule
Provide dedicated export/stream endpoints for batch data retrieval; never use per_page=1000 as a substitute for a batch mechanism.
---
## Reason
Paginated endpoints are optimized for UI navigation, not bulk data export. Using large per_page values for export bypasses pagination safeguards, risks timeouts, and consumes excessive memory. Dedicated export endpoints can use chunked processing and streaming.
---
## Bad Example
```php
// Bulk export through pagination — timeout risk
// GET /api/posts?per_page=1000 — client iterates through all pages
// Each 1000-record page takes 5 seconds — likely times out
```
---
## Good Example
```php
// Dedicated export endpoint with chunked streaming
// GET /api/posts/export
public function export() {
    return response()->stream(function () {
        Post::chunk(100, function ($posts) {
            echo $posts->toJson();
        });
    }, 200, ['Content-Type' => 'application/json']);
}
```
---
## Exceptions
Internal tools with small fixed datasets where export through pagination is acceptable.
---
## Consequences Of Violation
Timeouts on large exports; memory exhaustion; degraded pagination endpoint performance.
