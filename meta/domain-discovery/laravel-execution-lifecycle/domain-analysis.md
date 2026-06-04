# Domain Overview

The Laravel Execution Lifecycle & Framework Internals domain covers the complete path an HTTP request (or CLI command) takes from entry point through framework bootstrapping, service resolution, middleware processing, routing, controller dispatch, response construction, and termination. It also encompasses the internal architecture of the service container, service providers, kernel system, and the boot ordering that governs how Laravel initializes itself.

This domain is the foundation layer of the ECC system. Every other domain — Eloquent, Queues, Security, Testing, etc. — depends on understanding how Laravel boots, resolves dependencies, and processes requests. Without mastery here, all other knowledge is fragile.

---

# Domain Scope

## What Belongs

- `public/index.php` entry point mechanics
- Application class construction and initialization
- Service Container (IoC) architecture — bindings, resolution, contextual, tagged, scoped
- Service Provider contract — register, boot, deferred, environment-specific, package discovery
- HTTP Kernel — bootstrappers, middleware pipeline, handle/terminate lifecycle
- Console Kernel — command registration, scheduling, Artisan boot flow
- Middleware Pipeline — Pipeline class, global/group/route middleware, priority, terminable
- Bootstrapping Sequence — exact order of LoadEnvironmentVariables, LoadConfiguration, HandleExceptions, RegisterFacades, RegisterProviders, BootProviders
- Dependency Injection — constructor injection, method injection, auto-resolution, interface binding
- Facade Architecture — facade base class, real-time facades, alias loading
- Application Configuration — `bootstrap/app.php`, ApplicationBuilder, fluent configuration API
- Long-Running Process lifecycle (Octane, queue workers) — singleton vs scoped, state leaks, reset strategies
- Caching & Optimization — config cache, route cache, events cache, services manifest, deferred provider manifest
- Lifecycle Hooks & Events — booting, booted, terminating, bootstrapping/bootstrapped events, request lifecycle duration handlers
- Version Evolution — architectural differences across Laravel 10, 11, 12, 13 (Kernel removal, slim skeleton, ApplicationBuilder, attribute-based middleware)

## What Does NOT Belong

- Route matching algorithms and URL generation (belongs to Routing & Controllers domain)
- HTTP client internals (belongs to HTTP & Client Integration)
- Session storage drivers and implementations (belongs to State & Session Management)
- Blade compilation and rendering engine (belongs to Frontend & View Rendering)
- Specific service provider implementations for database, queue, mail, etc. (belong to their respective domains)
- Detailed middleware implementation logic (e.g., auth middleware internals, CSRF validation logic) — the pipeline itself belongs here, but specific middleware implementations belong elsewhere

---

# Major Subdomains

## 1. Request Lifecycle

The complete flow from HTTP request arrival to response delivery. The backbone of understanding how Laravel processes every request.

## 2. Service Container & IoC Architecture

The dependency injection container that serves as Laravel's foundation. All service resolution, binding management, and object construction flows through this subsystem.

## 3. Service Providers

The bootstrapping mechanism for all Laravel services. Providers are the composition root where services are registered, configured, and initialized.

## 4. Application Bootstrap

The Application class itself — its construction, initialization phases, base bindings, and the modern fluent configuration API via ApplicationBuilder.

## 5. Kernel Architecture

The HTTP and Console kernels that coordinate request handling, bootstrapping, middleware dispatching, and termination.

## 6. Middleware Pipeline

The pipeline pattern that wraps request processing with filter layers. Covers global, group, route, priority, and terminable middleware.

## 7. Dependency Injection Flow

How Laravel resolves dependencies automatically — constructor injection, method injection, auto-resolution rules, and interface binding strategies.

## 8. Boot Order & Timing

The precise sequence of operations during application startup, including bootstrapper order, provider registration/boot phases, lifecycle hooks, and deferred loading.

## 9. Long-Running Process Architecture

How the lifecycle changes under Octane and queue workers — singleton persistence, state management, scoped bindings, and memory leak prevention.

## 10. Caching & Optimization

The caching strategies that reduce bootstrap overhead — config cache, route cache, events cache, services manifest, and deferred provider optimization.

---

# Complete Knowledge Inventory

## 1. Request Lifecycle

