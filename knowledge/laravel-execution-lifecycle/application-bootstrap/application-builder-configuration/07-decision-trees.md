# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Application Bootstrap
**Knowledge Unit:** Application Builder Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

1. Configuration Location: Builder vs service provider for bindings
2. Closure Scope Safety: Builder closures vs middleware for per-request logic
3. Builder Method Ordering: `withRouting()` vs `withMiddleware()` execution order
4. Lifecycle Hook Strategy: `booting()` vs middleware for initialization logic

---

# Architecture-Level Decision Trees

---

## Decision Name: Binding Registration Location

---

## Decision Context

Choosing between the ApplicationBuilder (`withSingletons()`, `withBindings()` in `bootstrap/app.php`) and a service provider for registering container bindings.

---

## Decision Criteria

* performance — no meaningful difference
* architectural — builder registration runs during construction; provider registration runs during bootstrapper sequence
* security — builder closures capture scope at registration time, affecting Octane persistence
* maintainability — builders are declarative; providers support complex logic

---

## Decision Tree

Is the binding a simple class-to-class or interface-to-concrete mapping with no setup logic?
↓
YES → Use `withSingletons()` or `withBindings()` in `bootstrap/app.php`
NO → Does the binding need to read config, environment, or other services?
↓
YES → Use a service provider (`register()` or `boot()` depending on config dependency)
NO → Does the binding need conditional logic based on environment?
↓
YES → Use a service provider for complex conditional registration
NO → Use the builder for simple, unconditional bindings

---

## Rationale

The builder is ideal for declarative mappings (contract → concrete) that require no setup. Once the binding needs config reads, environment checks, or dependency injection, a service provider is more appropriate. Builder closures that contain complex logic become untestable and violate the principle that `bootstrap/app.php` should be a declarative configuration file.

---

## Recommended Default

**Default:** Simple contract-to-concrete mappings in `withSingletons()`/`withBindings()`; all other bindings in service providers.
**Reason:** Keeps `bootstrap/app.php` declarative and testable; moves complex logic to providers where it is properly testable.

---

## Risks Of Wrong Choice

- Complex logic in builder closures: untestable closure code, difficult to debug, scope-capture issues in Octane.
- Simple bindings in service providers: unnecessary indirection — adds a provider class for what could be a one-liner in the builder.
- Duplicate registration: using both builder and provider for the same binding creates race conditions (last registration wins).

---

## Related Rules

- Prefer `Application::configure()` over manual kernel binding overwrites (05-rules.md, Rule 3)
- Never place business logic in builder closures (05-rules.md, Rule 4)
- Never capture request-scoped variables in builder closures (05-rules.md, Rule 2)

---

## Related Skills

- Configure Application via ApplicationBuilder (06-skills.md)
- Create a Laravel Bootstrap File (bootstrap-app-php-file)

---

## Decision Name: Closure Scope Safety

---

## Decision Context

Determining whether a variable captured in a builder closure is safe (compile-time constant) or unsafe (request-scoped data) for Octane compatibility.

---

## Decision Criteria

* performance — captured references prevent garbage collection in Octane
* architectural — builder closures persist across all requests in long-running processes
* security — captured request data leaks between users
* maintainability — scope leaks are silent and hard to debug

---

## Decision Tree

Is the captured value a compile-time constant (scalar, class name string, config array)?
↓
YES → Safe to capture in builder closures
NO → Is the captured value request-scoped (`$request`, authenticated user, session data)?
↓
YES → UNSAFE — move to middleware or request-scoped lifecycle hooks
NO → Is the captured value a service instance resolved from the container?
↓
YES → Use `$app->make()` inside the closure instead of capturing; the closure will re-resolve on each access
NO → If unsure, assume unsafe and refactor to avoid capturing

---

## Rationale

Builder closures execute during application construction and persist across requests in Octane. Capturing request-scoped variables creates memory leaks (the captured object and all its dependencies are retained indefinitely) and cross-request data contamination (one request's data is accessible to the next). Only compile-time constants are safe to capture because they do not vary per request and have no request-scoped dependencies.

---

## Recommended Default

**Default:** Capture nothing in builder closures; use `$app->make()` inside the closure to resolve services at execution time.
**Reason:** Zero-risk approach — closure re-resolves services on each execution, avoiding all scope-leak concerns.

---

## Risks Of Wrong Choice

- Capturing `$request` in `booting()` closure: memory leak in Octane — the captured `$request` object and its dependencies are retained indefinitely.
- Capturing resolved service instances: the instance may hold references to request-scoped data that should not persist.
- Capturing variables that are safe in FPM but unsafe in Octane: code passes local tests but fails in production Octane.

---

## Related Rules

- Never capture request-scoped variables in builder closures (05-rules.md, Rule 2)

---

## Related Skills

- Configure Application via ApplicationBuilder (06-skills.md)
- Reset Application State Between Octane Requests (application-flush-and-reset)

---

## Decision Name: Lifecycle Hook Strategy

---

## Decision Context

Choosing between `booting()`/`booted()` callbacks registered in the builder vs middleware for executing initialization logic.

---

## Decision Criteria

* performance — `booting()` runs once per application lifecycle; middleware runs on every request
* architectural — `booting()` runs during construction; middleware runs during request pipeline
* security — `booting()` cannot access request data; middleware can
* maintainability — `booting()` is for framework-wide setup; middleware is for per-request logic

---

## Decision Tree

Does the logic need to run once per application lifecycle (not per request)?
↓
YES → Use `booting()` or `booted()` in the ApplicationBuilder
NO → Does the logic need access to the current request?
↓
YES → Use middleware — run on every request with full request context
NO → Does the logic configure framework behavior (kernel, exception handler)?
↓
YES → Use `booting()` — runs during bootstrap phase, before any request
NO → Use middleware for runtime logic, `booting()` for compile-time logic

---

## Rationale

`booting()` and `booted()` run during the application bootstrap sequence, once per application lifecycle (once per request in FPM, once per worker start in Octane). Middleware runs on every request within the HTTP pipeline. Logic that configures the framework itself belongs in `booting()`. Logic that handles individual requests belongs in middleware. Using `booting()` for per-request behavior causes state leaks in Octane.

---

## Recommended Default

**Default:** Framework configuration in `booting()`/`booted()`; per-request behavior in middleware.
**Reason:** Correct separation of compile-time vs runtime concerns; prevents Octane state leaks.

---

## Risks Of Wrong Choice

- Per-request logic in `booting()`: executes once per worker in Octane, not per request — state leaks across requests.
- Framework setup in middleware: runs on every request instead of once, wasting CPU cycles.
- Registering request-scoped event listeners in `booted()`: listener persists across all requests in Octane.

---

## Related Rules

- Never capture request-scoped variables in builder closures (05-rules.md, Rule 2)
- Place all config-dependent logic in `boot()` not `register()` (bootstrapper-sequence, Rule 1)

---

## Related Skills

- Configure Application via ApplicationBuilder (06-skills.md)
- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)
