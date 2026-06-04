# Per-Page Parameter Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Pagination Strategies
- **Knowledge Unit:** Per-Page Parameter Design
- **Last Updated:** 2026-06-02

---

## Executive Summary

The `per_page` (or `limit`) parameter controls how many records are returned in a single paginated response. Its design — default value, maximum value, parameter naming, and behavior when omitted or exceeded — significantly impacts API usability, server load, and data transfer costs. A well-designed per-page strategy balances client convenience (smaller pages for mobile, larger pages for batch processing) with server protection (limits prevent abuse and excessive load).

---

## Core Concepts

### Parameter Naming
- `per_page` — Laravel convention, JSON:API `page[size]`
- `limit` — Database-idiomatic, used by Stripe, GitHub
- `page[size]` — JSON:API nested parameter style

### Default Values
- Laravel default: 15
- Common REST defaults: 15, 20, 25, 30
- Mobile-optimized: 10–15
- Admin panels: 25–50

### Maximum Values
- Typical max: 100
- Generous max: 1000
- Reason: Prevent OOM, slow queries, and bandwidth abuse

---

## Mental Models

### The Buffet Plate Model
`per_page` is the plate size. A small plate (10) means more trips but manageable portions. A large plate (1000) means fewer trips but the plate is heavy and might spill. The server gets to say "maximum plate size is 100" to prevent gluttony.

### The Water Tap Model
`per_page` is the flow rate. A small flow gives steady, manageable data. A large flow can overwhelm the pipes (network) and the bucket (server memory). The server controls the maximum flow rate.

### The Granularity Model
Smaller `per_page` values give finer-grained control to the client but increase the number of requests. Larger values reduce requests but increase per-request latency and memory.

---

## Internal Mechanics

### Default Configuration in Laravel
```php
// Model-specific default
class User extends Model
{
    protected $perPage = 25;
}

// Controller-level override
User::paginate(20);
User::paginate(request('per_page', 15));

// Global default (via AppServiceProvider)
Paginator::defaultPerPage(20);
```

### Request Validation
```php
// Validate per_page with bounded range
$validated = $request->validate([
    'per_page' => 'integer|min:1|max:100',
]);

// Or clamp with min/max
$perPage = min(max((int) $request->input('per_page', 15), 1), 100);
```

### Response Metadata
```php
// Laravel automatically includes per_page in meta
"meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 100,
    "last_page": 7
}

// Custom per_page in meta for cursor pagination
"meta": {
    "per_page": 15,
    "next_cursor": "...",
    "has_more": true
}
```

---

## Patterns

### Configurable Default per Resource
```php
class PostController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', Post::DEFAULT_PER_PAGE);
        $perPage = min($perPage, Post::MAX_PER_PAGE);

        return PostResource::collection(
            Post::paginate($perPage)
        );
    }
}
```

### Adaptive per_page by Client
```php
// Mobile clients get smaller pages automatically
$perPage = $request->userAgent()?->isMobile()
    ? min($request->input('per_page', 10), 50)
    : min($request->input('per_page', 25), 100);
```

### max() + min() Clamping
```php
$perPage = (int) $request->input('per_page', 15);
$perPage = max(1, min($perPage, 100));
```

### Query Parameter Consistency
Use the same naming and semantics across all endpoints:
```
GET /api/posts?per_page=20
GET /api/users?per_page=20
GET /api/comments?per_page=20
```

---

## Architectural Decisions

### Static vs Dynamic Defaults
Static defaults (a constant) are predictable for clients. Dynamic defaults (based on client type, time of day, server load) add complexity. Use static defaults unless you have a specific reason to vary.

### Generous vs Restrictive Maximums
Generous maximums (1000) serve batch-processing clients but risk server overload. Restrictive maximums (50) protect the server but frustrate clients that want fewer round trips. A common compromise: max=100 for regular endpoints, max=1000 for dedicated export endpoints.

### Pagination Config per Endpoint Tier
- Public endpoints: max per_page = 100, default = 15
- Authenticated endpoints: max per_page = 200, default = 25
- Admin/internal endpoints: max per_page = 1000, default = 50

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Small default minimizes payload | More requests for large datasets | Higher latency for batch operations |
| Large maximum supports data export | Unbounded maximum causes OOM risk | Always enforce an upper limit |
| Per-endpoint tuning optimizes UX | Configuration complexity | Increased maintenance burden |
| Client-adaptive per_page improves mobile UX | Default behavior is less predictable | Document the algorithm or use static defaults |

