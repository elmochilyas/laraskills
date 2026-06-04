# REST Architectural Constraints

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: rest-architectural-constraints
- Phase: 5-rules
- Last Updated: 2026-06-02

---

## Use The API Middleware Group For Statelessness
---
## Category
Architecture
---
## Rule
Always use the `api` middleware group for API routes — never add `StartSession`, `ShareErrorsFromSession`, or other session-related middleware to API routes.
---
## Reason
Statelessness is the most impactful REST constraint — every request must carry all information the server needs. Laravel's `api` middleware group excludes session middleware by design, enforcing statelessness. Adding session middleware to API routes breaks horizontal scaling (requiring session affinity), introduces CSRF requirements, and creates hidden server state.
---
## Bad Example
```php
// Adding session middleware to API routes
Route::middleware(['web', 'auth:sanctum'])->group(function () {
    Route::apiResource('users', UserController::class);
    // 'web' group includes StartSession — breaks statelessness
});
```

## Good Example
```php
// Use the api middleware group
Route::middleware('api')->group(function () {
    Route::apiResource('users', UserController::class);
    // No session middleware — fully stateless
});
```

## Exceptions
When the API must share authentication with the web frontend (same-domain SPA with Sanctum). Even then, use Sanctum's stateful middleware for specific endpoints, not the entire `web` group.

## Consequences Of Violation
Server-side session state in API; cannot horizontally scale without sticky sessions; CSRF token requirements on API endpoints; hidden coupling between requests via session data.
---

## Use Token-Based Authentication For APIs
---
## Category
Security
---
## Rule
Always use token-based authentication (Sanctum tokens or Passport OAuth) for API authentication — never use session-based authentication for API routes.
---
## Reason
Session-based auth requires server-side session state, breaking statelessness and preventing horizontal scaling. Tokens are self-contained or database-backed credentials that the client sends with every request, enabling any server instance to authenticate without session affinity. Tokens also have explicit scopes and expiration independent of session lifetime.
---
## Bad Example
```php
// Session-based auth on API routes
Route::middleware(['auth:web'])->group(function () {
    Route::apiResource('users', UserController::class);
    // Uses session — requires cookie, breaks statelessness
});
```

## Good Example
```php
// Token-based auth with Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('users', UserController::class);
    // Stateless — token sent with every request
});
```

## Exceptions
Same-domain SPAs using Sanctum's SPA authentication (cookie-based but stateful only for the CSRF endpoint). This is an accepted pragmatic exception documented by Laravel.

## Consequences Of Violation
Sticky session requirement prevents horizontal scaling; session hijacking risk from cookie theft; CSRF protection needed on all state-changing endpoints; session storage becomes bottleneck under load.
---

## Set Explicit Cache Headers On Every Response
---
## Category
Performance
---
## Rule
Always set explicit `Cache-Control` headers on every API response — even if the answer is `no-cache, no-store`, the header must be present.
---
## Reason
Without explicit cache headers, browsers, CDNs, and proxies make their own caching decisions. API responses that should not be cached may be cached inadvertently, serving stale data. Explicit headers ensure predictable caching behavior at every layer of the infrastructure.
---
## Bad Example
```php
return response()->json($data);
// No Cache-Control header — intermediaries make unpredictable caching decisions
```

## Good Example
```php
return response()->json($data)
    ->header('Cache-Control', 'public, max-age=3600');

// Or for private/user-specific data:
return response()->json($data)
    ->header('Cache-Control', 'private, no-cache');
```

## Exceptions
When a higher-level infrastructure (nginx, CDN) sets cache headers globally. Still set response-level headers for documentation and local development clarity.

## Consequences Of Violation
Unpredictable caching behavior; stale data served to users; private data cached and shared across users; debugging difficulty when caching behavior changes between environments.
---

## Never Access session() In API Routes
---
## Category
Architecture
---
## Rule
Never use `session()`, `Session::`, or `$request->session()` in API route handlers or controllers — model client-specific state as server resources instead.
---
## Reason
Using session in API routes introduces server-side state between requests, breaking statelessness. This prevents horizontal scaling, creates hidden dependencies, and couples the API to specific server instances. Client-specific state (cart contents, wizard progress, multi-step form data) should be modeled as API resources with CRUD operations.
---
## Bad Example
```php
// Session state in API controller
public function addToCart(Request $request)
{
    $cart = session()->get('cart', []);
    $cart[] = $request->product_id;
    session()->put('cart', $cart); // hidden server state
}
```

## Good Example
```php
// Model state as resource
Route::post('carts/{cart}/items', [CartItemController::class, 'store']);
// State is stored in database, not session — fully stateless
```

## Exceptions
When the API is an internal service on a single-server deployment with no scaling requirements. Even then, prefer resource-based state for future-proofing.

## Consequences Of Violation
Cannot horizontally scale API without sticky sessions; hidden state causes bugs when load balancer distributes requests across instances; session storage becomes a bottleneck; CSRF requirements introduced.
---

