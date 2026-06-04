# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture & Structure
**Knowledge Unit:** Helper Functions
**Generated:** 2026-06-03

---

# Decision Inventory

* Helper Functions vs Constructor Injection for Dependency Access
* Container-Resolving Helpers vs Pure Utility Helpers
* Custom Helper Definitions vs Class Methods
* env() vs config() for Environment Configuration

---

# Architecture-Level Decision Trees

---

## Decision 1: Helper Functions vs Constructor Injection for Dependency Access

---

## Decision Context

Whether to access framework services via global helper functions (`app()`, `cache()`, `config()`) or via constructor injection.

---

## Decision Criteria

* Whether the code is in the HTTP layer (controllers, views) or business logic layer (services, actions)
* Whether the dependency needs to be mocked in tests
* Whether the dependency is used once or across multiple methods

---

## Decision Tree

Is the code in a controller, view, or event listener (HTTP/presentation layer)?
↓
YES → Helpers are acceptable — controllers and views are integration-tested; ergonomics matter
NO → Is the code in a service, action, or domain object (business logic layer)?
    ↓
    YES → Constructor injection REQUIRED — business logic must be testable in isolation
    NO → Is the code in a closure, callback, or rapid prototype?
        ↓
        YES → Helpers are acceptable — injection ceremony is disproportionate for lightweight code
        NO → Constructor injection — any structured code should use explicit dependencies
NO → Is the dependency used across multiple methods in the class?
    ↓
    YES → Constructor injection — shared dependency belongs in the constructor
    NO → Is the dependency called only once in a single method?
        ↓
        YES → Acceptable to use helper — but constructor injection is still preferred for consistency
        NO → Constructor injection — default approach

---

## Rationale

Helpers create implicit dependencies that are invisible in the class signature. Constructor injection makes dependencies explicit, enabling mocking, testing in isolation, and IDE autocompletion. The rule: controllers and views can use helpers (they are integration-tested anyway); services and actions must use constructor injection (they need isolated unit tests).

---

## Recommended Default

**Default:** Constructor injection in business logic classes. Helpers in controllers, views, and lightweight closures.
**Reason:** Testability and explicitness in business logic. Ergonomics in presentation layer.

---

## Risks Of Wrong Choice

* `app()` in service: Hidden dependency; test must bootstrap full container to mock; class cannot be tested with `new`
* Constructor injection in controller: 5+ constructor params for simple CRUD controller — unnecessary ceremony
* Helper in domain service: `cache()` call inside domain logic — domain now depends on cache infrastructure
* All helpers everywhere: No dependency graph visible; every class requires container boot to test

---

## Related Rules

* Enforce Constructor Injection in Business Logic Classes
* Enforce env() Only in Config Files

---

## Related Skills

* Use Helper Functions in Controllers and Views
* Use Constructor Injection in Services and Actions

---

---

## Decision 2: Container-Resolving Helpers vs Pure Utility Helpers

---

## Decision Context

Whether the helper being used depends on the service container (container-resolving) or is a standalone utility (pure).

---

## Decision Criteria

* Whether the helper calls Container::getInstance() internally
* Whether the helper can be used in a standalone PHP unit test
* Whether the helper is a data transformation or framework service access

---

## Decision Tree

Does the helper touch the service container (`app()`, `resolve()`, `config()`, `view()`, `cache()`)?
↓
YES → Container-resolving — creates implicit container dependency; NOT safe in pure unit tests
NO → Is the helper a data transformer (`collect()`, `str()`, `data_get()`, `tap()`)?
    ↓
    YES → Pure utility — safe anywhere, including pure unit tests; no container dependency
    NO → Is the helper a debug output function (`dd()`, `dump()`)?
        ↓
        YES → Container-resolving (some) — `dd()` uses Symfony's var-dumper; should never be in production code
        NO → Check the source — if it calls `Container::getInstance()`, it's container-resolving
NO → Is the code running in a pure unit test (no Laravel boot)?
    ↓
    YES → ONLY pure utility helpers are safe — container-resolving helpers will fail
    NO → Both types are acceptable — but prefer pure utilities even in framework context
NO → Is the code running in a service provider register() method?
    ↓
    YES → Only `app()` is reliably safe — session, auth, cache helpers may fail if services aren't yet available
    NO → Container-resolving helpers are generally safe — but prefer injection in business logic

---

## Rationale

Pure utility helpers (`collect()`, `str()`, `data_get()`) are PHP functions that don't touch the container. They're safe anywhere, including pure unit tests. Container-resolving helpers (`app()`, `cache()`, `auth()`) depend on the service container and cannot be used without framework boot. The distinction determines where each helper is safe to use.

---

## Recommended Default

**Default:** Pure utility helpers (safe everywhere). Container-resolving helpers (controllers/views only, not in business logic).
**Reason:** Pure utilities have no hidden dependencies. Container-resolving helpers create implicit container coupling.

---

## Risks Of Wrong Choice

* Container-resolving helper in unit test: Test fails with RuntimeException — container not bootstrapped
* Pure utility helper misclassified as container-resolving: `collect()` is perfectly safe in any context
* `app()` in service provider `register()`: Some services (session, auth) aren't available yet — RuntimeException
* Pure utility helper used as service access: `str()` is string manipulation, not `config()` — using the wrong helper

