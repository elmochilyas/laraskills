# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Application Bootstrap
**Knowledge Unit:** Application Class Construction
**Generated:** 2026-06-03

---

# Decision Inventory

1. Construction Method: `Application::configure()->create()` vs `new Application()`
2. Base Path: Explicit vs default detection
3. Service Registration Location: Constructor vs service provider vs builder

---

# Architecture-Level Decision Trees

---

## Decision Name: Application Construction Method

---

## Decision Context

Choosing how to instantiate the Laravel Application — via the modern `Application::configure()` factory (Laravel 11+) or direct `new Application()` constructor call.

---

## Decision Criteria

* performance — no meaningful difference
* architectural — builder API enforces proper configuration chain
* security — builder prevents fragile kernel binding overwrites
* maintainability — builder is the documented, future-proof API

---

## Decision Tree

Which Laravel version?
↓
11+? → Use `Application::configure()->...->create()`
NO → Check if you need custom subclass
↓
Need to subclass Application for custom framework distribution?
YES → Use `new Application($basePath)` with explicit constructor arguments
NO → Use `Application::configure()` with backwards-compatible builder chain (10.x supports some with* methods)

---

## Rationale

`Application::configure()` enforces the ApplicationBuilder chain, preventing direct container manipulation before configuration completes. Direct `new Application()` skips builder configuration, tightens coupling to internal constructor behavior, and prevents framework evolution of the bootstrap layer. In Laravel 11+, the builder is mandatory for proper kernel and exception handler binding.

---

## Recommended Default

**Default:** `Application::configure(basePath: dirname(__DIR__))->withRouting(...)->withMiddleware()->withExceptions()->create()`
**Reason:** The only supported construction pattern in Laravel 11+; returns a properly configured Application with all kernel bindings in place.

---

## Risks Of Wrong Choice

- Using `new Application()` in Laravel 11+ bypasses builder configuration, requiring manual `$app->singleton()` calls for kernel binding — fragile and undocumented.
- Omitting `->create()` returns `ApplicationBuilder` instead of `Application`, causing type errors at entry points.
- Subclassing Application to add constructor bindings couples custom logic to the bootstrap phase and prevents clean reset in Octane.

---

## Related Rules

- Always use `Application::configure()->create()` instead of `new Application()` in Laravel 11+ (05-rules.md, Rule 1)
- Never modify the Application constructor or add bindings in constructor subclasses (05-rules.md, Rule 2)
- Never call `app('config')` or any non-base binding immediately after construction (05-rules.md, Rule 3)

---

## Related Skills

- Bootstrap a Laravel Application Instance (06-skills.md)
- Configure Application via ApplicationBuilder (application-builder-configuration)
- Create a Laravel Bootstrap File (bootstrap-app-php-file)

---

## Decision Name: Base Path Resolution Strategy

---

## Decision Context

Determining which base path to use — explicitly passed via `basePath` parameter or relying on the default `dirname(__DIR__, 3)` fallback.

---

## Decision Criteria

* performance — negligible difference
* architectural — path binding is the root for all other path helpers
* security — wrong base path can lead to directory traversal
* maintainability — explicit paths prevent silent failures in non-standard layouts

---

## Decision Tree

Is the application deployed with a standard directory layout?
↓
YES → Use default `dirname(__DIR__)` from `bootstrap/app.php`; no explicit basePath needed
NO → Is the vendor directory in a non-standard location?
↓
YES → Pass explicit `basePath` to `Application::configure(basePath: '/custom/root')`
NO → Are you running in a monorepo, serverless, or Phar environment?
↓
YES → Pass explicit `basePath` to prevent `dirname(__DIR__, 3)` from resolving incorrectly
NO → Default resolution is safe

---

## Rationale

The default base path detection assumes a standard directory layout (`vendor/bin/` is 3 levels deep from the application root). Any deviation — monorepo structures, serverless artifacts with flattened directories, Phar distributions — causes `dirname(__DIR__, 3)` to resolve to the wrong directory. Explicit paths eliminate this brittleness.

---

## Recommended Default

**Default:** Omit `basePath` in standard Laravel installations (let `Application::configure()` detect from `bootstrap/app.php` location)
**Reason:** Reduces configuration surface; the default detection works reliably for standard project structures.

---

## Risks Of Wrong Choice

- Omitting explicit base path in non-standard layouts: path helpers resolve to wrong directories, storage writes fail, config files not found.
- Hardcoding absolute paths in `bootstrap/app.php`: breaks when moving between environments (local dev → CI → production).

---

## Related Rules

- Always pass explicit `basePath` in non-standard directory layouts (05-rules.md, Rule 4)
- Always use path helpers instead of hardcoded absolute filesystem paths (path-helpers-and-environment-detection, Rule 1)

---

## Related Skills

- Bootstrap a Laravel Application Instance (06-skills.md)
- Customize Application Paths for Non-Standard Deployments (path-helpers-and-environment-detection)

---

## Decision Name: Where to Register Container Bindings

---

## Decision Context

Deciding the appropriate location to register bindings — the constructor (applicable only when subclassing), a service provider, or the ApplicationBuilder in `bootstrap/app.php`.

---

## Decision Criteria

* performance — no meaningful runtime difference
* architectural — constructor bindings survive flush(), other locations do not
* security — builder closures capture scope at registration time, affecting Octane
* maintainability — builder is declarative; providers support complex registration logic

---

## Decision Tree

Is the binding simple (class-to-class mapping without setup logic)?
↓
YES → Place in `withSingletons()`, `withBindings()`, or `withScopedSingletons()` in `bootstrap/app.php`
NO → Does the binding require config reads, DI, or conditional logic?
↓
YES → Use a service provider (`register()` for bindings, `boot()` for config-dependent logic)
NO → Is the binding a core framework override that must survive flush()?
↓
YES → Consider constructor registration (only valid when subclassing Application for framework-level extensions)
NO → Use the most scoped location: builder for simple, provider for complex

---

## Rationale

The constructor is the wrong place for any user-land binding — it runs before bootstrappers, cannot access config, and bindings there survive flush() unexpectedly. The builder is ideal for declarative class-to-class mappings. Service providers support the full container API with access to config (in `boot()`) and other services.

---

## Recommended Default

**Default:** Register bindings in service providers; use `withSingletons()` in `bootstrap/app.php` only for simple contract-to-concretion mappings.
**Reason:** Service providers have access to the full container API, config, and lifecycle hooks — the most flexible and maintainable location.

---

## Risks Of Wrong Choice

- Constructor bindings: survive flush() unexpectedly in Octane, cannot be cleared between requests.
- Builder bindings with setup logic: closures become complex and untestable.
- Service provider bindings in `register()` that access config: returns null because config-dependent code must be in `boot()`.

---

## Related Rules

- Never modify the Application constructor or add bindings in constructor subclasses (05-rules.md, Rule 2)
- Place all config-dependent logic in `boot()` not `register()` (bootstrapper-sequence, Rule 1)
- Never capture request-scoped variables in builder closures (application-builder-configuration, Rule 2)

---

## Related Skills

- Bootstrap a Laravel Application Instance (06-skills.md)
- Configure Application via ApplicationBuilder (application-builder-configuration)
- Register Service Providers (service-providers)