---

## Performance Considerations

### Response Size vs per_page
- per_page=10: ~2–5KB response, 10 queries to fetch 100 records
- per_page=100: ~20–50KB response, 1 query to fetch 100 records
- per_page=1000: ~200–500KB response, 1 query but 5–10x slower

The optimal per_page balances response size (network time) with page count (round trips). For most APIs, 15–25 is the sweet spot.

### Database Impact of Large per_page
Large `per_page` values increase query execution time (more rows to fetch, more data to transfer from storage engine). They also increase memory usage on both database and application servers.

### Serialization Cost
More records per page means more serialization time (Eloquent model hydration, JSON encoding). For per_page=1000, serialization can dominate response time.

---

## Production Considerations

### Rate Limiting by per_page
Consider tying rate limits to `per_page` — clients requesting larger pages consume more server resources. However, this adds complexity and is uncommon in practice.

### Logging Abusive per_page Requests
Log and monitor requests with `per_page` values near the maximum. A single client repeatedly requesting max per_page may indicate scraping or abuse.

### API Documentation
Document per-endpoint default and maximum `per_page` values in your API reference. Include the parameter in OpenAPI/Swagger specs.

### Backward Compatibility
If you reduce the maximum `per_page`, clients relying on larger values break. Use sunset headers and deprecation warnings.

---

## Common Mistakes

### Not Enforcing a Maximum
Why it happens: Trusting clients to request reasonable values. Why it's harmful: A client requests per_page=100000, causing the database to transfer and the app to hydrate 100K records, exhausting memory. Better approach: Always enforce a documented maximum.

### Using per_page for Batch Operations
Why it happens: Clients set per_page=1000 to iterate through all records quickly. Why it's harmful: Large pages time out or consume excessive memory. Better approach: Provide a dedicated export endpoint with chunked processing, not pagination.

### Inconsistent Naming Across Endpoints
Why it happens: Different developers choose different names (per_page vs limit vs page_size). Why it's harmful: Clients must adapt to different parameter names for each endpoint. Better approach: Standardize on one naming convention across the entire API.

---

## Failure Modes

### per_page Exceeds Database Limits
Some databases have limits on the number of rows returned in a single query (e.g., SQLite's SQLITE_MAX_LIMIT). Large `per_page` values may hit these limits.

### Pagination Overflow
If `per_page` is extremely large and the total dataset is large, the paginator may attempt to allocate arrays with millions of elements, causing out-of-memory errors.

### Negative or Zero Values
An invalid `per_page=0` or `per_page=-1` can crash pagination logic if not validated. Always validate to `min:1`.

---

## Ecosystem Usage

### Laravel
Default: 15. Configurable via `Model::$perPage`, `Paginator::defaultPerPage()`, or pass to `paginate()`. No built-in maximum enforcement — must be implemented manually.

### GitHub API
Default: 30. Max: 100. Uses `per_page` parameter name. Returns `Link` headers for navigation.

### Stripe API
Default: 10. Max: 100. Uses `limit` parameter name. Cursor-based pagination with `starting_after`.

---

## Related Knowledge Units

### Prerequisites
- Offset Pagination Design — Where per_page is used
- Cursor Pagination Design — Where per_page/limit is used

### Related Topics
- Pagination Strategy Selection — Context for per_page decisions
- Rate Limiting Design — Relationship between per_page and resource consumption

### Advanced Follow-up Topics
- Response Payload Optimization — Minimizing per-page data transfer
- API Versioning and Backward Compatibility — Changing per_page defaults

---

## Research Notes

### Source Analysis
- GitHub API docs: Pagination parameters
- Stripe API reference: Pagination with limit
- JSON:API spec: page[size] parameter
- Laravel docs: Pagination configuration

### Key Insight
The default `per_page` value should be chosen based on your most common client (mobile vs desktop) and the median record size. For APIs with small records (IDs, names), a larger default works. For APIs with large records (full articles, images), a smaller default prevents bloated responses.

### Version-Specific Notes
- Laravel 9–11: `Paginator::defaultPerPage()` consistent
- Laravel 11: No changes to per_page behavior