---

## Related Rules

* Enforce Constructor Injection in Business Logic Classes
* Enforce env() Only in Config Files

---

## Related Skills

* Use Helper Functions in Controllers and Views
* Use Constructor Injection in Services and Actions

---

---

## Decision 3: Custom Helper Definitions vs Class Methods

---

## Decision Context

Whether to implement application-specific utility functions as global helpers or as static/instance methods on classes.

---

## Decision Criteria

* Whether the function is used across multiple views and controllers
* Whether the function is a simple, pure transformation
* Whether the function needs to be mocked in tests

---

## Decision Tree

Is the function a pure transformation with no side effects (format currency, truncate text, calculate something)?
↓
YES → Custom helper is appropriate — pure utilities are safe and ergonomic
NO → Does the function depend on framework services (auth, cache, DB)?
    ↓
    YES → Class method — framework dependencies should be injected; helpers hide dependencies
    NO → Is the function used across multiple views, controllers, and templates?
        ↓
        YES → Custom helper is appropriate — avoids duplicating the same logic across files
        NO → Is there an existing class where this method naturally belongs?
            ↓
            YES → Class method — keeps the logic with related code
            NO → Custom helper — standalone utility with no natural class home
NO → Does the function need to be mocked or swapped in tests?
    ↓
    YES → Class method — helpers cannot be mocked; must use partial mock of facade
    NO → Custom helper — no mocking need; simpler than a class

---

## Rationale

Custom helpers are best for simple, pure transformations used across presentation code (views, controllers). Class methods are better for logic with framework dependencies or mocking requirements. Helpers cannot be mocked; if you need to swap the implementation in tests, use a class.

---

## Recommended Default

**Default:** Class methods for business logic with dependencies. Custom helpers for presentational pure transformations.
**Reason:** Class methods support mocking and injection. Helpers are simpler but less flexible.

---

## Risks Of Wrong Choice

* Helper with framework dependency: `function currentUser() { return auth()->user(); }` — hidden auth dependency; untestable
* Class method for pure formatting: `FormatHelper::currency($amount)` — unnecessary class for a simple formatting function
* Helper defined without `function_exists()`: Framework update adds same function — fatal PHP error
* Helper for mockable logic: Cannot mock in tests; tests must use actual implementation

---

## Related Rules

* Enforce Constructor Injection in Business Logic Classes
* Enforce env() Only in Config Files

---

## Related Skills

* Use Helper Functions in Controllers and Views
* Use Constructor Injection in Services and Actions

---

---

## Decision 4: env() vs config() for Environment Configuration

---

## Decision Context

Whether to read configuration via `env('APP_DEBUG')` or `config('app.debug')`.

---

## Decision Criteria

* Whether the code is in a config file or application code
* Whether `php artisan config:cache` is used in production
* Whether the value needs to be cached

---

## Decision Tree

Is the code inside a `config/` file?
↓
YES → `env()` is allowed — config files are the ONLY place where `env()` is safe
NO → Is the code inside a service, controller, view, or any non-config file?
    ↓
    YES → MUST use `config()` — `env()` returns `null` after `config:cache`
    NO → Is the code in a migration or seeder?
        ↓
        YES → `config()` — `env()` is unsafe outside config files
        NO → `config()` — the rule applies everywhere outside config files
YES → Is `php artisan config:cache` used in production?
    ↓
    YES → `config()` in application code is MANDATORY — `env()` will return `null`
    NO → Is there any possibility of config caching in the future?
        ↓
        YES → `config()` — future-proof; prevents silent null returns after caching is adopted
        NO → `env()` is technically safe in non-cached deployments — but `config()` is still preferred
NO → Is the value used in a context where caching the config file is not possible?
    ↓
    YES → `env()` is technically safe — but `config()` is more consistent
    NO → `config()` — always prefer config() for consistency

---

## Rationale

After `php artisan config:cache`, all `config/` files are merged and cached. The `env()` helper reads from `$_ENV` directly — it does NOT read from the cached config. So any `env()` call outside config files returns the live `$_ENV` value (which may be correct in development) but after caching, `$_ENV` is only populated during the cache generation process. In production, `env()` outside config files returns `null`.

---

## Recommended Default

**Default:** `env()` ONLY in `config/` files. `config()` EVERYWHERE else.
**Reason:** `env()` returns `null` after `config:cache`. This is the most common production bug in Laravel.

---

## Risks Of Wrong Choice

* `env()` in controller: Works in development (no config cache); returns `null` in production (cached) — silent behavior change
* `env()` in service: Authentication check based on `env('APP_ENV')` — returns `null` after cache; auth logic breaks silently
* `env()` in `config/app.php`: CORRECT — config files are the safe zone
* `config()` in config file: Also correct — but the `config()` value itself may come from `env()` in the same file

---

## Related Rules

* Enforce Constructor Injection in Business Logic Classes
* Enforce env() Only in Config Files

---

## Related Skills

* Use Helper Functions in Controllers and Views
* Use Constructor Injection in Services and Actions