- Entry Point Mechanics (`public/index.php`)
- Application Instance Creation via `bootstrap/app.php`
- HTTP vs Console Kernel Dispatch
- Request Capture and Symfony Request Adaptation
- The `handleRequest` / `handleCommand` Pattern
- sendRequestThroughRouter Flow
- sendRequestThroughPipeline Flow
- Response Sending via `->send()`
- Kernel Termination (terminate middleware, events, callbacks)
- Lifecycle Events (RequestHandled, Terminating)
- Request Duration Lifecycle Handlers
- Octane Lifecycle Differences
- Console Command Lifecycle Differences
- Maintenance Mode Request Handling

## 2. Service Container & IoC Architecture

- Container Fundamentals and Purpose
- Container vs Application Relationship
- The `Illuminate\Container\Container` Class
- Binding Types: `bind()`, `singleton()`, `scoped()`, `instance()`
- Binding Resolution: `make()`, `makeWith()`, `build()`
- Auto-Resolution via PHP Reflection API
- Reflection-based Constructor Inspection
- Contextual Binding (`when()->needs()->give()`)
- Tagged Bindings (`tag()`, `tagged()`)
- Binding Extending (`extend()` — Decorator Pattern)
- Method Binding (`bindMethod()`, `callMethodBinding()`)
- Resolution Callbacks (`resolving()`, `afterResolving()`, `beforeResolving()`)
- Rebound Callbacks (`rebinding()`, `rebound()`)
- Container Aliases and Abstract Aliases
- The `$instances` Cache Array
- Circular Dependency Detection
- Build Stack Tracking
- Scoped Instance Flushing
- Contextual Attribute Bindings (`#[Context]`, `#[Singleton]`)
- ArrayAccess on Container (`$app['key']`)

## 3. Service Providers

- Service Provider Contract and Base Class
- The `register()` Method — bindings only, no resolution
- The `boot()` Method — post-registration initialization
- Provider Registration Order Guarantees
- The `bootstrap/providers.php` File
- Deferred Providers (`DeferrableProvider` interface, `provides()` method)
- Deferred Provider Manifest and Loading Mechanism
- Eager vs Deferred Provider Tradeoffs
- Provider Boot Order and Dependencies
- Package Service Providers and Auto-Discovery
- Environment-Specific Provider Registration
- Provider Properties: `$bindings`, `$singletons` shortcuts
- Conditional Provider Registration
- Provider Merge Config (`mergeConfigFrom()`)
- Provider Registration Lifecycle Hooks (Spatie: registeringPackage, packageRegistered, bootingPackage, packageBooted)
- Core Framework Providers List
- Service Provider Testing Strategies
- Provider Sprawl Anti-Pattern

## 4. Application Bootstrap

- Application Constructor Phase (`Illuminate\Foundation\Application::__construct`)
- Base Bindings Registration (`registerBaseBindings()`)
- Base Service Providers Registration (`registerBaseServiceProviders()` — Event, Log, Routing)
- Core Container Aliases Registration (`registerCoreContainerAliases()`)
- Laravel Cloud Services Registration
- The `bootstrap/app.php` File Structure
- `Application::configure()` Static Factory Method
- `ApplicationBuilder` Fluent Configuration API
- `withRouting()` — web, api, commands, channels, health
- `withMiddleware()` — global, groups, aliases, priority
- `withExceptions()` — report, render, throttle callbacks
- `withProviders()`, `withEvents()`, `withBroadcasting()`
- `withCommands()` — custom command paths
- `withSingletons()`, `withScopedSingletons()`, `withBindings()`
- `booting()`, `booted()` Application Builder Hooks
- The `create()` Method
- Path Helpers (`basePath()`, `configPath()`, `storagePath()`, etc.)
- Environment Detection (`runningInConsole()`, `runningUnitTests()`, environment())
- `hasBeenBootstrapped()` Guard
- Application Flush and Reset
- `getNamespace()` via Composer PSR-4

## 5. Kernel Architecture

