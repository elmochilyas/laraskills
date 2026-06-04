# ECC Anti-Patterns — Octane Boot Timing

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Octane Boot Timing |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Request-Scoped Singletons
2. No Flush Listeners for Auth, Session, Uploads
3. Static Cache Accumulation
4. Deferred Providers Everywhere for Octane
5. No max_requests Configuration

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — singletons that accumulate query results across requests
- Premature Caching — caching per-request data in singletons that persist across Octane requests

---

## Anti-Pattern 1: Request-Scoped Singletons

### Category
Reliability

### Description
Using `$app->singleton()` for services that hold per-request state (auth, session, tenant, locale) under Octane.

### Why It Happens
Developers develop on PHP-FPM where each request gets a fresh application instance. They deploy to Octane without auditing binding types.

### Warning Signs
- `CurrentUser`, `TenantContext`, `Locale` services bound as `singleton()`
- Auth-related services using `singleton()`
- Services that hold user-specific data bound as `singleton()`

### Why It Is Harmful
Under Octane, singletons persist across all requests in a single worker. A singleton that holds user data from request #1 leaks that data to request #2 handled by the same worker. This is the #1 Octane data contamination issue.

### Real-World Consequences
`CurrentUser` is bound as `singleton()`. Request #1 from User A sets `CurrentUser::name` to "Alice". Request #2 from User B resolves `CurrentUser` — the same instance from request #1 returns "Alice". User B sees User A's data. PCI-compliant billing data may be exposed.

### Preferred Alternative
Use `$app->scoped()` for all services that hold mutable per-request state. Scoped bindings are flushed between requests.

### Refactoring Strategy
1. Audit all `$app->singleton()` calls in service providers
2. Replace each that holds mutable per-request state with `$app->scoped()`
3. Add custom flush listeners in `config/octane.php` for app-specific scoped services

### Detection Checklist
- [ ] Auth or session services using `singleton()`
- [ ] Tenant or locale services using `singleton()`
- [ ] User data leaks between requests in Octane workers

### Related Rules
Octane Boot Timing Rule 1 (05-rules.md): Use scoped() for All Per-Request State.

### Related Skills
Adapt Boot Timing for Octane Long-Running Workers (06-skills.md).

### Related Decision Trees
Binding Lifetime Selection for Octane (07-decision-trees.md).

---

## Anti-Pattern 2: No Flush Listeners for Auth, Session, Uploads

### Category
Security

### Description
Running Octane without configuring `FlushSessionState`, `FlushAuthenticationState`, and `FlushUploadedFiles` in `config/octane.php`.

### Why It Happens
Developers focus on Octane's performance benefits and skip reading the configuration documentation about required flush listeners.

### Warning Signs
- Empty or missing `RequestTerminated` listener list in `config/octane.php`
- No `FlushSessionState` in octane config
- No `FlushAuthenticationState` in octane config
- No `FlushUploadedFiles` in octane config

### Why It Is Harmful
Without flush listeners, session data, authentication state, and uploaded file instances persist across requests in the worker, leaking sensitive data from one user to the next.

### Real-World Consequences
User A logs in and authenticates. `FlushAuthenticationState` is not configured. User B makes a request to the same worker. The auth state from User A persists — User B is treated as User A. User B sees User A's dashboard, orders, and billing information. Full account takeover without any credentials.

### Preferred Alternative
Always include the three core flush listeners in `config/octane.php`. Add custom listeners for application-specific request state.

### Refactoring Strategy
1. Open `config/octane.php`
2. Add `FlushSessionState::class` to the `RequestTerminated` listeners array
3. Add `FlushAuthenticationState::class` to the listeners array
4. Add `FlushUploadedFiles::class` to the listeners array
5. Add custom listeners for app-specific state (tenant, locale, feature flags)

### Detection Checklist
- [ ] `FlushSessionState` missing from octane config
- [ ] `FlushAuthenticationState` missing from octane config
- [ ] `FlushUploadedFiles` missing from octane config
- [ ] Session or auth state persists between requests

### Related Rules
Octane Boot Timing Rule 3 (05-rules.md): Configure Octane Flush Listeners for Auth, Session, Uploads.

### Related Skills
Adapt Boot Timing for Octane Long-Running Workers (06-skills.md).

### Related Decision Trees
Worker Lifecycle (07-decision-trees.md).

---

## Anti-Pattern 3: Static Cache Accumulation

### Category
Security

### Description
Using static class properties as caches, counters, or buffers that grow unbounded across requests in Octane workers.

### Why It Happens
Developers use static properties for caching (a common pattern in PHP-FPM) without considering that these persist across all requests in a long-running worker.

### Warning Signs
- `private static array $cache = []` in service classes
- `private static int $requestCount = 0` for metrics
- Static collections that accumulate data across method calls
- No mechanism to clear static properties between requests

### Why It Is Harmful
Static properties persist across all requests in an Octane worker. Data from request #1 is visible to request #2. If the static property accumulates data unbounded (query caches, page view buffers), it causes memory exhaustion over time.

