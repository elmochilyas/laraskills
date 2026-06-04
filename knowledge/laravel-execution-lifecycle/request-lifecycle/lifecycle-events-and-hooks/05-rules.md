# Lifecycle Events and Hooks Rules

## Rule: Always Prefer Terminating Over RequestHandled For Cleanup
---
## Category
Performance
---
## Rule
Use `Terminating` event or `$app->terminating()` callbacks for post-response cleanup; never use `RequestHandled` for operations that do not modify the response.
---
## Reason
`RequestHandled` fires inside `Kernel::handle()` *before* `$response->send()` — it delays time-to-first-byte. `Terminating` fires in `$kernel->terminate()` *after* the response has been sent (and after `fastcgi_finish_request()` in FPM), so its execution time is hidden from the client.
---
## Bad Example
```php
// Logs request metrics before the response is sent — adds client-visible latency
Event::listen(RequestHandled::class, function ($event) {
    Log::info('Request completed', [
        'uri' => $event->request->getUri(),
        'status' => $event->response->getStatusCode(),
    ]);
});
```
---
## Good Example
```php
// Logs after response is sent — no client-visible latency
Event::listen(Terminating::class, function ($event) {
    Log::info('Request completed', [
        'uri' => $event->request->getUri(),
        'status' => $event->response->getStatusCode(),
    ]);
});
```
---
## Exceptions
Modifying the response (adding headers, transforming content) must use `RequestHandled` because the response has already been sent by the time `Terminating` fires.
---
## Consequences Of Violation
Unnecessary client-visible latency added to every request, slower TTFB, degraded user-perceived performance, reduced Lighthouse/Web Vitals scores.

---

## Rule: Keep RequestHandled Listeners Sub-Millisecond
---
## Category
Performance
---
## Rule
Limit `RequestHandled` listeners to micro-operations only (header manipulation, response transformation); move all I/O and heavy computation to `Terminating` or queue jobs.
---
## Reason
`RequestHandled` fires synchronously inside the kernel's `handle()` method, before `send()`. Every millisecond spent in a `RequestHandled` listener is added to the response time that the client observes. Under load, this compounds — 5 listeners each taking 2ms adds 10ms to every response.
---
## Bad Example
```php
Event::listen(RequestHandled::class, function ($event) {
    $event->response->headers->set('X-Cache-Status', Cache::get('key')); // DB/Redis call
});
```
---
## Good Example
```php
Event::listen(RequestHandled::class, function ($event) {
    $event->response->headers->set('X-Framework', 'Laravel'); // sub-millisecond header
});
```
---
## Exceptions
Response compression or encryption that must happen before the response is sent can justify millisecond-range operations in `RequestHandled`, but should use streaming or dedicated middleware instead.
---
## Consequences Of Violation
Increased TTFB, degraded user experience, reduced concurrent request capacity under load, slower API response times.

---

## Rule: Register booting() Only In Provider register() Methods
---
## Category
Framework Usage
---
## Rule
Register `$app->booting()` callbacks exclusively inside a service provider's `register()` method; never in `boot()`.
---
## Reason
`booting()` callbacks execute immediately upon registration if the application has already started booting. When registered in `register()`, they queue for execution during the boot phase. When registered in `boot()`, they fire immediately (the app is already past the booting phase), effectively running at an unpredictable point — usually during provider `boot()` execution but not at the intended booting phase boundary.
---
## Bad Example
```php
public function boot(): void
{
    // fires immediately during boot(), not at booting phase
    $this->app->booting(function () {
        $this->app->make(InitService::class)->initialize();
    });
}
```
---
## Good Example
```php
public function register(): void
{
    // queued during register(), fires after RegisterProviders completes
    $this->app->booting(function () {
        $this->app->make(InitService::class)->initialize();
    });
}
```
---
## Exceptions
Conditional booting callbacks that intentionally want to fire during `boot()` should use `$this->app->booted()` instead, which is the correct hook for that timing.
---
## Consequences Of Violation
Callbacks fire at unexpected times, services unavailable when callback runs, initialization order bugs that are timing-dependent and hard to reproduce.

---

## Rule: Use Exact Class Strings For Bootstrap Event Listeners
---
## Category
Maintainability
---
## Rule
Use exact bootstrapper class name strings when listening to `bootstrapping:*` and `bootstrapped:*` events; avoid vague wildcards without verification.
---
## Reason
Bootstrap events use string names (`bootstrapping:LoadConfiguration`) rather than typed event objects. A wildcard mismatch, typo, or namespace discrepancy silently prevents the listener from ever firing — no error is raised, the listener is simply never dispatched. Wildcards should be tested with Artisan Tinker to verify they match.
---
## Bad Example
```php
// Typo in class name — silently never fires
$app['events']->listen('bootstrapped:*Config*', function () {
    // never executes
});
```
---
## Good Example
```php
// Exact class name — guaranteed to match
$app['events']->listen('bootstrapped:Illuminate\Foundation\Bootstrap\LoadConfiguration', function () {
    Log::debug('Configuration loaded');
});
```
---
## Exceptions
Wildcard listeners intended for observability (measuring all bootstrap phases) should use `bootstrapping:*` and `bootstrapped:*` with a prefix that prevents ambiguity, and must be verified with a test.
---
## Consequences Of Violation
Monitoring silently missing, bootstrapping telemetry broken, debugging time wasted investigating why listeners never fire, missed metrics in production.

