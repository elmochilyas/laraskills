# Octane Architecture Overview

## Rule Name
Audit every singleton for mutable state before deploying Octane.
---
## Category
Architecture | Reliability
---
## Rule
Always audit every `singleton()` binding across application and vendor providers for mutable per-request state before deploying Octane.
---
## Reason
Silent data leaks are the #1 production Octane bug — singletons shared across workers retain state between requests. A singleton holding cached user data leaks that data to the next request.
---
## Bad Example
```php
// Deployed to Octane without audit
$this->app->singleton(AuthManager::class); // Auth state leaks across requests
```
---
## Good Example
```php
// Audit identifies singletons with state
$this->app->singleton(ConfigReader::class);    // Stateless — safe
$this->app->scoped(CurrentTeam::class);         // Per-request state — scoped
$this->app->scoped(AuthManager::class);         // Per-request state — scoped
```
---
## Exceptions
PHP-FPM-only deployments where process isolation provides per-request freshness.
---
## Consequences Of Violation
Cross-request data leaks, authentication confusion, silent wrong results that cannot be reproduced in development.

---

## Rule Name
Use `scoped()` for all per-request stateful services.
---
## Category
Architecture | Design
---
## Rule
Always bind auth, session, locale, current-tenant, and any other per-request contextual services as `scoped()` rather than `singleton()`.
---
## Reason
Scoped bindings provide per-request isolation with in-request singleton performance. The sandbox discards the instance after the request, ensuring no state crosses request boundaries.
---
## Bad Example
```php
$this->app->singleton(CurrentTenant::class);
// Each request sets tenant; next request reads stale tenant
```
---
## Good Example
```php
$this->app->scoped(CurrentTenant::class);
// Fresh instance per request; singleton speed within request
```
---
## Exceptions
Truly stateless services (config readers, HTTP clients, loggers) correctly remain singletons.
---
## Consequences Of Violation
User A's tenant data affects User B's request; hard-to-reproduce data corruption.

---

## Rule Name
Set `max_requests` based on memory profiling, never disable it.
---
## Category
Performance | Reliability
---
## Rule
Always configure `max_requests` in `config/octane.php` based on measured memory growth rate. Never set it to 0 or null.
---
## Reason
No application has perfect memory hygiene. `max_requests` is the last line of defense against accumulated memory leaks. Profile per-request growth and calculate: `(memory_limit - baseline) / growth_per_request`.
---
## Bad Example
```php
// config/octane.php
'max_requests' => 0, // No safety valve — workers grow until OOM
```
---
## Good Example
```php
// config/octane.php
// Profiled: baseline 40MB, growth 0.5MB/req, limit 128MB
'max_requests' => env('OCTANE_MAX_REQUESTS', 150),
```
---
## Exceptions
Local development where worker churn doesn't matter.
---
## Consequences Of Violation
Workers silently accumulate memory until OS OOM killer terminates them; requests lost during crash.

---

## Rule Name
Test Octane readiness with sequential request sequences.
---
## Category
Testing
---
## Rule
Always test Octane behavior with sequences of ≥100 sequential requests in CI before deployment.
---
## Reason
Octane bugs only manifest on the second, third, or thousandth request. Singletons and statics accumulate over time — a single-request test catches nothing.
---
## Bad Example
```php
// Single-request test — passes but misses leaks
public function test_user_can_view_profile(): void
{
    $response = $this->get('/profile');
    $response->assertOk();
}
```
---
## Good Example
```php
// Sequential request test — detects cross-request leaks
public function test_octane_data_isolation(): void
{
    $alice = $this->actingAs(User::factory()->create());
    $bob = $this->actingAs(User::factory()->create());

    $alice->get('/profile'); // Warms caches
    $bobResponse = $bob->get('/profile'); // Should be Bob's data

    $bobResponse->assertSee($bob->user->name);
    $bobResponse->assertDontSee($alice->user->name);
}
```
---
## Exceptions
PHP-FPM-only deployments — no persistent process means no accumulation.
---
## Consequences Of Violation
Leaks undetected until production; silent data corruption affects real users.

---

## Rule Name
Never share Octane workers with Horizon or queue workers.
---
## Category
Architecture | Reliability
---
## Rule
Always run Octane workers and queue workers (Horizon) in separate processes. Never share a worker process between HTTP and queue processing.
---
## Reason
Queue jobs and HTTP requests operate on the same container with different lifecycle assumptions. Running both in the same process causes state corruption, container confusion, and resource contention.
---
## Bad Example
```php
// Running queue:work inside an Octane worker process
// Contaminates shared singletons between HTTP and queue contexts
```
---
## Good Example
```php
# Separate processes:
# Terminal 1: php artisan octane:start
# Terminal 2: php artisan queue:work redis --max-jobs=500
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Singleton state corruption between HTTP and queue contexts; unpredictable failures; resource exhaustion.

---

## Rule Name
Run each Octane runtime's adapter-specific tests.
---
## Category
Testing | Reliability
---
## Rule
Always test against the specific Octane runtime (Swoole, RoadRunner, or FrankenPHP) you will deploy to, not just the Octane facade.
---
## Reason
Each runtime has distinct concurrency models and edge cases. Swoole supports coroutines with shared memory; RoadRunner uses process-per-core isolation; FrankenPHP can reuse sandboxes. Behavior varies across runtimes.
---
## Bad Example
```php
// Tests pass on Swoole but deploy to FrankenPHP with sandbox reuse
// Sandbox-cleanup assumptions are wrong
```
---
## Good Example
```php
// Test with the target runtime
// ci.yml
// - Run: php artisan octane:start --server=swoole --max-requests=100
// - Run: pest tests/Octane --parallel
```
---
## Exceptions
Development environments where runtime parity is not expected.
---
## Consequences Of Violation
Runtime-specific bugs surface only in production; sandbox lifecycle assumptions are wrong under different adapters.