### Real-World Consequences
An `AnalyticsTracker` class has `private static array $pageViews = []`. Each request appends to this array. After 10,000 requests in the same worker, `$pageViews` contains 10,000 entries — consuming megabytes of memory. Worse, data from request #1 is mixed with data from request #10,000, making analytics reporting incorrect.

### Preferred Alternative
Use instance properties instead of static properties. Use `scoped()` bindings so instances are fresh per request. For cross-request caches, use dedicated cache services (Redis, database) with explicit TTL.

### Refactoring Strategy
1. Audit all static properties in application and package code
2. Replace `private static` with `private` properties (instance-level)
3. For services that must be cached across requests, use `Cache::remember()` instead of static arrays
4. For metrics aggregation, use dedicated metrics services (Redis counters, Prometheus)

### Detection Checklist
- [ ] Static properties that accumulate data across method calls
- [ ] Static caches without size limits or flush mechanisms
- [ ] Memory growth over time in Octane workers

### Related Rules
Octane Boot Timing Rule 2 (05-rules.md): Audit All Singletons for Mutable State.

### Related Skills
Adapt Boot Timing for Octane Long-Running Workers (06-skills.md).

### Related Decision Trees
Worker Lifecycle (07-decision-trees.md).

---

## Anti-Pattern 4: Deferred Providers Everywhere for Octane

### Category
Performance

### Description
Making all providers deferred under Octane under the mistaken belief that it provides the same benefit as in FPM.

### Why It Happens
Developers carry over FPM-era optimizations to Octane without understanding that under Octane, both deferred and eager providers boot once per worker.

### Warning Signs
- Every provider implements `DeferrableProvider`
- Route, event, or gate registration in deferred providers
- First request to a worker pays large deferred-loading latency
- No measurable performance difference after deferred conversion

### Why It Is Harmful
Under Octane, both deferred and eager providers boot once per worker. The bootstrap cost is amortized across thousands of requests — effectively zero per request. Deferred providers still do not provide their `boot()` logic (routes, events, listeners) until first resolution, potentially breaking features on the first request.

### Real-World Consequences
A developer makes all providers deferred for Octane. `RouteServiceProvider` is deferred — routes are not registered until a service from that provider is resolved. The first request to each worker finds no routes and returns 404. Subsequent requests work because the provider loaded on the first request. Production deploys cause 5 minutes of 404 errors until all workers are warmed.

### Preferred Alternative
Use eager providers for all boot-time initialization (routes, events, listeners, gates) under Octane. Defer only heavy, binding-only, rarely-used providers.

### Refactoring Strategy
1. Remove `DeferrableProvider` from all providers with boot-time logic
2. For binding-only providers used on < 50% of requests, keep deferred
3. Pre-resolve hot-path services in `booted()` callbacks
4. Measure worker startup time — optimize where data shows benefit

### Detection Checklist
- [ ] Providers with route/event registration are deferred
- [ ] First request per worker slow or returning errors
- [ ] No measurable performance difference from deferral

### Related Rules
Octane Boot Timing Rule 5 (05-rules.md): Pre-Resolve Hot-Path Services in booted().
Complete Boot Sequence Rule 4 (05-rules.md): Defer Providers That Only Bind Services.

### Related Skills
Adapt Boot Timing for Octane Long-Running Workers (06-skills.md).

### Related Decision Trees
Provider Strategy Under Octane (07-decision-trees.md).

---

## Anti-Pattern 5: No max_requests Configuration

### Category
Reliability

### Description
Running Octane workers indefinitely without configuring `octane.max_requests` to periodically restart workers.

### Why It Happens
Developers assume correct scoped bindings and property management make workers immune to memory growth.

### Warning Signs
- `max_requests` not set in `config/octane.php`
- Workers run indefinitely in production
- Memory usage increases over time in monitoring
- Occasional worker OOM kills

### Why It Is Harmful
Even with correct scoped bindings, some memory growth is inevitable — autoloader caches, logged query bindings, deferred service resolution, and package internals accumulate over time. Without `max_requests`, workers consume increasing memory until the operating system kills them (OOM).

### Real-World Consequences
An Octane deployment has no `max_requests` set. Workers run continuously. Memory usage grows from 50MB to 500MB over 24 hours. At peak traffic, a worker exceeds the 512MB container limit and is OOM-killed. The remaining workers handle double the load, also grow faster, and cascade into a full outage.

### Preferred Alternative
Configure `octane.max_requests` to 500-1000 to periodically restart workers and reset memory to a clean baseline.

### Refactoring Strategy
1. Open `config/octane.php`
2. Set `'max_requests' => 500` (start conservative, adjust based on monitoring)
3. Monitor memory growth over time and adjust threshold
4. Add alerting for worker restart frequency

### Detection Checklist
- [ ] `max_requests` not configured in `config/octane.php`
- [ ] Memory grows over time in worker monitoring
- [ ] Workers crash with OOM errors
- [ ] No worker restart mechanism

### Related Rules
Octane Boot Timing Rule 4 (05-rules.md): Set max_requests to Limit Memory Growth.

### Related Skills
Adapt Boot Timing for Octane Long-Running Workers (06-skills.md).

### Related Decision Trees
Worker Lifecycle (07-decision-trees.md).
