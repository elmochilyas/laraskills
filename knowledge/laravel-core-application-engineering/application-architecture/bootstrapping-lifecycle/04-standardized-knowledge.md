# ECC Standardized Knowledge — Bootstrapping Lifecycle

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Bootstrapping Lifecycle |
| **Difficulty** | Foundation |
| **Category** | Application Architecture — Application Lifecycle |
| **Last Updated** | 2026-06-02 |

---

## Overview

The Laravel bootstrapping lifecycle is the sequence of operations that transforms a server entry point (`public/index.php` for HTTP, `artisan` for CLI) into a fully resolved application capable of handling requests. It consists of two distinct phases: the **Kernel bootstrap** (6 sequential steps that prepare the application foundation) and the **request pipeline** (middleware wrapping that processes the request through to response).

Understanding this lifecycle is foundational because every Laravel application executes these same steps on every request. The order is not arbitrary: each step depends on the previous. Environment must be loaded before configuration, configuration before facades, facades before providers, and the register phase must complete before boot begins.

The lifecycle enforces a strict two-phase contract for service providers: all `register()` calls complete across every provider before any `boot()` method runs. This architectural decision prevents inter-provider timing dependencies during registration while ensuring the container is fully populated before providers interact with resolved services during boot.

---

## Core Concepts

### Kernel
The Kernel is the central orchestrator. Two implementations exist: `Illuminate\Foundation\Http\Kernel` for HTTP and `Illuminate\Foundation\Console\Kernel` for Artisan. Both follow the same bootstrap structure but differ in post-bootstrap flow.

### Bootstrap Array
Each Kernel defines a `$bootstrappers` property — an ordered array of 6 classes iterated during `bootstrap()`:
1. `LoadEnvironmentVariables` — reads `.env`, populates `$_ENV` and `$_SERVER`
2. `LoadConfiguration` — loads all `config/` files into the config repository
3. `HandleExceptions` — registers error and exception handlers
4. `RegisterFacades` — registers facade aliases
5. `RegisterProviders` — iterates provider list and calls `register()` on each
6. `BootProviders` — calls `boot()` on every registered provider

### Two-Phase Provider Contract
The `register()`/`boot()` split is the most important structural constraint. `register()` is for container bindings only. `boot()` is for interaction with resolved services. All `register()` calls complete before any `boot()` begins.

### Middleware Pipeline
After bootstrapping, the HTTP Kernel sends the request through the middleware pipeline — concentric layers that modify the request, short-circuit, or modify the response on the way back.

---

## When To Use

- **Every HTTP request** — the lifecycle runs on every request automatically
- **Every Artisan command** — Console Kernel runs the same 6 bootstrap steps
- **Understanding deployment** — config caching, route caching, and optimization depend on bootstrap step ordering
- **Debugging provider issues** — understanding register/boot ordering is essential for service provider debugging
- **Custom bootstrappers** — applications that need early initialization before providers run

---

## When NOT To Use

- The lifecycle is not configurable per-request — all requests undergo identical bootstrap
- Custom bootstrappers are rarely needed in application code — reserved for framework-level extensions
- Octane applications break the per-request bootstrap model entirely

---

## Best Practices

### Keep register() Clean
`register()` should only contain `$this->app->bind()`, `$this->app->singleton()`, and `$this->app->instance()` calls. No service resolution, no facades, no side effects.

**Why:** During `register()`, not all providers have registered their bindings. Resolving a service from another provider either works by coincidence or fails unpredictably when provider order changes.

### Defer Provider Instantiation
Mark providers as deferred when their services are not used on every request.

**Why:** Deferred providers avoid the instantiation, register, and boot cost until the service is first needed, reducing bootstrap time by 30-70% for large applications.

### Run Artisan Optimize on Deploy
Always run `php artisan optimize` (which compiles deferred provider manifest, config cache, and route cache) as part of deployment.

**Why:** Without optimization, deferred providers fall back to eager loading and config is loaded from 20+ individual files on every request.

### Never Resolve Services in register()
Move all service resolution to `boot()`. If a binding must be available during registration from another provider, document the dependency and ensure provider ordering.

**Why:** Services resolved during `register()` may be in a partially initialized state because their provider's `boot()` hasn't executed yet.

---

## Architecture Guidelines

### Layer Placement
```
public/index.php → bootstrap/app.php → Kernel::handle()
    ↓
Bootstrap (6 steps: env, config, errors, facades, register, boot)
    ↓
Middleware Pipeline (global → route groups → route)
    ↓
Router → Controller → Response
    ↓
Terminate (cleanup callbacks)
```

### Boundary Rules
- Bootstrap steps are sequential and deterministic — no step can re-enter a previous step
- The middleware pipeline is concentric — each layer can short-circuit
- `terminate()` runs after the response is sent — no new responses can be generated