- HTTP Kernel Class (`Illuminate\Foundation\Http\Kernel`)
- Kernel Constructor — Application + Router Injection
- `handle()` Method — Exception Wrapping
- `sendRequestThroughRouter()` — Instance Request, Bootstrap, Pipeline
- `dispatchToRouter()` — Route Dispatch Callback
- `terminate()` — Events, Terminable Middleware, Duration Handlers
- `bootstrap()` — Guarded One-Time Bootstrapping
- Kernel Bootstrappers Array (6 core bootstrappers)
- Request Started At Timing
- Request Lifecycle Duration Handlers (threshold-based callbacks)
- Console Kernel Class (`Illuminate\Foundation\Console\Kernel`)
- Artisan Command Loading and Registration
- Schedule Resolution
- Console Bootstrap Flow
- Kernel Version Evolution (Laravel 10 → 11 → 12 → 13)
- Kernel Removal in Laravel 11+ (slim skeleton)
- Legacy Kernel Migration Patterns
- `syncMiddlewareToRouter()` Bridge

## 6. Middleware Pipeline

- Pipeline Pattern (`Illuminate\Pipeline\Pipeline`)
- Pipeline `send()`, `through()`, `then()` API
- Global Middleware Stack
- Middleware Groups (`web`, `api`, custom)
- Route-Specific Middleware
- Middleware Aliases
- Middleware Priority (`$middlewarePriority`, `priority()` method)
- Middleware Parameters (role-based middleware)
- `$next($request)` Closure Mechanics
- Pre-Middleware vs Post-Middleware Code
- Terminable Middleware (`terminate()` method)
- Singleton Requirement for Handle+Terminate Instance Matching
- Middleware Exclusion (`withoutMiddleware()`)
- Default Web Middleware Group Members
- Default API Middleware Group Members
- Middleware vs Route Model Binding Ordering
- TrustProxies, HandleCors, PreventRequestsDuringMaintenance
- Middleware Configuration in `bootstrap/app.php`
- Middleware in Laravel 11+ (attribute-based registration)
- Middleware Invokable Classes (extracting from closures)
- `ShouldSkipMiddleware()` Mechanism

## 7. Dependency Injection Flow

- Constructor Injection in Controllers, Jobs, Listeners, etc.
- Method Injection in Controller Actions, Service Provider Boot, Event Handlers
- Auto-Resolution Strategy (ReflectionClass → constructor parameters → recursive resolution)
- Interface Binding Resolution Flow
- Primitive Value Resolution
- `Container::call()` — Method Injection Engine
- `BoundMethod` Class — Reflection-based Call Resolution
- Controller Resolution via `$this->container->make()`
- Route Action Resolution (Closure vs Controller@Method)
- Service Locator Anti-Pattern (`app()`, `resolve()`, `App::make()` in business logic)
- Facades as Dependency Injection Alternative
- Testing with the Container (`instance()`, `swap()`, `forgetInstance()`)
- Over-Injection Anti-Pattern
- `new` Inside Services Anti-Pattern
- Circular Dependency Resolution and Break Strategies
- Binding Concrete-to-Concrete Anti-Pattern
- Container Call Bindings
- Tight Loop Resolution Anti-Pattern
- Application and Environment Facades (`app()->environment()`, etc.)

## 8. Boot Order & Timing

- Complete Boot Sequence (Exact Order):
  1. Composer Autoloader Load
  2. Application Instance Created (base bindings, base providers, core aliases)
  3. `Application::configure()` Called (if using modern bootstrap)
  4. ApplicationBuilder Configuration Registered (routing, middleware, exceptions callbacks deferred)
  5. Application Returned to `public/index.php`
  6. `handleRequest(Request::capture())` Called
  7. HTTP Kernel Resolved from Container
  8. `Kernel::handle($request)` Called
  9. Application `bootstrapWith()` Executed:
      a. `LoadEnvironmentVariables`
      b. `LoadConfiguration`
      c. `HandleExceptions`
      d. `RegisterFacades`
      e. `RegisterProviders`
      f. `BootProviders`
  10. Request Sent Through Global Middleware Pipeline
  11. Router Dispatches Request
  12. Route Middleware Pipeline Executed
  13. Route/Controller Action Executed
  14. Response Travels Back Out Through Middleware
  15. Kernel Terminates
  16. Response Sent to Browser
- `bootstrapWith()` Event Dispatching (`bootstrapping:*`, `bootstrapped:*`)
- `register()` Phase Order Guarantees
- `boot()` Phase Order Guarantees
- `booting()` / `booted()` Application Callbacks
- Provider `$defer` Behavior
- Deferred Provider Loading Timing (on `make()` call)
- Octane Boot Process (one-time boot)
- Queue Worker Boot Process
- Console Kernel Boot vs HTTP Kernel Boot Differences
- Middleware Registration Timing (before routing)
- Route Registration Timing

