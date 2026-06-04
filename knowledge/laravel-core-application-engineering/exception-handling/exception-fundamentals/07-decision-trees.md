# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Exception Handler Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

* Version-Specific Handler API (Laravel 11 vs Laravel 10 and below)
* Reportable Callback vs Exception `report()` Method
* Renderable Callback vs Error Page Template

---

# Architecture-Level Decision Trees

---

## Decision 1: Version-Specific Handler API (Laravel 11 vs Laravel 10 and below)

---

## Decision Context

Whether to use the new `withExceptions()` fluent API in `bootstrap/app.php` (Laravel 11+) or the traditional `App\Exceptions\Handler` class with `register()` (Laravel 10 and below), and when to migrate between them.

---

## Decision Criteria

* Laravel version of the application (11+ or 10-)
* Whether the application is undergoing an in-progress upgrade from Laravel 10 to 11
* Whether the team has existing `Handler` class customizations that must be preserved
* Whether the project uses third-party packages that expect the old `Handler` class pattern

---

## Decision Tree

Is the application running Laravel 11 or later?
↓
YES → Use `withExceptions()` in `bootstrap/app.php` — fluent API, no class file needed
    ↓
    Is the application mid-upgrade from Laravel 10 with existing Handler customizations?
    ↓
    YES → Keep `Handler` class temporarily during upgrade, but plan migration to `withExceptions()`
    ↓
    NO → Migrate fully — remove Handler class, move all logic to `withExceptions()`
NO → Use `App\Exceptions\Handler` with `register()` method — Laravel 10 and below required pattern

---

## Rationale

Laravel 11 introduced `withExceptions()` to simplify exception configuration by removing the need for a dedicated Handler class file. The new API is cleaner, more testable, and is the forward path. However, mid-upgrade applications should not break existing functionality by removing the Handler class before all behavior is migrated.

---

## Recommended Default

**Default:** Use `withExceptions()` for Laravel 11+. Use `App\Exceptions\Handler` for Laravel 10-.
**Reason:** The `withExceptions()` API is the modern, framework-recommended approach with a fluent interface that reduces boilerplate.

---

## Risks Of Wrong Choice

* `withExceptions()` in Laravel 10: Not available — causes runtime errors
* `Handler` class in Laravel 11+: Not used by default — requires manual container binding, loses fluent API benefits
* Stale Handler class after upgrade: Dead code that may confuse developers about where exception config lives
* Premature migration: Breaking changes during an active upgrade if behavior isn't fully replicated

---

## Related Rules

* Use withExceptions() for Laravel 11+, Handler Class for Laravel 10-
* Centralized Exception Reporting

---

## Related Skills

* Configure the Exception Handler
* Exception Handler Configuration

---

---

## Decision 2: Reportable Callback vs Exception `report()` Method

---

## Decision Context

Whether to put custom exception reporting logic in the exception handler via `$this->reportable()` or directly in the exception class via the `report()` method.

---

## Decision Criteria

* Whether the reporting logic needs injected services (database, mailer, API client)
* Whether the exception is thrown from multiple contexts (HTTP, queue, CLI)
* Whether the same reporting pattern applies to multiple exception types
* Whether the reporting logic is simple (set log channel, add context) or complex (multiple side effects, conditionals)

---

## Decision Tree

Does the reporting logic need constructor-injected dependencies?
↓
YES → Use `$this->reportable()` in the handler — exceptions must remain throwable anywhere without service resolution
NO → Is the same reporting pattern shared across 2+ exception types?
    YES → Use `$this->reportable()` with a shared callable — DRY across exception types
    NO → Is the reporting logic simple (set log channel, add context, change level)?
        YES → Use exception `report()` method — self-contained, testable, simple
        NO → Is the reporting logic complex (multiple side effects, conditionals, retries)?
            YES → Use `$this->reportable()` with a dedicated reporter class — separates complex concern
            NO → Use exception `report()` method

---

## Rationale

Exceptions must remain throwable anywhere without constructor injection. `report()` on the exception is ideal for self-contained configuration. The handler's `reportable()` is necessary when dependencies are required or when logic spans multiple exception types.

---

## Recommended Default

**Default:** Use exception `report()` for simple log-level or channel changes. Use `$this->reportable()` in the handler when dependencies are needed.
**Reason:** Keeps exceptions portable while centralizing dependency-heavy logic in the handler where the container is available.

---

## Risks Of Wrong Choice

* `report()` with dependencies: Exception breaks in queue jobs or CLI commands where dependencies aren't resolved
* `reportable()` for simple log config: Adds indirection to the handler file for trivial logic that belongs on the exception
* No handler customization: All exceptions log at ERROR level to the default channel — loss of signal quality

---

## Related Rules

* Centralized Exception Reporting
* Exception Report Method for Logging

---

## Related Skills

* Custom Exception with Report
* Exception Handler Configuration

---

---

## Decision 3: Renderable Callback vs Error Page Template

---

## Decision Context

Whether to customize HTTP error responses via a `renderable()` callback in the handler or via Blade error page templates (`resources/views/errors/{status}.blade.php`).

---

## Decision Criteria

* Whether the error response needs dynamic logic (API vs HTML branching, user-specific content)
* Whether the application uses Inertia (which needs component rendering)
* Whether the error only needs a static branded page (404, 403, 500)
* Whether different error statuses need different response structures

---

## Decision Tree

Is the error response for a standard HTTP status (404, 403, 429, 500, 503)?
↓
YES → Is the response purely presentation (branded HTML page, no dynamic logic)?
    YES → Use Blade error page template `resources/views/errors/{status}.blade.php`
    NO → Does the response need dynamic logic (user-specific content, API vs HTML branching)?
        YES → Use `renderable()` callback — template alone can't conditionally respond
NO → Is the application using Inertia?
    YES → Use `renderable()` callback to render Inertia error components — Blade templates won't work for Inertia
    NO → Does the error response need custom JSON structure for an API?
        YES → Use `renderable()` callback — controlled response shape
        NO → Use `renderable()` callback for any non-standard response requirements

---

## Rationale

Blade error page templates resolve automatically by status code. They're the simplest option for static branded pages. `renderable()` callbacks are needed when the response logic is dynamic — different handling per request type, user-specific content, or non-standard response formats.

---

## Recommended Default

**Default:** Use Blade error templates for standard HTTP error pages (403, 404, 429, 500, 503). Use `renderable()` for non-standard errors or dynamic response logic.
**Reason:** Static templates minimize handler complexity while `renderable()` provides escape hatches for dynamic requirements.

---

## Risks Of Wrong Choice

* Template for dynamic response: Can't branch by request type or user — same response for all contexts
* `renderable()` for static page: More code in handler than necessary — template auto-resolution is cleaner
* No Inertia handling in renderable: Inertia requests get HTML instead of error components

---

## Related Rules

* Error Handler Renderable Registration
* Error Page Template Standardization

---

## Related Skills

* Implement Custom HTTP Error Pages
