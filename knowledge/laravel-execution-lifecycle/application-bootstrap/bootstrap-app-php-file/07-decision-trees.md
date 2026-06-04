# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Application Bootstrap
**Knowledge Unit:** Bootstrap App PHP File
**Generated:** 2026-06-03

---

# Decision Inventory

1. Bootstrap Pattern: Laravel 11+ builder vs legacy `new Application()`
2. File Output Hygiene: Return-only vs global variable assignment
3. Environment Branching: `$app->environment()` vs `$app->runningInConsole()` vs separate files

---

# Architecture-Level Decision Trees

---

## Decision Name: Bootstrap Pattern Selection

---

## Decision Context

Choosing between the modern `Application::configure()->create()` fluent chain (Laravel 11+) and the legacy `new Application()` with manual kernel binding approach.

---

## Decision Criteria

* performance — no meaningful difference
* architectural — builder enforces proper configuration; legacy bypasses it
* security — builder prevents fragile kernel binding overwrites
* maintainability — builder is documented API; legacy is unsupported in Laravel 11+

---

## Decision Tree

What Laravel version is the application running?
↓
11+? → Use `Application::configure(basePath: ...)->withRouting(...)->withMiddleware()->withExceptions()->create()`
NO → Is the application being actively developed and may upgrade to 11+?
↓
YES → Migrate to builder pattern now; test with current version
NO → Use legacy `new Application($basePath)` with `$app->singleton()` for kernel bindings
↓
NO (version < 10) → Use legacy pattern compatible with the installed version

---

## Rationale

The builder API is the only supported configuration surface for Laravel 11+. Legacy `new Application()` with manual kernel binding overwrites (`$app->singleton(HttpKernel::class, ...)`) is removed in Laravel 11 where the kernel is resolved automatically via the builder. Using the legacy pattern in Laravel 11+ produces an incomplete Application that cannot dispatch requests.

---

## Recommended Default

**Default:** `return Application::configure(basePath: dirname(__DIR__))->withRouting(...)->withMiddleware(...)->withExceptions(...)->create();`
**Reason:** The only supported and future-proof pattern in Laravel 11+.

---

## Risks Of Wrong Choice

- Using `new Application()` in Laravel 11+: kernel contracts are not bound — `$kernel->handle()` fails.
- Migrating to builder pattern without `->create()`: returns `ApplicationBuilder` instead of `Application`, causing type errors.
- Mixing builder and legacy patterns: double-registration of bindings with unpredictable last-writer-wins semantics.

---

## Related Rules

- Always use `Application::configure()->create()` over `new Application()` in Laravel 11+ (05-rules.md, Rule 1)
- Always `return` the Application from `bootstrap/app.php` (05-rules.md, Rule 1)
- Prefer `Application::configure()` over manual kernel binding overwrites (application-builder-configuration, Rule 3)

---

## Related Skills

- Create a Laravel Bootstrap File (06-skills.md)
- Bootstrap a Laravel Application Instance (application-class-construction)

---

## Decision Name: File Output Hygiene

---

## Decision Context

Deciding whether the bootstrap file should use a `return` statement or assign the Application to a global variable.

---

## Decision Criteria

* performance — no difference
* architectural — return-value contract enables instance isolation
* security — global variables create cross-request contamination in Octane
* maintainability — return-value pattern is testable; globals are not

---

## Decision Tree

Does the entry point call `$app = require 'bootstrap/app.php'`?
↓
YES → Use `return Application::configure(...)->create();` — the file MUST return the Application
NO → Are you tempted to assign to `$GLOBALS` or `$_ENV` for convenience?
↓
YES → Do NOT use global variables — refactor to pass the Application explicitly
NO → Are you in a testing scenario that needs to inspect the bootstrap result?
↓
YES → The return-value pattern enables `$app = require 'bootstrap/app.php'` in tests — use it
NO → Always return; never assign to globals

---

## Rationale

The return-value contract allows each entry point (`index.php`, `artisan`, Octane) to receive its own Application instance. Global variable assignment defeats encapsulation, creates testability problems, and risks cross-request state pollution in Octane. The file's design as a pure configuration file that returns a value is deliberate — it avoids side effects, enables testability, and makes the bootstrap process deterministic.

---

## Recommended Default

**Default:** `return Application::configure(...)->create();` as the sole output of `bootstrap/app.php`.
**Reason:** Preserves the return-value contract, enables testability, prevents global state pollution.

---

## Risks Of Wrong Choice

- Assigning to `$GLOBALS['laravel_app']`: cross-request data contamination in Octane — one request's container state leaks to the next.
- Using `dd()` or `echo` in bootstrap: output before response corrupts HTTP headers — `Cannot modify header information` error.
- Omitting `return`: entry points receive `null` instead of Application — immediate crash.

---

## Related Rules

- Always `return` the Application from `bootstrap/app.php`; never assign to a global variable (05-rules.md, Rule 1)
- Never use `dd()`, `var_dump()`, `echo` in `bootstrap/app.php` (05-rules.md, Rule 2)

---

## Related Skills

- Create a Laravel Bootstrap File (06-skills.md)

---

## Decision Name: Environment-Specific Branching Strategy

---

## Decision Context

Choosing the method for environment-conditional configuration inside `bootstrap/app.php` — `$app->environment()`, `$app->runningInConsole()`, or separate bootstrap files per environment.

---

## Decision Criteria

* performance — no meaningful difference
* architectural — environment checks before config loading read `$_ENV` directly
* security — misspelled environment names silently evaluate to `false`
* maintainability — single file with branching is simpler than multiple files

---

## Decision Tree

Does the branching depend on CLI vs HTTP context (not deployment environment)?
↓
YES → Use `$app->runningInConsole()` — reliable, set in constructor before any bootstrapper
NO → Does the branching depend on deployment environment (production, staging, local)?
↓
YES → Use `$app->environment('production')` — but only AFTER config loads; before that, use `$_ENV['APP_ENV']` directly
NO → Are you considering creating separate bootstrap files per environment?
↓
YES → Do NOT create separate files — use in-file branching instead
NO → Use `$app->environment()` with appropriate fallback

---

## Rationale

Separate bootstrap files per environment (`bootstrap/app.production.php`, `bootstrap/app.local.php`) create maintenance burden, configuration drift, and inconsistency — a change must be applied to N files instead of one. In-file branching with `$app->environment()` or `$app->runningInConsole()` keeps all configuration in a single file and ensures consistency across environments. Note that `$app->environment()` before `LoadConfiguration` reads `$_ENV['APP_ENV']` directly, not `config/app.php`.

---

## Recommended Default

**Default:** Single `bootstrap/app.php` with `$app->runningInConsole()` for CLI-vs-HTTP and `$app->environment('production')` for deployment environment branching.
**Reason:** Single source of truth, consistent across environments, no configuration drift.

---

## Risks Of Wrong Choice

- Misspelled environment name in `$app->environment('produktion')`: silently evaluates to `false`, production configuration not applied.
- Separate bootstrap files: configuration drift between files, environment-specific bugs that only appear in production.
- Using `$app->make()` inside environment branches before bootstrappers run: `BindingResolutionException` for unregistered services.

---

## Related Rules

- Keep the builder chain minimal — only call `with*()` methods for subsystems the application actually uses (05-rules.md, Rule 3)
- Never use `dd()`, `var_dump()`, `echo` in `bootstrap/app.php` (05-rules.md, Rule 2)

---

## Related Skills

- Create a Laravel Bootstrap File (06-skills.md)
- Configure Application via ApplicationBuilder (application-builder-configuration)