## 9. Long-Running Process Architecture

- Octane Architecture Overview (Swoole, RoadRunner, FrankenPHP)
- One-Time Boot vs Per-Request Boot
- Singleton State Leaks Under Octane
- Scoped Bindings as the Octane-Safe Singleton
- Static Property Accumulation and Memory Leaks
- Octane Lifecycle Hooks (`tick()`, `RequestTerminated` Listener)
- `config/octane.php` — Listeners, Max Requests, Workers
- Octane Sandbox and Reset Mechanism (`FlushUploadedFiles`, `FlushSessionState`, `FlushAuthenticationState`)
- Worker Count and Max Requests Strategy
- Coroutine Safety in Swoole
- Queue Worker Persistent State
- Job Instance Lifecycle
- Service Binding Audit for Octane Deployment
- Package Compatibility with Octane
- Terminating Callback Accumulation Leaks (e.g., Blade ViewServiceProvider)
- Memory Profiling for Octane (Blackfire, Telescope)

## 10. Caching & Optimization

- Config Caching (`config:cache`, `config:clear`)
- Route Caching (`route:cache`, `route:clear`)
- Events Caching (`event:cache`, `event:clear`)
- Services Cache (`bootstrap/cache/services.php` — deferred provider manifest)
- `php artisan optimize` Command
- `php artisan optimize:clear` Command
- Cache Invalidation Strategy During Deployment
- OpCache Configuration for Laravel
- Production Bootstrap File Optimization
- Deferred Provider Manifest Generation
- Composer Autoloader Optimization (`composer dump-autoload -o`)
- Bootstrap Cache Warmup in CI/CD
- Provider Count Impact on Bootstrap Time
- Measurement and Monitoring (Telescope, Clockwork)

---

# Knowledge Classification

## Foundation
- Entry Point Mechanics
- Application Instance Creation
- Container Fundamentals
- Binding Types (bind, singleton)
- Binding Resolution (make)
- Service Provider Basics
- Register vs Boot Methods
- Middleware Fundamentals
- Global vs Route Middleware
- Constructor Injection
- `bootstrap/app.php` Basics
- HTTP vs Console Kernel Concept
- Config Caching

## Intermediate
- Scoped Bindings
- Contextual Binding
- Auto-Resolution via Reflection
- Middleware Groups and Aliases
- Middleware Priority
- Terminable Middleware
- Method Injection
- Service Provider Bindings/Singletons Properties
- Deferred Providers Basics
- Container Aliases
- Pipeline Pattern Understanding
- Environment-Specific Providers
- Bootstrap Path Helpers
- Console Kernel Scheduling
- Middleware Parameters
- Facade Architecture
- Lifecycle Events (RequestHandled, Terminating)

## Advanced
- Rebound Callbacks
- Resolution Callbacks (resolving, afterResolving)
- Tagged Bindings
- Binding Extending (Decorator)
- Method Binding
- Circular Dependency Resolution
- Build Stack Tracking
- Provider Auto-Discovery and Package Service Providers
- Deferred Provider Manifest Mechanics
- Full Boot Sequence Understanding
- ApplicationBuilder Configuration API
- Octane Lifecycle — singleton vs scoped vs bind tradeoffs
- Octane State Leak Diagnosis
- Kernel `handle()` → `sendRequestThroughRouter()` → Pipeline Internals
- `dispatchToRouter()` Bridge
- Request Duration Lifecycle Handlers
- Scoped Instance Flushing
- `Container::call()` and `BoundMethod` Internals

## Expert
- Reflection API Zero-Day Resolution Understanding
- Contextual Attribute Bindings
- Container `rebound()` Mechanics for Hot-Reload
- Octane `Flush*` Listener Implementation
- Octane Coroutine Safety Patterns
- Static Property Accumulation Analysis Patterns
- Config/Route/Events Cache Internal Format
- Services Cache — Deferred Provider Hash Table Optimization
- Provider Count Scaling Analysis
- `bootstrapWith()` Event System for Custom Bootstrappers
- `hasBeenBootstrapped()` Guard Internals
- Container ArrayAccess Implementation Details
- Framework Boot Time Profiling and Optimization
- `BoundMethod::call()` Reflection Optimization
- Kernel Version Migration Strategies (10→11→12→13)