## Apply All Six Constraints As A System
---
## Category
Architecture
---
## Rule
Always apply REST constraints together as a system — never cherry-pick individual constraints (HTTP methods without statelessness, or resources without caching) and claim REST compliance.
---
## Reason
REST constraints are interdependent — they produce architectural properties (scalability, visibility, reliability) when applied together. Using HTTP methods and resources without statelessness or caching produces an HTTP API that doesn't deliver REST's key benefits. Partial adoption weakens the architecture without providing the simplicity of a non-REST design.
---
## Bad Example
```php
// "REST" API with sessions and no caching — missing constraints
Route::middleware('web')->group(function () {
    Route::apiResource('users', UserController::class);
});
// Uses HTTP methods (good) but has sessions (bad), no cache headers (bad)
```

## Good Example
```php
// Full constraint application
Route::middleware(['api', 'auth:sanctum'])->group(function () {
    Route::apiResource('users', UserController::class);
});
// Stateless (api middleware), token auth, cache headers on responses
```

## Exceptions
When the API is explicitly documented as "RESTful" (Level 2) or "HTTP API" — not claiming full "REST". Accurate terminology sets correct expectations.

## Consequences Of Violation
Misleading "REST" labeling; missing key benefits (caching, scaling); architectural inconsistencies that accumulate technical debt; difficult migration to full REST later.
---

## Use Correlation IDs For Request Tracing
---
## Category
Maintainability
---
## Rule
Always include a correlation ID (request ID) in every API response and log — never rely on session IDs for request correlation in stateless APIs.
---
## Reason
Without sessions, there is no session ID to correlate requests from the same client. Correlation IDs (generated by the client or load balancer) allow tracing a request across multiple layers (load balancer, application, database, external services). This is essential for debugging failures in stateless, horizontally-scaled architectures.
---
## Bad Example
```php
// No correlation ID — cannot trace request across layers
return response()->json($data);
```

## Good Example
```php
// Generate and return correlation ID
$correlationId = $request->header('X-Correlation-Id', (string) Str::uuid());
Log::withContext(['correlation_id' => $correlationId]);
return response()->json($data)
    ->header('X-Correlation-Id', $correlationId);
```

## Exceptions
When the infrastructure layer (load balancer, API gateway) already injects and logs correlation IDs. Ensure the application forwards the existing correlation ID rather than generating a new one.

## Consequences Of Violation
Cannot correlate requests across layers during debugging; difficult to trace failures in distributed systems; extended mean-time-to-resolution for production incidents.
---

## Design For Horizontal Scaling Without Session Affinity
---
## Category
Scalability
---
## Rule
Always design API routes and middleware to support round-robin load balancing without session affinity — never introduce dependencies on specific server instances.
---
## Reason
Stateless APIs can scale horizontally by adding server instances behind a round-robin load balancer. Session affinity (sticky sessions) couples clients to specific servers, creating hot spots and single points of failure when a server goes down. Any dependency on local filesystem, in-memory cache without replication, or server-local state breaks this model.
---
## Bad Example
```php
// File-based cache on local disk — breaks without sticky sessions
Cache::store('file')->put('key', 'value', 3600);
// Next request may hit different server — cache miss
```

## Good Example
```php
// Shared Redis cache — works across all server instances
Cache::store('redis')->put('key', 'value', 3600);
// Any server can read the cached value
```

## Exceptions
Single-server deployments where horizontal scaling is not anticipated. Even then, use shared caching to avoid migration pain when scaling is needed.

## Consequences Of Violation
Cannot add server instances without enabling sticky sessions; uneven load distribution (sticky sessions create hot servers); server failure drops all active user sessions; scaling requires infrastructure changes.
---

## Distinguish Public vs Private Cache Headers
---
## Category
Security
---
## Rule
Always set `Cache-Control: private` for user-specific responses and `Cache-Control: public` for shared responses — never use `public` for authenticated or personalized data.
---
## Reason
`public` cache-control allows CDNs and shared caches to store and serve the response to any user. User-specific data (profile, dashboard, personal settings) cached as `public` would be served to the wrong user. `private` restricts caching to the browser, preventing shared caches from serving personalized data to other users.
---
## Bad Example
```php
// Public cache for user-specific data — leaks to other users
return response()->json(auth()->user()->profile)
    ->header('Cache-Control', 'public, max-age=3600');
```

## Good Example
```php
// Private cache for user-specific data
return response()->json(auth()->user()->profile)
    ->header('Cache-Control', 'private, max-age=3600');

// Public cache for shared data
return response()->json(Product::all())
    ->header('Cache-Control', 'public, max-age=3600');
```

## Exceptions
When the response contains no user-specific data even though the endpoint requires authentication (e.g., public product catalog behind auth). In that case, `public` with `s-maxage` is safe — verify no user-specific data is included.

## Consequences Of Violation
User-specific data cached and served to other users; privacy data exposure; compliance violations (GDPR, HIPAA); CDN serving wrong user's data.
---