---

## Rule: Do Not Nest Lifecycle Hook Registration Inside Lifecycle Hooks
---
## Category
Reliability
---
## Rule
Never register a lifecycle callback or event listener from within another lifecycle callback or event listener of the same type.
---
## Reason
Registering a callback inside a callback of the same lifecycle phase creates an unbounded chain — the newly registered callback may execute in the same phase iteration, causing infinite loops or stack overflows. Even if it doesn't loop, the execution order becomes non-deterministic and depends on internal implementation details.
---
## Bad Example
```php
Event::listen(Terminating::class, function () {
    // Registers another terminating listener inside a terminating listener
    Event::listen(Terminating::class, function () {
        Log::info('Also terminating');
    });
});
```
---
## Good Example
```php
// Register all terminating listeners at a single, stable point — e.g., in a ServiceProvider
Event::listen(Terminating::class, CleanupHandler::class);
Event::listen(Terminating::class, LogMetrics::class);
```
---
## Exceptions
Conditional registration based on runtime data (e.g., register a listener only if a specific condition is met) is acceptable if the registration guard prevents infinite recursion and the lifecycle phase iteration has completed.
---
## Consequences Of Violation
Infinite callback chains, stack overflow exceptions, non-deterministic execution order, memory leaks from accumulating listener registrations.

---

## Rule: Avoid Container Resolution In booting() Callbacks
---
## Category
Reliability
---
## Rule
Do not resolve services from the container inside `$app->booting()` callbacks; use `$app->booted()` instead.
---
## Reason
`booting()` callbacks fire during the `RegisterProviders` bootstrapper, after providers have registered but before they have *booted*. Many services are not yet fully initialized — their `boot()` methods have not run. Resolving a service in `booting()` may return an uninitialized proxy or trigger an error.
---
## Bad Example
```php
$this->app->booting(function () {
    $service = $this->app->make(EmailService::class);
    // EmailService may depend on services that haven't booted yet
});
```
---
## Good Example
```php
$this->app->booted(function () {
    $service = $this->app->make(EmailService::class);
    // All providers have booted — all services are fully initialized
});
```
---
## Exceptions
Resolving framework-level services that are explicitly documented to be available during `booting` (e.g., config repository, event dispatcher) is safe.
---
## Consequences Of Violation
Calls to uninitialized services, runtime exceptions that only occur with specific provider boot order, subtle timing-dependent failures.

---

## Rule: Use Duration Handlers For Telemetry, Never For Logic
---
## Category
Architecture
---
## Rule
Restrict `whenRequestLifecycleDurationExceeds` handlers to observability (logging, metrics) only; never use them for business logic or response modification.
---
## Reason
Duration handlers run in `$kernel->terminate()`, after the response has been sent and the connection closed. Any state modification (database writes, cache updates, session changes) happens after the client has received the response — the client cannot be notified of failures, and under Octane, the modifications carry over to the next request.
---
## Bad Example
```php
$kernel->whenRequestLifecycleDurationExceeds(1000, function ($request, $response) {
    // Side effect that should not happen after response is sent
    DB::table('slow_requests')->insert(['uri' => $request->getUri()]);
});
```
---
## Good Example
```php
$kernel->whenRequestLifecycleDurationExceeds(1000, function ($request, $response) {
    // Read-only telemetry — no side effects
    Log::warning('Slow request', ['uri' => $request->getUri(), 'duration' => ...]);
});
```
---
## Exceptions
No common exceptions. Side effects in duration handlers are always incorrect because the response is already sent and the client connection is closed.
---
## Consequences Of Violation
Silent data corruption from post-send writes, Octane state leakage between requests, unmonitored failures in observability pipeline.

---

## Rule: Use Callbacks For Simple Cleanup, Events For Complex Operations
---
## Category
Code Organization
---
## Rule
Prefer `$app->terminating()` callbacks for single-purpose cleanup (flush caches, reset singletons) and the `Terminating` event for multi-listener orchestration (logging, metrics, queue dispatch).
---
## Reason
Callbacks are simpler, lighter, and execute in registration order. The event dispatcher provides ordering, priority, queued listeners, and subscriber support. Matching the mechanism to complexity keeps cleanup code readable — trivial flushes don't need event classes, and complex operations benefit from event infrastructure.
---
## Bad Example
```php
// Using event dispatcher for a simple singleton reset
Event::listen(Terminating::class, function () {
    app()->forgetInstance(CurrentUser::class);
});
```
---
## Good Example
```php
// Simple callback for trivial cleanup
$this->app->terminating(function () {
    app()->forgetInstance(CurrentUser::class);
});

// Event dispatcher for complex multi-listener operations
Event::listen(Terminating::class, [
    LogRequestMetrics::class,
    DispatchAfterResponseJobs::class,
    ReportToPulse::class,
]);
```
---
## Exceptions
Applications that standardize on the event dispatcher for all lifecycle hooks (enforcing consistency over optimization) may use events exclusively.
---
## Consequences Of Violation
Over-engineered cleanup code, unnecessary event infrastructure for simple operations, inconsistent patterns between trivial and complex cleanup.