## Enterprise
- Multi-Tenant Bootstrap Strategy (tenant-aware service resolution)
- Octane Production Observability (Blackfire, Datadog, New Relic)
- Custom Kernel Implementations
- Service Provider Governance (hundreds of providers in monolithic apps)
- Bootstrap Cache Pipeline in CI/CD
- Deployment Strategies: zero-downtime with cache warmup
- Container Swap Strategies for Integration Testing
- Octane + Horizon Multi-Server Architecture
- OpCache + Octane Preloading Optimization
- Boot Sequence Audit for Compliance
- Custom Bootstrapper Integration
- Framework Fork/Monorepo Maintenance Considerations

---

# Dependency Map

```
Entry Point Mechanics
↓
Application Instance Creation
↓
Application Bootstrap (base bindings, providers, aliases)
↓
Container Fundamentals
↓
Binding Types (bind, singleton, scoped, instance)  ←  Auto-Resolution
↓                                                          ↓
Contextual Binding                                Reflection API
↓                                                          ↓
Tagged/Extended Bindings                          Dependency Injection
↓                                                          ↓
Service Provider Register()                       Constructor Injection
↓                                                          ↓
Service Provider Boot()                           Method Injection
↓
Full Boot Sequence Understanding
↓
Kernel Architecture
↓
Middleware Pipeline (global → groups → route)
↓
Request Lifecycle Complete
↓
Octane / Long-Running Process Implications
↓
Caching & Optimization Strategies
```

Branching paths:
- Container resolution callbacks (rebound, resolving) → depends on Container Fundamentals + Binding Types
- Deferred Providers → depends on Service Provider Register
- Facade Architecture → depends on Container Aliases + Auto-Resolution
- Pipeline Pattern → depends on Middleware Pipeline
- Kernel Bootstrappers → depends on Bootstrap Sequence + Container

---

# Missing Knowledge Risk Analysis

1. **Developers learn Service Providers but ignore Deferred Providers.** Most tutorials cover register/boot basics. Deferred providers, the services manifest, and lazy-loading optimization are rarely understood, leading to unnecessary bootstrap overhead in large applications.

2. **Developers learn Singleton but ignore Scoped.** With Octane adoption growing, using `singleton()` for request-aware state is a production data-leak vulnerability. Many teams discover this only after deploying Octane to production.

3. **Developers learn `make()` but ignore Contextual Binding.** Without contextual binding, teams resort to factories or `if` statements inside services. The `when()->needs()->give()` pattern eliminates conditional wiring but is one of the least-used container features.

4. **Developers learn Event Listeners but ignore Boot Sequence.** Understanding *when* code runs (bootstrapper order, register vs boot, booting vs booted) prevents subtle bugs where dependencies aren't yet available.

5. **Developers learn Middleware but ignore Pipeline Internals.** The Pipeline class itself is reusable beyond HTTP middleware. Experts use `Pipeline` for multi-step data processing, but most developers never explore the class independently.

6. **Developers learn Config Caching but ignore Services Cache.** The `bootstrap/cache/services.php` manifest enables deferred providers. Without understanding this file, teams don't know why provider changes sometimes don't take effect until cache is cleared.

7. **Developers learn Route Model Binding but ignore Middleware Ordering.** Route model binding happens inside middleware (`SubstituteBindings`), not in the controller or router. Developers who don't understand ordering put binding-dependent logic in middleware that runs before `SubstituteBindings`.

8. **Developers learn Octane but ignore Static Property Accumulation.** Blade compilation callbacks, singleton caches, and static arrays grow unbounded in long-running processes. Teams deploy Octane, see normal behavior for days, then hit OOM under load.

9. **Developers learn Facades but ignore their Container Coupling.** Facades hide the service location behind a static API. Teams overuse them, creating untestable implicit dependencies, then wonder why tests are fragile.

10. **Developers learn Auto-Resolution but ignore its Cost.** Every reflection-based resolution triggers ReflectionClass inspection. In high-throughput Octane applications, teams don't realize they should pre-resolve or register singletons for hot paths.

---

# Research Findings

## Recurring Expert Recommendations

1. **Bind interfaces, not concretions.** Always bind against interfaces — `PaymentGatewayInterface::class` not `StripeGateway::class`. This enables testing and swapping without code changes.

