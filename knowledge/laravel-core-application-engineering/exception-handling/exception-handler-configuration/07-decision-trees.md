# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Exception Handler Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

* Reportable Callback vs Exception report() Method
* Renderable Callback vs Error Page Template
* Single Handler File vs Separate Renderer/Reporter Classes

---

# Architecture-Level Decision Trees

---

## Decision 1: Reportable Callback vs Exception report() Method

---

## Decision Context

Whether to put custom exception reporting logic in the `App\Exceptions\Handler` via `$this->reportable()` or directly in the exception class via the `report()` method.

---

## Decision Criteria

* Whether the reporting logic needs injected services (database, mailer, API client)
* Whether the exception is thrown from multiple contexts (HTTP, queue, CLI)
* Whether the same reporting pattern applies to multiple exception types
* Whether the reporting logic is simple (log level, channel) or complex (multiple actions, conditionals)

---

## Decision Tree

Does the reporting logic need constructor-injected dependencies?
↓
YES → Use `$this->reportable()` in the handler — exceptions should be throwable anywhere without service resolution
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

## Decision 2: Renderable Callback vs Error Page Template

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

---

---

## Decision 3: Single Handler File vs Separate Renderer/Reporter Classes

---

## Decision Context

Whether to keep all exception handling logic in `App\Exceptions\Handler` or extract renderers and reporters into separate classes.

---

## Decision Criteria

* Number of custom `renderable()` and `reportable()` callbacks (threshold: ~10 total)
* Whether handlers are reused across multiple applications or packages
* Whether the team prefers flat files or separated concerns
* Whether the handler file is approaching the team's file length convention

---

## Decision Tree

How many custom `renderable()` + `reportable()` callbacks does the application have?
↓
1-5 callbacks?
YES → Keep in `Handler.php` — single file is simpler, all exception logic in one place
NO → 6-10 callbacks?
    YES → Is the handler file approaching your team's file length limit?
        YES → Extract into separate `Renderers/` and `Reporters/` directories
        NO → Keep in handler — or split if the team prefers single-responsibility classes
NO → 11+ callbacks or reusable across projects?
    YES → Extract into separate classes — essential for maintainability and reuse

---

## Rationale

A single handler file is fine for small-to-medium applications (up to ~10 custom callbacks). Beyond that, the file becomes a maintenance burden. Separate renderer/reporter classes also enable unit testing the handling logic independently of framework boot.

---

## Recommended Default

**Default:** Keep all logic in `Handler.php` for applications with 1-5 custom callbacks. Extract to separate classes at 6+ or when handler file exceeds the project's convention.
**Reason:** Balances simplicity against maintainability — single file is easier to navigate until it grows beyond a reasonable size.

---

## Risks Of Wrong Choice

* Single file at 10+ callbacks: Handler becomes unmanageable, hard to test, merge conflicts common
* Separate classes at 2 callbacks: Premature abstraction — indirection without benefit
* No separation: Handler accumulates unrelated logic, violates single responsibility principle

---

## Related Rules

* Error Handler Configuration
* Handler File Organization

---

## Related Skills

* Exception Handler Configuration
