## Enable N+1 Detection in Development
---
## Category
Performance
---
## Rule
Install and enable query monitoring tools (Debugbar, Telescope) in every development environment from project start.
---
## Reason
N+1 problems are invisible without tooling — the application works correctly, just slowly. Debugbar shows query count in the browser toolbar, making violations immediately visible during development. Detecting N+1 at development time costs seconds; fixing it after production deployment costs hours.
---
## Bad Example
```php
// No detection tooling installed
// Developer writes User::all() then accesses $user->posts in a loop
// No visual feedback — N+1 goes unnoticed until production
```
---
## Good Example
```php
// composer require barryvdh/laravel-debugbar --dev
// Debugbar shows 101 queries for 100 users — immediately visible
```
---
## Exceptions
API-only projects where Debugbar's toolbar cannot display. Use Telescope or query log middleware instead.
---
## Consequences Of Violation
N+1 problems ship to production. Application performance degrades silently as data grows. Users experience slow page loads, and the team discovers the issue through complaints rather than monitoring.
---
## Set Route-Specific Query Count Thresholds
---
## Category
Maintainability
---
## Rule
Define query count thresholds per route or page, not as a single global cap across all endpoints.
---
## Reason
A dashboard page may legitimately use 20 queries (multiple widgets, aggregates); a simple show page should use 2-3. A global cap triggers false positives on complex pages and false negatives on simple ones. Route-specific thresholds accurately reflect each endpoint's expected query budget.
---
## Bad Example
```php
// Global cap — unrealistic for all routes
if (count(DB::getQueryLog()) > 10) {
    Log::warning('Too many queries');
}
// Dashboard with 15 legit queries triggers false warning
```
---
## Good Example
```php
class QueryCountMiddleware
{
    private array $thresholds = [
        'posts.index' => 5,
        'dashboard' => 25,
        'users.show' => 3,
    ];

    public function handle($request, $next)
    {
        DB::enableQueryLog();
        $response = $next($request);
        $count = count(DB::getQueryLog());
        $threshold = $this->thresholds[$request->path()] ?? 10;
        if ($count > $threshold) {
            Log::warning("Query threshold exceeded on {$request->path()}: {$count}");
        }
        return $response;
    }
}
```
---
## Exceptions
Trivial applications with fewer than 5 endpoints where a global cap is practical.
---
## Consequences Of Violation
Developers ignore the query count warning system (too many false positives) and stop paying attention. Genuine N+1 regressions go undetected.
---
## Use Deterministic Seed Data for Query Count Tests
---
## Category
Testing
---
## Rule
Use fixed, predictable seed data — not random factory data — in tests that assert query counts.
---
## Reason
Random factories produce variable data shapes (a post with 0 comments vs. 10 comments triggers different eager loading behavior). This makes query count assertions flaky — sometimes they pass, sometimes they fail — making them unreliable as a CI gate.
---
## Bad Example
```php
public function test_post_index_queries(): void
{
    Post::factory(10)
        ->has(Comment::factory()->count(rand(0, 5))) // Random — flaky count
        ->create();

    $this->get('/posts');
    $this->assertQueryCountLessThan(10); // May fail randomly
}
```
---
## Good Example
```php
public function test_post_index_queries(): void
{
    Post::factory(10)
        ->has(Comment::factory()->count(3)) // Fixed count — deterministic
        ->create();

    $this->get('/posts');
    $this->assertQueryCountLessThan(10); // Always the same result
}
```
---
## Exceptions
Smoke tests that check for N+1 absence without asserting exact counts — use a generous upper bound to accommodate any data shape.
---
## Consequences Of Violation
Flaky CI pipeline. Developers lose trust in query count assertions and may disable them or ignore failures. The safety net degrades and N+1 regressions slip through.
---
## Never Deploy Debugbar to Production
---
## Category
Security
---
## Rule
Ensure Debugbar is installed only as a `--dev` dependency and explicitly disabled in production environments.
---
## Reason
Debugbar exposes database queries (including bindings with user data), application configuration, environment variables, and internal structure. Deploying it to production gives any user who opens the toolbar full visibility into the application internals.
---
## Bad Example
```json
{
    "require": {
        "barryvdh/laravel-debugbar": "^3.0"
    }
}
// Installed in production — toolbar visible to all users
```
---
## Good Example
```json
{
    "require-dev": {
        "barryvdh/laravel-debugbar": "^3.0"
    }
}
// Only installed in dev environments
```
---
## Exceptions
Staging environments that mirror production — use Telescope with `APP_DEBUG=false` instead.
---
## Consequences Of Violation
Data exposure (user PII in query bindings, database credentials in config, API keys in env vars). This is a critical security vulnerability that can lead to data breaches.
---
## Combine Automated Tests with Production Monitoring
---
## Category
Testing
---
## Rule
Implement both CI/CD query count assertions and production monitoring (request duration alerts, sampling-based query logging).
---
## Reason
Test assertions catch regressions before deployment but only cover tested code paths. Production monitoring catches regressions caused by data growth, new code paths, or edge cases that tests miss. Neither alone provides complete coverage.
---
## Bad Example
```php
// Only automated tests — no production monitoring
$this->assertQueryCountLessThan(10);
// A code path added to production without tests triggers N+1 silently
```
---
## Good Example
```php
// CI test: assertQueryCountLessThan(10);
// Production: Datadog alert on /posts p95 duration > 500ms
// Production: Telescope sampling captures slow requests for analysis
```
---
## Exceptions
Trivial applications where monitoring infrastructure cost exceeds benefit.
---
## Consequences Of Violation
N+1 regressions reach production undetected if untested code paths are involved. Production monitoring alone cannot catch issues before deployment; tests alone cannot catch issues in non-tested scenarios.