2. **Use `scoped()` for Octane-safe state.** Any class holding per-request state (auth, tenant, locale, request data) should use `scoped()` under Octane. `singleton()` will leak state between requests.

3. **Keep `register()` pure — bindings only.** Never resolve from the container in `register()`. Use `boot()` for any code that depends on registered services.

4. **Defer providers that only bind.** If a provider only registers container bindings, implement `DeferrableProvider` to avoid loading it on every request.

5. **Use contextual binding instead of factories.** The `when()->needs()->give()` pattern eliminates conditional wiring and adheres to the Open/Closed Principle.

6. **Organize providers by concern.** Don't dump everything in `AppServiceProvider`. Create dedicated `PaymentServiceProvider`, `CacheServiceProvider`, etc.

7. **Audit singletons before Octane deployment.** Check every `singleton()` registration for mutable state. Convert request-aware singletons to `scoped()`.

8. **Use the Pipeline class independently.** The `Illuminate\Pipeline\Pipeline` class is useful for any sequential multi-step processing, not just HTTP middleware.

9. **Prefer constructor injection over `app()` in business logic.** The service locator pattern hides dependencies, making testing and comprehension harder.

10. **Cache aggressively in production.** Always run `config:cache`, `route:cache`, `event:cache` in deployment. Without these, bootstrap overhead increases significantly.

## Recurring Architectural Patterns

1. **Onion/Decorator Model — Middleware Pipeline.** The pipeline wraps request processing in layers that run both before and after the core action. This pattern enables cross-cutting concerns (auth, logging, CORS) without touching business logic.

2. **Composition Root — Service Providers.** All dependency wiring is centralized in providers. Controllers and services never construct their own dependencies. This is the Composition Root pattern from DI literature.

3. **Deferred Loading — Performance via Lazy Initialization.** Deferred providers and the services manifest enable Laravel to stay lean by loading only what's needed per request.

4. **Strategy Pattern — Contextual Binding.** Different consumers of the same interface receive different implementations based on context, without conditional logic.

5. **Interceptor — Container Resolution Callbacks.** `resolving()` and `afterResolving()` provide hooks to intercept and decorate services without modifying their registration.

6. **Template Method — Kernel Handle/Terminate.** The kernel defines the skeleton of request processing; bootstrappers, middleware, and the router fill in the steps.

7. **Event-Driven Hooks — Bootstrap/Provider Lifecycle.** The `bootstrapping:*` / `bootstrapped:*` events and `booting` / `booted` callbacks allow observation and extension at every phase.

## Recurring Tradeoffs

1. **Singleton vs Scoped.** Singletons are faster (built once) but dangerous under Octane. Scoped balances performance with safety. The tradeoff: benchmark your specific binding to decide.

2. **Eager Providers vs Deferred Providers.** Eager providers boot every request (predictable but slower). Deferred providers skip loading until needed (faster cold start, but first-use latency spike).

3. **Constructor Injection vs Facades.** Constructor injection makes dependencies explicit (testable, clear) but verbose. Facades are convenient but hide dependencies (service locator).

4. **Register Everything vs Auto-Resolution.** Explicit bindings make behavior predictable but require maintenance. Auto-resolution reduces boilerplate but can produce surprising behavior (wrong implementation resolved).

5. **Single Provider vs Many Providers.** Fewer providers are simpler but violate SRP. Many providers are cleaner but increase bootstrap overhead and file count.

6. **Octane vs Traditional FPM.** Octane is dramatically faster (10x response time improvement) but introduces state management complexity that FPM handles for free.

## Recurring Misconceptions

1. **"The service container is magic."** It's not magic — it's PHP Reflection API and cached arrays. Understanding the reflection mechanism demystifies auto-resolution.

2. **"Singletons are always safe in Laravel."** They're safe in FPM (process dies after request) but leak state in Octane/queue workers. This is the #1 Octane bug.

3. **"`register()` and `boot()` are interchangeable."** They are not. `register()` runs before all providers are loaded; `boot()` runs after. Resolving in `register()` may fail.

4. **"Middleware only runs before the controller."** Middleware code after `$next($request)` runs *after* the controller. Middleware is an onion, not a filter chain.

5. **"Route model binding is controller magic."** It happens in `SubstituteBindings` middleware, not in the controller. This affects ordering with other middleware.