### Deployment Sequence
Every deployment should run: `php artisan config:cache` → `php artisan route:cache` → `php artisan optimize` → `php artisan view:cache`

---

## Performance Considerations

### Config Caching
Reduces `LoadConfiguration` from reading 20+ files to a single file include. Saves 5-15ms. Enable in production.

### Deferred Provider Manifest
The manifest (`bootstrap/cache/services.php`) maps service abstracts to their provider classes. Without it, all deferred providers load eagerly. This is the single most impactful bootstrap optimization.

### Bootstrapper Impact (most to least)
1. `BootProviders` — provider boot logic dominates
2. `RegisterProviders` — class loading and instantiation
3. `LoadConfiguration` — mitigated by config cache
4. `RegisterFacades` — class_alias calls
5. `HandleExceptions` — negligible
6. `LoadEnvironmentVariables` — negligible

### Octane Considerations
Octane boots once and persists across requests. Bootstrap runs once, not per-request. State must not leak between requests.

---

## Security Considerations

### Environment Exposure
If `APP_ENV` is set to a non-production value, debug mode may be enabled, exposing stack traces and configuration. Production deployments must ensure `APP_DEBUG=false` and `APP_ENV=production`.

### Bootstrap File Integrity
`bootstrap/app.php` is the single file that creates the Application instance. If compromised, an attacker can intercept the entire request lifecycle. Protect this file with filesystem permissions.

---

## Common Mistakes

### Accessing Services in register()
Desc: Resolving services during `register()` where bindings may not exist yet.
Cause: Not understanding the two-phase provider contract.
Consequence: Works by coincidence until provider order changes, then fails unpredictably.
Better: Move service resolution to `boot()`.

### Assuming Provider Boot Order
Desc: ProviderA depends on ProviderB's boot-time side effects.
Cause: Implicit ordering assumption in the `providers` array.
Consequence: Adding a new provider between them breaks the dependency.
Better: Use `resolving` callbacks instead of direct resolution during boot.

### Forgetting Config Cache on Deploy
Desc: Deploying without refreshing config cache.
Cause: Deployment script doesn't include cache commands.
Consequence: New configuration values don't load.
Better: Include `config:clear && config:cache` in every deployment script.

---

## Anti-Patterns

### Business Logic in Bootstrappers
Adding database queries, API calls, or complex calculations to a custom bootstrapper. Bootstrappers should initialize infrastructure, not execute business logic. Business logic in bootstrappers runs on every request and couples application behavior to registry timing.

### Register as a Service Locator
Using `register()` as a place to call `$this->app->make()` and start using services. The register phase is for binding, not resolving. This anti-pattern is the most common source of bootstrap-related bugs.

---

## Examples

### Bootstrap Flow
```
public/index.php
  → require vendor/autoload.php
  → $app = require bootstrap/app.php
  → $kernel = $app->make(HttpKernel::class)
  → $response = $kernel->handle($request)
  → $response->send()
  → $kernel->terminate($request, $response)
```

### Kernel Internal Flow
```
HttpKernel::handle($request)
  1. $this->bootstrap() → iterate $bootstrappers array
  2. $this->sendRequestThroughRouter($request) → middleware pipeline
  3. return $response
```

---

## Related Topics

### Prerequisites
- **Application Class** — The Application instance created in `bootstrap/app.php`

### Closely Related
- **Service Provider Strategies** — Deep dive into eager vs deferred, register vs boot
- **Configuration Management** — Config loading mechanics during bootstrap
- **Service Container Basics** — Container instantiation and provider registration

### Advanced
- **Octane Application Boot** — How Octane breaks the per-request bootstrap model
- **Custom Bootstrappers** — Extending the bootstrap array for early initialization

### Cross-Domain
- **Data & Storage Systems** — How config caching interacts with database configuration

---

## AI Agent Notes

### Important Decisions
- The 6 bootstrapper order is stable across all Laravel versions (5.0+). This is a framework guarantee.
- Custom bootstrappers should be added to the Kernel's `$bootstrappers` array cautiously. They run on every request.
- `bootstrap/app.php` configuration (Laravel 11+) moved middleware and exception config out of Kernel classes.

### Important Constraints
- Bootstrap runs eagerly on every request — there is no lazy bootstrap path
- The Kernel tracks bootstrap state via `$hasBooted` flag to prevent re-bootstrapping on sub-requests
- Octane requires a fundamentally different mental model (bootstrap once, handle many requests)

### Rules Generation Hints
- Enforce that `config:cache` is run in production deployment scripts
- Enforce environment-specific config validation to catch missing values at deploy time

---

## Verification

This document has been validated against:
- `Illuminate\Foundation\Http\Kernel::handle()` — the central orchestration method
- `Illuminate\Foundation\Bootstrap` namespace — 6 bootstrapper classes
- `Illuminate\Foundation\Application::bootstrapWith()` — the bootstrap loop
- Laravel 11+ `bootstrap/app.php` configuration patterns