6. **"Facades are the same as injected services."** Facades hide the dependency from the constructor signature. They are a service locator pattern, not dependency injection.

7. **"`app()->make()` is dependency injection."** It is service location, not injection. True DI means dependencies are declared in the constructor, not fetched from a global registry.

8. **"Caching all config/events/routes is always optimal."** Caching can mask configuration issues and requires a cache clear + rebuild on every deployment. There's a maintenance tradeoff.

9. **"The HTTP Kernel no longer exists in Laravel 11+."** The user-land `App\Http\Kernel` was removed, but the framework's `Illuminate\Foundation\Http\Kernel` still exists and handles requests internally.

10. **"Deferred providers are always better."** Deferred providers skip `boot()` entirely. If your provider has boot logic (event listeners, view composers, routes), deferred is not suitable.

---

# Future Expansion Opportunities

1. **Custom Bootstrapper Development** — Patterns for writing application-specific bootstrappers that extend the 6-core bootstrapper list.

2. **Octane Production Runbook** — Detailed operational guidance for running Octane: monitoring, alerting, worker management, memory profiling, and incident response for state leaks.

3. **Middleware Bypass and Security Internals** — The `withoutMiddleware()` mechanism, maintenance mode bypass, and security implications of middleware gating.

4. **Container Swap and Multi-Tenancy** — Advanced patterns for scoping the container per-tenant, including tenant-aware service resolution and configuration isolation.

5. **Framework Bootstrap Performance Benchmarking** — Structured methodology for measuring bootstrap time, provider cost, and cache effectiveness across different application scales.

6. **Event Discovery Internals** — How Laravel auto-discovers events and listeners, the cache format, and performance implications.

7. **Pint and Static Analysis Integration** — Using PHPStan/deptrac rules to enforce container usage patterns (no `app()` in domain code, no bindings outside providers).

8. **Service Provider Testing Strategies** — How to unit test provider registration and boot behavior, including deferred provider testing.

9. **FRANKENPHP and Modern PHP Servers** — PHP 8.4+ server capabilities, preloading, and JIT implications for Laravel bootstrap.

10. **ApplicationBuilder Plugin System** — How third-party packages can extend the `ApplicationBuilder` fluent API for their own configuration needs.

---

# Sources Consulted

## Tier 1 — Framework Truth

- Laravel 13.x Documentation: Request Lifecycle (https://laravel.com/docs/13.x/lifecycle)
- Laravel 13.x Documentation: Middleware (https://laravel.com/docs/13.x/middleware)
- Laravel 13.x Documentation: Service Container (https://laravel.com/docs/13.x/container)
- Laravel 13.x Documentation: Service Providers (https://laravel.com/docs/13.x/providers)
- Laravel 13.x Documentation: Octane (https://laravel.com/docs/13.x/octane)
- Laravel 13.x Documentation: Directory Structure (https://laravel.com/docs/13.x/structure)
- Laravel 13.x Documentation: Packages (https://laravel.com/docs/13.x/packages)
- Laravel API Docs: `Illuminate\Foundation\Application` (https://api.laravel.com/docs/13.x/Illuminate/Foundation/Application)
- Laravel API Docs: `Illuminate\Foundation\Http\Kernel` (https://api.laravel.com/docs/13.x/Illuminate/Foundation/Http/Kernel)
- Laravel API Docs: `Illuminate\Container\Container` (https://api.laravel.com/docs/master/Illuminate/Container/Container)
- Laravel Source Code: `src/Illuminate/Foundation/Application.php` (GitHub, master branch)
- Laravel Source Code: `src/Illuminate/Container/Container.php` (GitHub, 11.x branch)
- Laravel Source Code: `src/Illuminate/Foundation/Http/Kernel.php` (GitHub, 13.x branch)
- Laravel Source Code: `src/Illuminate/Container/BoundMethod.php` (GitHub, 10.x branch)
- Laravel Source Code: `src/Illuminate/Foundation/Configuration/ApplicationBuilder.php` (GitHub, 13.x branch)
- Laravel Slim Skeleton PR #47309 (GitHub, `laravel/framework`)
- Laravel Slim Skeleton PR #6188 (GitHub, `laravel/laravel`)
- Laravel 12.x ApplicationBuilder creation callback PR #54936 (GitHub, `laravel/framework`)

## Tier 2 — Expert Production Usage

- Wendell Adriel: Laravel Request Lifecycle Deep Dive (https://wendelladriel.com/blog/laravel-request-lifecycle-deep-dive)
- Zalt.me: Inside Laravel's Application Kernel (https://zalt.me/blog/2025/10/inside-laravel-application-kernel)
- TheCodeForge: Laravel Service Container Explained — Bindings, Resolution & Real-World Internals (https://thecodeforge.io/php/laravel-service-container/)
- Spatie Video: Exploring the Service Provider (https://spatie.be/videos/laravel-package-training/exploring-the-service-provider)
- Spatie DeepWiki: Service Providers (https://deepwiki.com/spatie/laravel-package-tools/3.8-service-providers)
- Spatie DeepWiki: Advanced Usage / Lifecycle Hooks (https://deepwiki.com/spatie/laravel-package-tools/6-advanced-usage)
- Spatie GitHub: `laravel-package-tools` README (https://github.com/spatie/laravel-package-tools)
- Laravel News: Configuring Middleware in Laravel (https://laravel-news.com/configuring-middleware-in-laravel)
- Stanza: Laravel Foundations — Request Lifecycle (https://www.stanza.dev/courses/laravel-foundations/request-lifecycle/)
- Tutorial Tools: Laravel 12 Request Lifecycle Explained (https://www.tutorial-tools.com/post/laravel-12-request-lifecycle-explained)
- Nabil Hassen: Kernel.php in Laravel 12 — Where Is It? (https://nabilhassen.com/how-to-replace-kernelphp-in-laravel-11-and-12)
- DEV.to (Grant Holle): Exploring Middleware in Laravel 11 (https://dev.to/grantholle/exploring-middleware-in-laravel-11-2e10)

## Tier 3 — Production Repositories

- Laravel Framework (https://github.com/laravel/framework)
- Laravel Octane (https://github.com/laravel/octane)
- Laravel Horizon (https://github.com/laravel/horizon)
- Laravel Jetstream (https://github.com/laravel/jetstream)
- Laravel Breeze (https://github.com/laravel/breeze)
- Laravel Pulse (https://github.com/laravel/pulse)
- Spatie Laravel Package Tools (https://github.com/spatie/laravel-package-tools)
- DeepWiki: Laravel Framework (https://deepwiki.com/laravel/framework)
- DeepWiki: Laravel Octane (https://deepwiki.com/laravel/octane)

## Tier 4 — Community Intelligence

- Reddit r/laravel: Common singleton/Octane bugs discussions
- GitHub Issues: Laravel Octane state leak and memory leak threads
- GitHub Issues: Deferred provider optimization discussion (PR #51343, #2426)
- Stack Overflow: Service container resolution and middleware ordering questions
- DEV.to: Laravel Service Container — From Dependency Hell to Clean Code (https://dev.to/laravel_mastery_ffd9d10ec/laravel-service-container-from-dependency-hell-to-clean-code-3a9m)
- DEV.to: Don't Leak User Data — Mastering Laravel Octane State (https://dev.to/iprajapatiparesh/dont-leak-user-data-mastering-laravel-octane-state-4670)
- Dave Torres Blog: Laravel Octane Memory Leaks & Stale State Explained (https://blog.davetorres.dev/laravel-octane-memory-leak-stale-state/)
- Aris Arisandi: Laravel Octane in Real Production (https://idnasirasira.com/blog/laravel-octane-real-production-performance)
- Laravel Ideas: Increase Performance by Making More Providers Deferrable (GitHub Issue #2426)
- ShieldCI: Service Container Resolution Analyzer — anti-pattern documentation (https://docs.shieldci.com/analyzers/best-practices/service-container-resolution)
- CodeClarityLab: Service Locator Anti-Pattern (https://codeclaritylab.com/glossary/service_locator_antipattern)
- Laravel Magazine: Dependency Injection and the Container — Common Mistakes (https://laravelmagazine.com/dependency-injection-and-the-container-in-php-and-laravel)
- Florentin Pomirleanu: How to Scale a Laravel SaaS App with Octane and Horizon (https://florentin.pomirleanu.com/blog/technology-trends/how-to-scale-a-laravel-saas-app-with-octane-and-horizon)
- LinkedIn / Visvanathan D: Laravel Octane — What Really Changes in the Request Lifecycle?
